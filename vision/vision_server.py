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
SCORE_THR       = float(os.environ.get("YOLO_SCORE_THR", "0.20"))
SIMILARITY_THR  = float(os.environ.get("DINO_SIM_THR",  "0.50"))
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
        # Index untuk YOLO: {product_id: label}
        self.yolo_classes: List[str] = []
        # product_id terurut sesuai yolo_classes (penting untuk mapping cls idx)
        self.class_to_pid: dict = {}
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
        """Rebuild YOLO class list dari semua produk ditambah generic classes untuk membantu deteksi bounding box."""
        classes = ["product", "item", "snack", "bottle", "box", "drink", "can", "cup", "packaging"]
        self.class_to_pid = {}
        for pid, entry in self.db.items():
            # Ganti underscore dengan spasi agar YOLO-World lebih paham
            label = entry.get("label", "").strip().replace("_", " ")
            entry["label"] = label
            if label and label not in classes:
                classes.append(label)
                self.class_to_pid[label] = pid
        self.yolo_classes = classes
        log.info(f"YOLO classes ({len(self.yolo_classes)}): {self.yolo_classes}")

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
        self._rebuild_classes()

    def find_best_match(self, query_emb: np.ndarray):
        best_id, best_sim, best_entry = None, -1.0, None
        for pid, entry in self.db.items():
            for ref in entry.get("embeddings", []):
                sim = _cosine(query_emb, np.array(ref, dtype=np.float32))
                if sim > best_sim:
                    best_sim, best_id, best_entry = sim, pid, entry
        return best_id, best_entry, best_sim

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

def _crop_box(img: np.ndarray, box: list, pad: float = 0.05) -> np.ndarray:
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

    product_images_data = _supabase_get("product_images?select=product_id,storage_path") or []

    # Hapus produk lama dari DB lokal (vision_db.json) yang sudah tidak ada di Supabase
    valid_pids = [str(p.get("id", "")) for p in products]
    for existing_pid in list(embed_db.db.keys()):
        if existing_pid not in valid_pids:
            log.info(f"🗑️ Menghapus produk {existing_pid} dari lokal karena sudah dihapus di database")
            del embed_db.db[existing_pid]

    # Buat mapping product_id -> list of image_urls
    image_map = {}
    if product_images_data:
        for img in product_images_data:
            pid = str(img.get("product_id", ""))
            url = img.get("storage_path")
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

        # ── Jika ada image_urls dan belum ada embedding, compute DINOv2 ──
        existing_embs = embed_db.db.get(pid, {}).get("embeddings", [])
        if image_urls:
            if existing_embs:
                log.info(f"  [DINO] '{name}' sudah punya {len(existing_embs)} embedding, skip re-download")
                with_emb += 1
                continue

            new_embs = []
            for url in image_urls:
                log.info(f"  [DINO] Downloading image for '{name}' …")
                bgr = _download_image(url)
                if bgr is not None:
                    try:
                        pil = _bgr2pil(bgr)
                        emb = _extract_embedding(pil)
                        new_embs.append(emb.tolist())
                    except Exception as e:
                        log.error(f"  [DINO] Error embedding '{name}': {e}")
                        sync_status["errors"].append(f"{name}: {e}")
            
            if new_embs:
                embed_db.upsert(pid, name, ai_label, new_embs)
                with_emb += 1
                log.info(f"  [DINO] ✅ {len(new_embs)} Embedding computed untuk '{name}'")
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

    # ── Step 1: YOLO-World ─────────────────────────────────────────────────
    yolo_model.set_classes(embed_db.yolo_classes)
    results = yolo_model(_bgr2pil(bgr), verbose=False, conf=SCORE_THR)

    best_box  = None
    best_conf = 0.0
    yolo_label = None
    pid_by_label, entry_by_label = None, None

    if results and len(results[0].boxes) > 0:
        boxes   = results[0].boxes
        confs   = boxes.conf.cpu().numpy()
        xyxy    = boxes.xyxy.cpu().numpy()
        cls_ids = boxes.cls.cpu().int().numpy()

        best_i    = int(np.argmax(confs))
        best_box  = xyxy[best_i].tolist()
        best_conf = float(confs[best_i])
        best_cls  = int(cls_ids[best_i])
        yolo_label = embed_db.yolo_classes[best_cls] if best_cls < len(embed_db.yolo_classes) else "unknown"

        log.info(f"[YOLO] '{yolo_label}' conf={best_conf:.2f}")
        pid_by_label, entry_by_label = embed_db.find_by_label(yolo_label)
    else:
        log.info(f"[YOLO] Tidak ada deteksi — mencoba DINOv2 pada full image")

    # ── Step 2: DINOv2 ────────────────────────────────────────────────────
    if has_any_embedding:
        # Crop ke bbox YOLO jika ada, kalau tidak pakai full image
        if best_box is not None:
            crop = _crop_box(bgr, best_box)
            if crop.size == 0:
                crop = bgr
        else:
            crop = bgr

        query_emb              = _extract_embedding(_bgr2pil(crop))
        pid, entry, similarity = embed_db.find_best_match(query_emb)
        log.info(f"[DINO] Best match: '{entry['name'] if entry else 'none'}' sim={similarity:.3f}")

        if similarity >= SIMILARITY_THR:
            source = "yolo+dino" if best_box is not None else "dino-only"
            return {
                "success":      True,
                "source":       source,
                "product_id":   pid,
                "label":        entry["label"],
                "product_name": entry["name"],
                "confidence":   best_conf,
                "similarity":   similarity,
                "bbox":         best_box or [],
                "product": {"id": pid, "name": entry["name"], "label": entry["label"]},
            }
        else:
            log.info(f"[DINO] Similarity {similarity:.2f} < threshold {SIMILARITY_THR}")

    # ── Fallback: gunakan YOLO label langsung ─────────────────────────────
    if pid_by_label and entry_by_label:
        return {
            "success":      True,
            "source":       "yolo-world",
            "product_id":   pid_by_label,
            "label":        yolo_label,
            "product_name": entry_by_label["name"],
            "confidence":   best_conf,
            "similarity":   None,
            "bbox":         best_box or [],
            "product": {"id": pid_by_label, "name": entry_by_label["name"], "label": yolo_label},
        }

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
