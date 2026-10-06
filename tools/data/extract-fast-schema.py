"""Regenerate the FAST schema snapshot from the two supplied field files.

Run from the repository root:
    python <this file>

Rewrites frontend/src/shared/fast/fastSchema.ts
"""
import io, os, collections, openpyxl

DOCS = 'docs/inputs'
FILES = ['fast-trainer-profile-fields.xlsx', 'fast-trainer-history-fields.xlsx']
OUT = 'frontend/src/shared/fast/fastSchema.ts'

tables = collections.OrderedDict()
categories = collections.OrderedDict()
total = 0

for name in FILES:
    ws = openpyxl.load_workbook(os.path.join(DOCS, name), data_only=True).worksheets[0]
    for row in list(ws.iter_rows(values_only=True))[1:]:
        cat, tbl, fld = (list(row) + [None] * 3)[:3]
        if not tbl or not fld:
            continue
        tbl, fld = str(tbl).strip(), str(fld).strip()
        tables.setdefault(tbl, [])
        if fld not in tables[tbl]:
            tables[tbl].append(fld)
            total += 1
        if cat:
            categories[tbl] = str(cat).strip()

lines = []
w = lines.append
w('// AUTO-GENERATED from the two supplied FAST field files. Do not edit by hand.')
w('//')
w('//   docs/inputs/fast-trainer-profile-fields.xlsx')
w('//   docs/inputs/fast-trainer-history-fields.xlsx')
w('//')
w('// Regenerate after the owner extends either file (the stated intent is that')
w('// they will grow) with the script recorded in `13_FAST_DATA_DICTIONARY_MAP.md`.')
w('')
w('/**')
w(' * A snapshot of **exactly what FAST supplied** — nothing inferred, nothing added.')
w(' *')
w(' * This exists so `fastSources.ts` can be *checked* rather than trusted: a claim')
w(' * that some Expert Hub field comes from a FAST column is only meaningful if that')
w(' * column was actually supplied, and `fastSources.test.ts` proves every claim')
w(' * against this snapshot. Inventing a FAST field therefore fails the build.')
w(' *')
w(f' * {len(tables)} tables · {total} columns · supplied 2026-08-23.')
w(' */')
w('export const FAST_SCHEMA_SNAPSHOT: Readonly<Record<string, readonly string[]>> = {')
for tbl, cols in tables.items():
    cat = categories.get(tbl, '')
    w(f'  // {cat}')
    w(f"  '{tbl}': [")
    line = '   '
    for c in cols:
        piece = f" '{c}',"
        if len(line) + len(piece) > 96:
            w(line)
            line = '   '
        line += piece
    if line.strip():
        w(line)
    w('  ],')
w('};')
w('')
w('/** Every `Table.Column` the files supplied, as one flat set for lookups. */')
w('export const FAST_COLUMNS: ReadonlySet<string> = new Set(')
w('  Object.entries(FAST_SCHEMA_SNAPSHOT).flatMap(([table, columns]) =>')
w('    columns.map((column) => `${table}.${column}`)')
w('  )')
w(');')
w('')

io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
print(f'wrote {OUT}: {len(tables)} tables, {total} columns')
