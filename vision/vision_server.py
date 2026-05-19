"""
AutoCashier Vision Server v3 — Auto-sync dari Supabase
=======================================================
Pipeline:
  Step 1 — YOLO-World : Zero-shot bbox, text prompts = ai_label semua produk di Supabase
  Step 2 — DINOv2     : Embedding similarity dari image_url produk di Supabase

Tidak perlu register manual!
Cukup pastikan produk ada di tabel 'products' dengan kolom:
  - id        : UUID
  - name      : nama produk (untuk display)
  - ai_label  : label singkat untuk YOLO-World prompt  (mis. "indomie goreng")
  - image_url : URL foto produk (bisa dari Supabase Storage, Google Drive, dll)
                Opsional — jika null, hanya YOLO-World yang digunakan
"""

import os
import io
import sys
import json
import uuid
import base64
import logging
import asyncio
import urllib.request
from pathlib import Path
from typing import Optional, List

import cv2
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from transformers import AutoImageProcessor, AutoModel
from ultralytics import YOLOWorld

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("vision")

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
YOLO_MODEL      = os.environ.get("YOLO_MODEL", "yolov8s-worldv2.pt")
DINO_MODEL      = os.environ.get("DINO_MODEL", "facebook/dinov2-base")
EMBED_DB_PATH   = Path("vision_embeddings.json")
SCORE_THR           = float(os.environ.get("YOLO_SCORE_THR",       "0.12"))  # Diturunkan agar YOLO lebih sensitif pada shape-only
SIMILARITY_THR      = float(os.environ.get("DINO_SIM_THR",         "0.38"))  # Threshold dasar DINOv2
SIMILARITY_THR_CROP = float(os.environ.get("DINO_SIM_THR_CROP",    "0.34"))  # Threshold lebih longgar untuk YOLO-crop ketat
CONF_GAP_THR        = float(os.environ.get("DINO_GAP_THR",         "0.04"))  # Min gap #1-#2 agar tidak ambiguous
DEVICE          = "cuda" if torch.cuda.is_available() else "cpu"

# Supabase config (dari .env atau environment)
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "https://zhghwaypdgpxlznkammt.supabase.co")
SUPABASE_KEY    = os.environ.get("SUPABASE_ANON_KEY", "")

log.info(f"Device: {DEVICE} | YOLO threshold: {SCORE_THR} | DINOv2 threshold: {SIMILARITY_THR}")

# ─────────────────────────────────────────────────────────────────────────────
# Load .env (jika ada)
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
def _load_env(filepaths=[".env", "../.env"]):
    for filepath in filepaths:
        try:
            for line in Path(filepath).read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            # Re-read after loading
            global SUPABASE_URL, SUPABASE_KEY
            SUPABASE_URL = os.environ.get("SUPABASE_URL", SUPABASE_URL)
            SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", SUPABASE_KEY)
            break # Stop after finding the first valid .env file
        except FileNotFoundError:
            continue

_load_env()

# ─────────────────────────────────────────────────────────────────────────────
# Load AI Models
# ─────────────────────────────────────────────────────────────────────────────
log.info("Loading YOLO-World …")
try:
    yolo_model = YOLOWorld(YOLO_MODEL)
except Exception:
    log.warning(f"'{YOLO_MODEL}' not found, falling back to yolov8s-world.pt")
    yolo_model = YOLOWorld("yolov8s-world.pt")
log.info("✅ YOLO-World ready")

log.info("Loading DINOv2 …")
dino_processor = AutoImageProcessor.from_pretrained(DINO_MODEL)
dino_model     = AutoModel.from_pretrained(DINO_MODEL).to(DEVICE)
dino_model.eval()
log.info("✅ DINOv2 ready")

# ─────────────────────────────────────────────────────────────────────────────
# Embedding Database
# Structure: { product_id: { id, name, label, embeddings: [[float...]] } }
# ─────────────────────────────────────────────────────────────────────────────
class EmbedDB:
    def __init__(self, path: Path):
        self.path = path
        self.db: dict = {}
        self.yolo_classes: List[str] = []
        # ── Cache untuk vectorized similarity search ──────────────────────
        self._emb_matrix: Optional[np.ndarray] = None  # shape (N, D) normalized
        self._emb_index:  List[str]            = []    # pid per row
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                self.db = json.loads(self.path.read_text(encoding="utf-8"))
                log.info(f"Loaded {len(self.db)} products from {self.path}")
                self._rebuild_classes()
            except Exception as e:
                log.warning(f"Could not load DB: {e}")
                self.db = {}

    def save(self):
        self.path.write_text(json.dumps(self.db, indent=2), encoding="utf-8")

    def _rebuild_classes(self):
        """YOLO hanya pakai generic classes — tugasnya hanya crop region produk.
        Identifikasi produk sepenuhnya dilakukan oleh DINOv2.
        Sertakan kelas shape-based agar YOLO bisa crop action figure / toy."""
        self.yolo_classes = [
            "product", "item", "snack", "bottle", "box",
            "drink", "can", "cup", "packaging", "food", "object",
            # Shape-based / toy categories
            "toy", "figure", "action figure", "doll", "figurine",
            "collectible", "statue", "miniature", "model",
        ]
        self._rebuild_emb_matrix()

    def _rebuild_emb_matrix(self):
        """Pre-compute normalized embedding matrix untuk vectorized cosine similarity.
        Dipanggil sekali saat DB berubah, bukan per-frame."""
        rows, index = [], []
        for pid, entry in self.db.items():
            for emb in entry.get("embeddings", []):
                rows.append(emb)
                index.append(pid)
        if rows:
            mat = np.array(rows, dtype=np.float32)
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self._emb_matrix = mat / norms  # normalize tiap baris
            self._emb_index  = index
            log.info(f"Embedding matrix: {self._emb_matrix.shape} ({len(set(index))} produk, {len(index)} vectors)")
        else:
            self._emb_matrix = None
            self._emb_index  = []

    def upsert(self, pid: str, name: str, label: str, embeddings: List[List[float]]):
        existing_embs = self.db.get(pid, {}).get("embeddings", [])
        self.db[pid] = {
            "id":         pid,
            "name":       name,
            "label":      label.lower().strip(),
            "embeddings": existing_embs + embeddings,
        }
        self._rebuild_classes()

    def upsert_label_only(self, pid: str, name: str, label: str):
        """Register product tanpa embedding (hanya untuk YOLO-World)."""
        existing = self.db.get(pid, {})
        self.db[pid] = {
            "id":         pid,
            "name":       name,
            "label":      label.lower().strip(),
            "embeddings": existing.get("embeddings", []),
        }

    def find_best_match(self, query_emb: np.ndarray):
        """Vectorized cosine similarity — 1 matmul, bukan N loop.
        Returns (pid, entry, best_sim, gap) — gap adalah selisih sim #1 dan #2.
        Gap kecil = ambiguous (produk terlalu mirip).
        """
        if self._emb_matrix is None or len(self._emb_index) == 0:
            return None, None, -1.0, 0.0
        q = query_emb.flatten().astype(np.float32)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return None, None, -1.0, 0.0
        q = q / q_norm
        sims     = self._emb_matrix @ q          # (N,) — satu matmul
        best_i   = int(np.argmax(sims))
        best_sim = float(sims[best_i])
        best_pid = self._emb_index[best_i]
        best_entry = self.db.get(best_pid)

        # Hitung gap: selisih sim terbaik vs sim terbaik dari produk LAIN
        # (bukan hanya baris lain yang mungkin milik produk sama)
        other_sims = [
            float(sims[i]) for i, pid in enumerate(self._emb_index)
            if pid != best_pid
        ]
        second_best = max(other_sims) if other_sims else 0.0
        gap = best_sim - second_best
        log.info(f"[DINO] sim={best_sim:.3f} | 2nd={second_best:.3f} | gap={gap:.3f}")
        return best_pid, best_entry, best_sim, gap

    def find_by_label(self, label: str):
        label = label.lower().strip()
        for pid, entry in self.db.items():
            if entry.get("label", "").lower().strip() == label:
                return pid, entry
        return None, None

embed_db = EmbedDB(EMBED_DB_PATH)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    a, b = a.flatten(), b.flatten()
    d = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / d) if d > 0 else 0.0

def _decode_b64(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    pil = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

def _bgr2pil(bgr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

def _sharpen_image(bgr: np.ndarray) -> np.ndarray:
    """Pertajam gambar agar teks/logo label lebih distinktif untuk DINOv2."""
    kernel = np.array([[ 0, -1,  0],
                       [-1,  5, -1],
                       [ 0, -1,  0]], dtype=np.float32)
    return cv2.filter2D(bgr, -1, kernel)

def _multi_crop_embeddings(bgr: np.ndarray) -> List[np.ndarray]:
    """
    Hasilkan beberapa embedding dari varian crop gambar untuk produk shape-based.
    Ini membantu ketika sudut pengambilan gambar tidak sesuai persis dengan referensi.
    Menghasilkan: [full, center-crop, slight-zoom-in] → rata-rata ketiganya.
    """
    h, w = bgr.shape[:2]
    variants = [bgr]

    # Center crop (80% dari gambar)
    margin_y, margin_x = int(h * 0.10), int(w * 0.10)
    center_crop = bgr[margin_y:h - margin_y, margin_x:w - margin_x]
    if center_crop.size > 0:
        variants.append(center_crop)

    # Slight zoom-in (60% tengah)
    margin_y2, margin_x2 = int(h * 0.20), int(w * 0.20)
    zoom_crop = bgr[margin_y2:h - margin_y2, margin_x2:w - margin_x2]
    if zoom_crop.size > 0:
        variants.append(zoom_crop)

    embs = []
    for v in variants:
        embs.append(_extract_embedding(_bgr2pil(v)))
    return embs

def _crop_label_zone(bgr: np.ndarray) -> np.ndarray:
    """Crop zona label merek (40%–80% dari tinggi botol).
    Pada umumnya merek/logo ada di bagian tengah-atas botol.
    Dipakai sebagai sinyal tambahan untuk produk botol mirip.
    """
    h, w = bgr.shape[:2]
    y1 = int(h * 0.30)   # mulai dari 30% tinggi
    y2 = int(h * 0.75)   # sampai 75% tinggi
    crop = bgr[y1:y2, :]  # lebar penuh
    return crop if crop.size > 0 else bgr

def _extract_embedding(pil_img: Image.Image) -> np.ndarray:
    inputs = dino_processor(images=pil_img, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = dino_model(**inputs)
    return out.last_hidden_state[:, 0, :].cpu().numpy().squeeze().astype(np.float32)

def _download_image(url: str, timeout: int = 10) -> Optional[np.ndarray]:
    """Download gambar dari URL → numpy BGR. Return None jika gagal."""
    if url.startswith("/"):
        # Jika URL relatif (dari backend lokal), tambahkan host localhost:3001
        url = f"http://localhost:3001{url}"
        
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AutoCashier/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    except Exception as e:
        log.warning(f"Download failed ({url[:60]}): {e}")
        return None

def _crop_box(img: np.ndarray, box: list, pad: float = 0.10) -> np.ndarray:
    h, w = img.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in box]
    px, py = int((x2-x1)*pad), int((y2-y1)*pad)
    return img[max(0,y1-py):min(h,y2+py), max(0,x1-px):min(w,x2+px)]

# ─────────────────────────────────────────────────────────────────────────────
# Supabase Sync
# ─────────────────────────────────────────────────────────────────────────────
def _supabase_get(path: str) -> Optional[dict]:
    """Simple REST GET ke Supabase (tanpa library supabase-py)."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL / SUPABASE_ANON_KEY tidak di-set!")
        return None
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{path}"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "apikey":        SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type":  "application/json",
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        log.error(f"Supabase request error: {e}")
        return None

sync_status = {
    "last_sync": None,
    "total_products": 0,
    "with_embeddings": 0,
    "without_images": 0,
    "errors": [],
}

def sync_from_supabase() -> dict:
    """
    Ambil semua produk dari Supabase, lalu:
    1. Daftarkan ai_label ke YOLO-World (semua produk)
    2. Download image_url & compute DINOv2 embedding (produk yang punya gambar)
    """
    log.info("🔄 Syncing products from Supabase …")
    sync_status["errors"] = []

    products = _supabase_get("products?select=id,name,ai_label,image_url&order=name")
    if products is None:
        err = "Failed to fetch products from Supabase"
        log.error(err)
        sync_status["errors"].append(err)
        return sync_status

    product_images_data = _supabase_get("product_images?select=product_id,image_url") or []

    # Hapus produk lama dari DB lokal (vision_db.json) yang sudah tidak ada di Supabase
    valid_pids = [str(p.get("id", "")) for p in products]
    for existing_pid in list(embed_db.db.keys()):
        if existing_pid not in valid_pids:
            log.info(f"🗑️ Menghapus produk {existing_pid} dari lokal karena sudah dihapus di database")
            del embed_db.db[existing_pid]

    # Buat mapping product_id -> list of image_urls
    # image_url di product_images sudah berupa full public URL Supabase Storage
    image_map = {}
    if product_images_data:
        for img in product_images_data:
            pid = str(img.get("product_id", ""))
            url = img.get("image_url", "")
            if pid and url:
                image_map.setdefault(pid, []).append(url)

    total = len(products)
    log.info(f"📦 Found {total} products in Supabase")
    sync_status["total_products"] = total

    with_emb = 0
    no_img   = 0

    for p in products:
        pid       = str(p.get("id", ""))
        name      = p.get("name", "?")
        ai_label  = (p.get("ai_label") or name).strip()
        
        # Ambil daftar gambar dari product_images
        image_urls = image_map.get(pid, [])
        primary_img = p.get("image_url")
        if primary_img and primary_img not in image_urls:
            image_urls.insert(0, primary_img)

        if not pid or not ai_label:
            log.warning(f"Skipping product with missing id/label: {p}")
            continue

        # ── Selalu daftarkan label (untuk YOLO-World) ──
        embed_db.upsert_label_only(pid, name, ai_label)
        log.info(f"  [YOLO] Registered '{ai_label}' → '{name}'")

        # ── Jika ada image_urls, compute DINOv2 embedding ──
        # Cek jumlah gambar sekarang vs embedding yang tersimpan.
        # Jika ada gambar baru ditambahkan (mis. foto action figure baru), re-embed.
        existing_entry = embed_db.db.get(pid, {})
        existing_embs  = existing_entry.get("embeddings", [])
        existing_urls  = existing_entry.get("image_urls_cached", [])

        if image_urls:
            new_urls = [u for u in image_urls if u not in existing_urls]

            if not new_urls and existing_embs:
                # Semua URL sudah di-embed, skip
                log.info(f"  [DINO] '{name}' sudah punya {len(existing_embs)} embedding ({len(image_urls)} gambar), skip")
                with_emb += 1
                continue

            new_embs = []
            urls_to_embed = new_urls if new_urls else image_urls
            for url in urls_to_embed:
                log.info(f"  [DINO] Downloading image for '{name}' ({url[:60]}) …")
                bgr = _download_image(url)
                if bgr is not None:
                    try:
                        pil = _bgr2pil(bgr)
                        emb = _extract_embedding(pil)
                        new_embs.append(emb.tolist())

                        # Augment: flip horizontal untuk produk simetris/shape-based
                        pil_flip = pil.transpose(Image.FLIP_LEFT_RIGHT)
                        emb_flip = _extract_embedding(pil_flip)
                        new_embs.append(emb_flip.tolist())
                    except Exception as e:
                        log.error(f"  [DINO] Error embedding '{name}': {e}")
                        sync_status["errors"].append(f"{name}: {e}")

            if new_embs:
                embed_db.upsert(pid, name, ai_label, new_embs)
                # Simpan daftar URL agar bisa deteksi penambahan gambar baru
                embed_db.db[pid]["image_urls_cached"] = list(set(existing_urls + image_urls))
                with_emb += 1
                log.info(f"  [DINO] ✅ {len(new_embs)} embedding (+flip augment) untuk '{name}'")
            else:
                log.warning(f"  [DINO] Gagal download image untuk '{name}'")
                no_img += 1
        else:
            no_img += 1
            log.info(f"  [DINO] '{name}' tidak punya image_url — hanya YOLO-World")

    embed_db._rebuild_classes()
    embed_db.save()

    # Update YOLO-World text prompts
    if embed_db.yolo_classes:
        yolo_model.set_classes(embed_db.yolo_classes)
        log.info(f"✅ YOLO-World updated: {len(embed_db.yolo_classes)} classes")

    from datetime import datetime
    sync_status["last_sync"]       = datetime.now().isoformat()
    sync_status["total_products"]  = total
    sync_status["with_embeddings"] = with_emb
    sync_status["without_images"]  = no_img

    log.info(f"✅ Sync selesai: {total} produk, {with_emb} dengan embedding DINOv2, {no_img} tanpa gambar")
    return sync_status

# Jalankan sync saat startup
sync_from_supabase()

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="AutoCashier Vision Server", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class DetectRequest(BaseModel):
    image: str  # base64

class RegisterRequest(BaseModel):
    product_id:   str
    product_name: str
    ai_label:     str
    images:       List[str]  # base64

# ── GET /health ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "device":       DEVICE,
        "products":     len(embed_db.db),
        "yolo_classes": embed_db.yolo_classes,
        "sync":         sync_status,
    }

# ── GET /products ────────────────────────────────────────────────────────────
@app.get("/products")
async def list_products():
    products = [
        {
            "id":        pid,
            "name":      e["name"],
            "label":     e["label"],
            "num_refs":  len(e.get("embeddings", [])),
            "has_dino":  len(e.get("embeddings", [])) > 0,
        }
        for pid, e in embed_db.db.items()
    ]
    return {"success": True, "products": products, "total": len(products)}

# ── POST /sync ───────────────────────────────────────────────────────────────
@app.post("/sync")
async def sync_endpoint(background_tasks: BackgroundTasks):
    """
    Trigger ulang sinkronisasi dari Supabase.
    Dijalankan di background agar tidak memblokir response.
    """
    background_tasks.add_task(sync_from_supabase)
    return {"success": True, "message": "Sync started in background"}

# ── POST /sync/wait ──────────────────────────────────────────────────────────
@app.post("/sync/wait")
async def sync_wait():
    """Sync sinkron (blocking) — gunakan untuk memastikan selesai."""
    result = sync_from_supabase()
    return {"success": True, "sync": result}

# ── DELETE /products/{id} ────────────────────────────────────────────────────
@app.delete("/products/{product_id}")
async def delete_product(product_id: str):
    if product_id not in embed_db.db:
        raise HTTPException(status_code=404, detail="Product not in vision DB")
    del embed_db.db[product_id]
    embed_db._rebuild_classes()
    embed_db.save()
    yolo_model.set_classes(embed_db.yolo_classes)
    return {"success": True}

# ── POST /register (manual override) ────────────────────────────────────────
@app.post("/register")
async def register_product(req: RegisterRequest):
    """
    Daftarkan foto manual (override/tambahan di luar image_url Supabase).
    Berguna untuk produk yang belum punya gambar di DB.
    """
    if not req.images:
        raise HTTPException(status_code=400, detail="At least 1 image required")

    embs, errors = [], []
    for i, b64 in enumerate(req.images):
        try:
            bgr = _decode_b64(b64)
            emb = _extract_embedding(_bgr2pil(bgr))
            embs.append(emb.tolist())
        except Exception as e:
            errors.append(f"Image {i}: {e}")

    if not embs:
        raise HTTPException(status_code=400, detail=f"All images failed: {errors}")

    embed_db.upsert(req.product_id, req.product_name, req.ai_label, embs)
    embed_db.save()
    yolo_model.set_classes(embed_db.yolo_classes)

    return {"success": True, "product_id": req.product_id, "total_refs": len(embed_db.db[req.product_id]["embeddings"]), "errors": errors}

# ── POST /detect ─────────────────────────────────────────────────────────────
@app.post("/detect")
async def detect(req: DetectRequest):
    try:
        bgr = _decode_b64(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    if not embed_db.db:
        return {"success": False, "message": "Belum ada produk terdaftar. Sync dari Supabase terlebih dahulu via POST /sync"}

    has_any_embedding = any(len(e.get("embeddings", [])) > 0 for e in embed_db.db.values())

    # Ukuran gambar input (dari frontend, misal 480x270)
    img_h, img_w = bgr.shape[:2]

    # ── Step 1: YOLO-World — hanya untuk deteksi region/crop ───────────────
    # set_classes() TIDAK dipanggil di sini (sudah di-set saat startup/sync).
    # Memanggil set_classes() tiap frame sangat mahal (re-encode text embeddings).
    results = yolo_model(_bgr2pil(bgr), verbose=False, conf=SCORE_THR, imgsz=320)

    best_box       = None   # koordinat piksel dalam ruang img_w x img_h
    best_box_norm  = None   # koordinat ternormalisasi [x1,y1,x2,y2] dalam [0,1]
    best_conf      = 0.0

    if results and len(results[0].boxes) > 0:
        boxes   = results[0].boxes
        confs   = boxes.conf.cpu().numpy()
        cls_ids = boxes.cls.cpu().int().numpy()

        # boxes.xyxy sudah diskalakan ke ukuran gambar input oleh Ultralytics
        xyxy = boxes.xyxy.cpu().numpy()

        best_i    = int(np.argmax(confs))
        best_box  = xyxy[best_i].tolist()          # piksel dalam img_w x img_h
        best_conf = float(confs[best_i])
        best_cls  = int(cls_ids[best_i])
        yolo_label = embed_db.yolo_classes[best_cls] if best_cls < len(embed_db.yolo_classes) else "unknown"

        # Normalisasi ke [0,1] agar frontend bisa scale ke resolusi apapun
        x1, y1, x2, y2 = best_box
        best_box_norm = [
            x1 / img_w, y1 / img_h,
            x2 / img_w, y2 / img_h
        ]
        log.info(f"[YOLO] '{yolo_label}' conf={best_conf:.2f} bbox_norm={[round(v,3) for v in best_box_norm]}")
    else:
        log.info(f"[YOLO] Tidak ada deteksi — DINOv2 pakai full image")

    # ── Step 2: DINOv2 — satu-satunya identifier produk ───────────────────
    if has_any_embedding:
        # Crop ke bbox YOLO jika ada, kalau tidak pakai full image
        if best_box is not None:
            crop = _crop_box(bgr, best_box)
            if crop.size == 0:
                crop = bgr
            using_yolo_crop = True
        else:
            crop = bgr
            using_yolo_crop = False

        # Pertajam gambar agar teks/logo merek lebih distinktif
        crop_sharp = _sharpen_image(crop)

        # Jika crop kecil (YOLO ketat), scale up agar DINOv2 punya detail cukup
        crop_h, crop_w = crop_sharp.shape[:2]
        if using_yolo_crop and (crop_h < 112 or crop_w < 112):
            scale = max(112 / crop_h, 112 / crop_w, 1.0)
            crop_sharp = cv2.resize(crop_sharp, (int(crop_w * scale), int(crop_h * scale)),
                                    interpolation=cv2.INTER_LINEAR)
            log.info(f"[DINO] Up-scaled crop dari {crop_w}x{crop_h} → {crop_sharp.shape[1]}x{crop_sharp.shape[0]}")

        # ── Pass 1: embedding dari crop penuh (tajam) ──────────────────
        query_emb_full               = _extract_embedding(_bgr2pil(crop_sharp))
        pid, entry, similarity, gap  = embed_db.find_best_match(query_emb_full)
        log.info(f"[DINO] Best match: '{entry['name'] if entry else 'none'}' sim={similarity:.3f} gap={gap:.3f}")

        # Threshold lebih rendah bila YOLO memberikan crop ketat (lebih sedikit noise latar belakang)
        effective_thr = SIMILARITY_THR_CROP if using_yolo_crop else SIMILARITY_THR

        # ── Pass 1b: untuk produk shape-based / toy, rata-rata beberapa crop varian ──
        # Ini membantu jika sudut pandang tidak sama persis dengan referensi
        if similarity < effective_thr:
            multi_embs = _multi_crop_embeddings(crop_sharp)
            if len(multi_embs) > 1:
                avg_emb = np.mean(np.stack(multi_embs), axis=0).astype(np.float32)
                pid_m, entry_m, sim_m, gap_m = embed_db.find_best_match(avg_emb)
                log.info(f"[DINO-multi] '{entry_m['name'] if entry_m else 'none'}' sim={sim_m:.3f}")
                if sim_m > similarity:
                    pid, entry, similarity, gap = pid_m, entry_m, sim_m, gap_m
                    log.info(f"[DINO] Multi-crop result lebih baik: sim={similarity:.3f}")

        # ── Pass 2: jika gap kecil (ambiguous) & gap masuk akal, pakai zona label ──
        # Label-zone disambig hanya berguna untuk produk botol/kemasan dengan merek teks.
        # Produk shape-based (action figure, toy) tidak perlu crop zona label.
        is_shape_like = (
            entry is not None
            and any(kw in (entry.get("label", "") + " " + entry.get("name", "")).lower()
                    for kw in ["figure", "toy", "doll", "statue", "miniature", "model", "collectible",
                               "figur", "mainan", "patung"])
        )
        if similarity >= effective_thr and gap < CONF_GAP_THR and not is_shape_like:
            log.info(f"[DINO] Gap={gap:.3f} < {CONF_GAP_THR} → coba label-zone crop untuk disambiguasi")
            label_crop      = _crop_label_zone(crop_sharp)
            query_emb_label = _extract_embedding(_bgr2pil(label_crop))
            pid2, entry2, sim2, gap2 = embed_db.find_best_match(query_emb_label)
            log.info(f"[DINO-label] '{entry2['name'] if entry2 else 'none'}' sim={sim2:.3f} gap={gap2:.3f}")

            # Ambil hasil terbaik: kombinasikan kedua similarity
            if sim2 >= effective_thr:
                # Weighted average: label crop lebih dipercaya untuk disambiguasi merek
                combined_full  = 0.40 * similarity
                combined_label = 0.60 * sim2

                if pid2 != pid:
                    # Dua pass berbeda pendapat — pakai yang confidence gap-nya lebih besar
                    log.info(f"[DINO] Conflict: full→'{entry['name']}' vs label→'{entry2['name']}' | pakai gap terbesar")
                    if gap2 > gap:
                        pid, entry, similarity = pid2, entry2, sim2
                        log.info(f"[DINO] Resolved → '{entry['name']}' (label-zone menang)")
                else:
                    # Dua pass sepakat — boost similarity
                    similarity = min(1.0, combined_full + combined_label)
                    log.info(f"[DINO] Kedua pass sepakat '{entry['name']}', boosted sim={similarity:.3f}")

        if similarity >= effective_thr:
            source = "yolo+dino" if best_box is not None else "dino-only"
            if gap < CONF_GAP_THR and not is_shape_like:
                source += "+label-disambig"

            return {
                "success":      True,
                "source":       source,
                "product_id":   pid,
                "label":        entry["label"],
                "product_name": entry["name"],
                "confidence":   best_conf,
                "similarity":   round(similarity, 4),
                "gap":          round(gap, 4),
                "bbox":         best_box_norm or [],   # [x1,y1,x2,y2] dalam [0,1]
                "product": {"id": pid, "name": entry["name"], "label": entry["label"]},
            }
        else:
            log.info(f"[DINO] Similarity {similarity:.2f} < threshold {effective_thr}")

    return {
        "success":    False,
        "source":     "none",
        "message":    "Tidak ada produk yang cocok ditemukan",
        "confidence": best_conf,
        "similarity": None,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("VISION_PORT", 5002))
    log.info(f"🚀 Vision Server v3 on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
