import urllib.request
import json

SUPABASE_URL="https://zhghwaypdgpxlznkammt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw"

def _supabase_get(path: str):
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{path}"
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

def _supabase_patch(path: str, data: dict):
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
            "Prefer": "return=minimal"
        },
        method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read()

products = _supabase_get("products?select=id,name")
for p in products:
    name = p['name'].lower()
    label = "product"
    if "tel u fresh" in name or "tel-u" in name:
        label = "bottle"
    elif "cimory" in name:
        label = "snack"
    elif "duosus" in name:
        label = "box"
    else:
        label = "product"
        
    print(f"Updating {p['name']} -> {label}")
    _supabase_patch(f"products?id=eq.{p['id']}", {"ai_label": label})

print("Done")
