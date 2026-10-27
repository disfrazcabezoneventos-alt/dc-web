"""Build a review-only report from the staged payload and preserved CSV snapshot."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
payload = json.loads((ROOT / 'backend/import-cotillon-incremental-2026-10-27.json').read_text(encoding='utf-8'))['products']
snapshot = ROOT / 'tmp/import-2026-10-27/originales/cotillon.csv'
with snapshot.open(encoding='utf-8-sig', newline='') as handle:
    old = {p['sourceId']: p for row in csv.DictReader(handle) if (p := json.loads(row['registro_json'])).get('sourceId')}

changed = [p for p in payload if p['sourceId'] in old and (old[p['sourceId']]['price'], old[p['sourceId']]['stock']) != (p['price'], p['stock'])]
restocked = [p for p in payload if p['sourceId'] in old and old[p['sourceId']].get('active') is False]
halloween = [p for p in payload if p['baselinePrice'] is None and p['section'] == 'Halloween']
assert len(changed) == 87 and len(restocked) == 14
http = json.loads((ROOT / 'tmp/import-2026-10-27/restock-http.json').read_text(encoding='utf-8'))
assert {r['id'] for r in http['results']} == {p['sourceId'] for p in restocked}
assert all(r['passed'] and r['image']['status'] == 200 and r['thumbnail']['status'] == 200 for r in http['results'])

def money(value):
    return f'$ {value:,.0f}'.replace(',', '.')

def change(previous, new):
    if previous == 0:
        return 'base 0' if new else '0 %'
    return f'{(new / previous - 1) * 100:+.1f} %'

def big(previous, new):
    return previous == 0 and new != 0 or previous != 0 and abs(new / previous - 1) > .30

lines = [
    '# Revisión de la importación incremental de Cotillón', '',
    'Fuente: Excel corregido el 27/10/2026 y copia CSV de 1.206 registros. Este archivo no ejecuta cambios en Google Sheets.', '',
    f'- Lote principal: {len(payload)} IDs de Rappi; 554 existentes, 107 altas. Los 24 globos de Mini no forman parte de este lote.',
    f'- Altas Halloween primero: {len(halloween)}. Sorbetes Halloween está incluido con foto local verificada.',
    '- Actualizaciones propuestas: 87 registros, todos con cambio de stock y solo uno también con cambio de precio. El importador verifica cada campo contra su valor original antes de escribir; respeta ediciones manuales.',
    '- Los 14 productos inactivos que recuperaron stock se reactivan solo si conservan las URL originales y ambas responden HTTP 200 como imagen al ejecutar el lote. Si falla una, la ficha completa queda sin escribir e inactiva.', '',
    '## 87 actualizaciones propuestas', '',
    'Marca **>30 %** cuando cambia el precio o el stock en más de 30 %. `base 0` señala un stock anterior de cero.', '',
    '| ID Rappi | Producto | Precio actual | Precio nuevo | Δ precio | Stock actual | Stock nuevo | Δ stock | Marca |',
    '|---|---|---:|---:|---:|---:|---:|---:|---|',
]
for p in changed:
    before = old[p['sourceId']]
    flag = '**>30 %**' if big(before['price'], p['price']) or big(before['stock'], p['stock']) else ''
    lines.append(f"| {p['sourceId']} | {p['name'].replace('|', '/')} | {money(before['price'])} | {money(p['price'])} | {change(before['price'], p['price'])} | {before['stock']} | {p['stock']} | {change(before['stock'], p['stock'])} | {flag} |")

lines += ['', '## 14 reactivaciones condicionadas', '',
          'El 27/10/2026 se hizo un GET HTTP de ambas URL de cada ficha: las 28 respondieron 200 con contenido de imagen. Apps Script volverá a comprobarlas al ejecutar; una falla deja esa ficha inactiva.', '',
          '| ID Rappi | Producto | Stock nuevo | Imagen | Miniatura |', '|---|---|---:|---|---|']
for p in restocked:
    lines.append(f"| {p['sourceId']} | {p['name'].replace('|', '/')} | {p['stock']} | HTTP 200 | HTTP 200 |")

lines += ['', '## Altas Halloween al principio del lote', '',
          '| ID Rappi | Producto | Foto origen |', '|---|---|---|']
for p in halloween:
    lines.append(f"| {p['sourceId']} | {p['name'].replace('|', '/')} | {p['photoOrigin']} |")

output = ROOT / 'backend/INFORME_COTILLON_INCREMENTAL_2026_10_27.md'
output.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(json.dumps({'actualizaciones': len(changed), 'inactivos': len(restocked), 'altas_halloween': len(halloween), 'marcados_30': sum(big(old[p['sourceId']]['price'], p['price']) or big(old[p['sourceId']]['stock'], p['stock']) for p in changed)}, ensure_ascii=False))
