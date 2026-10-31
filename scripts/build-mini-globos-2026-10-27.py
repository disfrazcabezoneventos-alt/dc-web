"""Prepare the separate 24 Mini balloon variants; never writes Google Sheets."""
import csv
import hashlib
import json
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tmp/import-2026-10-27/originales/Stock-productos-rappi-web-2026-10-27.xlsx'
PHOTOS = Path(sys.argv[1]) if len(sys.argv) > 1 else None
DEST = ROOT / 'backend/import-images/mini-globos-2026-10-27'
PAYLOAD = ROOT / 'backend/import-mini-globos-2026-10-27.json'
REPORT = ROOT / 'backend/INFORME_MINI_GLOBOS_2026_10_27.md'
assert PHOTOS and PHOTOS.is_dir(), 'Indicar la carpeta local de fotos como argumento.'

workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
web = [dict(zip(next(workbook['Web dc'].values), row)) for row in list(workbook['Web dc'].values)[1:] if row[0]]
variants = defaultdict(list)
for row in list(workbook['Mapa variantes'].values)[1:]:
    if row[4]:
        variants[row[4]].append(row)
with (ROOT / 'tmp/import-2026-10-27/originales/cotillon.csv').open(encoding='utf-8-sig', newline='') as handle:
    existing = {json.loads(row['registro_json'])['id'] for row in csv.DictReader(handle)}

selected = [row for row in web if row['visible'] == 'Sí' and row['nombre'].startswith('GLOBO ') and row['nombre'].endswith(('12P', '12P X 25'))]
assert len(selected) == 24, f'Esperados 24 globos, encontrados {len(selected)}.'
assert len({row['nombre'] for row in selected}) == 24
data = []
images = {}
for row in selected:
    name = row['nombre']
    matches = variants[name]
    assert len(matches) == 1, (name, 'Mapa variantes ambiguo')
    code = str(matches[0][2]).strip()
    suffix = 'x25' if name.endswith(' X 25') else 'unidad'
    source_id = f'mini-{code}-{suffix}'
    assert source_id not in existing and code.isdigit()
    assert matches[0][5] == row['precio'] and matches[0][6] == row['stock']
    assert row['precio'] > 0 and type(row['stock']) is int and row['stock'] > 0
    assert row['categoria_principal'] == 'Cotillón' and row['subcategoria'] == 'Cumpleaños infantil' and row['subcategoria_interna'] == 'Decoración'
    photo = row['foto']
    src = PHOTOS / photo
    assert src.is_file(), f'Falta foto de {name}: {photo}'
    digest = hashlib.sha256(src.read_bytes()).hexdigest()
    if photo in images:
        assert images[photo] == digest
    images[photo] = digest
    data.append({
        'sourceId': source_id, 'miniCode': code, 'variant': suffix,
        'name': name, 'description': row['descripcion'],
        'group': 'COTILLÓN', 'section': 'Cumpleaños infantil', 'inner': 'Decoración',
        'price': row['precio'], 'stock': row['stock'],
        'photoFile': photo,
        'photoUrl': 'https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/mini-globos-2026-10-27/' + photo,
        'photoSha256': digest,
    })

assert len(data) == 24 and len({p['sourceId'] for p in data}) == 24 and len(images) == 12
assert Counter(p['variant'] for p in data) == {'unidad': 12, 'x25': 12}
DEST.mkdir(parents=True, exist_ok=True)
for photo, digest in images.items():
    destination = DEST / photo
    if destination.exists():
        assert hashlib.sha256(destination.read_bytes()).hexdigest() == digest
    else:
        shutil.copyfile(PHOTOS / photo, destination)
    assert hashlib.sha256(destination.read_bytes()).hexdigest() == digest

data.sort(key=lambda p: (p['miniCode'], p['variant']))
PAYLOAD.write_text(json.dumps({'version': 1, 'batch': 'mini-globos-2026-10-27', 'products': data}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
payload_sha = hashlib.sha256(PAYLOAD.read_bytes()).hexdigest()
lines = [
    '# Segunda etapa: globos Mini', '',
    'Preparación separada del lote de 661 productos con ID Rappi. Ningún cambio se ejecutó en producción.', '',
    '- 12 colores, dos presentaciones cada uno: unidad y bolsa x25. Total: 24 fichas nuevas.',
    '- Identidad: `mini-<código Mini>-unidad` y `mini-<código Mini>-x25`. El sufijo evita que las dos presentaciones del mismo código se confundan.',
    '- Los nombres, precios y stocks salen literalmente de `Web dc` y coinciden con `Mapa variantes`.',
    '- 12 JPG locales se copiaron byte por byte al PR; cada par unidad/x25 comparte la foto del color. No se generó ni editó ninguna foto.',
    '- Las URLs públicas de GitHub servirán únicamente como origen para el flujo firmado existente de Cloudinary, después de una eventual fusión aprobada.',
    f'- SHA-256 del payload: `{payload_sha}`.', '',
    '| Producto | ID interno | Precio | Stock | Foto local |',
    '|---|---|---:|---:|---|',
]
for p in data:
    lines.append(f"| {p['name']} | `{p['sourceId']}` | $ {p['price']:,.0f} | {p['stock']} | {p['photoFile']} |".replace('$ 5,000', '$ 5.000'))
REPORT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(json.dumps({'total': len(data), 'fotos': len(images), 'payload_sha256': payload_sha, 'precios': sorted({p['price'] for p in data})}, ensure_ascii=False))
