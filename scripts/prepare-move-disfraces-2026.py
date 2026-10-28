"""Build the reviewed, read-only Cotillon -> Disfraces manifest.

Usage: python scripts/prepare-move-disfraces-2026.py SOURCE.csv SNAPSHOT.json
SNAPSHOT.json contains the 117 [id, registro_json] rows read from Cotillón.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "backend" / "mover-disfraces-cotillon-2026-10-28.json"
BATCH = "mover-disfraces-cotillon-2026-10-28"
ADULT = {
    "2115151683": "Personajes", "2115151560": "Profesiones",
    "2115151703": "Profesiones", "2115179181": "Profesiones",
    "2115427434": "Personajes", "2115179182": "Personajes",
    "2115427432": "Superheroes y Princesas", "2115151704": "Personajes",
    "2115427150": "Halloween", "2115179183": "Personajes",
    "2115427144": "Halloween", "2115427152": "Halloween",
    "2115427437": "Halloween", "2115151725": "Halloween",
    "2115179184": "Históricos", "2115179187": "Personajes",
    "2115179188": "Históricos", "2115179189": "Históricos",
    "2115376775": "Personajes", "2115427435": "Personajes",
    "2115179190": "Personajes", "2115427438": "Halloween",
    "2115427142": "Halloween", "2115061671": "Personajes",
    "2115427149": "Halloween", "2115151750": "Personajes",
    "2115345635": "Otros", "2115427148": "Halloween",
    "2115151758": "Personajes", "2115272356": "Mujeres",
    "2115427145": "Otros",
}
REVIEW = {
    "2115415896": ("niño", "Combo temático sin talle; confirmar tamaño y si se vende como disfraz completo."),
    "2115415900": ("niño", "Combo temático sin talle; confirmar tamaño y si se vende como disfraz completo."),
    "2115415947": ("niño", "Kit de accesorios sin prenda ni talle; confirmar si corresponde moverlo de Cotillón."),
    "2115176293": ("niño", "La descripción indica talles de 2 a 16."),
    "2115176387": ("niño", "La descripción indica talles de 2 a 16."),
    "2115176386": ("niño", "La descripción indica talles de 2 a 16."),
    "2115176388": ("niño", "La descripción indica talles de 2 a 16."),
    "2115053599": ("niño", "La descripción dice niña T3; confirmar equivalencia del talle Candela."),
    "2115053600": ("niño", "La descripción dice niña T4; confirmar equivalencia del talle Candela."),
    "2115053601": ("niño", "Talle Candela T3; confirmar tabla de talles antes de mover."),
    "2115053589": ("niño", "Talle Candela T3; confirmar tabla de talles antes de mover."),
    "2115053590": ("niño", "Talle Candela T4; confirmar tabla de talles antes de mover."),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    csv_path, snapshot_path = map(Path, sys.argv[1:3])
    source = list(csv.DictReader(csv_path.open(encoding="utf-8-sig", newline="")))
    assert len(source) == 117 and len({r["ID origen"] for r in source}) == 117
    counts = Counter("REVISAR" if r["Destino"].startswith("REVISAR") else r["Destino"] for r in source)
    assert counts == {"niño": 74, "adulto": 31, "REVISAR": 12}, counts
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    rows = {row[0]: row[1] for row in snapshot["rows"]}
    assert len(rows) == 117
    moves, review = [], []
    for item in source:
        origin_id, name = item["ID origen"], item["Nombre"]
        record_id = "excel-" + origin_id
        raw = rows[record_id]
        product = json.loads(raw)
        assert product["id"] == record_id and product["sourceId"] == origin_id
        assert product["name"] == name and product["area"] == "cotillon" and product["mode"] == "venta"
        assert product["price"] == int(item["Precio hoy"])
        assert product["stock"] == int(item["Stock"])
        assert product["active"] == (item["Activo hoy"].lower() == "si")
        price = int(item["Precio correcto"])
        assert price > 0
        if item["Destino"].startswith("REVISAR"):
            suggestion, reason = REVIEW[origin_id]
            review.append({"id": record_id, "name": name, "suggestion": suggestion, "reason": reason})
            continue
        category = "Niños" if item["Destino"] == "niño" else ADULT[origin_id]
        moves.append({"id": record_id, "sourceId": origin_id, "name": name,
                      "destination": item["Destino"], "category": category,
                      "priceBefore": product["price"], "priceCorrect": price,
                      "sourceSha256": sha(raw.encode("utf-8"))})
    assert len(moves) == 105 and len(review) == 12 and len(ADULT) == 31 and len(REVIEW) == 12
    assert sum(x["priceBefore"] != x["priceCorrect"] for x in moves) == 1
    manifest = {"version": 1, "batch": BATCH, "csvSha256": sha(csv_path.read_bytes()),
                "moves": moves, "review": review}
    OUT.write_bytes((json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8"))
    print(json.dumps({"moves": len(moves), "review": len(review), "byCategory": Counter(x["category"] for x in moves),
                      "manifestSha256": sha(OUT.read_bytes())}, ensure_ascii=False))


if __name__ == "__main__":
    main()
