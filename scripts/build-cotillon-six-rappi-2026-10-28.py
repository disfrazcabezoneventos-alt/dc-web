"""Prepare only the six reviewed Rappi additions; no network or Sheets writes."""
import argparse
import csv
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCH = 'cotillon-seis-rappi-2026-10-28'
# ID, requested display name, price, stock, section, inner category, reviewed photo SHA-256.
REVIEWED = [
    ('2115454129', 'Globo Surtido 5p', 100, 314, 'Cumpleaños infantil', 'Decoración', '8a62292f050dd6028ab62d94d985b65b214c84a24128a4d5cb78c84749a9b01b'),
    ('2115454122', 'Globos Surtidos Chrome', 350, 153, 'Cumpleaños infantil', 'Decoración', 'b1dc487a7d379d07b23a6c33df3afbe78c50b39159d82cf032087e2679450c83'),
    ('2115454124', 'Globos Surtidos Std', 200, 709, 'Cumpleaños infantil', 'Decoración', '902a1551abcae63eb01bf300543c5db26eb74d200668312136962251dfae1cbe'),
    ('2115456032', 'Piñata Globo Surtida 20"', 2000, 84, 'Cumpleaños infantil', 'Bolsas y piñatas', 'b72ff56165635f77bcbf4f22f67140d873af5c04664a524da9319187bc01ece8'),
    ('2115454118', 'Tutús Surtidos', 8000, 10, 'Fiestas', 'Alas y tutús', 'c3a87afd9f847196dc3358f7348996ed01eac285fabdbe3996feb614b31bf3b6'),
    ('2115454258', 'Cinta De Precaución Amarilla X Metro', 200, 190, 'Hilos y cintas', '', 'f48cf4c6e3cb3ab6752c87f8edb2da2cb0a082ce00be2cdcaceb92086b9da1f2'),
]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--photo-index', type=Path, required=True)
    parser.add_argument('--photos-directory', type=Path, required=True)
    args = parser.parse_args()
    with args.photo_index.open(encoding='utf-8-sig', newline='') as source:
        index = list(csv.DictReader(source))
    products = []
    copies = []
    for source_id, name, price, stock, section, inner, expected_sha in REVIEWED:
        matches = [row for row in index if row['id'] == source_id]
        if len(matches) != 1:
            raise ValueError(f'Índice ambiguo o sin foto: {source_id}')
        row = matches[0]
        allowed_names = {name, 'Globo Surtidos Chrome'} if source_id == '2115454122' else {name}
        if row['name'] not in allowed_names or row['origin'] != 'Rappi':
            raise ValueError(f'La identidad de la foto cambió: {source_id}')
        photo = (args.photos_directory / row['file']).resolve()
        if not photo.is_relative_to(args.photos_directory.resolve()) or digest(photo) != expected_sha:
            raise ValueError(f'La foto revisada cambió: {source_id}')
        if int(row['width']) < 400 or int(row['height']) < 400:
            raise ValueError(f'La foto no tiene la resolución revisada: {source_id}')
        filename = source_id + '.jpg'
        copies.append((photo, ROOT / 'backend/import-images/cotillon-seis-2026-10-28' / filename))
        products.append({
            'sourceId': source_id, 'name': name, 'description': name,
            'group': 'DESCARTABLES' if source_id == '2115454258' else 'COTILLÓN',
            'section': section, 'inner': inner, 'price': price, 'stock': stock,
            'sku': row['code'], 'sourceName': row['name'], 'sourcePhotoFile': row['file'],
            'sourcePhotoUrl': row['url'], 'photoApproved': True,
            'photoFile': filename, 'photoSha256': expected_sha,
            'photoUrl': 'https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/cotillon-seis-2026-10-28/' + filename,
            'photoReviewReason': '',
        })
    # Validate all six before creating any output; preserve the original image bytes.
    for original, destination in copies:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(original, destination)
    output = ROOT / 'backend/import-cotillon-seis-rappi-2026-10-28.json'
    text = json.dumps({'version': 1, 'batch': BATCH, 'photoIndexSha256': digest(args.photo_index), 'products': products}, ensure_ascii=False, indent=2) + '\n'
    output.write_bytes(text.encode('utf-8'))
    print(json.dumps({'products': len(products), 'approvedPhotos': sum(p['photoApproved'] for p in products), 'sha256': digest(output)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
