"""Rebuild docs/integrations/fast-training-api-register.md from the saved FAST Training API swagger.

The Training API is the service FAST published for Expert Hub's integration request
(B-03 ... B-14, plus the reference lists). It is a different host and scope from the
portal API that build-register.py covers, so it has its own, much smaller register.

Run from the repository root after refreshing the snapshot (GET only):

    curl -s https://testingadminapi.fa.gov.sa/training/swagger/v1/swagger.json -o tools/fast-api/training-swagger-v1.json
    python tools/fast-api/build-training-register.py 2026-10-20

The argument is the capture date.
"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'docs', 'integrations', 'fast-training-api-register.md')
captured = sys.argv[1] if len(sys.argv) > 1 else '(date not given)'

with io.open(os.path.join(HERE, 'training-swagger-v1.json'), encoding='utf-8-sig') as f:
    spec = json.load(f)
schemas = spec.get('components', {}).get('schemas', {})


def type_of(sch):
    if not sch:
        return 'object'
    if '$ref' in sch:
        name = sch['$ref'].rsplit('/', 1)[-1]
        # ApiResponse<T> wrappers say nothing a reader needs: show T.
        for suffix in ('ApiResponse',):
            if name.endswith(suffix) and name != suffix:
                inner = name[:-len(suffix)]
                if inner.endswith('List'):
                    return f'[{inner[:-4]}](#{inner[:-4].lower()})[]'
                return f'[{inner}](#{inner.lower()})'
        return f'[{name}](#{name.lower()})'
    if sch.get('type') == 'array':
        return type_of(sch.get('items', {})) + '[]'
    kind = sch.get('format') or sch.get('type', 'object')
    return kind + ('?' if sch.get('nullable') else '')


def one_line(text):
    return ' '.join((text or '').split()).replace('|', '\\|')


ops = []
for path, item in spec['paths'].items():
    for method, op in item.items():
        ops.append(((op.get('tags') or ['(untagged)'])[0], method.upper(), path, op))

out = []
w = out.append
w('# FAST Training API Register')
w('')
w('Every operation of the FAST **Training API**, the service FAST published for Expert Hub\'s '
  'integration request (`22_FAST_INTEGRATION_REQUEST.md`, blocked items B-03 to B-14). '
  'Generated from `tools/fast-api/training-swagger-v1.json` by '
  '`tools/fast-api/build-training-register.py` — **do not edit by hand**.')
w('')
w('| | |')
w('|---|---|')
w('| **Host (testing)** | `testingadminapi.fa.gov.sa` |')
w(f'| **Base path** | `{spec.get("servers", [{}])[0].get("url", "")}` |')
security = spec.get('components', {}).get('securitySchemes', {})
for name, scheme in security.items():
    for flow, detail in scheme.get('flows', {}).items():
        w(f'| **Auth** | OAuth 2.0 `{flow}`, scope `{", ".join(detail.get("scopes", {}))}`, '
          f'token from `{detail.get("tokenUrl", "")}` |')
w(f'| **Operations** | {len(ops)} |')
by_method = {}
for _, method, _, _ in ops:
    by_method[method] = by_method.get(method, 0) + 1
w('| **By method** | ' + ' · '.join(f'{n} {m}' for m, n in sorted(by_method.items())) + ' |')
w('| **Envelope** | `ApiResponse` — `success`, `message`, `modelStateErrors`, `value` (the payload) |')
w(f'| **Captured** | {captured} |')
w('')
w('## Operations')
w('')
w('| Method | Path | Parameters | Returns | Summary |')
w('|---|---|---|---|---|')
for tag in sorted({o[0] for o in ops}):
    for _, method, path, op in [o for o in ops if o[0] == tag]:
        params = [f'`{p["name"]}` ({p["in"]}{", required" if p.get("required") else ""})'
                  for p in op.get('parameters', [])]
        body = op.get('requestBody', {}).get('content', {})
        if body:
            first = next(iter(body.values())).get('schema', {})
            if '$ref' in first:
                params.append('body ' + type_of(first))
            else:
                required = first.get('required', [])
                fields = ', '.join(f'`{k}`' + ('' if k in required else '?')
                                   for k in (first.get('properties') or {}))
                params.append(f'body ({next(iter(body))}: {fields})')
        ok = op.get('responses', {}).get('200', {}).get('content', {})
        returns = type_of(next(iter(ok.values())).get('schema', {})) if ok else '—'
        w(f'| `{method}` | `{path}` | {"<br>".join(params) or "—"} | {returns} | {one_line(op.get("summary"))} |')
w('')
w('## Error responses')
w('')
for _, method, path, op in ops:
    errors = [f'`{code}` {one_line(r.get("description"))}' for code, r in op.get('responses', {}).items()
              if code != '200']
    if errors:
        w(f'- `{method} {path}` — ' + '; '.join(errors))
w('')
w('## Schemas')
w('')
for name, sch in schemas.items():
    if name.endswith('ApiResponse') and name != 'ApiResponse':
        continue
    w(f'### {name}')
    w('')
    if sch.get('description'):
        w(one_line(sch['description']))
        w('')
    props = sch.get('properties') or {}
    if props:
        w('| Field | Type | Notes |')
        w('|---|---|---|')
        for prop, value in props.items():
            w(f'| `{prop}` | {type_of(value)} | {one_line(value.get("description"))} |')
        w('')

with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
print(f'{len(ops)} operations -> {os.path.relpath(OUT)}')
