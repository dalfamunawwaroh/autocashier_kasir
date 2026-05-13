import urllib.request, json, os
from pathlib import Path

for line in Path('.env').read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

URL = os.environ.get('SUPABASE_URL', '')
KEY = os.environ.get('SUPABASE_ANON_KEY', '')

def get(path):
    req = urllib.request.Request(
        f'{URL}/rest/v1/{path}',
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json',
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), None
    except Exception as e:
        return None, str(e)

print("=== Checking products ===")
prods, err = get('products?select=id,name&limit=5')
if err:
    print(f"ERROR fetching products: {err}")
else:
    for p in (prods or []):
        pid = p['id']
        print(f"\nProduct: {p['name']} ({pid})")

        imgs, err2 = get(f'product_images?product_id=eq.{pid}&limit=10')
        if err2:
            print(f"  product_images ERROR: {err2}")
        elif not imgs:
            print(f"  product_images: 0 baris (kosong atau RLS block)")
        else:
            print(f"  product_images: {len(imgs)} baris")
            print(f"  Kolom: {list(imgs[0].keys())}")
            for img in imgs:
                print(f"    {img}")

print("\n=== Raw product_images table (tanpa filter) ===")
all_imgs, err3 = get('product_images?limit=5')
if err3:
    print(f"ERROR: {err3}")
elif not all_imgs:
    print("Tabel product_images kosong atau diblokir RLS (0 baris)")
else:
    print(f"{len(all_imgs)} baris, kolom: {list(all_imgs[0].keys())}")
    for img in all_imgs:
        print(f"  {img}")
