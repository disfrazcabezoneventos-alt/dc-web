"""Build the reviewed costume manifest and private photo archives without editing Sheets.

Usage: python scripts/prepare-disfraces-2026.py CATALOG.xlsx CROSS.xlsx PHOTOS.zip
       STOCK.txt [archive-map.json]
The optional map is {"disfraces-20261028-01.zip": "Google Drive file ID", ...}.
"""
from __future__ import annotations

import hashlib
import csv
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "backend" / "import-disfraces-2026-10-28.json"
PHOTO_OUT = ROOT / "tmp" / "disfraces-2026-10-28"
BATCH = "disfraces-2026-10-28"
MANUAL_NAMES = {"Scream", "Woody"}
TARIFFS = {"Cabezones": (75000, 100000), "Premium": (65000, 65000), "Estándar": (60000, 60000)}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rows(path: Path, sheet: str, start: int):
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        return [row for row in workbook[sheet].iter_rows(min_row=start, values_only=True) if row[0] is not None]
    finally:
        workbook.close()


def stock_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    plain = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", plain).strip()


def conflicting_stock_names(path: Path) -> dict[str, list[tuple[str, str, int]]]:
    entries = defaultdict(list)
    section = ""
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if line.startswith("## Sheet name:"):
            section = line.split(":", 1)[1].strip()
            continue
        cells = next(csv.reader([line]))
        if len(cells) < 2 or not cells[0].strip():
            continue
        quantities = [int(cell.strip()) for cell in cells[1:] if re.fullmatch(r"\d+", cell.strip())]
        if quantities:
            entries[stock_key(cells[0])].append((cells[0].strip(), section, quantities[0]))
    return {key: records for key, records in entries.items() if len({r[2] for r in records}) > 1}


def main() -> None:
    catalog_path, cross_path, zip_path, stock_path = map(Path, sys.argv[1:5])
    archive_map = json.loads(Path(sys.argv[5]).read_text(encoding="utf-8")) if len(sys.argv) > 5 else {}
    stock_conflicts = conflicting_stock_names(stock_path)
    catalog = rows(catalog_path, "Catálogo", 8)
    cross = rows(cross_path, "Cruce stock", 2)
    tariffs = rows(catalog_path, "Tarifas", 6)
    tariff_table = {str(row[0]): (row[1], row[2]) for row in tariffs if row[0] in TARIFFS}
    assert tariff_table == TARIFFS, f"La pestaña Tarifas cambió: {tariff_table}"
    assert len(catalog) == len(cross) == 443
    cross_by_id = {str(row[0]): row for row in cross}
    assert len(cross_by_id) == 443
    PHOTO_OUT.mkdir(parents=True, exist_ok=True)
    products = []
    photo_records = []
    review = Counter()
    seen_ids = set()
    with zipfile.ZipFile(zip_path) as source:
        for row in catalog:
            source_id = str(row[0])
            name = str(row[1])
            assert source_id not in seen_ids and name.strip() == name
            seen_ids.add(source_id)
            cr = cross_by_id[source_id]
            assert cr[1] == name and int(cr[3]) == int(row[10]) and cr[4] == row[7], source_id
            assert row[19] == "Pendiente", source_id
            width = int(row[10])
            eligible = width >= 600 and name not in MANUAL_NAMES
            tariff = str(row[4])
            rent, insurance = tariff_table[tariff]
            assert row[5] == rent and row[6] == insurance, source_id
            original_stock = row[7]
            assert isinstance(original_stock, int) and original_stock >= 0, source_id
            # The stock source contains duplicate names across tabs. Keep catalog stock
            # when their numeric quantities disagree, including the Spider name variant.
            ambiguous_stock = stock_key(str(cr[5] or "")) in stock_conflicts or source_id == "162"
            use_cross = cr[7] == "Alta" and isinstance(cr[6], int) and not ambiguous_stock
            stock = cr[6] if use_cross else original_stock
            if source_id == "231":
                assert stock == 0
            photo_path = str(row[12])
            data = source.read(photo_path)
            assert len(data) >= 40
            if eligible:
                photo_records.append((source_id, photo_path, data))
            if name in MANUAL_NAMES:
                review["manual_conflicts"] += 1
            elif eligible:
                review["eligible"] += 1
            else:
                review["inactive_size"] += 1
            if use_cross:
                review["stock_from_cross"] += 1
            elif cr[7] == "Alta" and isinstance(cr[6], int) and ambiguous_stock:
                review["stock_ambiguous"] += 1
            products.append({
                "sourceId": source_id,
                "name": name,
                "categories": [part.strip() for part in str(row[3]).split(";") if part.strip()],
                "tariff": tariff,
                "rentPrice": rent,
                "insurance": insurance,
                "catalogStock": original_stock,
                "stock": stock,
                "stockFromCross": use_cross,
                "stockAmbiguous": ambiguous_stock,
                "photoWidth": width,
                "photoHeight": int(row[11]),
                "photoPath": photo_path,
                "photoSha256": sha256(data),
                "photoBatch": "",
                "manualConflict": name in MANUAL_NAMES,
                "review": "Pendiente",
            })
    photo_lookup = {}
    for index in range(0, len(photo_records), 15):
        chunk = photo_records[index:index + 15]
        batch_name = f"disfraces-20261028-{index // 15 + 1:02d}.zip"
        batch_path = PHOTO_OUT / batch_name
        if batch_path.exists():
            with zipfile.ZipFile(batch_path) as archive:
                assert archive.namelist() == [path for _, path, _ in chunk], batch_name
                for _, path, data in chunk:
                    assert archive.read(path) == data, path
        else:
            with zipfile.ZipFile(batch_path, "w", compression=zipfile.ZIP_STORED) as archive:
                for _, path, data in chunk:
                    info = zipfile.ZipInfo(path, date_time=(2026, 10, 28, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_STORED
                    archive.writestr(info, data)
        for source_id, _, _ in chunk:
            photo_lookup[source_id] = batch_name
    for product in products:
        product["photoBatch"] = photo_lookup.get(product["sourceId"], "")
    manifest = {"version": 1, "batch": BATCH, "sourceSha256": {
        "catalog": sha256(catalog_path.read_bytes()),
        "cross": sha256(cross_path.read_bytes()),
        "photos": sha256(zip_path.read_bytes()),
        "stock": sha256(stock_path.read_bytes()),
    }, "photoArchives": [
        {"name": path.name, "driveId": archive_map.get(path.name, ""), "sha256": sha256(path.read_bytes())}
        for path in sorted(PHOTO_OUT.glob("disfraces-20261028-*.zip"))
    ], "products": products}
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"sourceRows": len(products), "photoBatches": len(manifest["photoArchives"]),
                      "review": review, "manifestSha256": sha256(OUT.read_bytes()),
                      "stockNamesWithDifferentQuantities": len(stock_conflicts),
                      "photosMb": round(sum(p.stat().st_size for p in PHOTO_OUT.glob("*.zip")) / 1048576, 1)},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
