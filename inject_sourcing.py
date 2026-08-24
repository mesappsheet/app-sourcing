import json
import time
import os

db_path = os.path.join(os.path.dirname(__file__), "src", "data", "products_db.json")

with open(db_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Vérifier si déjà présent
for p in data.get("products", []):
    if p.get("sku") == "QUIN-FIX-DF01":
        print("Product already in database.")
        exit(0)

new_prod = {
    "id": f"prod-{int(time.time()*1000)}",
    "sku": "QUIN-FIX-DF01",
    "category": "visserie",
    "categoryName": "Visserie, Boulons & Fixations",
    "categoryIcon": "🔩",
    "titleFr": "Entretoise de Fixation Verre Garde-Corps & Escalier - DF Railing Inox 304 Noir Mat",
    "titleCn": "304不锈钢黑色哑光玻璃夹固定销 楼梯护栏配件",
    "material": "Acier Inoxydable 304 Noir Mat PVD",
    "finish": "Noir Mat PVD Anti-Rayures",
    "dimensions": "Diamètre: 38mm / 50mm • Longueur Corps: 30mm • Goujon Fileté M10/M12",
    "weightCapacity": "Charge Latérale > 150 kg/pièce • Verre 8-12mm",
    "measuringSystem": "Standard Métrique ISO",
    "headType": "Tête Plate Fraisée avec Joint EPDM Anti-Vibration",
    "origin": "Foshan, Guangdong, China",
    "unit": "Pièce (pc)",
    "basePriceCny": 4.85,
    "baseUnit": "Pièce (pc)",
    "icon": "🔩",
    "rating": 4.9,
    "status": "Sourcé Usine",
    "hasVideoDemo": True,
    "images": [
        "https://image.made-in-china.com/2f0j00sKGTwBvdCjkR/Stainless-Steel-Glass-Standoff-Pin-for-Balustrade-and-Staircase.jpg",
        "https://s.alicdn.com/@sc04/kf/H61bb6d872fea4070985ec828f14f1042V.jpg_960x960q80.jpg"
    ],
    "specifications": [
        {"category": "Spécifications Techniques", "label": "Type", "value": "Glass Standoff Bracket"},
        {"category": "Spécifications Techniques", "label": "Matériau", "value": "Inox 304 / 316"},
        {"category": "Spécifications Techniques", "label": "Finition", "value": "Noir Mat PVD"},
        {"category": "Spécifications Techniques", "label": "Épaisseur Verre", "value": "8mm à 12mm"},
        {"category": "Spécifications Commerciales", "label": "MOQ", "value": "100 pièces"},
        {"category": "Spécifications Commerciales", "label": "Délai Livraison", "value": "10 jours"}
    ],
    "suppliers": [
        {
            "name": "Foshan DF Railing Hardware Co., Ltd.",
            "location": "Foshan, Guangdong, China",
            "verified": True,
            "priceCny": 4.85,
            "priceFcfa": 4200,
            "moq": "100 pièces",
            "leadTime": "10-12 jours",
            "rating": 4.9
        }
    ]
}

data["products"].insert(0, new_prod)

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: Product successfully injected into active products_db.json!")
