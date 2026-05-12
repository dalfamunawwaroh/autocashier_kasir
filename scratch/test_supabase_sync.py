"""
Test apakah Python bisa fetch produk dari Supabase.
Jalankan: .venv\Scripts\python.exe scratch/test_supabase_sync.py
"""
import os
import sys
import json
import urllib.request
from pathlib import Path

# Fix encoding untuk Windows
sys.stdout.reconfigure(encoding='utf-8')

# Load .env dari root project
def _load_env(filepath=".env"):
    try:
        for line in Path(filepath).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
        print(f"[OK] .env loaded from: {filepath}")
    except FileNotFoundError:
        print(f"[WARN] .env not found at: {filepath}")

_load_env(".env")
_load_env("../.env")  # fallback jika run dari subfolder scratch

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

print(f"\nSupabase URL : {SUPABASE_URL}")
print(f"Anon Key     : {SUPABASE_KEY[:30]}..." if SUPABASE_KEY else "[ERROR] ANON KEY KOSONG!")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n[ERROR] SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan!")
    exit(1)

url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/products?select=id,name,ai_label,image_url&order=name"
print(f"\nFetching: {url}\n")

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
        data = json.loads(resp.read().decode("utf-8"))

    print(f"[OK] Berhasil! Ditemukan {len(data)} produk:\n")
    has_null_label = False
    for p in data:
        ai_label  = p.get("ai_label") or "(NULL)"
        image_url = p.get("image_url") or "(NULL)"
        status = "[WARNING: ai_label NULL]" if ai_label == "(NULL)" else "[OK]"
        if ai_label == "(NULL)":
            has_null_label = True
        print(f"  {status} {p['name']}")
        print(f"       ai_label  : {ai_label}")
        print(f"       image_url : {image_url[:70] if image_url != '(NULL)' else '(NULL)'}")
        print()

    if has_null_label:
        print("[PENTING] Beberapa produk punya ai_label=NULL -> tidak akan terdeteksi YOLO-World!")
        print("          Isi kolom ai_label di Supabase untuk produk-produk tersebut.\n")

except Exception as e:
    print(f"[ERROR] Request gagal: {e}")
