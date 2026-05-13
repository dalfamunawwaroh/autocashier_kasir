import os
import json
import urllib.request

SUPABASE_URL="https://zhghwaypdgpxlznkammt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw"

def _supabase_storage_list(bucket: str, prefix: str):
    url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/list/{bucket}"
    payload = {
        "prefix": prefix,
        "limit": 100,
        "offset": 0,
        "sortBy": {
            "column": "name",
            "order": "asc"
        }
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            files = json.loads(resp.read().decode("utf-8"))
            return files
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    print("Root:")
    print(_supabase_storage_list("product-images", ""))
    print("Products folder:")
    print(_supabase_storage_list("product-images", "products"))
    print("Products folder with slash:")
    print(_supabase_storage_list("product-images", "products/"))
