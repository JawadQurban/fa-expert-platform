import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dsRoot = path.join(__dirname, '..', 'src', 'design-system');

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

const defined = new Set();
for (const file of [
  path.join(dsRoot, 'tokens', 'generated', 'tokens.css'),
  path.join(dsRoot, 'tokens', 'tokens.css'),
]) {
  const content = fs.readFileSync(file, 'utf8');
  for (const m of content.matchAll(/(--fads-[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
}

const referenced = new Set();
const cssFiles = walk(dsRoot, ['.module.css', 'global.css']);
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const m of content.matchAll(/var\((--fads-[a-z0-9-]+)/g)) referenced.add(m[1]);
}

const missing = [...referenced].filter((r) => !defined.has(r)).sort((a, b) => a.localeCompare(b));
console.log(`Defined: ${defined.size}, Referenced: ${referenced.size}, Missing: ${missing.length}`);
if (missing.length > 0) {
  console.error('The following --fads-* custom properties are referenced in component');
  console.error('.module.css files but are not defined in tokens/generated/tokens.css or');
  console.error('tokens/tokens.css (both loaded by global.css) — every one below will');
  console.error('silently resolve to nothing in a real browser:\n');
  console.error(missing.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: every referenced --fads-* custom property is defined.');
}
