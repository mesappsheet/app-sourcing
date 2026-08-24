import json
import os

db_path = os.path.join(os.path.dirname(__file__), "src", "data", "products_db.json")

with open(db_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for p in data.get("products", []):
    if p.get("sku") == "QUIN-FIX-DF01":
        p["images"] = [
            "https://s.alicdn.com/@sc04/kf/H8c24fa76ab894addaf7aa70d5163b1d7w.jpg_960x960q80.jpg",
            "https://s.alicdn.com/@sc04/kf/H61bb6d872fea4070985ec828f14f1042V.jpg_960x960q80.jpg"
        ]

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated images in products_db.json!")
