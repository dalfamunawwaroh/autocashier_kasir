import json
from pathlib import Path

db_path = Path("vision_embeddings.json")
if not db_path.exists():
    print("FILE TIDAK ADA: vision_embeddings.json belum dibuat")
else:
    db = json.loads(db_path.read_text(encoding="utf-8"))
    print(f"Total produk di embedding DB: {len(db)}")
    print()
    for pid, entry in db.items():
        n_embs = len(entry.get("embeddings", []))
        status = "OK" if n_embs > 0 else "NO_DINO"
        name = entry["name"]
        label = entry["label"]
        print(f"[{status}] {name} | label={label} | embeddings={n_embs}")
    print()
    with_emb = sum(1 for e in db.values() if len(e.get("embeddings", [])) > 0)
    no_emb = len(db) - with_emb
    print("--- RINGKASAN ---")
    print(f"Dengan DINO embedding : {with_emb}")
    print(f"Tanpa DINO embedding  : {no_emb}")
    print(f"Total produk          : {len(db)}")
