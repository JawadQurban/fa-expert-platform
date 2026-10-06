import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Lightweight, dependency-free CSS enforcement for the two DC rules
 * `docs/DESIGN_CONSTRAINTS.md` §6 claims are lint-enforced but, per the
 * Phase 5D production-readiness review, had zero actual tooling behind
 * them: DC-04 (approved colors only — no hard-coded hex/rgb literals in
 * component stylesheets) and DC-23 (logical properties only — no
 * left/right). Both rules are already 100% compliant across the design
 * system as of this check being added (verified by the same review), so
 * this intentionally only guards against *future* regressions — it does
 * not attempt to also enforce DC-03/DC-08 (no hard-coded spacing/sizing),
 * since a handful of pre-existing, previously-catalogued minor magic
 * numbers (e.g. `Link.module.css`'s `0.2em`) would immediately fail that
 * broader check and are tracked separately as technical debt, not
 * regressed-on-purpose here.
 *
 * This is deliberately a small script, not a stylelint config, to avoid
 * adding a new dependency for two checks — "stylelint or equivalent CSS
 * enforcement" per the hardening brief.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dsRoot = path.join(__dirname, '..', 'src', 'design-system');

// Token-definition files legitimately declare raw hex/rgb values — that's
// their entire purpose (the reference/primitive tier). Foundation files
// (reset/global) are not component surfaces either. Everything else under
// design-system (every `*.module.css`) must be token-only.
const EXCLUDED_FILES = new Set(['tokens.css', 'reset.css', 'global.css']);
const EXCLUDED_DIRS = [path.join(dsRoot, 'tokens')];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        !EXCLUDED_DIRS.some(
          (excluded) => full === excluded || full.startsWith(`${excluded}${path.sep}`)
        )
      ) {
        walk(full, out);
      }
    } else if (entry.name.endsWith('.css') && !EXCLUDED_FILES.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_FUNCTION = /\brgba?\s*\(/g;
const PHYSICAL_PROPERTY =
  /(?<![\w-])(left|right|margin-left|margin-right|padding-left|padding-right|border-left(?:-\w+)?|border-right(?:-\w+)?)\s*:/g;
const PHYSICAL_TEXT_ALIGN = /text-align\s*:\s*(left|right)\b/g;

const violations = [];

for (const file of walk(dsRoot)) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(path.join(__dirname, '..'), file);
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    for (const match of line.matchAll(HEX_COLOR)) {
      violations.push(
        `${relative}:${lineNumber} — hard-coded hex color "${match[0]}" (DC-04: tokens only, use var(--fads-sys-color-*))`
      );
    }
    for (const match of line.matchAll(RGB_FUNCTION)) {
      violations.push(
        `${relative}:${lineNumber} — hard-coded "${match[0].trim()}" color function (DC-04: tokens only, use var(--fads-sys-color-*))`
      );
    }
    for (const match of line.matchAll(PHYSICAL_PROPERTY)) {
      violations.push(
        `${relative}:${lineNumber} — physical-direction property "${match[1]}" (DC-23: use logical properties, e.g. inset-inline-start/margin-inline-start/padding-inline-start)`
      );
    }
    for (const match of line.matchAll(PHYSICAL_TEXT_ALIGN)) {
      violations.push(
        `${relative}:${lineNumber} — "text-align: ${match[1]}" (DC-23: use "text-align: start" / "text-align: end")`
      );
    }
  });
}

if (violations.length > 0) {
  console.error(`Found ${violations.length} CSS constraint violation(s):\n`);
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: no hard-coded colors (DC-04) or physical-direction properties (DC-23) found.');
}
