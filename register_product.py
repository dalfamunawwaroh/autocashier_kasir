"""
register_product.py
===================
Script CLI untuk mendaftarkan foto referensi produk ke vision DB.

Cara pakai:
  python register_product.py --id <uuid> --name "Indomie Goreng" --label "indomie" --images foto1.jpg foto2.jpg foto3.jpg

Atau gunakan --vision-url jika vision server berjalan di port berbeda:
  python register_product.py --vision-url http://localhost:5002 ...

Jika tidak ada --id, UUID baru akan di-generate otomatis.
"""

import argparse
import base64
import json
import sys
import uuid
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found. Run: pip install requests")
    sys.exit(1)


def image_to_base64(path: str) -> str:
    data = Path(path).read_bytes()
    ext  = Path(path).suffix.lower().lstrip(".")
    mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp"}.get(ext, "jpeg")
    return f"data:image/{mime};base64," + base64.b64encode(data).decode()


def main():
    parser = argparse.ArgumentParser(description="Register product reference images to AutoCashier Vision DB")
    parser.add_argument("--id",          default=None,                    help="Product UUID (auto-generated if omitted)")
    parser.add_argument("--name",        required=True,                   help="Human-readable product name, e.g. 'Indomie Goreng'")
    parser.add_argument("--label",       required=True,                   help="Short AI label used as YOLO text prompt, e.g. 'indomie'")
    parser.add_argument("--images",      required=True, nargs="+",        help="Path(s) to reference image files (3-5 recommended)")
    parser.add_argument("--vision-url",  default="http://localhost:5002", help="Vision server URL")
    args = parser.parse_args()

    product_id = args.id or str(uuid.uuid4())

    print(f"\n📦 Registering product:")
    print(f"   ID    : {product_id}")
    print(f"   Name  : {args.name}")
    print(f"   Label : {args.label}")
    print(f"   Images: {args.images}\n")

    # Encode images
    b64_images = []
    for img_path in args.images:
        p = Path(img_path)
        if not p.exists():
            print(f"⚠️  File not found: {img_path} — skipping")
            continue
        b64_images.append(image_to_base64(img_path))
        print(f"   ✅ Encoded: {p.name} ({p.stat().st_size // 1024} KB)")

    if not b64_images:
        print("❌ No valid images found. Exiting.")
        sys.exit(1)

    payload = {
        "product_id":   product_id,
        "product_name": args.name,
        "ai_label":     args.label,
        "images":       b64_images,
    }

    url = f"{args.vision_url.rstrip('/')}/register"
    print(f"\n📡 Sending to {url} …")

    try:
        resp = requests.post(url, json=payload, timeout=120)
        result = resp.json()
    except Exception as e:
        print(f"❌ Request failed: {e}")
        sys.exit(1)

    if result.get("success"):
        print(f"\n✅ SUCCESS! Product '{args.name}' registered.")
        print(f"   Total reference embeddings: {result.get('total_refs')}")
        if result.get("errors"):
            print(f"   Warnings: {result['errors']}")
    else:
        print(f"\n❌ FAILED: {result}")
        sys.exit(1)


if __name__ == "__main__":
    main()
