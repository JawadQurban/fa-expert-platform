"""Rebuild docs/integrations/fast-portal-api-register.md from the saved FAST swagger.

Run from the repository root after refreshing the snapshots:

    curl -s https://testingportal.fa.gov.sa/fa-api/swagger/v1/swagger.json -o tools/fast-api/swagger-v1.json
    curl -s https://testingportal.fa.gov.sa/fa-api/swagger/v2/swagger.json -o tools/fast-api/swagger-v2.json
    python tools/fast-api/build-register.py 2026-10-06

The argument is the capture date. Sections 1-3 of the register are written by hand
and are carried over untouched; everything else is generated. Live results come
from live-calls.json, response fields of untyped operations from
observed-fields.json, and the "changes" section is a diff against the operations
the register listed before this run.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'docs', 'integrations', 'fast-portal-api-register.md')
SPECS = ['swagger-v1.json', 'swagger-v2.json']
METHODS = ('get', 'post', 'put', 'delete', 'patch')
captured = sys.argv[1] if len(sys.argv) > 1 else '(date not given)'


def load(name):
    with io.open(os.path.join(HERE, name), encoding='utf-8-sig') as f:
        return json.load(f)


specs = [load(n) for n in SPECS]
live = load('live-calls.json')
observed = {k: v for k, v in load('observed-fields.json').items() if not k.startswith('_')}
schemas = {}
for s in specs:
    schemas.update(s.get('components', {}).get('schemas', {}))

ops = []  # (tag, METHOD, path, op)
for s in specs:
    for path, item in s['paths'].items():
        for m, op in item.items():
            if m in METHODS:
                ops.append(((op.get('tags') or ['(untagged)'])[0], m.upper(), path, op))

previous = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
prev_ops = set(re.findall(r"^\| `(GET|POST|PUT|DELETE|PATCH)` \| `([^`]+)` \|", previous, re.M))
prev_date = (re.search(r"\*\*Captured\*\* \| (.+?) \|", previous) or [None, 'the previous capture'])[1]
hand = re.search(r"(## 1\. .*?)(?=^## 4\. )", previous, re.S | re.M)
hand = re.sub(r'(\s*---\s*)+$', '', hand.group(1)) if hand else '## 1. Response envelopes\n\n_TODO_'
old_changes = re.search(r'^## 8\. Changes\n.*', previous, re.S | re.M)


def ref_name(ref):
    return ref.rsplit('/', 1)[-1]


def anchor(name):
    return re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))


def type_of(sch, link=True):
    """A schema's type as one short label; named schemas link to the dictionary."""
    if not sch:
        return 'object'
    if '$ref' in sch:
        n = ref_name(sch['$ref'])
        return f'[{n}](#{anchor(n)})' if link else n
    if sch.get('type') == 'array':
        inner = type_of(sch.get('items', {}), link)
        cut = inner.index(']') if inner.startswith('[') else len(inner)
        return inner[:cut] + '[]' + inner[cut:]
    if sch.get('format') == 'date-time':
        return 'datetime'
    if 'allOf' in sch and sch['allOf']:
        return type_of(sch['allOf'][0], link)
    return sch.get('type', 'object')


def refs_in(sch, seen):
    """Every named schema reachable from sch, transitively."""
    if isinstance(sch, dict):
        if '$ref' in sch:
            n = ref_name(sch['$ref'])
            if n not in seen and n in schemas:
                seen.add(n)
                refs_in(schemas[n], seen)
        for v in sch.values():
            refs_in(v, seen)
    elif isinstance(sch, list):
        for v in sch:
            refs_in(v, seen)
    return seen


def body_schema(container):
    content = (container or {}).get('content', {})
    for ct in ('application/json', 'text/json', 'text/plain', 'multipart/form-data'):
        if ct in content:
            return content[ct].get('schema')
    return next(iter(content.values()), {}).get('schema') if content else None


def response_schema(op):
    r = op.get('responses', {}).get('200')
    return body_schema(r) if r else None


def cell_params(op):
    out = []
    for p in op.get('parameters', []):
        if p['name'] == 'Accept-Language':
            continue
        notes = [x for x in ('required' if p.get('required') else None,
                             p['in'] if p['in'] != 'query' else None) if x]
        out.append(f"`{p['name']}` *{type_of(p.get('schema', {}), False)}*" + (f" ({', '.join(notes)})" if notes else ''))
    return '<br>'.join(out) or '—'


def cell_returns(op):
    out = []
    for code, r in op.get('responses', {}).items():
        sch = body_schema(r)
        out.append(f"`{code}` {type_of(sch) if sch else r.get('description', '')}")
    return '<br>'.join(out)


def cell_live(key):
    rows = live.get(key, [])
    return '<br>'.join(f"`{r['status']}` {r.get('size', '')} · {r['auth']}, {r['date']}".replace('  ', ' ') for r in rows)


def expand(sch, depth, trail, w):
    """Field-by-field listing of a schema, nested up to four levels, cycles cut."""
    if '$ref' in sch:
        n = ref_name(sch['$ref'])
        if n in trail or depth > 4:
            return
        sch, trail = schemas.get(n, {}), trail | {n}
    if sch.get('type') == 'array':
        return expand(sch.get('items', {}), depth, trail, w)
    req = set(sch.get('required', []))
    for name, f in (sch.get('properties') or {}).items():
        w(f"{'  ' * depth}- `{name}` — {type_of(f, False)}" + (' **required**' if name in req else ''))
        target = f.get('items', f) if f.get('type') == 'array' else f
        if '$ref' in target and 'enum' not in schemas.get(ref_name(target['$ref']), {}):
            expand(target, depth + 1, trail, w)


# ── assemble ────────────────────────────────────────────────────────────────
lines = []
w = lines.append
tags = sorted({t for t, *_ in ops}, key=str.lower)
by_method = {m: sum(1 for _, mm, *_ in ops if mm == m) for m in ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')}
typed = [o for o in ops if response_schema(o[3])]
lang_everywhere = all(any(p['name'] == 'Accept-Language' for p in o[3].get('parameters', [])) for o in ops)
used = set()
for *_, op in ops:
    refs_in(op, used)
objects = sorted((n for n in used if 'enum' not in schemas[n]), key=str.lower)
enums = sorted((n for n in used if 'enum' in schemas[n]), key=str.lower)

w('# FA Portal API Register')
w('')
w('Every operation published by `Ims.Portal.Api` on the Financial Academy testing portal: the parameters it takes, '
  'the payload it declares in return, and the fields inside that payload. Generated from the OpenAPI 3.0 definitions '
  'at `/fa-api/swagger/v1/swagger.json` and `/fa-api/swagger/v2/swagger.json`, saved in `tools/fast-api/`. '
  '**Do not edit sections 4–7 by hand** — run `fast-api/build-register.py`.')
w('')
w('| | |')
w('|---|---|')
w('| **Host** | `testingportal.fa.gov.sa` |')
w('| **Base path** | `/fa-api` |')
w('| **Auth (declared)** | Bearer JWT on every operation (`Authorization: Bearer <token>`) |')
w('| **Auth (observed)** | Not enforced on the public catalogue: `Lookup/*`, `Program/Search` and `Program/GetPlansByProgramId` answer `200` with no token. `Program/GetProgramLiveSessions` accepts the service token as valid (no 401) but refuses it at authorization (`success=false`, `Unauthorized`). Caller-scoped endpoints (e.g. `GetProgramPlanTakers`) return nothing for a service principal (2026-10-06) |')
w('| **Service token** | Client credentials, client `fast_test`, scope `fast_integration`, from `https://testingauth.fa.gov.sa/identitymanagement.sts/connect/token` |')
w(f"| **Required header** | {'`Accept-Language` (`ar`/`en`) on every operation' if lang_everywhere else '`Accept-Language` on most operations'} |")
w(f'| **Operations** | {len(ops)} across {len(tags)} controllers |')
w('| **By method** | ' + ' · '.join(f'{c} {m}' for m, c in by_method.items() if c) + ' |')
w(f'| **Schemas documented** | {len(objects)} objects + {len(enums)} enums (request and response) |')
w(f'| **Typed responses** | {len(typed)} of {len(ops)}; the rest declare a bare `200 OK` |')
w(f'| **Captured** | {captured} |')
w('')
w('**Contents** — [1. Response envelopes](#1-response-envelopes) · [2. Live call results](#2-live-call-results) · '
  '[3. Reading the tables](#3-reading-the-tables) · [4. Endpoint reference](#4-endpoint-reference) · '
  '[5. Return bodies](#5-return-bodies) · [6. Fields observed live](#6-fields-observed-live) · '
  '[7. Schema dictionary](#7-schema-dictionary) · [8. Changes](#8-changes)')
w('')
w('---')
w('')
w(hand.rstrip())
w('')
w('---')
w('')

# 4. endpoints
w('## 4. Endpoint reference')
w('')
counts = {t: sum(1 for tt, *_ in ops if tt == t) for t in tags}
half = (len(tags) + 1) // 2
w('| Controller | Ops | Controller | Ops |')
w('|---|---:|---|---:|')
for i in range(half):
    a = tags[i]
    b = tags[i + half] if i + half < len(tags) else None
    w(f'| [{a}](#{anchor(a)}) | {counts[a]} | ' + (f'[{b}](#{anchor(b)}) | {counts[b]} |' if b else ' | |'))
w('')
for t in tags:
    w(f'### {t}')
    w('')
    w('| Method | Path | Parameters | Accepts | Returns | Live |')
    w('|---|---|---|---|---|---|')
    notes = []
    for tt, m, p, op in ops:
        if tt != t:
            continue
        req = body_schema(op.get('requestBody'))
        w(f"| `{m}` | `{p}` | {cell_params(op)} | {type_of(req) if req else '—'} | {cell_returns(op)} | {cell_live(f'{m} {p}')} |")
        text = ' '.join(x.strip() for x in (op.get('summary'), op.get('description')) if x and x.strip())
        live_notes = '; '.join(r['note'] for r in live.get(f'{m} {p}', []) if r.get('note'))
        if text or live_notes:
            notes.append(f"- **`{m} {p}`** — " + ' '.join(x for x in (text, f'*Live:* {live_notes}.' if live_notes else '') if x))
    w('')
    lines.extend(notes + ([''] if notes else []))

# 5. return bodies
w('## 5. Return bodies')
w('')
w('The response payload of every operation that declares one, expanded field by field. Each heading lists the operations that return it.')
w('')
returned = {}
for _, m, p, op in ops:
    sch = response_schema(op)
    if sch:
        returned.setdefault(type_of(sch, False), []).append((m, p, sch))
for name in sorted(returned, key=str.lower):
    users = returned[name]
    w(f'### {name} — full response body')
    w('')
    w('Returned by: ' + ', '.join(f'`{m} {p}`' for m, p, _ in users))
    w('')
    expand(users[0][2], 0, set(), w)
    w('')

# 6. observed
w('## 6. Fields observed live')
w('')
w('Operations whose swagger response is a bare `200 OK`, so the spec says nothing about the body. These fields were read from real responses (`tools/fast-api/observed-fields.json`).')
w('')
for key, o in observed.items():
    w(f"### `{key}`")
    w('')
    w(f"Envelope `{o['envelope']}`, `value` is {o['value']}:")
    w('')
    w(', '.join(f'`{f}`' for f in o['fields']))
    w('')

# 7. dictionary
w('## 7. Schema dictionary')
w('')
w(f'All {len(objects)} object schemas and {len(enums)} enums reachable from any operation (request or response), alphabetically, one level deep.')
w('')
for n in objects:
    sch = schemas[n]
    req = set(sch.get('required', []))
    w(f'#### {n}')
    w('')
    props = sch.get('properties') or {}
    if not props:
        w('_No properties declared._')
        w('')
        continue
    w('| Field | Type | Required |')
    w('|---|---|---|')
    for f, fs in props.items():
        t = type_of(fs)
        w(f"| `{f}` | {t if t.startswith('[') else f'`{t}`'} | {'yes' if f in req else ''} |")
    w('')
for n in enums:
    w(f'#### {n}')
    w('')
    w('Enum: ' + ', '.join(f'`{v}`' for v in schemas[n]['enum']))
    w('')

# 8. changes
now = {(m, p) for _, m, p, _ in ops}
added, removed = sorted(now - prev_ops, key=lambda x: x[1]), sorted(prev_ops - now, key=lambda x: x[1])
if not added and not removed and old_changes:
    # A rebuild with no new capture keeps the last real diff instead of "0 changes".
    w(old_changes.group(0).rstrip('\n'))
    w('')
else:
    w('## 8. Changes')
    w('')
    w(f'Since {prev_date}: **{len(added)} added, {len(removed)} removed.**')
    w('')
    for label, items in (('Added', added), ('Removed', removed)):
        if items:
            w(f'**{label}**')
            w('')
            lines.extend(f'- `{m} {p}`' for m, p in items)
            w('')

with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(lines))
print(f'wrote {OUT}: {len(ops)} ops, {len(tags)} controllers, {len(objects)}+{len(enums)} schemas, '
      f'{len(typed)} typed, +{len(added)}/-{len(removed)} since {prev_date}')
