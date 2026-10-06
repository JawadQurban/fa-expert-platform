#!/usr/bin/env node
/**
 * Icon import pipeline (Phase 6 — Platforms Code Icon Library).
 *
 * Input:  scripts/icon-raw/<category>/<icon>.svg
 *         Raw SVG exports from the official Figma file, one per icon,
 *         taken from the canonical "Style=Stroke, Type=Rounded" symbol
 *         (or "Property 1=Stroke, Property 2=Rounded" for the small set
 *         of icons that use that alternate variant-property naming).
 *         Drop new raw exports here (grouped by category folder) and
 *         re-run this script to extend the library — it never needs the
 *         Icon component's public API to change.
 *
 * Output: src/assets/icons/<category>/<icon>.svg              (normalized icon assets)
 *         src/design-system/primitives/Icon/registry/<category>.ts  (one registry object per category)
 *         src/design-system/primitives/Icon/icons.ts                (thin aggregator + IconName type)
 *         src/design-system/primitives/Icon/icon-categories.ts      (category metadata)
 *
 * Per-category registry files keep each generated module small and
 * independently cacheable (by tsc/vite) as the library grows toward its
 * full ~4,372-icon size — a single monolithic icons.ts was fine at pilot
 * scale but forces every tool (typecheck, test, build, build-storybook)
 * to parse the entire registry even when only one category changed.
 *
 * Run:    node scripts/import-icons.mjs
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW_DIR = join(ROOT, 'scripts/icon-raw');
const ASSETS_DIR = join(ROOT, 'src/assets/icons');
const ICON_DIR = join(ROOT, 'src/design-system/primitives/Icon');
const REGISTRY_DIR = join(ICON_DIR, 'registry');

// Official Platforms Code icon categories (canvas "❖ ICONS"), in Figma
// top-to-bottom order — verified via get_metadata on the source file.
// Used only to render human-readable category labels; the kebab id is
// derived the same way from both this list and the raw folder names, so
// a raw folder always resolves to a label even if this list is stale.
const OFFICIAL_CATEGORIES = [
  'Download + Upload',
  'Date + Time',
  'Education',
  'Editing',
  'Clothing',
  'Dashboard',
  'Arrows',
  'Alert',
  'Award',
  'Animation',
  'Add + Remove',
  'Bookmark',
  'AI',
  'Business',
  'Check',
  'Crypto',
  'Buildings',
  'Communications',
  'Logos',
  'Devices',
  'Filter + Sorting',
  'Files Folders',
  'Foods',
  'Furnitures',
  'Shapes',
  'Git',
  'Games',
  'Home',
  'Hierarchy',
  'Link + Unlink',
  'Login + Logout',
  'Hands',
  'Image + Camera',
  'Islamic',
  'Kitchen',
  'Legal',
  'Layout',
  'E-Commerce',
  'Energy',
  'Gym',
  'Mouse',
  'Presentation',
  'Programming',
  'Notes + Tasks',
  'Weather',
  'Users',
  'Wifi',
  'Security',
  'Search',
  'Maps',
  'Media',
  'Menu',
  'Emojis',
  'Science + Technology',
  'Settings',
  'Space',
  'Mathematics',
  'Medical',
  'Logistics',
  'Community Icons',
];

const CANONICAL_STYLE_SELECTORS = [
  'g[id="Style=Stroke, Type=Rounded"]',
  'g[id="Property 1=Stroke, Property 2=Rounded"]',
];

export function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function toTitleCase(kebab) {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function toCamelCase(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Registry-key collision policy: the first category to claim an icon
 * name wins the bare name; every later occurrence (same name, different
 * category — file paths never collide since they're category-namespaced
 * on disk) is disambiguated as `${name}__${category}` and reported as a
 * duplicate. Never silently drops or overwrites an entry.
 */
export function resolveRegistryName(nameOccurrences, iconKebab, categoryKebab, rawFile) {
  const occurrences = nameOccurrences.get(iconKebab) ?? [];
  occurrences.push({ category: categoryKebab, rawFile });
  nameOccurrences.set(iconKebab, occurrences);

  const isDuplicate = occurrences.length > 1;
  const registryName = isDuplicate ? `${iconKebab}__${categoryKebab}` : iconKebab;
  return { registryName, isDuplicate, firstSeenInCategory: occurrences[0].category };
}

const CATEGORY_LABELS = new Map(OFFICIAL_CATEGORIES.map((name) => [toKebabCase(name), name]));

function findRawSvgFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findRawSvgFiles(full).map((f) => ({ ...f, category: entry })));
    } else if (extname(entry).toLowerCase() === '.svg') {
      results.push({ path: full, file: entry, category: basename(dir) });
    }
  }
  return results;
}

/**
 * Extracts the clean 24x24 icon markup from a raw Figma sheet export.
 * Raw exports include sheet-level chrome (background swatch, category
 * translate groups, the dashed selection-frame indicator) that sits
 * outside the 0-24 viewBox and renders invisibly, plus one visible
 * background rect — all discarded here. Only the canonical style
 * group's content survives, with hardcoded ink fills swapped for
 * `currentColor` so the Icon component can drive color via CSS.
 */
function normalizeSvg(rawSvg) {
  const dom = new JSDOM(rawSvg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;

  let styleGroup = null;
  for (const selector of CANONICAL_STYLE_SELECTORS) {
    styleGroup = doc.querySelector(selector);
    if (styleGroup) break;
  }
  if (!styleGroup) {
    return { ok: false, reason: 'canonical Stroke/Rounded style group not found' };
  }

  // Strip descriptive ids (e.g. "Icon", "Vector (Stroke)") so multiple
  // inlined icons on one page never share duplicate DOM ids.
  styleGroup.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  styleGroup.removeAttribute('id');

  let inner = styleGroup.innerHTML.trim();
  if (!inner) {
    return { ok: false, reason: 'canonical style group has no content' };
  }

  inner = inner.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="currentColor"');
  // jsdom re-declares the SVG namespace on elements bordering the
  // extraction boundary when serializing via innerHTML; the wrapper
  // <svg> we emit already declares it once, so drop the redundant copy.
  inner = inner.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');

  return {
    ok: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">\n${inner}\n</svg>\n`,
  };
}

export function main() {
  const summary = {
    discoveredRaw: 0,
    exported: 0,
    skipped: [],
    failed: [],
    duplicates: [],
    categories: {},
  };

  let rawFiles = [];
  try {
    rawFiles = findRawSvgFiles(RAW_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`No raw SVGs found — expected input directory: ${RAW_DIR}`);
      console.error('Export icons from Figma first (see docs/ICON_LIBRARY.md), then re-run.');
      process.exit(1);
    }
    throw err;
  }
  summary.discoveredRaw = rawFiles.length;

  // registryName -> { category, categoryLabel, iconKebab, rawFile }
  const registryEntries = new Map();
  const nameOccurrences = new Map(); // iconKebab -> [{category, rawFile}]

  for (const { path, file, category } of rawFiles) {
    const iconKebab = toKebabCase(basename(file, extname(file)));
    const categoryKebab = toKebabCase(category);
    const categoryLabel = CATEGORY_LABELS.get(categoryKebab) ?? toTitleCase(categoryKebab);

    const { registryName, isDuplicate, firstSeenInCategory } = resolveRegistryName(
      nameOccurrences,
      iconKebab,
      categoryKebab,
      path
    );
    if (isDuplicate) {
      summary.duplicates.push({
        baseName: iconKebab,
        category: categoryKebab,
        registeredAs: registryName,
        firstSeenInCategory,
      });
    }

    registryEntries.set(registryName, {
      category: categoryKebab,
      categoryLabel,
      iconKebab,
      rawPath: path,
    });
  }

  // Fresh output — the assets dir and generated registry are fully derived
  // from raw + this script.
  rmSync(ASSETS_DIR, { recursive: true, force: true });
  rmSync(REGISTRY_DIR, { recursive: true, force: true });
  mkdirSync(REGISTRY_DIR, { recursive: true });

  // categoryKebab -> { label, iconImports: [], iconRegistryLines: [], icons: [] }
  // Grouped by category (rather than one flat pair of arrays) so each
  // category can be written to its own registry file — processing and
  // holding one category's data in memory at a time instead of all
  // categories' import lines simultaneously.
  const categoryMap = new Map();

  for (const [registryName, { category, categoryLabel, rawPath }] of [
    ...registryEntries.entries(),
  ].sort((a, b) => a[0].localeCompare(b[0]))) {
    const raw = readFileSync(rawPath, 'utf-8');
    const result = normalizeSvg(raw);
    if (!result.ok) {
      summary.failed.push({ name: registryName, rawFile: rawPath, reason: result.reason });
      continue;
    }

    const outDir = join(ASSETS_DIR, category);
    mkdirSync(outDir, { recursive: true });
    // Category namespacing on disk already prevents collisions, so the
    // file always uses the bare icon name even when the registry key
    // was disambiguated for a cross-category duplicate.
    const outFile = join(outDir, `${registryName.split('__')[0]}.svg`);
    writeFileSync(outFile, result.svg, 'utf-8');

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        label: categoryLabel,
        iconImports: [],
        iconRegistryLines: [],
        icons: [],
      });
    }
    const bucket = categoryMap.get(category);
    const importVar = `icon_${registryName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const importPath = `@/assets/icons/${category}/${registryName.split('__')[0]}.svg?raw`;
    bucket.iconImports.push(`import ${importVar} from '${importPath}';`);
    bucket.iconRegistryLines.push(`  '${registryName}': ${importVar},`);
    bucket.icons.push(registryName);

    summary.exported += 1;
    summary.categories[category] = (summary.categories[category] ?? 0) + 1;
  }

  const categoryEntriesForRegistry = [...categoryMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const aggregatorImports = [];
  const aggregatorSpreads = [];

  for (const [categoryKebab, { iconImports, iconRegistryLines }] of categoryEntriesForRegistry) {
    const registryVar = `${toCamelCase(categoryKebab)}Icons`;
    const categoryTs = `// AUTO-GENERATED by scripts/import-icons.mjs — do not edit by hand.
// Re-run \`node scripts/import-icons.mjs\` after adding raw exports to
// scripts/icon-raw/${categoryKebab}/ to regenerate this category's registry.
${iconImports.join('\n')}

export const ${registryVar} = {
${iconRegistryLines.join('\n')}
} as const;
`;
    writeFileSync(join(REGISTRY_DIR, `${categoryKebab}.ts`), categoryTs, 'utf-8');

    aggregatorImports.push(`import { ${registryVar} } from './registry/${categoryKebab}';`);
    aggregatorSpreads.push(`  ...${registryVar},`);
  }

  const iconsTs = `// AUTO-GENERATED by scripts/import-icons.mjs — do not edit by hand.
// Re-run \`node scripts/import-icons.mjs\` after adding raw exports to
// scripts/icon-raw/ to regenerate. The Icon component's public API
// (Icon.tsx) never needs to change when this file changes.
//
// This file only aggregates the per-category registries under ./registry/
// — it never imports SVGs directly, so adding a category only touches
// that category's own registry file plus the two lines this generator
// appends here.
${aggregatorImports.join('\n')}

export const iconRegistry = {
${aggregatorSpreads.join('\n')}
} as const;

export type IconName = keyof typeof iconRegistry;
`;
  writeFileSync(join(ICON_DIR, 'icons.ts'), iconsTs, 'utf-8');

  const categoryEntries = [...categoryMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const categoriesTs = `// AUTO-GENERATED by scripts/import-icons.mjs — do not edit by hand.
// Re-run \`node scripts/import-icons.mjs\` to regenerate.
import type { IconName } from './icons';

export interface IconCategory {
  readonly id: string;
  readonly label: string;
  readonly icons: readonly IconName[];
}

export const iconCategories = {
${categoryEntries
  .map(
    ([id, { label, icons }]) =>
      `  '${id}': { id: '${id}', label: '${label.replace(/'/g, "\\'")}', icons: [${icons
        .map((i) => `'${i}'`)
        .join(', ')}] },`
  )
  .join('\n')}
} as const satisfies Record<string, IconCategory>;

export type IconCategoryId = keyof typeof iconCategories;
`;
  writeFileSync(join(ICON_DIR, 'icon-categories.ts'), categoriesTs, 'utf-8');

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

// Only run when invoked directly (`node scripts/import-icons.mjs`) — importing
// this module for its pure helpers (e.g. from tests) must not touch the filesystem.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
