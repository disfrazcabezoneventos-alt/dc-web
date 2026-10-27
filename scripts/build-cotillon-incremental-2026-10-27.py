"""Prepare a read-only Cotillón import from the 27 Oct workbook and photo index.

This script never contacts Sheets or Cloudinary. It rejects mismatched rows rather
than guessing an identity, price, stock, category, or photo. Keep the source
workbook and CSV snapshot outside Git and make a verified backup first.
"""

import argparse
import csv
import hashlib
import json
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl


def key(value):
    text = unicodedata.normalize('NFD', str(value or ''))
    return ' '.join(''.join(c for c in text if unicodedata.category(c) != 'Mn').casefold().split())


ALIASES = {
    'sobres/bolsas': 'Sobres / Bolsas',
    'vasos/copas/jarras': 'Vasos / Copas / Jarras',
    'maquillaje/pinta pelo': 'Maquillaje pinta pelo',
    'corbatas/monos/cinturones/tiradores': 'Corbatas moños cinturones y tiradores',
}


def category_key(value):
    original = key(value)
    return key(ALIASES.get(original, value))


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as source:
        return list(csv.DictReader(source))


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workbook', type=Path, required=True)
    parser.add_argument('--photo-index', type=Path, required=True)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--categories', type=Path, required=True)
    parser.add_argument('--photos-directory', type=Path, required=True)
    parser.add_argument('--local-photos-directory', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()

    workbook = openpyxl.load_workbook(args.workbook, read_only=True, data_only=True)
    general_values = list(workbook['General'].values)
    web_values = list(workbook['Web dc'].values)
    general = [dict(zip(general_values[0], row)) for row in general_values[1:] if row[5] is not None]
    web = [dict(zip(web_values[0], row)) for row in web_values[1:] if row[0] is not None]
    snapshot = [json.loads(row['registro_json']) for row in read_csv(args.snapshot)]
    by_id = {p['sourceId']: p for p in snapshot if p.get('sourceId')}
    if len(by_id) != len(snapshot):
        raise ValueError('La copia de cotillon tiene IDs de origen faltantes o duplicados.')
    old_imports = {}
    for filename in ('import-cotillon-excel-2026.json', 'import-cotillon-agotados-2026.json'):
        file = Path(__file__).resolve().parents[1] / 'backend' / filename
        for product in json.loads(file.read_text(encoding='utf-8'))['products']:
            old_imports[product['sourceId']] = product
    photos = defaultdict(list)
    for row in read_csv(args.photo_index):
        if row['id']:
            photos[row['id']].append(row)
    photo_files = {p.name for p in args.photos_directory.rglob('*') if p.is_file()}
    local_photo = 'sorbetes-halloween__2115454079.jpg'
    local_path = args.local_photos_directory / local_photo
    committed_path = Path(__file__).resolve().parents[1] / 'backend' / 'import-images' / 'cotillon-2026-10-27' / local_photo
    if not local_path.is_file() or not committed_path.is_file() or sha256(local_path) != sha256(committed_path) or sha256(local_path) != '3ad62bbad1660350471754f1603c2bca07050823aedd7fce4c92dd5381a1b786':
        raise ValueError('La foto local de Sorbetes Halloween no coincide con el archivo revisado.')
    photos['2115454079'] = [{'id': '2115454079', 'file': local_photo, 'url': 'https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/cotillon-2026-10-27/' + local_photo, 'origin': 'local-revisada'}]
    photo_files.add(local_photo)
    categories = [json.loads(row['registro_json']) for row in read_csv(args.categories)]

    visible_web = [r for r in web if r['visible'] == 'Sí']
    visible_by_name = defaultdict(list)
    for row in visible_web:
        visible_by_name[row['nombre']].append(row)
    payload = []
    reasons = []
    for row in general:
        if row['Visible web'] != 'Sí':
            continue
        source_id = str(row['ID del producto'])
        name = row['Producto']
        matched = visible_by_name[name]
        if len(matched) != 1:
            reasons.append((source_id, name, 'La fila visible de Web dc no es única.'))
            continue
        w = matched[0]
        if (w['precio'], w['stock'], w['foto']) != (row['Precio local'], row['Stock Mini'], row['Archivo de foto']):
            reasons.append((source_id, name, 'Precio, stock o foto difiere entre General y Web dc.'))
            continue
        if not isinstance(w['precio'], (int, float)) or isinstance(w['precio'], bool) or w['precio'] <= 0 or w['precio'] > 100000000:
            reasons.append((source_id, name, 'Precio inválido.'))
            continue
        if not isinstance(w['stock'], int) or isinstance(w['stock'], bool) or w['stock'] <= 0 or w['stock'] > 100000:
            reasons.append((source_id, name, 'Stock inválido.'))
            continue
        if 'disfraz' in key(name):
            reasons.append((source_id, name, 'Disfraz: debe permanecer oculto.'))
            continue
        if len(photos[source_id]) != 1 or photos[source_id][0]['file'] != w['foto'] or not photos[source_id][0]['url'] or w['foto'] not in photo_files:
            reasons.append((source_id, name, 'Foto faltante o índice de fotos ambiguo.'))
            continue

        group = next((c['group'] for c in categories if c.get('group') and category_key(c['group']) == category_key(w['categoria_principal'])), None)
        section = next((c for c in categories if c.get('group') == group and not c.get('parentId') and category_key(c['name']) == category_key(w['subcategoria']) and c.get('storefront') is not False), None)
        inner = next((c for c in categories if section and c.get('parentId') == section['id'] and category_key(c['name']) == category_key(w['subcategoria_interna']) and c.get('storefront') is not False), None) if w['subcategoria_interna'] else None
        if not group or not section or (w['subcategoria_interna'] and not inner):
            reasons.append((source_id, name, 'Categoría inexistente en la copia de Google Sheets.'))
            continue
        old = by_id.get(source_id)
        baseline = old_imports.get(source_id) if old else None
        if old and baseline is None:
            reasons.append((source_id, name, 'No se encontró la referencia anterior para proteger ediciones manuales.'))
            continue
        photo = photos[source_id][0]
        payload.append({
            'sourceId': source_id,
            'name': name,
            'description': w['descripcion'],
            'group': group,
            'section': section['name'],
            'inner': inner['name'] if inner else '',
            'price': w['precio'],
            'stock': w['stock'],
            'photoUrl': photo['url'],
            'photoFile': photo['file'],
            'photoOrigin': photo['origin'],
            'sku': str(row['Código'] or ''),
            'baselinePrice': baseline['price'] if baseline else None,
            'baselineStock': baseline['stock'] if baseline else None,
        })

    if reasons:
        raise ValueError('No se generó ningún archivo: ' + json.dumps(reasons[:20], ensure_ascii=False))
    if len(payload) != 661 or len({p['sourceId'] for p in payload}) != 661:
        raise ValueError('El lote no contiene exactamente 661 IDs únicos visibles de General.')
    if sum(p['sourceId'] in by_id for p in payload) != 554:
        raise ValueError('El cruce con la copia no coincide con los 554 existentes esperados.')
    extra_web = [r['nombre'] for r in visible_web if r['nombre'] not in {p['name'] for p in payload}]
    if len(extra_web) != 24:
        raise ValueError('Las variantes visibles sin ID de Rappi ya no son exactamente 24.')

    # Primero las altas de Halloween; después otras altas y finalmente actualizaciones.
    payload.sort(key=lambda p: (0 if p['baselinePrice'] is None and key(p['section']) == 'halloween' else 1 if p['baselinePrice'] is None else 2, p['sourceId']))

    output = {'version': 1, 'batch': 'cotillon-incremental-2026-10-27', 'products': payload}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    report = {
        'source_sha256': {'workbook': sha256(args.workbook), 'photo_index': sha256(args.photo_index), 'cotillon_snapshot': sha256(args.snapshot), 'categories_snapshot': sha256(args.categories)},
        'payload_sha256': sha256(args.out),
        'general_visible': 661,
        'web_visible': len(visible_web),
        'existing': 554,
        'new': 107,
        'visible_variants_without_rappi_id': extra_web,
        'current_price_changes': sum(by_id[p['sourceId']]['price'] != p['price'] for p in payload if p['sourceId'] in by_id),
        'current_stock_changes': sum(by_id[p['sourceId']]['stock'] != p['stock'] for p in payload if p['sourceId'] in by_id),
        'current_changed_products': sum((by_id[p['sourceId']]['price'], by_id[p['sourceId']]['stock']) != (p['price'], p['stock']) for p in payload if p['sourceId'] in by_id),
        'manual_price_fields_in_snapshot': sum(by_id[p['sourceId']]['price'] != p['baselinePrice'] for p in payload if p['sourceId'] in by_id),
        'manual_stock_fields_in_snapshot': sum(by_id[p['sourceId']]['stock'] != p['baselineStock'] for p in payload if p['sourceId'] in by_id),
        'inactive_with_new_stock': [p['sourceId'] for p in payload if p['sourceId'] in by_id and by_id[p['sourceId']].get('active') is False],
        'photo_origins_new': dict(Counter(p['photoOrigin'] for p in payload if p['sourceId'] not in by_id)),
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
