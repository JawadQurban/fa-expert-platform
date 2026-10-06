import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const inputPath = path.join(repoRoot, 'references', 'figma', 'foundations', 'Values.tokens.json');
// Light.tokens.json carries the official per-component (Button/Chip/Link/...) semantic
// color tokens — as opposed to Values.tokens.json's generic primitive scale. Only the
// Button entries are consumed today (Visual Compliance Correction, `reports/VISUAL_COMPLIANCE_BUTTON.md`);
// dark theme is out of scope (Q22).
const lightInputPath = path.join(
  repoRoot,
  'references',
  'figma',
  'foundations',
  'Light.tokens.json'
);
const outputDir = path.join(repoRoot, 'frontend', 'src', 'design-system', 'tokens', 'generated');

fs.mkdirSync(outputDir, { recursive: true });

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);
const lightData = JSON.parse(fs.readFileSync(lightInputPath, 'utf8'));

const toRem = (px) => {
  if (px === 0) {
    return '0';
  }
  return `${(px / 16).toFixed(3).replace(/\.0+$/, '').replace(/0+$/, '')}rem`;
};
const toCssValue = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'object' && value !== null && 'hex' in value) {
    return value.hex.toLowerCase();
  }

  return value;
};

const cssLines = [];
const metaTokens = [];

const addToken = (name, value, source) => {
  const cssName = name.startsWith('--') ? name : `--${name}`;
  const cssValue = toCssValue(value);
  cssLines.push(`  ${cssName}: ${cssValue};`);
  metaTokens.push({ name: cssName, value: cssValue, source });
};

const getColor = (group, shade) => {
  const entry = data.Colors?.[group];
  const token = entry?.[shade] ?? entry?.[`${shade}-primary`];
  if (token?.$value?.hex) {
    return token.$value.hex.toLowerCase();
  }
  return null;
};

const addColorScale = (prefix, group, shades) => {
  shades.forEach((shade) => {
    const value = getColor(group, shade);
    if (value) {
      addToken(`${prefix}-${shade}`, value, `Colors.${group}.${shade}`);
    }
  });
};

addColorScale('fads-ref-neutral', 'Neutral', [
  '25',
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
]);
addColorScale('fads-ref-primary', 'Primary-SA-Flag', [
  '25',
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
]);
addToken('fads-ref-success-500', getColor('Green', '500') ?? '#17b26a', 'Colors.Green.500');
addToken('fads-ref-error-500', getColor('Red', '500') ?? '#f04438', 'Colors.Red.500');
addToken('fads-ref-warning-500', getColor('Yellow', '500') ?? '#f79009', 'Colors.Yellow.500');
addToken('fads-ref-information-500', getColor('Blue', '500') ?? '#2e90fa', 'Colors.Blue.500');

// Official Button (CMP-05) semantic color tokens, sourced from the Figma "Light" mode
// export's `Button` group and cross-verified live against the actual Button component
// set (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 407:510376) via the Figma MCP
// get_design_context/get_variable_defs tools — see docs/FIGMA_BUTTON_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE_BUTTON.md. These are additive: only Button.module.css
// consumes them, so no other component is affected.
const getButtonColor = (key) => {
  const token = lightData.Button?.[key];
  if (!token) return null;
  // Some Button entries are alias strings (e.g. "{Alpha.alpha-white-60}") rather than
  // direct color objects — resolve through the referenced group/key.
  if (typeof token.$value === 'string') {
    const match = /^\{([^.]+)\.([^}]+)\}$/.exec(token.$value);
    if (match) {
      const [, group, shade] = match;
      const resolved = data.Colors?.[group]?.[shade] ?? lightData[group]?.[shade];
      if (resolved?.$value) {
        const { alpha, hex } = resolved.$value;
        return alpha != null && alpha < 1 ? toRgba(hex, alpha) : hex.toLowerCase();
      }
    }
    return null;
  }
  if (token.$value?.hex) {
    const { alpha, hex } = token.$value;
    return alpha != null && alpha < 1 ? toRgba(hex, alpha) : hex.toLowerCase();
  }
  return null;
};

const toRgba = (hex, alpha) => {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`;
};

// Style => [cssPrefix, Light.tokens.json Button-group key prefix]. `neutral` (dark/black)
// and `secondarySolid` (light gray) are named to match the Button component's own
// "Style" variant property, not the (confusingly, differently-named) Figma token-group
// prefix underneath each ("black" and "neutral" respectively) — verified live: Style=Neutral
// uses `button-background-black-*`, Style=Secondary-Solid uses `button-background-neutral-*`.
const buttonStyleMap = [
  ['primary', 'button-background-primary'],
  ['neutral', 'button-background-black'],
  ['secondary-solid', 'button-background-neutral'],
  ['danger', 'button-background-danger-primary'],
  ['oncolor', 'button-background-oncolor'],
];
const buttonStateSuffixes = [
  ['default', 'default'],
  ['hover', 'hovered'],
  ['pressed', 'pressed'],
  ['selected', 'selected'],
  ['focused', 'focused'],
];
buttonStyleMap.forEach(([cssPrefix, keyPrefix]) => {
  buttonStateSuffixes.forEach(([cssState, keySuffix]) => {
    const value = getButtonColor(`${keyPrefix}-${keySuffix}`);
    if (value) {
      addToken(
        `fads-sys-button-${cssPrefix}-bg-${cssState}`,
        value,
        `Light.Button.${keyPrefix}-${keySuffix}`
      );
    }
  });
});

// Button label/border/focus/disabled scalars — verified live against the real component
// (docs/FIGMA_BUTTON_SPECIFICATION.md §6, §8, §10).
addToken(
  'fads-sys-button-label-oncolor',
  getLightToken('Text', 'text-oncolor-primary') ?? '#ffffff',
  'Light.Text.text-oncolor-primary'
);
addToken(
  'fads-sys-button-label-default',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-button-border-neutral',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-button-focus-ring-inner',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-button-focus-ring-outer',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor'
);
addToken(
  'fads-sys-button-disabled-bg',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled'
);
addToken(
  'fads-sys-button-disabled-label',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
// Variant: subtle (added 2026-07-21) — verified live via Button-menu's own
// component set (node 411:4478/411:4730/411:4982 in J0xq7JG3JKshRDzrgAM7E0),
// which shares Button's exact style/size/state matrix. Reuses the generic
// button-background-neutral-hovered/-pressed literal values directly (same
// hex as secondarySolid's own tokens, independently sourced per the
// no-cross-component-aliasing policy since Subtle has no distinct named
// token group of its own in Light.tokens.json).
addToken(
  'fads-sys-button-subtle-bg-hover',
  'var(--fads-ref-neutral-100)',
  'Figma MCP get_design_context button-background-neutral-hovered #f3f4f6'
);
addToken(
  'fads-sys-button-subtle-bg-pressed',
  'var(--fads-ref-neutral-200)',
  'Figma MCP get_design_context button-background-neutral-pressed #e5e7eb'
);

// Button size tokens — Figma has no named "height" variable for these (the component
// frames use a literal fixed pixel height per Size variant), so these cannot be pulled
// from Values.tokens.json/Light.tokens.json like the color tokens above. They are
// instead sourced directly from the live Figma MCP get_design_context inspection of the
// real Button component nodes (see docs/FIGMA_BUTTON_SPECIFICATION.md §3 for the node
// IDs sampled). Gap/padding-inline *are* real Figma variables
// (`Button/buttons-{sm,md,lg}-gap` / `-padding`, "Spacing" collection) but are not part
// of the locally-exported foundations JSON, so the same live-verified values are used.
const buttonSizeMap = [
  ['sm', { height: 24, paddingInline: 8, gap: 4, iconSize: 16 }],
  ['md', { height: 32, paddingInline: 12, gap: 4, iconSize: 20 }],
  ['lg', { height: 40, paddingInline: 16, gap: 4, iconSize: 24 }],
];
buttonSizeMap.forEach(([size, dims]) => {
  addToken(
    `fads-sys-button-height-${size}`,
    `${dims.height}px`,
    `Figma MCP get_design_context (Button, Size=${size}, live-verified)`
  );
  addToken(
    `fads-sys-button-padding-inline-${size}`,
    `${dims.paddingInline}px`,
    `Figma MCP get_variable_defs Button/buttons-${size}-padding (live-verified)`
  );
  addToken(
    `fads-sys-button-gap-${size}`,
    `${dims.gap}px`,
    `Figma MCP get_variable_defs Button/buttons-${size}-gap (live-verified)`
  );
  addToken(
    `fads-sys-button-icon-size-${size}`,
    `${dims.iconSize}px`,
    `Figma MCP get_design_context (Button, Size=${size}, live-verified)`
  );
});

// Fixed pixel line-heights per text size — Figma variables
// `Line Height/Text/line-heights-text-{2xs,xs,sm,md}` (live-verified via get_variable_defs),
// not present in the local foundations export (which only has the unitless
// fads-ref-line-height-* ratios). General-purpose, not Button-specific: any component
// using text-2xs/xs/sm/md can adopt these. `2xs` added for Tag's x Small size
// (`docs/FIGMA_TAG_SPECIFICATION.md` §3, live-verified 14px).
const lineHeightMap = [
  ['2xs', 14],
  ['xs', 18],
  ['sm', 20],
  ['md', 24],
  ['lg', 28],
];
lineHeightMap.forEach(([size, px]) => {
  addToken(
    `fads-sys-typography-line-height-${size}`,
    `${px}px`,
    `Figma MCP get_variable_defs Line Height/Text/line-heights-text-${size} (live-verified)`
  );
});

// Official Card (CMP-07) tokens — verified live against the actual Card component set
// (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 30195:10358) via Figma MCP
// get_design_context — see docs/FIGMA_CARD_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md. Additive only:
// `--fads-sys-color-background-default`, `--fads-sys-elevation-1`,
// `--fads-sys-opacity-disabled`, and `--fads-sys-radius-md` are consumed by ~20 other
// components and are intentionally left untouched — Card gets its own tokens instead,
// even where a value happens to coincide with one already used elsewhere.
addToken(
  'fads-sys-card-bg',
  getLightToken('Background', 'background-card') ?? '#ffffff',
  'Light.Background.background-card'
);
addToken(
  'fads-sys-card-bg-hover',
  getLightToken('Background', 'background-neutral-50') ?? '#f9fafb',
  'Light.Background.background-neutral-50'
);
addToken(
  'fads-sys-card-bg-focused',
  getLightToken('Background', 'background-neutral-50') ?? '#f9fafb',
  'Light.Background.background-neutral-50'
);
addToken(
  'fads-sys-card-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled'
);
addToken(
  'fads-sys-card-text',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display'
);
addToken(
  'fads-sys-card-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-card-border-stroke',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-card-border-focus',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
// Card/card-lg-gap — a genuine Card-specific Figma variable (not the generic spacing
// scale), live-verified via get_design_context (24px between top-level sections).
addToken(
  'fads-sys-card-gap',
  '24px',
  'Figma MCP get_design_context Card/card-lg-gap (live-verified)'
);
// Shadows/shadow-md — a named Figma effect style (two stacked drop shadows), live
// -verified via get_design_context; distinct from the shared --fads-sys-elevation-1
// placeholder.
addToken(
  'fads-sys-card-shadow',
  '0 2px 4px -2px rgba(16, 24, 40, 0.06), 0 4px 8px -2px rgba(16, 24, 40, 0.1)',
  'Figma MCP get_design_context Shadows/shadow-md (live-verified)'
);

// Official Nav Header (CMP-01) tokens — verified live against the actual Nav Header
// component set (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 30150:148751, page
// 429:130167) via the Figma MCP get_design_context/get_variable_defs tools — see
// docs/FIGMA_HEADER_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md. Additive only: only
// Header.module.css consumes them, so no other component is affected. Several values
// coincide with a Button token because both were independently sourced from the same
// underlying Figma primitive (e.g. the neutral hover/pressed greys) — that is expected
// (Figma reuses its global tokens across components); Header never references
// var(--fads-sys-button-*) and vice versa ("fix only the component in scope").
addToken(
  'fads-sys-header-bg',
  getLightToken('Background', 'background-menu') ?? '#ffffff',
  'Light.Background.background-menu'
);
addToken(
  'fads-sys-header-item-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-header-item-bg-hover',
  getLightToken('Button', 'button-background-neutral-hovered') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-hovered'
);
addToken(
  'fads-sys-header-item-bg-pressed',
  getLightToken('Button', 'button-background-neutral-pressed') ?? '#e5e7eb',
  'Light.Button.button-background-neutral-pressed'
);
addToken(
  'fads-sys-header-item-border-focus',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-header-item-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-header-item-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled'
);
addToken(
  'fads-sys-header-selected-bg',
  getButtonColor('button-background-primary-default') ?? '#1b8354',
  'Light.Button.button-background-primary-default'
);
addToken(
  'fads-sys-header-selected-bg-hover',
  getButtonColor('button-background-primary-hovered') ?? '#166a45',
  'Light.Button.button-background-primary-hovered'
);
addToken(
  'fads-sys-header-selected-bg-pressed',
  getButtonColor('button-background-primary-pressed') ?? '#104631',
  'Light.Button.button-background-primary-pressed'
);
addToken(
  'fads-sys-header-selected-text',
  getLightToken('Text', 'text-oncolor-primary') ?? '#ffffff',
  'Light.Text.text-oncolor-primary'
);
addToken(
  'fads-sys-header-indicator',
  getLightToken('Background', 'background-primary-400') ?? '#54c08a',
  'Light.Background.background-primary-400'
);
addToken(
  'fads-sys-header-logo-label-text',
  getLightToken('Text', 'text-secondary-paragraph') ?? '#6c737f',
  'Light.Text.text-secondary-paragraph'
);
// Header geometry — live-verified frame metrics (no named Figma variable for the 72px
// bar height / 48px emblem / 40px toggle button); the padding/gap/radius values are
// the generic Figma spacing variables (spacing-4xl 32, spacing-xl 16, spacing-md 8,
// spacing-xs 4, radius-sm 4) captured live via get_design_context on node 30150:148752.
const headerGeometry = [
  [
    'fads-sys-header-height',
    '72px',
    'Figma MCP get_design_context (Nav Header item height, live-verified)',
  ],
  [
    'fads-sys-header-padding-inline',
    '32px',
    'Figma MCP get_variable_defs spacing-4xl (live-verified)',
  ],
  [
    'fads-sys-header-padding-inline-compact',
    '16px',
    'Figma MCP get_variable_defs spacing-xl (live-verified)',
  ],
  ['fads-sys-header-group-gap', '16px', 'Figma MCP get_variable_defs spacing-xl (live-verified)'],
  [
    'fads-sys-header-item-padding-inline',
    '16px',
    'Figma MCP get_variable_defs spacing-xl (live-verified)',
  ],
  [
    'fads-sys-header-item-padding-block',
    '8px',
    'Figma MCP get_variable_defs spacing-md (live-verified)',
  ],
  ['fads-sys-header-item-gap', '4px', 'Figma MCP get_variable_defs spacing-xs (live-verified)'],
  ['fads-sys-header-item-radius', '4px', 'Figma MCP get_variable_defs radius-sm (live-verified)'],
  [
    'fads-sys-header-logo-gap',
    '8px',
    'Figma MCP get_design_context Logo Placeholder gap (live-verified)',
  ],
  [
    'fads-sys-header-logo-icon-size',
    '48px',
    'Figma MCP get_design_context Logo Placeholder Size=Medium emblem (live-verified)',
  ],
  [
    'fads-sys-header-toggle-size',
    '40px',
    'Figma MCP get_design_context Header Menu button box (live-verified)',
  ],
  [
    'fads-sys-header-icon-size',
    '24px',
    'Figma MCP get_design_context Header Action / toggle leading icon (live-verified)',
  ],
  [
    'fads-sys-header-chevron-size',
    '20px',
    'Figma MCP get_design_context Header Menu Item chevron (live-verified)',
  ],
  [
    'fads-sys-header-indicator-height',
    '6px',
    'Figma MCP get_design_context selection indicator bar (live-verified)',
  ],
];
headerGeometry.forEach(([name, value, source]) => addToken(name, value, source));

// Official Footer (CMP-03) tokens — verified live against the actual Footer component
// set (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 30150:165937, page 4205:18569) via the
// Figma MCP get_design_context/get_variable_defs tools — see
// docs/FIGMA_FOOTER_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md. Additive only: only
// Footer.module.css consumes them, so no other component is affected. Values that
// coincide with another component's token (e.g. text-default #161616) were each
// independently sourced from the same underlying Figma primitive; Footer.module.css
// never references another component's var(--fads-sys-<component>-*).
addToken(
  'fads-sys-footer-bg',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100'
);
addToken(
  'fads-sys-footer-group-label-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-footer-group-label-border',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-footer-link-text',
  getLightToken('Link', 'link-neutral') ?? '#384250',
  'Light.Link.link-neutral'
);
addToken(
  'fads-sys-footer-legal-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-footer-logo-label-text',
  getLightToken('Text', 'text-secondary-paragraph') ?? '#6c737f',
  'Light.Text.text-secondary-paragraph'
);
// Dark-green (on-color) background variant.
addToken(
  'fads-sys-footer-bg-oncolor',
  getLightToken('Background', 'background-SA-Flag') ?? '#074d31',
  'Light.Background.background-SA-Flag'
);
addToken(
  'fads-sys-footer-text-oncolor',
  getLightToken('Text', 'text-oncolor-primary') ?? '#ffffff',
  'Light.Text.text-oncolor-primary'
);
addToken(
  'fads-sys-footer-link-oncolor',
  getLightToken('Link', 'link-oncolor') ?? '#ffffff',
  'Light.Link.link-oncolor'
);
addToken(
  'fads-sys-footer-border-oncolor',
  getLightAlphaColor('Border', 'border-oncolor-transparent-30') ?? 'rgba(255, 255, 255, 0.3)',
  'Light.Border.border-oncolor-transparent-30'
);
// Footer geometry — spacing variables captured live via get_design_context on node
// 30150:165938 (no named Figma variable for the 1280px content max-width / logo opacity).
const footerGeometry = [
  [
    'fads-sys-footer-padding-inline',
    '32px',
    'Figma MCP get_variable_defs spacing-4xl (live-verified)',
  ],
  [
    'fads-sys-footer-max-width',
    '1280px',
    'Figma MCP get_design_context Footer content max-width (live-verified)',
  ],
  [
    'fads-sys-footer-region-gap',
    '48px',
    'Figma MCP get_variable_defs Global/spacing-6xl (live-verified)',
  ],
  [
    'fads-sys-footer-content-padding-block-start',
    '40px',
    'Figma MCP get_variable_defs spacing-5xl (live-verified)',
  ],
  [
    'fads-sys-footer-content-padding-block-end',
    '24px',
    'Figma MCP get_variable_defs spacing-3xl (live-verified)',
  ],
  ['fads-sys-footer-groups-gap', '24px', 'Figma MCP get_variable_defs spacing-3xl (live-verified)'],
  ['fads-sys-footer-group-gap', '8px', 'Figma MCP get_variable_defs spacing-md (live-verified)'],
  [
    'fads-sys-footer-group-min-width',
    '180px',
    'Figma MCP get_design_context Footer group min-width (live-verified)',
  ],
  ['fads-sys-footer-legal-gap', '40px', 'Figma MCP get_variable_defs spacing-5xl (live-verified)'],
  ['fads-sys-footer-links-gap', '16px', 'Figma MCP get_variable_defs spacing-xl (live-verified)'],
  [
    'fads-sys-footer-legal-padding-block',
    '16px',
    'Figma MCP get_variable_defs spacing-xl (live-verified)',
  ],
  [
    'fads-sys-footer-logos-opacity',
    '0.7',
    'Figma MCP get_design_context Logos opacity (live-verified)',
  ],
];
footerGeometry.forEach(([name, value, source]) => addToken(name, value, source));

// Official Divider tokens — verified live against the actual Divider component set
// (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 18697:19412) via Figma MCP
// get_design_context/get_variable_defs — see docs/FIGMA_DIVIDER_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md. Additive only: only
// Divider.module.css consumes these, even where a value coincides with an existing
// Button/Card/Header/Footer token (all independently sourced from the same underlying
// Figma primitives — see docs/TOKEN_MAPPING.md for the "no cross-component aliasing"
// policy).
addToken(
  'fads-sys-divider-color-neutral',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-divider-color-primary',
  getLightToken('Border', 'border-primary') ?? '#1b8354',
  'Light.Border.border-primary'
);
addToken(
  'fads-sys-divider-color-white',
  getLightToken('Border', 'border-white') ?? '#ffffff',
  'Light.Border.border-white'
);
addToken(
  'fads-sys-divider-color-alpha-white',
  getLightAlphaColor('Alpha', 'alpha-white-30') ?? 'rgba(255, 255, 255, 0.3)',
  'Light.Alpha.alpha-white-30'
);
// Every sampled Divider node (Horizontal and Vertical, all 4 colors) is a uniform 1px
// line; no named Figma "border-width" variable exists for it.
addToken(
  'fads-sys-divider-thickness',
  '1px',
  'Figma MCP get_design_context Divider frame thickness (live-verified, all 8 variants)'
);

// Official Link (CMP-06) tokens — verified live against the actual Link component set
// (Figma file cII2UMRzWj0rwKuMzWFqTU, node 2508:25804, a 144-variant set of
// rtl × state × style × size × inline) via Figma MCP get_metadata/get_design_context/
// get_screenshot/get_variable_defs — see docs/FIGMA_LINK_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Link/VISUAL_COMPLIANCE_LINK.md. Additive only: only
// Link.module.css consumes these, even where a value coincides with another
// component's token (e.g. Button's icon sizes) or with Light.tokens.json's own
// bulk `Link` group (used elsewhere by Footer's link-colored text).
addToken(
  'fads-sys-link-primary',
  getLightToken('Link', 'link-primary') ?? '#1b8354',
  'Light.Link.link-primary'
);
addToken(
  'fads-sys-link-primary-hovered',
  getLightToken('Link', 'link-primary-hovered') ?? '#54c08a',
  'Light.Link.link-primary-hovered'
);
addToken(
  'fads-sys-link-primary-pressed',
  getLightToken('Link', 'link-primary-pressed') ?? '#88d8ad',
  'Light.Link.link-primary-pressed'
);
addToken(
  'fads-sys-link-primary-focused',
  getLightToken('Link', 'link-primary-focused') ?? '#1b8354',
  'Light.Link.link-primary-focused'
);
addToken(
  'fads-sys-link-primary-visited',
  getLightToken('Link', 'link-primary-visited') ?? '#14573a',
  'Light.Link.link-primary-visited'
);
addToken(
  'fads-sys-link-neutral',
  getLightToken('Link', 'link-neutral') ?? '#384250',
  'Light.Link.link-neutral'
);
addToken(
  'fads-sys-link-neutral-hovered',
  getLightToken('Link', 'link-neutral-hovered') ?? '#6c737f',
  'Light.Link.link-neutral-hovered'
);
addToken(
  'fads-sys-link-neutral-pressed',
  getLightToken('Link', 'link-neutral-pressed') ?? '#9da4ae',
  'Light.Link.link-neutral-pressed'
);
addToken(
  'fads-sys-link-neutral-focused',
  getLightToken('Link', 'link-neutral-focused') ?? '#384250',
  'Light.Link.link-neutral-focused'
);
// Needs Confirmation: the live Neutral+Visited node (get_design_context, node
// 2508:25746) references the *Primary*-mood visited color (#14573a), not
// Light.tokens.json's own distinct `Link.link-neutral-visited` (#4d5761) — a
// likely Figma-authoring inconsistency between the bulk token library and this
// specific component instance's wiring. Implemented to match the live node
// exactly (per docs/FIGMA_LINK_SPECIFICATION.md §4), not the bulk library value.
addToken(
  'fads-sys-link-neutral-visited',
  '#14573a',
  'Figma MCP get_design_context node 2508:25746 (live-verified; see Needs Confirmation note above)'
);
addToken(
  'fads-sys-link-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled (Primary and Neutral Disabled states both reference this shared token live, not a Link-scoped disabled color)'
);
addToken(
  'fads-sys-link-oncolor',
  getLightToken('Link', 'link-oncolor') ?? '#ffffff',
  'Light.Link.link-oncolor'
);
addToken(
  'fads-sys-link-oncolor-hovered',
  getLightAlphaColor('Link', 'link-oncolor-hovered') ?? 'rgba(255, 255, 255, 0.8)',
  'Light.Link.link-oncolor-hovered'
);
addToken(
  'fads-sys-link-oncolor-pressed',
  getLightAlphaColor('Link', 'link-oncolor-pressed') ?? 'rgba(255, 255, 255, 0.6)',
  'Light.Link.link-oncolor-pressed'
);
addToken(
  'fads-sys-link-oncolor-focused',
  getLightToken('Link', 'link-oncolor-focused') ?? '#ffffff',
  'Light.Link.link-oncolor-focused'
);
addToken(
  'fads-sys-link-oncolor-visited',
  getLightAlphaColor('Link', 'link-oncolor-visited') ?? 'rgba(255, 255, 255, 0.9)',
  'Light.Link.link-oncolor-visited'
);
addToken(
  'fads-sys-link-oncolor-disabled',
  getLightAlphaColor('Link', 'link-oncolor-disabled') ?? 'rgba(255, 255, 255, 0.3)',
  'Light.Link.link-oncolor-disabled'
);
// Focus treatment: a literal 2px solid border around the whole link box (not an
// offset ring) — live-verified via get_design_context on the Focused-state nodes
// (e.g. 2508:25741 Primary/Neutral, 2508:25687 On-color).
addToken(
  'fads-sys-link-focus-border-color',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-link-focus-border-color-oncolor',
  getLightToken('Border', 'border-white') ?? '#ffffff',
  'Light.Border.border-white'
);
addToken(
  'fads-sys-link-focus-border-width',
  '2px',
  'Figma MCP get_design_context Focused-state border width (live-verified)'
);
// Size geometry — gap and icon size scale 1:1 with Figma's Link/link-sm-gap and
// Link/link-md-gap spacing variables (live-verified via get_variable_defs) and the
// icon slot's own frame dimensions (live-verified via get_design_context).
addToken('fads-sys-link-gap-sm', '4px', 'Light.Spacing.Link/link-sm-gap (live-verified)');
addToken('fads-sys-link-gap-md', '8px', 'Light.Spacing.Link/link-md-gap (live-verified)');
addToken(
  'fads-sys-link-icon-size-sm',
  '16px',
  'Figma MCP get_design_context icon slot size at Size=Small (live-verified)'
);
addToken(
  'fads-sys-link-icon-size-md',
  '20px',
  'Figma MCP get_design_context icon slot size at Size=Medium (live-verified)'
);

// Official Tag (CMP-26) tokens — verified live against the actual Tag component set
// (Figma file Sv0oWOS1SjWnwhQwdzRJIE, node 421:110968, a 288-variant set of
// rtl × size × style × outline × rounded × iconOnly) via Figma MCP get_metadata/
// get_design_context/get_variable_defs — see docs/FIGMA_TAG_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Tag/VISUAL_COMPLIANCE_TAG.md. Additive only: only
// Tag.module.css consumes these. No `Danger`/`Primary` tokens are added — no such
// style exists on this live node (spec §12).
addToken(
  'fads-sys-tag-neutral-bg',
  getLightToken('Tag', 'tag-background-neutral-light') ?? '#f9fafb',
  'Light.Tag.tag-background-neutral-light'
);
addToken(
  'fads-sys-tag-neutral-border-light',
  getLightToken('Border', 'border-neutral-secondary') ?? '#e5e7eb',
  'Light.Border.border-neutral-secondary'
);
addToken(
  'fads-sys-tag-neutral-border',
  getLightToken('Tag', 'tag-border-neutral') ?? '#4d5761',
  'Light.Tag.tag-border-neutral'
);
addToken(
  'fads-sys-tag-neutral-text',
  getLightToken('Tag', 'tag-text-neutral') ?? '#1f2a37',
  'Light.Tag.tag-text-neutral'
);
// Verified live: Neutral's icon color is the shared Icon/icon-default token, NOT
// its own text color (#1f2a37) — a genuine, confirmed distinction (spec §4).
addToken(
  'fads-sys-tag-neutral-icon',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-tag-success-bg',
  getLightToken('Tag', 'tag-background-success-light') ?? '#ecfdf3',
  'Light.Tag.tag-background-success-light'
);
addToken(
  'fads-sys-tag-success-border-light',
  getLightToken('Tag', 'tag-border-success-light') ?? '#abefc6',
  'Light.Tag.tag-border-success-light'
);
addToken(
  'fads-sys-tag-success-border',
  getLightToken('Tag', 'tag-border-success') ?? '#067647',
  'Light.Tag.tag-border-success'
);
addToken(
  'fads-sys-tag-success-text',
  getLightToken('Tag', 'tag-text-success') ?? '#085d3a',
  'Light.Tag.tag-text-success'
);
addToken(
  'fads-sys-tag-success-icon',
  getLightToken('Tag', 'tag-icon-success') ?? '#085d3a',
  'Light.Tag.tag-icon-success'
);
addToken(
  'fads-sys-tag-error-bg',
  getLightToken('Tag', 'tag-background-error-light') ?? '#fef3f2',
  'Light.Tag.tag-background-error-light'
);
addToken(
  'fads-sys-tag-error-border-light',
  getLightToken('Tag', 'tag-border-error-light') ?? '#fecdca',
  'Light.Tag.tag-border-error-light'
);
addToken(
  'fads-sys-tag-error-border',
  getLightToken('Tag', 'tag-border-error') ?? '#b42318',
  'Light.Tag.tag-border-error'
);
addToken(
  'fads-sys-tag-error-text',
  getLightToken('Tag', 'tag-text-error') ?? '#912018',
  'Light.Tag.tag-text-error'
);
addToken(
  'fads-sys-tag-error-icon',
  getLightToken('Tag', 'tag-icon-error') ?? '#912018',
  'Light.Tag.tag-icon-error'
);
addToken(
  'fads-sys-tag-warning-bg',
  getLightToken('Tag', 'tag-background-warning-light') ?? '#fffaeb',
  'Light.Tag.tag-background-warning-light'
);
addToken(
  'fads-sys-tag-warning-border-light',
  getLightToken('Tag', 'tag-border-warning-light') ?? '#fedf89',
  'Light.Tag.tag-border-warning-light'
);
addToken(
  'fads-sys-tag-warning-border',
  getLightToken('Tag', 'tag-border-warning') ?? '#b54708',
  'Light.Tag.tag-border-warning'
);
addToken(
  'fads-sys-tag-warning-text',
  getLightToken('Tag', 'tag-text-warning') ?? '#93370d',
  'Light.Tag.tag-text-warning'
);
addToken(
  'fads-sys-tag-warning-icon',
  getLightToken('Tag', 'tag-icon-warning') ?? '#93370d',
  'Light.Tag.tag-icon-warning'
);
addToken(
  'fads-sys-tag-information-bg',
  getLightToken('Tag', 'tag-background-info-light') ?? '#eff8ff',
  'Light.Tag.tag-background-info-light'
);
addToken(
  'fads-sys-tag-information-border-light',
  getLightToken('Tag', 'tag-border-info-light') ?? '#b2ddff',
  'Light.Tag.tag-border-info-light'
);
addToken(
  'fads-sys-tag-information-border',
  getLightToken('Tag', 'tag-border-info') ?? '#175cd3',
  'Light.Tag.tag-border-info'
);
addToken(
  'fads-sys-tag-information-text',
  getLightToken('Tag', 'tag-text-info') ?? '#1849a9',
  'Light.Tag.tag-text-info'
);
addToken(
  'fads-sys-tag-information-icon',
  getLightToken('Tag', 'tag-icon-info') ?? '#1849a9',
  'Light.Tag.tag-icon-info'
);
// On-Color — structurally different from the other 5 moods: filled has a
// translucent-white background and NO border at all (verified live, spec §4).
addToken(
  'fads-sys-tag-oncolor-bg',
  getLightAlphaColor('Tag', 'tag-background-on-color') ?? 'rgba(255, 255, 255, 0.2)',
  'Light.Tag.tag-background-on-color'
);
addToken(
  'fads-sys-tag-oncolor-border',
  getLightAlphaColor('Tag', 'tag-border-on-color') ?? 'rgba(255, 255, 255, 0.6)',
  'Light.Tag.tag-border-on-color'
);
addToken(
  'fads-sys-tag-oncolor-text',
  getLightToken('Text', 'text-oncolor-primary') ?? '#ffffff',
  'Light.Text.text-oncolor-primary'
);
addToken(
  'fads-sys-tag-oncolor-icon',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor'
);
// Size geometry — height/padding-inline/icon-size live-verified via get_design_context
// per Size; gap is uniform (4px, Global/spacing-xs) across all three sizes.
addToken(
  'fads-sys-tag-height-xs',
  '20px',
  'Figma MCP get_design_context Size=x Small (live-verified)'
);
addToken(
  'fads-sys-tag-height-sm',
  '24px',
  'Figma MCP get_design_context Size=Small (live-verified)'
);
addToken(
  'fads-sys-tag-height-md',
  '32px',
  'Figma MCP get_design_context Size=Medium (live-verified)'
);
addToken(
  'fads-sys-tag-padding-inline-xs',
  '8px',
  'Light.Spacing.Global/spacing-md (live-verified, Size=x Small)'
);
addToken(
  'fads-sys-tag-padding-inline-sm',
  '8px',
  'Light.Spacing.Global/spacing-md (live-verified, Size=Small)'
);
addToken(
  'fads-sys-tag-padding-inline-md',
  '12px',
  'Light.Spacing.Global/spacing-lg (live-verified, Size=Medium)'
);
addToken('fads-sys-tag-gap', '4px', 'Light.Spacing.Global/spacing-xs (live-verified, all sizes)');
addToken(
  'fads-sys-tag-icon-size-xs',
  '10px',
  'Figma MCP get_design_context icon slot size at Size=x Small (live-verified)'
);
addToken(
  'fads-sys-tag-icon-size-sm',
  '14px',
  'Figma MCP get_design_context icon slot size at Size=Small (live-verified)'
);
addToken(
  'fads-sys-tag-icon-size-md',
  '18px',
  'Figma MCP get_design_context icon slot size at Size=Medium (live-verified)'
);
addToken(
  'fads-sys-tag-icon-only-padding',
  '2px',
  'Light.Spacing.Global/spacing-xxs (live-verified, Icon only=True, all sizes)'
);

// Official Text Input (CMP-13) tokens — verified live against the actual Text Input
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:130250, a 288-variant
// set of rtl × state × filled × error × size × style) via Figma MCP get_metadata/
// get_design_context/get_variable_defs — see docs/FIGMA_TEXT_INPUT_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md. Additive
// only: only TextInput.module.css consumes these — TextInput no longer composes the
// shared Field/control.module.css base (Textarea and Select still do, unchanged,
// per "never modify unrelated components").
// Light.tokens.json's `Form` group stores most Text Input colors as alias strings
// (e.g. "{Text.text-default}") rather than direct hex values, unlike Tag/Link's
// direct-hex Themes-collection tokens — resolved the same way Button's alias
// entries already are (see getButtonColor above), scoped to the Form group.
const getFormColor = (key) => {
  const token = lightData.Form?.[key];
  if (!token) return null;
  if (typeof token.$value === 'string') {
    const match = /^\{([^.]+)\.([^}]+)\}$/.exec(token.$value);
    if (match) {
      const [, group, shade] = match;
      const resolved = data.Colors?.[group]?.[shade] ?? lightData[group]?.[shade];
      if (resolved?.$value) {
        const { alpha, hex } = resolved.$value;
        return alpha != null && alpha < 1 ? toRgba(hex, alpha) : hex.toLowerCase();
      }
    }
    return null;
  }
  if (token.$value?.hex) {
    const { alpha, hex } = token.$value;
    return alpha != null && alpha < 1 ? toRgba(hex, alpha) : hex.toLowerCase();
  }
  return null;
};
addToken(
  'fads-sys-textinput-label-text',
  getFormColor('field-text-label') ?? '#161616',
  'Light.Form.field-text-label'
);
addToken(
  'fads-sys-textinput-label-disabled',
  getLightToken('Global', 'input-text-disabled') ?? '#9da4ae',
  'Light.Global.input-text-disabled'
);
addToken(
  'fads-sys-textinput-required-color',
  getFormColor('field-border-error') ?? '#b42318',
  'Light.Form.field-border-error'
);
addToken(
  'fads-sys-textinput-bg-default',
  getFormColor('field-background-default') ?? '#ffffff',
  'Light.Form.field-background-default'
);
addToken(
  'fads-sys-textinput-bg-darker',
  getFormColor('field-background-darker') ?? '#f3f4f6',
  'Light.Form.field-background-darker'
);
addToken(
  'fads-sys-textinput-bg-lighter',
  getFormColor('field-background-lighter') ?? '#fcfcfd',
  'Light.Form.field-background-lighter'
);
addToken(
  'fads-sys-textinput-border-default',
  getFormColor('field-border-default') ?? '#9da4ae',
  'Light.Form.field-border-default'
);
addToken(
  'fads-sys-textinput-border-hovered',
  getFormColor('field-border-hovered') ?? '#384250',
  'Light.Form.field-border-hovered'
);
addToken(
  'fads-sys-textinput-border-pressed',
  getFormColor('field-border-pressed') ?? '#0d121c',
  'Light.Form.field-border-pressed'
);
addToken(
  'fads-sys-textinput-border-error',
  getFormColor('field-border-error') ?? '#b42318',
  'Light.Form.field-border-error'
);
addToken(
  'fads-sys-textinput-border-readonly',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-textinput-border-disabled',
  getLightToken('Border', 'border-disabled') ?? '#d2d6db',
  'Light.Border.border-disabled'
);
addToken(
  'fads-sys-textinput-text-filled',
  getFormColor('field-text-filled') ?? '#161616',
  'Light.Form.field-text-filled'
);
addToken(
  'fads-sys-textinput-text-hovered',
  getFormColor('field-text-hovered') ?? '#161616',
  'Light.Form.field-text-hovered'
);
addToken(
  'fads-sys-textinput-text-pressed',
  getFormColor('field-text-pressed') ?? '#384250',
  'Light.Form.field-text-pressed'
);
addToken(
  'fads-sys-textinput-text-focused',
  getFormColor('field-text-focused') ?? '#384250',
  'Light.Form.field-text-focused'
);
addToken(
  'fads-sys-textinput-text-readonly',
  getFormColor('field-text-readonly') ?? '#161616',
  'Light.Form.field-text-readonly'
);
addToken(
  'fads-sys-textinput-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-textinput-text-placeholder',
  getFormColor('field-text-placeholder') ?? '#6c737f',
  'Light.Form.field-text-placeholder'
);
addToken(
  'fads-sys-textinput-affix-bg',
  getLightToken('Button', 'button-background-neutral-default') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-default'
);
addToken(
  'fads-sys-textinput-affix-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled'
);
addToken(
  'fads-sys-textinput-affix-text',
  getLightToken('Text', 'text-secondary-paragraph') ?? '#6c737f',
  'Light.Text.text-secondary-paragraph'
);
addToken(
  'fads-sys-textinput-helper-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-textinput-helper-error',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error'
);
// Focused-state shadow — a 2-layer soft drop shadow (Figma "Shadows/shadow-md"),
// live-verified via get_design_context on the Focused-state nodes.
addToken(
  'fads-sys-textinput-focus-shadow',
  '0 2px 4px rgba(16, 24, 40, 0.06), 0 4px 8px rgba(16, 24, 40, 0.1)',
  'Figma MCP get_design_context Shadows/shadow-md on Focused state (live-verified)'
);
// Size geometry — height/typography-tier per Size; gap/content-padding are uniform
// across both sizes (live-verified via get_design_context).
addToken(
  'fads-sys-textinput-height-lg',
  '40px',
  'Figma MCP get_design_context Size=Large (live-verified)'
);
addToken(
  'fads-sys-textinput-height-md',
  '32px',
  'Figma MCP get_design_context Size=Medium (live-verified)'
);
addToken(
  'fads-sys-textinput-affix-padding-lg',
  '16px',
  'Light.Spacing.Global/spacing-xl (live-verified, Size=Large)'
);
addToken(
  'fads-sys-textinput-affix-padding-md',
  '12px',
  'Light.Spacing.Global/spacing-lg (live-verified, Size=Medium)'
);
addToken(
  'fads-sys-textinput-content-padding-start',
  '8px',
  'Light.Spacing.Form/Input-container-padding-left (live-verified, both sizes)'
);
addToken(
  'fads-sys-textinput-content-padding-end',
  '16px',
  'Light.Spacing.Form/Input-container-padding-right (live-verified, both sizes)'
);
addToken(
  'fads-sys-textinput-icon-gap',
  '8px',
  'Light.Spacing.Form/icon-enteredtext (live-verified, both sizes)'
);
addToken(
  'fads-sys-textinput-label-gap',
  '8px',
  'Light.Spacing.Form/field-label-gap (live-verified)'
);
addToken(
  'fads-sys-textinput-label-asterisk-gap',
  '4px',
  'Light.Spacing.Form/label-gap (live-verified)'
);
addToken(
  'fads-sys-textinput-helper-gap',
  '8px',
  'Light.Spacing.Form/icon-helpertext (live-verified)'
);
addToken(
  'fads-sys-textinput-helper-padding-block',
  '4px',
  'Light.Spacing.Global/spacing-xs (live-verified)'
);
addToken(
  'fads-sys-textinput-icon-size',
  '20px',
  'Figma MCP get_design_context leading icon slot size (live-verified)'
);
addToken(
  'fads-sys-textinput-feedback-icon-size',
  '16px',
  'Figma MCP get_design_context feedback icon slot size (live-verified)'
);
addToken(
  'fads-sys-textinput-underline-height',
  '2px',
  'Figma MCP get_design_context Pressed/Focused-state thin underline (live-verified)'
);

// Official Breadcrumb (CMP-04) tokens — verified live against the actual Breadcrumb component
// set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 5698:2597, a 10-variant set of rtl × levels) via
// Figma MCP get_metadata/get_design_context/get_screenshot — see
// docs/FIGMA_BREADCRUMB_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Breadcrumb/VISUAL_COMPLIANCE_BREADCRUMB.md. Ancestor-item link color
// is not a Breadcrumb-scoped token — items compose the already-Approved Link component
// (mood="neutral") directly, reusing its own --fads-sys-link-neutral token for free.
addToken(
  'fads-sys-breadcrumb-text-current',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-breadcrumb-separator-color',
  getLightToken('Icon', 'icon-neutral') ?? '#384250',
  "Light.Icon.icon-neutral (closest generic muted-icon variable — the separator's vector asset " +
    'fill was not independently color-inspectable via get_design_context, see spec §9 item 2)'
);
addToken(
  'fads-sys-breadcrumb-ellipsis-text',
  getLightToken('Link', 'link-neutral') ?? '#384250',
  'Light.Link.link-neutral (same Figma variable the Link component itself independently sources ' +
    'for mood="neutral" — coincidence, not a cross-component alias, per docs/TOKEN_MAPPING.md)'
);
addToken(
  'fads-sys-breadcrumb-item-gap',
  '4px',
  "Light.Spacing.Link/link-sm-gap (live-verified; same Figma variable the Link component's own " +
    'size="sm" gap independently sources)'
);

// Official Checkbox (CMP-17) tokens — verified live against the actual Checkbox component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30186:53826, a 108-variant set of
// checked+indeterminate × state × size × style) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see docs/FIGMA_CHECKBOX_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/Checkbox/VISUAL_COMPLIANCE_CHECKBOX.md.
addToken(
  'fads-sys-checkbox-size-md',
  '24px',
  'Figma MCP get_metadata Size=Medium frame (live-verified)'
);
addToken(
  'fads-sys-checkbox-size-sm',
  '20px',
  'Figma MCP get_metadata Size=Small frame (live-verified)'
);
addToken(
  'fads-sys-checkbox-size-xs',
  '16px',
  'Figma MCP get_metadata Size=x Small frame (live-verified)'
);
addToken(
  'fads-sys-checkbox-radius',
  '2px',
  'Light.radius-xs (live-verified via get_variable_defs — no existing shared --fads-sys-radius-* token matches 2px)'
);
addToken(
  'fads-sys-checkbox-border-default',
  getLightToken('Controls', 'control-border') ?? '#6c737f',
  'Light.Controls.control-border'
);
addToken(
  'fads-sys-checkbox-border-readonly',
  getLightToken('Global', 'border-disabled') ?? '#9da4ae',
  'Light.Global.border-disabled'
);
addToken(
  'fads-sys-checkbox-bg-pressed-unchecked',
  getLightToken('Controls', 'control-pressed') ?? '#d2d6db',
  'Light.Controls.control-pressed'
);
addToken(
  'fads-sys-checkbox-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled'
);
addToken(
  'fads-sys-checkbox-ripple',
  getLightToken('Controls', 'control-ripple-effect') ?? '#f3f4f6',
  'Light.Controls.control-ripple-effect'
);
addToken(
  'fads-sys-checkbox-icon-oncolor',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (same white used by Control-icon-hovered/-pressed on every filled state)'
);
addToken(
  'fads-sys-checkbox-icon-readonly',
  getLightToken('Controls', 'control-border') ?? '#6c737f',
  'Light.Controls.control-border (closest defensible reading for the Read-only icon tone — not ' +
    'independently color-inspectable, see spec §3 Needs Confirmation)'
);
addToken(
  'fads-sys-checkbox-focus-ring',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-checkbox-primary-checked',
  getLightToken('Controls', 'control-primary-checked') ?? '#1b8354',
  'Light.Controls.control-primary-checked'
);
addToken(
  'fads-sys-checkbox-primary-hovered',
  getLightToken('Controls', 'control-primary-hovered') ?? '#14573a',
  'Light.Controls.control-primary-hovered'
);
addToken(
  'fads-sys-checkbox-primary-pressed',
  getLightToken('Controls', 'control-primary-pressed') ?? '#104631',
  'Light.Controls.control-primary-pressed'
);
addToken(
  'fads-sys-checkbox-primary-focused',
  getLightToken('Controls', 'control-primary-focused') ?? '#1b8354',
  'Light.Controls.control-primary-focused'
);
addToken(
  'fads-sys-checkbox-neutral-checked',
  getLightToken('Controls', 'control-neutral-checked') ?? '#0d121c',
  'Light.Controls.control-neutral-checked'
);
addToken(
  'fads-sys-checkbox-neutral-hovered',
  getLightToken('Controls', 'control-neutral-hovered') ?? '#4d5761',
  'Light.Controls.control-neutral-hovered'
);
addToken(
  'fads-sys-checkbox-neutral-pressed',
  getLightToken('Controls', 'control-neutral-pressed') ?? '#6c737f',
  'Light.Controls.control-neutral-pressed'
);
addToken(
  'fads-sys-checkbox-neutral-focused',
  getLightToken('Controls', 'control-neutral-focused') ?? '#0d121c',
  'Light.Controls.control-neutral-focused'
);

// Official Radio (CMP-16) tokens — verified live against the actual Radio component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30195:23385, a 24-variant set of
// state × style × selected) and the Radio Label sub-component (node 30195:23490) via
// Figma MCP get_design_context/get_variable_defs — see docs/FIGMA_RADIO_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/Radio/VISUAL_COMPLIANCE_RADIO.md. Several color values are
// numerically identical to Checkbox's own tokens (both read the same Light.Controls.* Figma
// variables) — minted as a separate fads-sys-radio-* family per this codebase's established
// per-component-token convention (see TextInput vs. Checkbox precedent), not duplicated by
// oversight.
addToken(
  'fads-sys-radio-hit-size',
  '32px',
  'Figma MCP get_design_context "Radio elements" hit-target frame (live-verified)'
);
addToken(
  'fads-sys-radio-size',
  '24px',
  'Figma MCP get_design_context "_RadioBase" ring frame (live-verified)'
);
addToken(
  'fads-sys-radio-border-default',
  getLightToken('Controls', 'control-border') ?? '#6c737f',
  'Light.Controls.control-border'
);
addToken(
  'fads-sys-radio-border-readonly',
  getLightToken('Global', 'border-disabled') ?? '#9da4ae',
  'Light.Global.border-disabled (shared by Read-only and Disabled unchecked rings, live-verified identical)'
);
addToken(
  'fads-sys-radio-bg-pressed-unchecked',
  getLightToken('Controls', 'control-pressed') ?? '#d2d6db',
  'Light.Controls.control-pressed'
);
addToken(
  'fads-sys-radio-bg-disabled',
  getLightToken('Global', 'control-disabled') ?? '#9da4ae',
  'Light.Global.control-disabled (Disabled-checked dot — live-verified identical across Primary and Neutral)'
);
addToken(
  'fads-sys-radio-ripple',
  getLightToken('Controls', 'control-ripple-effect') ?? '#f3f4f6',
  'Light.Controls.control-ripple-effect'
);
addToken(
  'fads-sys-radio-focus-ring',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-radio-primary-checked',
  getLightToken('Controls', 'control-primary-checked') ?? '#1b8354',
  'Light.Controls.control-primary-checked'
);
addToken(
  'fads-sys-radio-primary-hovered',
  getLightToken('Controls', 'control-primary-hovered') ?? '#14573a',
  'Light.Controls.control-primary-hovered'
);
addToken(
  'fads-sys-radio-primary-pressed',
  getLightToken('Controls', 'control-primary-pressed') ?? '#104631',
  'Light.Controls.control-primary-pressed'
);
addToken(
  'fads-sys-radio-primary-focused',
  getLightToken('Controls', 'control-primary-focused') ?? '#1b8354',
  'Light.Controls.control-primary-focused (live-verified identical to checked — focus never recolors)'
);
addToken(
  'fads-sys-radio-neutral-checked',
  getLightToken('Controls', 'control-neutral-checked') ?? '#0d121c',
  'Light.Controls.control-neutral-checked'
);
addToken(
  'fads-sys-radio-neutral-hovered',
  getLightToken('Controls', 'control-neutral-hovered') ?? '#4d5761',
  'Light.Controls.control-neutral-hovered'
);
addToken(
  'fads-sys-radio-neutral-pressed',
  getLightToken('Controls', 'control-neutral-pressed') ?? '#6c737f',
  'Light.Controls.control-neutral-pressed'
);
addToken(
  'fads-sys-radio-neutral-focused',
  getLightToken('Controls', 'control-neutral-focused') ?? '#0d121c',
  'Light.Controls.control-neutral-focused (live-verified identical to checked — focus never recolors)'
);
addToken(
  'fads-sys-radio-label-text',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display (Radio Label node 30195:23490 — distinct from the generic ' +
    'fads-sys-color-text-default #161616 used elsewhere; a real, live-verified difference)'
);
addToken(
  'fads-sys-radio-description-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (Radio Label helper-text row)'
);
addToken(
  'fads-sys-radio-error-text',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error (Radio Label alert-message row — distinct from the generic ' +
    "fads-sys-color-status-error #f04438; matches TextInput's own scoped error-text token choice)"
);
addToken(
  'fads-sys-radio-error-gap',
  '16px',
  'Light.Control.control-title-error-gap (Radio Label alert-message row icon↔text gap)'
);

// Official Switch (CMP-18) tokens — verified live against the actual Switch component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:69895, a 20-variant set of
// rtl × state[Default/Hovered/Pressed/Focused/Disabled] × on) and the Switch Label
// sub-component (node 30150:69998) via Figma MCP get_design_context/get_variable_defs —
// see docs/FIGMA_SWITCH_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Switch/VISUAL_COMPLIANCE_SWITCH.md. The Default state's exact
// unchecked border token could not be read directly (Default is an opaque raster asset in
// the extracted markup, unlike Hovered/Pressed/Focused/Checked which are live inline code) —
// fads-sys-switch-border-default extends Light.Controls.control-border by disclosed analogy
// with Checkbox/Radio's own identical Default-state token choice, not guessed from nothing.
addToken(
  'fads-sys-switch-track-inline',
  '48px',
  'Figma MCP get_design_context track frame (live-verified)'
);
addToken(
  'fads-sys-switch-track-block',
  '24px',
  'Figma MCP get_design_context track frame (live-verified)'
);
addToken(
  'fads-sys-switch-thumb-size',
  '16px',
  'Figma MCP get_design_context Thumb inset geometry (16.67%/8.33% of the 24×48px track — live-verified)'
);
addToken(
  'fads-sys-switch-thumb-inset',
  '4px',
  'Figma MCP get_design_context Thumb inset geometry (live-verified, same value both axes)'
);
addToken(
  'fads-sys-switch-border-default',
  getLightToken('Controls', 'control-border') ?? '#6c737f',
  'Light.Controls.control-border (Default state is a raster asset — extended by disclosed ' +
    'analogy with Checkbox/Radio, not independently sampled for Switch)'
);
addToken(
  'fads-sys-switch-border-hovered',
  getLightToken('Controls', 'control-neutral-hovered') ?? '#4d5761',
  'Light.Controls.control-neutral-hovered'
);
addToken(
  'fads-sys-switch-border-pressed',
  getLightToken('Controls', 'control-neutral-pressed') ?? '#6c737f',
  'Light.Controls.control-neutral-pressed'
);
addToken(
  'fads-sys-switch-focus-ring-off',
  getLightToken('Controls', 'control-neutral-focused') ?? '#0d121c',
  'Light.Controls.control-neutral-focused (also reused for the unchecked track border under focus)'
);
addToken(
  'fads-sys-switch-focus-ring-on',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black (checked focus ring uses this universal color, not the mood color — live-verified)'
);
addToken(
  'fads-sys-switch-focus-ring-radius',
  '2px',
  'Light.Radius.radius-xs (the focus ring is a distinct rectangular overlay, not the pill shape — live-verified)'
);
addToken(
  'fads-sys-switch-border-disabled',
  getLightToken('Controls', 'Control-boarder-disabled') ?? '#9da4ae',
  'Light.Controls.Control-boarder-disabled (sic — literal Figma variable name, includes the typo)'
);
addToken(
  'fads-sys-switch-bg-checked',
  getLightToken('Controls', 'control-primary-checked') ?? '#1b8354',
  'Light.Controls.control-primary-checked'
);
addToken(
  'fads-sys-switch-bg-checked-hovered',
  getLightToken('Controls', 'control-primary-hovered') ?? '#14573a',
  'Light.Controls.control-primary-hovered'
);
addToken(
  'fads-sys-switch-bg-checked-pressed',
  getLightToken('Controls', 'control-primary-pressed') ?? '#104631',
  'Light.Controls.control-primary-pressed'
);
addToken(
  'fads-sys-switch-bg-checked-disabled',
  getLightToken('Global', 'control-disabled') ?? '#d2d6db',
  'Light.Global.control-disabled'
);
addToken(
  'fads-sys-switch-ripple',
  getLightToken('Controls', 'control-ripple-effect') ?? '#f3f4f6',
  'Light.Controls.control-ripple-effect'
);
addToken(
  'fads-sys-switch-thumb-bg',
  getLightToken('Background', 'background-white') ?? '#ffffff',
  'Light.Background.background-white'
);
addToken(
  'fads-sys-switch-thumb-shadow',
  '0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 3px rgba(16, 24, 40, 0.05)',
  'Figma MCP get_design_context Shadows/shadow-sm (live-verified)'
);
addToken(
  'fads-sys-switch-label-text',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display (Switch Label node 30150:69998 — same token as Radio Label, ' +
    "independently sourced here per this codebase's per-component-token convention)"
);
addToken(
  'fads-sys-switch-description-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (Switch Label helper-text row)'
);
addToken(
  'fads-sys-switch-error-text',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error (Switch Label alert-message row)'
);
addToken(
  'fads-sys-switch-error-gap',
  '16px',
  'Light.Control.control-title-error-gap (Switch Label alert-message row icon↔text gap, ' +
    'the non-trailing-switch layout value — the trailSwitch variant sampled an 8px gap ' +
    "instead; 16px chosen for consistency with Radio's own identical row)"
);

// Official Input Prefix-Suffix tokens — verified live against the actual Input Prefix-Suffix
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:60916, a 48-variant set of
// type[Plus/Minus] × state[Default/Hovered/Pressed/Selected/Focused/Disabled] ×
// style[Solid/Subtle] × size[Large/Medium]) via Figma MCP get_design_context/get_variable_defs
// — see docs/FIGMA_INPUT_PREFIX_SUFFIX_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/InputPrefixSuffix/VISUAL_COMPLIANCE_INPUT_PREFIX_SUFFIX.md. This is
// the exact icon-badge sub-component NumberInput's own increment/decrement buttons instantiate
// (confirmed by matching Figma node IDs).
addToken(
  'fads-sys-inputaffix-icon-default',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-inputaffix-icon-oncolor',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (Selected state icon color)'
);
addToken(
  'fads-sys-inputaffix-icon-disabled',
  getLightToken('Global', 'icon-default-disabled') ?? '#9da4ae',
  'Light.Global.icon-default-disabled'
);
addToken(
  'fads-sys-inputaffix-bg-solid-default',
  getLightToken('Button', 'button-background-neutral-default') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-default'
);
addToken(
  'fads-sys-inputaffix-bg-solid-hovered',
  getLightToken('Button', 'button-background-neutral-hovered') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-hovered (live-verified identical to the default value)'
);
addToken(
  'fads-sys-inputaffix-bg-solid-pressed',
  getLightToken('Button', 'button-background-neutral-pressed') ?? '#e5e7eb',
  'Light.Button.button-background-neutral-pressed'
);
addToken(
  'fads-sys-inputaffix-bg-selected',
  getLightToken('Button', 'button-background-black-selected') ?? '#384250',
  'Light.Button.button-background-black-selected (applies regardless of the Solid/Subtle style, live-verified)'
);
addToken(
  'fads-sys-inputaffix-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled (Solid style only — Subtle stays backgroundless when disabled)'
);
addToken(
  'fads-sys-inputaffix-focus-ring',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black (a real 4px solid border, not an outline — live-verified)'
);

// Official Date Picker (CMP-19) tokens — verified live against the actual Date Picker
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:10582, 6 top-level symbols:
// rtl × range × picker[open/closed]) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_DATE_PICKER_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/DatePicker/VISUAL_COMPLIANCE_DATE_PICKER.md. The trigger field
// itself reuses TextInput's own --fads-sys-textinput-* tokens directly (confirmed
// token-identical to the live "Date Field" node) — only the calendar-grid-specific colors
// below (selected/range-highlight day-cell fills, popover elevation) are new.
addToken(
  'fads-sys-datepicker-selected-bg',
  getLightToken('Form', 'datecell-background-default') ?? '#1b8354',
  'Light.Form.datecell-background-default'
);
addToken(
  'fads-sys-datepicker-selected-text',
  getLightToken('Text', 'text-oncolor-primary') ?? '#ffffff',
  'Light.Text.text-oncolor-primary'
);
addToken(
  'fads-sys-datepicker-range-bg',
  getLightToken('Form', 'datecell-background-100') ?? '#dff6e7',
  'Light.Form.datecell-background-100 (the in-range highlight band color)'
);
addToken(
  'fads-sys-datepicker-popover-radius',
  '8px',
  'Figma MCP get_variable_defs Radius/radius-md (live-verified)'
);
addToken(
  'fads-sys-datepicker-popover-shadow',
  '0 24px 48px -12px rgba(16, 24, 40, 0.18)',
  'Figma MCP get_variable_defs Shadows/shadow-2xl (live-verified)'
);

// Official Button-Close tokens — verified live against the actual Button-Close
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 2763:420129, a 32-variant set of
// size[x Small/Small/Medium/Large] × state[Default/Hovered/Pressed/Focused] ×
// onColor[false/true]) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/ButtonClose/VISUAL_COMPLIANCE_BUTTON_CLOSE.md. Radius reuses the
// already-shared generic --fads-sys-radius-sm; the 2px focus border reuses the already-shared
// generic --fads-sys-border-width-thick (live-verified identical to the sampled `border-2`).
addToken(
  'fads-sys-buttonclose-icon-default',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-buttonclose-icon-oncolor',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (onColor=true icon color)'
);
addToken(
  'fads-sys-buttonclose-bg-hovered',
  getLightToken('Button', 'button-background-neutral-hovered') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-hovered'
);
addToken(
  'fads-sys-buttonclose-bg-pressed',
  getLightToken('Button', 'button-background-neutral-pressed') ?? '#e5e7eb',
  'Light.Button.button-background-neutral-pressed'
);
addToken(
  'fads-sys-buttonclose-bg-oncolor-hovered',
  'rgba(255, 255, 255, 0.2)',
  'Figma MCP get_variable_defs Button/button-background-transparent-hovered (live-verified #ffffff33)'
);
addToken(
  'fads-sys-buttonclose-bg-oncolor-pressed',
  'rgba(255, 255, 255, 0.4)',
  'Figma MCP get_variable_defs Button/button-background-transparent-pressed (live-verified #ffffff66)'
);
addToken(
  'fads-sys-buttonclose-focus-ring',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-buttonclose-focus-ring-oncolor',
  getLightToken('Border', 'border-white') ?? '#ffffff',
  'Light.Border.border-white (onColor=true focus ring)'
);
addToken(
  'fads-sys-buttonclose-size-xs',
  '20px',
  'Figma MCP get_design_context size="x Small" (live-verified box dimension)'
);
addToken(
  'fads-sys-buttonclose-size-sm',
  '24px',
  'Figma MCP get_design_context size="Small" (live-verified box dimension)'
);
addToken(
  'fads-sys-buttonclose-size-md',
  '32px',
  'Figma MCP get_design_context size="Medium" (live-verified box dimension)'
);
addToken(
  'fads-sys-buttonclose-size-lg',
  '40px',
  'Figma MCP get_design_context size="Large" (live-verified box dimension)'
);
addToken(
  'fads-sys-buttonclose-icon-size-xs',
  '16px',
  'Figma MCP get_design_context size="x Small" (live-verified icon dimension)'
);
addToken(
  'fads-sys-buttonclose-icon-size-sm',
  '20px',
  'Figma MCP get_design_context size="Small"/"Medium" (live-verified icon dimension, shared)'
);
addToken(
  'fads-sys-buttonclose-icon-size-lg',
  '24px',
  'Figma MCP get_design_context size="Large" (live-verified icon dimension)'
);

// Official Floating Button tokens — verified live against the actual Floating Button
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 19488:124656) via Figma MCP
// get_design_context/get_variable_defs — see docs/FIGMA_FLOATING_BUTTON_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/FloatingButton/VISUAL_COMPLIANCE_FLOATING_BUTTON.md. Colors,
// typography, disabled treatment, and the focus ring all reuse the already-Approved Button's
// own --fads-sys-button-* tokens directly (get_variable_defs confirmed byte-identical Figma
// variable sources) — only these 3 geometry tokens are new.
addToken(
  'fads-sys-floatingbutton-padding-sm',
  '16px',
  'Figma MCP get_variable_defs Global/spacing-xl (live-verified, Small size)'
);
addToken(
  'fads-sys-floatingbutton-padding-lg',
  '20px',
  'Figma MCP get_variable_defs Global/spacing-2xl (live-verified, Large size)'
);
addToken(
  'fads-sys-floatingbutton-gap',
  '8px',
  'Figma MCP get_variable_defs Global/spacing-md (live-verified icon↔label gap)'
);

// Official Trailing Icon tokens — verified live against the actual Trailing Icon
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:92875, only 2 variants:
// Open[False/True]) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_TRAILING_ICON_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/TrailingIcon/VISUAL_COMPLIANCE_TRAILING_ICON.md. The panel's
// tokens share the same Figma "Tooltip/*" variable namespace as the separate, not-yet
// -visually-verified Tooltip primitive (batch 7) — scoped here under trailingicon-* rather
// than reusing Tooltip's own (currently unverified) tokens. Radius/z-index/font-weight reuse
// the already-shared generic --fads-sys-radius-sm/--fads-sys-z-tooltip/--fads-ref-font-weight-semibold
// tokens directly (not duplicated).
addToken(
  'fads-sys-trailingicon-hit-padding',
  '4px',
  'Figma MCP get_design_context p-[4px] on the Icon wrapper (live-verified)'
);
addToken(
  'fads-sys-trailingicon-icon-size',
  '20px',
  'Figma MCP get_design_context size-[20px] (live-verified)'
);
addToken(
  'fads-sys-trailingicon-icon-color',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-trailingicon-tooltip-gap',
  '8px',
  'Figma MCP get_variable_defs Tooltip/tooltip-gap (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-min-width',
  '160px',
  'Figma MCP get_design_context min-w-[160px] (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-max-width',
  '240px',
  'Figma MCP get_design_context max-w-[240px] (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-bg',
  '#ffffff',
  'Figma MCP get_variable_defs Tooltip/tooltip-background-light (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-shadow',
  '0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)',
  'Figma MCP get_variable_defs Shadows/shadow-lg (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-padding',
  '8px',
  'Figma MCP get_variable_defs Tooltip/tooltip-padding (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-text',
  '#1f2a37',
  'Figma MCP get_variable_defs Tooltip/tooltip-text-heading-light (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-font-size',
  '12px',
  'Figma MCP get_variable_defs Text xs/Semibold size (live-verified)'
);
addToken(
  'fads-sys-trailingicon-tooltip-line-height',
  '18px',
  'Figma MCP get_variable_defs Text xs/Semibold lineHeight (live-verified)'
);

// Official Dropdown List Item tokens — verified live against the actual Dropdown List Item
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 3262:27949, type[Single Select/Multi
// Select/Group label] × state[Default/Hovered/Pressed/Focused/Disabled] × selected × divider ×
// rtl) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_DROPDOWN_LIST_ITEM_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/DropdownListItem/VISUAL_COMPLIANCE_DROPDOWN_LIST_ITEM.md. This is
// the exact sub-component Select's own spec already names "Dropdown List Item × N" (confirmed by
// the identical node ID) — Select has been refactored to compose this primitive. The decorative
// multi-select checkbox reuses Checkbox's own already-verified --fads-sys-checkbox-* tokens
// directly (confirmed byte-identical) rather than adding new ones. Border-width/radius reuse the
// already-shared generic --fads-sys-border-width-thick/-thin/--fads-sys-radius-sm tokens.
addToken(
  'fads-sys-dropdownlistitem-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-dropdownlistitem-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-dropdownlistitem-group-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-dropdownlistitem-icon-default',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-dropdownlistitem-bg-hover',
  getLightToken('Form', 'option-background-hover') ?? '#f3f4f6',
  'Light.Form.option-background-hover'
);
addToken(
  'fads-sys-dropdownlistitem-bg-pressed',
  getLightToken('Form', 'option-background-pressed') ?? '#e5e7eb',
  'Light.Form.option-background-pressed'
);
addToken(
  'fads-sys-dropdownlistitem-focus-border',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-dropdownlistitem-checkbox-border',
  '#6c737f',
  'Figma MCP get_design_context Controls/control-border (live-verified, unchecked Multi Select checkbox)'
);
addToken(
  'fads-sys-dropdownlistitem-divider',
  '#d2d6db',
  'Figma MCP get_design_context colors/neutral/300 (live-verified divider line color)'
);
addToken(
  'fads-sys-dropdownlistitem-padding',
  '8px',
  'Figma MCP get_variable_defs Global/spacing-md (live-verified row padding/gap)'
);

// Official Search Box tokens — verified live against the actual Search Box component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:90990, rtl × state[Default/Hovered/Pressed/
// Focused/Read-only/Disabled] × filled × size[Medium/Large] × style[Default/Filled darker/
// Filled lighter] — the exact same governing axes already sourced for the already-Approved
// TextInput) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_SEARCH_BOX_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/SearchBox/VISUAL_COMPLIANCE_SEARCH_BOX.md. get_variable_defs
// confirmed the field chrome is byte-identical to TextInput's own --fads-sys-textinput-*
// tokens, reused directly — this is the ONLY new token this component needs.
addToken(
  'fads-sys-searchbox-helper-icon-size',
  '16px',
  'Figma MCP get_design_context Feedback Icon size-[16px] (live-verified, helper-text row icon)'
);

// Official Content Switcher (CMP-10) tokens — verified live against the actual Content
// Switcher component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 8421:71014, size × onColor ×
// rtl, plus the _Content Switcher Item sub-component 8421:70930 sampled across itemType ×
// state × onColor × size × rtl) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_CONTENT_SWITCHER_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/ContentSwitcher/VISUAL_COMPLIANCE_CONTENT_SWITCHER.md. Every color
// is sourced from the same Button/* Figma variable family already used by the already-Approved
// Button (and FloatingButton) — reused directly via the existing --fads-sys-button-* tokens,
// not duplicated here. Only geometry (this component's own height scale, distinct from
// Button's; the 76px minimum item width; the Large-size 20px/30px typography pair, no existing
// generic match) and the onColor translucent-white background/border are new.
addToken(
  'fads-sys-contentswitcher-height-sm',
  '32px',
  'Figma MCP get_design_context h-[32px], size="Small" (live-verified)'
);
addToken(
  'fads-sys-contentswitcher-height-md',
  '40px',
  'Figma MCP get_design_context h-[40px], size="Medium" (live-verified)'
);
addToken(
  'fads-sys-contentswitcher-height-lg',
  '48px',
  'Figma MCP get_design_context h-[48px], size="Large" (live-verified)'
);
addToken(
  'fads-sys-contentswitcher-min-width',
  '76px',
  'Figma MCP get_design_context min-w-[76px] (live-verified, every item)'
);
addToken(
  'fads-sys-contentswitcher-bg-oncolor-default',
  'rgba(255, 255, 255, 0.2)',
  'Figma MCP get_variable_defs Button/button-background-transparent-hovered (live-verified — the ' +
    'resting, not hover-only, background for a Normal item when onColor=true)'
);
addToken(
  'fads-sys-contentswitcher-border-oncolor',
  'rgba(255, 255, 255, 0.1)',
  'Figma MCP get_variable_defs Border/border-transparent-10 (live-verified)'
);
addToken(
  'fads-sys-contentswitcher-text-size-lg',
  '20px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-xl (live-verified, Large item text)'
);
addToken(
  'fads-sys-contentswitcher-line-height-lg',
  '30px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-xl (live-verified)'
);

// Official Menu (CMP-11) and Menu list item tokens — verified live against the actual Menu
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30195:22214) and its Menu list item
// sub-component (node 30195:21865, rtl × Trail element[None/Text/Icon/Button/Tag/Switch] ×
// state[Default/Hovered/Pressed/Selected/Focused/Disabled], 72 variants) via Figma MCP
// get_design_context/get_variable_defs — see docs/FIGMA_MENU_SPECIFICATION.md,
// docs/FIGMA_MENU_LIST_ITEM_SPECIFICATION.md, reports/VISUAL_COMPLIANCE/Menu/
// VISUAL_COMPLIANCE_MENU.md, and reports/VISUAL_COMPLIANCE/MenuListItem/
// VISUAL_COMPLIANCE_MENU_LIST_ITEM.md. Hover/Pressed backgrounds, the leading-icon size, the
// panel border, and panel radius all reuse the already-Approved Button's own --fads-sys-button-*
// tokens directly (confirmed byte-identical); item/section padding reuse the already-shared
// generic --fads-sys-space-inset-sm token; the group label's typography reuses the already-
// shared generic --fads-sys-typography-text-xs/-line-height-xs/--fads-ref-font-weight-bold
// tokens.
addToken(
  'fads-sys-menu-bg',
  getLightToken('Background', 'background-menu') ?? '#ffffff',
  'Light.Background.background-menu'
);
addToken(
  'fads-sys-menu-shadow',
  '0 24px 48px -12px rgba(16, 24, 40, 0.18)',
  'Figma MCP get_variable_defs Shadows/shadow-2xl (live-verified)'
);
addToken(
  'fads-sys-menu-width',
  '241px',
  'Figma MCP get_design_context w-[241px] (live-verified panel width)'
);
addToken(
  'fads-sys-menu-section-border',
  '#cbd5e1',
  'Figma MCP get_variable_defs border/border-default (live-verified, section divider — distinct ' +
    "from the panel's own outer Border/border-neutral-primary)"
);
addToken(
  'fads-sys-menu-section-gap',
  '12px',
  'Figma MCP get_variable_defs Global/spacing-lg (live-verified, group-label-to-items gap)'
);
addToken(
  'fads-sys-menu-group-label-text',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display'
);
addToken(
  'fads-sys-menulistitem-bg-selected',
  getLightToken('Background', 'background-primary-50') ?? '#f3fcf6',
  'Light.Background.background-primary-50'
);
addToken(
  'fads-sys-menulistitem-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-menulistitem-text-selected',
  getLightToken('Text', 'text-primary') ?? '#1b8354',
  'Light.Text.text-primary'
);
addToken(
  'fads-sys-menulistitem-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-menulistitem-text-secondary',
  getLightToken('Text', 'text-secondary-paragraph') ?? '#6c737f',
  'Light.Text.text-secondary-paragraph (Text trailing-element muted content)'
);
addToken(
  'fads-sys-menulistitem-icon-disabled',
  getLightToken('Global', 'icon-default-disabled') ?? '#9da4ae',
  'Light.Global.icon-default-disabled'
);
addToken(
  'fads-sys-menulistitem-focus-border',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);

// Official Rating (CMP-29) tokens — verified live against the actual Rating component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:69520, size × brand, plus the _RatingStar
// sub-component 30150:69453, 24 variants: size × state[Normal/Half/Selected/Pressed] ×
// style[Default/Brand]) via Figma MCP get_design_context/get_variable_defs/get_metadata — see
// docs/FIGMA_RATING_SPECIFICATION.md and reports/VISUAL_COMPLIANCE/Rating/
// VISUAL_COMPLIANCE_RATING.md. The star-to-star gap, corner radius, and focus ring all reuse
// already-shared generic tokens directly.
addToken(
  'fads-sys-rating-star-empty',
  getLightToken('Background', 'background-neutral-200') ?? '#e5e7eb',
  'Light.Background.background-neutral-200'
);
addToken(
  'fads-sys-rating-star-filled',
  getLightToken('Background', 'background-secondary') ?? '#dba102',
  'Light.Background.background-secondary'
);
addToken(
  'fads-sys-rating-star-filled-brand',
  getLightToken('Background', 'background-primary') ?? '#1b8354',
  'Light.Background.background-primary'
);
addToken(
  'fads-sys-rating-hover-bg',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100 (interactive star hover/press highlight)'
);
addToken(
  'fads-sys-rating-star-size-sm',
  '24px',
  'Figma MCP get_metadata Size=Small (live-verified)'
);
addToken(
  'fads-sys-rating-star-size-md',
  '32px',
  'Figma MCP get_metadata Size=Medium (live-verified)'
);
addToken(
  'fads-sys-rating-star-size-lg',
  '48px',
  'Figma MCP get_metadata Size=Large (live-verified)'
);

// Official Textarea (CMP-14) tokens — verified live against the actual Textarea component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 5462:417368, a 144-variant set of
// rtl × state × filled × error × style) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see docs/FIGMA_TEXTAREA_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/Textarea/VISUAL_COMPLIANCE_TEXTAREA.md. Additive only: only
// Textarea.module.css consumes these — Textarea no longer composes the shared
// Field/control.module.css base (Select still does, unchanged). Shares the same Form/field-*
// Figma variable family as TextInput, independently sourced here via the same generic
// getFormColor() alias-resolver (no cross-component token references).
addToken(
  'fads-sys-textarea-bg-default',
  getFormColor('field-background-default') ?? '#ffffff',
  'Light.Form.field-background-default'
);
addToken(
  'fads-sys-textarea-bg-darker',
  getFormColor('field-background-darker') ?? '#f3f4f6',
  'Light.Form.field-background-darker'
);
addToken(
  'fads-sys-textarea-bg-lighter',
  getFormColor('field-background-lighter') ?? '#fcfcfd',
  'Light.Form.field-background-lighter'
);
addToken(
  'fads-sys-textarea-border-default',
  getFormColor('field-border-default') ?? '#9da4ae',
  'Light.Form.field-border-default'
);
addToken(
  'fads-sys-textarea-border-hovered',
  getFormColor('field-border-hovered') ?? '#384250',
  'Light.Form.field-border-hovered (confirmed present via get_variable_defs on this component)'
);
addToken(
  'fads-sys-textarea-border-pressed',
  getFormColor('field-border-pressed') ?? '#0d121c',
  'Light.Form.field-border-pressed'
);
addToken(
  'fads-sys-textarea-border-error',
  getFormColor('field-border-error') ?? '#b42318',
  'Light.Form.field-border-error'
);
addToken(
  'fads-sys-textarea-border-readonly',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-textarea-border-disabled',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  "Light.Border.border-neutral-primary (live-verified distinct from TextInput's own Disabled " +
    'border token — see spec §3)'
);
addToken(
  'fads-sys-textarea-text-filled',
  getFormColor('field-text-filled') ?? '#161616',
  'Light.Form.field-text-filled'
);
addToken(
  'fads-sys-textarea-text-hovered',
  getFormColor('field-text-hovered') ?? '#161616',
  'Light.Form.field-text-hovered'
);
addToken(
  'fads-sys-textarea-text-pressed',
  getFormColor('field-text-pressed') ?? '#384250',
  'Light.Form.field-text-pressed'
);
addToken(
  'fads-sys-textarea-text-focused',
  getFormColor('field-text-focused') ?? '#384250',
  'Light.Form.field-text-focused'
);
addToken(
  'fads-sys-textarea-text-readonly',
  getFormColor('field-text-readonly') ?? '#161616',
  'Light.Form.field-text-readonly'
);
addToken(
  'fads-sys-textarea-text-disabled',
  '#9da4ae',
  'Figma MCP get_design_context Global/input-text-disabled on the Disabled Label sub-component ' +
    '(live-verified; no named Figma variable in the local JSON export) — the sampled Textarea ' +
    "Disabled node's own text layer was an untokenized stray hex instead, see spec §9 item 1"
);
addToken(
  'fads-sys-textarea-text-placeholder',
  getFormColor('field-text-placeholder') ?? '#6c737f',
  'Light.Form.field-text-placeholder'
);
addToken(
  'fads-sys-textarea-helper-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-textarea-helper-error',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error'
);
addToken(
  'fads-sys-textarea-scrollbar-track',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100 (used via CSS scrollbar-color, spec §5)'
);
addToken(
  'fads-sys-textarea-scrollbar-thumb',
  '#d2d6db',
  'Figma MCP get_variable_defs Form/Textarea-scrollbar-bar (live-verified; no named Figma ' +
    'variable in the local JSON export) — used via CSS scrollbar-color, spec §5'
);
addToken(
  'fads-sys-textarea-focus-shadow',
  '0 2px 4px rgba(16, 24, 40, 0.06), 0 4px 8px rgba(16, 24, 40, 0.1)',
  'Figma MCP get_design_context Shadows/shadow-md on Focused state (live-verified, same effect ' +
    "already independently confirmed for TextInput's own focus shadow)"
);
addToken(
  'fads-sys-textarea-underline-height',
  '2px',
  'Figma MCP get_design_context Focused-state full-width thin underline (live-verified)'
);
addToken(
  'fads-sys-textarea-min-height',
  '96px',
  'Figma MCP get_metadata Textarea frame height (live-verified demo-instance height, extended as the sane default)'
);
addToken(
  'fads-sys-textarea-padding-inline',
  '16px',
  'Light.Spacing.Form/textarea-container-padding-left&right (live-verified)'
);
addToken(
  'fads-sys-textarea-padding-block',
  '12px',
  'Light.Spacing.Form/textarea-container-padding-top&bottom (live-verified)'
);
addToken(
  'fads-sys-textarea-label-gap',
  '8px',
  'Light.Spacing.Form/iable-container (live-verified — label-row-to-box gap)'
);

// Official Select / Dropdown Input (CMP-15) tokens — verified live against the actual Dropdown
// Input component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 3534:49934, a 288-variant set of
// rtl × size × filled × state × error × style) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see docs/FIGMA_SELECT_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Select/VISUAL_COMPLIANCE_SELECT.md. Shares the same Form/field-*
// Figma variable family as TextInput/Textarea, independently sourced via the same generic
// getFormColor() alias-resolver (no cross-component token references). Field radius/border-width
// reuse the already-shared generic --fads-sys-radius-sm/--fads-sys-border-width-thin tokens.
addToken(
  'fads-sys-select-height-lg',
  '40px',
  'Figma MCP get_metadata Size=Large frame (live-verified)'
);
addToken(
  'fads-sys-select-height-md',
  '32px',
  'Figma MCP get_metadata Size=Medium frame (live-verified)'
);
addToken(
  'fads-sys-select-bg-default',
  getFormColor('field-background-default') ?? '#ffffff',
  'Light.Form.field-background-default'
);
addToken(
  'fads-sys-select-bg-darker',
  getFormColor('field-background-darker') ?? '#f3f4f6',
  'Light.Form.field-background-darker'
);
addToken(
  'fads-sys-select-bg-lighter',
  getFormColor('field-background-lighter') ?? '#fcfcfd',
  'Light.Form.field-background-lighter'
);
addToken(
  'fads-sys-select-bg-pressed',
  getFormColor('field-background-pressed') ?? '#f3f4f6',
  'Light.Form.field-background-pressed'
);
addToken(
  'fads-sys-select-border-default',
  getFormColor('field-border-default') ?? '#9da4ae',
  'Light.Form.field-border-default'
);
addToken(
  'fads-sys-select-border-hovered',
  getFormColor('field-border-hovered') ?? '#384250',
  'Light.Form.field-border-hovered'
);
addToken(
  'fads-sys-select-border-error',
  getFormColor('field-border-error') ?? '#b42318',
  'Light.Form.field-border-error'
);
addToken(
  'fads-sys-select-border-disabled',
  getLightToken('Global', 'border-disabled') ?? '#9da4ae',
  'Light.Global.border-disabled (shared by Read-only and Disabled — live-verified uniform)'
);
addToken(
  'fads-sys-select-text-filled',
  getFormColor('field-text-filled') ?? '#161616',
  'Light.Form.field-text-filled'
);
addToken(
  'fads-sys-select-text-placeholder',
  getFormColor('field-text-placeholder') ?? '#6c737f',
  'Light.Form.field-text-placeholder'
);
addToken(
  'fads-sys-select-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-select-icon-default',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-select-icon-disabled',
  getLightToken('Icon', 'icon-default-400') ?? '#9da4ae',
  'Light.Icon.icon-default-400'
);
addToken(
  'fads-sys-select-panel-border',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-select-panel-shadow',
  '0 8px 8px -4px rgba(16, 24, 40, 0.03), 0 20px 24px -4px rgba(16, 24, 40, 0.08)',
  'Figma MCP get_design_context Shadows/shadow-xl on the open listbox panel (live-verified)'
);
addToken(
  'fads-sys-select-helper-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-select-helper-error',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error'
);
addToken(
  'fads-sys-select-content-gap',
  '4px',
  "Light.Spacing.Form/dropdown-icon-content (live-verified — distinct from TextInput's own 8px icon gap)"
);
addToken(
  'fads-sys-select-padding-inline',
  '16px',
  'Light.Spacing.Form/dropdown-container-padding-left&right (live-verified)'
);
addToken('fads-sys-select-label-gap', '8px', 'Light.Spacing.Form/iable-container (live-verified)');
addToken(
  'fads-sys-select-panel-padding',
  '8px',
  'Light.Spacing.Global/spacing-md (live-verified — listbox panel inner padding)'
);
// Official File Upload / Single (CMP-20) and / Multiple (CMP-20) tokens — verified live against
// both component sets (Figma file J0xq7JG3JKshRDzrgAM7E0, nodes 30146:37020 / 30146:37007) via
// Figma MCP get_metadata/get_design_context/get_variable_defs — see
// docs/FIGMA_FILE_UPLOAD_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/FileUploader/VISUAL_COMPLIANCE_FILEUPLOADER.md. The Browse button in
// both variants composes the already-Approved Button component directly (dark variant for
// Single, secondary variant for Multiple) — no new button-fill tokens needed here.
addToken(
  'fads-sys-fileupload-dropzone-bg',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100'
);
addToken(
  'fads-sys-fileupload-border',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-fileupload-border-error',
  getLightToken('Border', 'border-error') ?? '#b42318',
  'Light.Border.border-error'
);
addToken(
  'fads-sys-fileupload-heading-text',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display (drop-zone heading, Multiple)'
);
addToken(
  'fads-sys-fileupload-caption-text',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (drop-zone caption, Multiple)'
);
addToken(
  'fads-sys-fileupload-helper-text',
  '#64748b',
  'Figma MCP get_design_context Text/text-tertiary on the Single-variant helper text (live-verified; no named Figma variable in the local JSON export)'
);
addToken(
  'fads-sys-fileupload-file-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default (file name)'
);
addToken(
  'fads-sys-fileupload-error-text',
  '#ce281c',
  "Figma MCP get_design_context Text/text-error-primary on the File-3 error-message row (live-verified; distinct from this design system's usual #b42318 error red — spec §4 item 2, flagged not silently unified)"
);
addToken(
  'fads-sys-fileupload-success-icon',
  getLightToken('Icon', 'icon-success') ?? '#067647',
  'Light.Icon.icon-success'
);
addToken(
  'fads-sys-fileupload-icon-default',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default (drop-zone icon, Multiple)'
);
addToken(
  'fads-sys-fileupload-text-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-fileupload-bg-disabled',
  getLightToken('Global', 'background-disabled') ?? '#e5e7eb',
  'Light.Global.background-disabled (Browse button fill, Disabled)'
);
addToken(
  'fads-sys-fileupload-content-gap',
  '8px',
  'Light.Spacing.Text/text-content-gap (live-verified — label-to-helper and heading-to-caption gap)'
);
addToken(
  'fads-sys-fileupload-dropzone-padding',
  '24px',
  'Light.Spacing.Global/spacing-3xl (live-verified — Multiple drop-zone inner padding)'
);
addToken(
  'fads-sys-fileupload-dropzone-gap',
  '16px',
  'Light.Spacing.Global/spacing-xl (live-verified — Header-to-button stack gap, both variants)'
);
addToken(
  'fads-sys-fileupload-file-padding',
  '8px',
  'Light.Spacing.size/8 (live-verified — file-row inner padding)'
);
addToken(
  'fads-sys-fileupload-file-gap',
  '8px',
  'Light.Spacing.Global/spacing-md (live-verified — file-list stack gap, and status-icon-to-name gap)'
);

// Official Table (CMP-27) tokens — verified live against the official component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 5698:40875 — 16 variants: rtl x
// alternatingRows x compact x contained) via Figma MCP get_metadata/get_design_context/
// get_variable_defs — see docs/FIGMA_TABLE_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Table/VISUAL_COMPLIANCE_TABLE.md. The row-selection checkbox
// composes the already-Approved Checkbox component directly — no new checkbox tokens here.
addToken(
  'fads-sys-table-cell-border',
  getLightToken('Table', 'table-cell-border') ?? '#d2d6db',
  'Light.Table.table-cell-border'
);
addToken(
  'fads-sys-table-text-head',
  getLightToken('Table', 'table-text-head') ?? '#384250',
  'Light.Table.table-text-head'
);
addToken(
  'fads-sys-table-text-body',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Table.table-text-body -> Light.Text.text-default (alias)'
);
addToken(
  'fads-sys-table-bg-header',
  getLightToken('Table', 'table-background-header') ?? '#f3f4f6',
  'Light.Table.table-background-header'
);
addToken(
  'fads-sys-table-bg-row-alt',
  getLightToken('Table', 'table-background-row-alt') ?? '#f9fafb',
  'Light.Table.table-background-row-alt'
);
addToken(
  'fads-sys-table-bg-row-hovered',
  getLightToken('Table', 'table-background-row-hovered') ?? '#f3f4f6',
  'Light.Table.table-background-row-hovered'
);
addToken(
  'fads-sys-table-bg-row-selected',
  getLightToken('Table', 'table-background-row-select') ?? '#f3fcf6',
  'Light.Table.table-background-row-select (fill is identical whether or not the row is also hovered — Light.Table.table-background-row-selected-hovered shares the same #F3FCF6 hex; see spec §3 Needs Confirmation re: the separate table-boarder-row-selected-hovered stroke token)'
);
addToken(
  'fads-sys-table-header-height',
  '48px',
  'Figma MCP get_design_context min-h-[48px] on the Table Header Cell wrapper (live-verified, identical across Standard and Compact density)'
);
addToken(
  'fads-sys-table-row-height-standard',
  '64px',
  'Figma MCP get_design_context min-h-[64px] on the Table Row Cell wrapper, Compact=False (live-verified)'
);
addToken(
  'fads-sys-table-row-height-compact',
  '32px',
  'Figma MCP get_design_context min-h-[32px] on the Table Row Cell wrapper, Compact=True (live-verified)'
);
addToken(
  'fads-sys-table-cell-padding-h',
  '16px',
  'Light.Table (via get_variable_defs) Table/table-cell-h-padding'
);
addToken(
  'fads-sys-table-cell-padding-v',
  '8px',
  'Light.Table (via get_variable_defs) Table/table-cell-v-padding'
);
addToken(
  'fads-sys-table-head-font-size',
  '12px',
  'Light.Table (via get_variable_defs) Size/Text/typo-size-text-xs (header cell text)'
);
addToken(
  'fads-sys-table-head-line-height',
  '18px',
  'Light.Table (via get_variable_defs) Line Height/Text/line-heights-text-xs (header cell text)'
);
addToken(
  'fads-sys-table-select-cell-width',
  '52px',
  'Figma MCP get_design_context w-[52px] on the leading checkbox Table Row Cell (live-verified)'
);
addToken(
  'fads-sys-table-radius-contained',
  '8px',
  'Figma MCP get_design_context rounded-[var(--radius/radius-md,8px)] on the Contained=True outer wrapper (live-verified; Radius is a dimension group with no .hex in the local JSON export, so sourced directly from the extracted code rather than getLightToken)'
);

// Official Pagination (CMP-28) tokens — verified live against the official component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 7936:8133 — 6 variants: rtl x size
// [Large/Medium/Small]) via Figma MCP get_metadata/get_design_context/get_variable_defs —
// see docs/FIGMA_PAGINATION_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Pagination/VISUAL_COMPLIANCE_PAGINATION.md. Prev/Next icon
// glyphs are CSS-drawn (arrow-left-01/arrow-right-01 aren't in the Icon registry yet) — no
// new icon-fill token needed since they use currentColor (fads-sys-pagination-text).
addToken(
  'fads-sys-pagination-text',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-pagination-selector-bg',
  getLightToken('Background', 'background-primary') ?? '#1b8354',
  'Light.Background.background-primary (current-page underline indicator)'
);
addToken(
  'fads-sys-pagination-ellipsis-border',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black (overflow "…" item border)'
);
addToken(
  'fads-sys-pagination-radius',
  '4px',
  'Figma MCP get_variable_defs Radius/radius-sm (live-verified)'
);
addToken(
  'fads-sys-pagination-items-gap',
  '8px',
  'Figma MCP get_variable_defs Pagination/pagination-Items-padding (live-verified)'
);
addToken(
  'fads-sys-pagination-item-size-lg',
  '40px',
  'Figma MCP get_design_context size-[40px], Size=Large (live-verified)'
);
addToken(
  'fads-sys-pagination-item-size-md',
  '32px',
  'Figma MCP get_design_context size-[32px], Size=Medium (live-verified)'
);
addToken(
  'fads-sys-pagination-item-size-sm',
  '24px',
  'Figma MCP get_design_context h-[24px]/min-w-[24px], Size=Small (live-verified)'
);
addToken(
  'fads-sys-pagination-item-padding-lg',
  '8px',
  'Figma MCP get_variable_defs Pagination/pagination-Item-lg-padding (live-verified)'
);
addToken(
  'fads-sys-pagination-item-padding-md',
  '6px',
  'Figma MCP get_variable_defs Pagination/pagination-Item-md-padding (live-verified)'
);
addToken(
  'fads-sys-pagination-item-padding-sm',
  '4px',
  'Figma MCP get_variable_defs Pagination/pagination-Item-sm-padding (live-verified)'
);
addToken(
  'fads-sys-pagination-icon-size-lg',
  '24px',
  'Figma MCP get_design_context Leading Icon size-[24px], Size=Large (live-verified)'
);
addToken(
  'fads-sys-pagination-icon-size-md',
  '20px',
  'Figma MCP get_design_context Leading Icon size-[20px], Size=Medium (live-verified)'
);
addToken(
  'fads-sys-pagination-icon-size-sm',
  '16px',
  'Figma MCP get_design_context Leading Icon size-[16px], Size=Small (live-verified)'
);
addToken(
  'fads-sys-pagination-selector-width-lg',
  '24px',
  'Figma MCP get_design_context Selector w-[24px], Size=Large (live-verified)'
);
addToken(
  'fads-sys-pagination-selector-width-md',
  '24px',
  'Figma MCP get_design_context Selector w-[24px], Size=Medium (live-verified)'
);
addToken(
  'fads-sys-pagination-selector-width-sm',
  '16px',
  'Figma MCP get_design_context Selector w-[16px], Size=Small (live-verified)'
);
addToken(
  'fads-sys-pagination-selector-height',
  '3px',
  'Figma MCP get_design_context Selector h-[3px] (live-verified, all sizes)'
);
addToken(
  'fads-sys-pagination-text-size-lg',
  '16px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-md (live-verified — Large page-number text)'
);
addToken(
  'fads-sys-pagination-text-size-md',
  '16px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-md (live-verified — Medium uses the same text-md size as Large)'
);
addToken(
  'fads-sys-pagination-text-size-sm',
  '14px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-sm (live-verified)'
);
addToken(
  'fads-sys-pagination-line-height-lg',
  '24px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-md (live-verified)'
);
addToken(
  'fads-sys-pagination-line-height-md',
  '24px',
  "Figma MCP get_variable_defs Line Height/Text/line-heights-text-md (live-verified — Medium shares Large's line-height)"
);
addToken(
  'fads-sys-pagination-line-height-sm',
  '20px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-sm (live-verified)'
);

// Official Alert (CMP-23, Figma name "Inline Alert") tokens — verified live against the official
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 1730:46048 — 40 variants: rtl x
// type[Neutral/Info/Destructive/Warning/Success] x backgroundColor[White/Color] x mobile) after
// the node was manually registered in figma-component-map.json — see
// docs/FIGMA_ALERT_SPECIFICATION.md and reports/VISUAL_COMPLIANCE/Alert/VISUAL_COMPLIANCE_ALERT.md.
// Supersedes the prior pass's provisional tokens (which were disclosed reuses of Tag's palette
// while Alert's own node was unresolvable) — every value below is now independently live-verified
// against Alert's own node, not reused from another component.
addToken(
  'fads-sys-alert-bg-white',
  getLightToken('Background', 'background-notification-white') ?? '#ffffff',
  'Light.Background.background-notification-white'
);
addToken(
  'fads-sys-alert-border-white',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary (constant across all tones on the White surface — only the featured icon and accent stripe change color per tone)'
);
addToken(
  'fads-sys-alert-bg-tinted-neutral',
  getLightToken('Background', 'background-neutral-25') ?? '#fcfcfd',
  'Light.Background.background-neutral-25 (Color/tinted surface, Neutral tone)'
);
addToken(
  'fads-sys-alert-border-tinted-neutral',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary (Neutral has no distinct tinted-border color — live-verified identical to the White surface border)'
);
addToken(
  'fads-sys-alert-bg-tinted-info',
  getLightToken('Background', 'background-info-25') ?? '#f5faff',
  'Light.Background.background-info-25'
);
addToken(
  'fads-sys-alert-border-tinted-info',
  getLightToken('Border', 'border-info-light') ?? '#b2ddff',
  'Light.Border.border-info-light'
);
addToken(
  'fads-sys-alert-bg-tinted-success',
  getLightToken('Background', 'background-success-25') ?? '#f6fef9',
  'Light.Background.background-success-25'
);
addToken(
  'fads-sys-alert-border-tinted-success',
  getLightToken('Border', 'border-success-light') ?? '#abefc6',
  'Light.Border.border-success-light'
);
addToken(
  'fads-sys-alert-bg-tinted-warning',
  getLightToken('Background', 'background-warning-25') ?? '#fffcf5',
  'Light.Background.background-warning-25'
);
addToken(
  'fads-sys-alert-border-tinted-warning',
  getLightToken('Border', 'border-warning-light') ?? '#fedf89',
  'Light.Border.border-warning-light'
);
addToken(
  'fads-sys-alert-bg-tinted-error',
  getLightToken('Background', 'background-error-25') ?? '#fffbfa',
  'Light.Background.background-error-25'
);
addToken(
  'fads-sys-alert-border-tinted-error',
  getLightToken('Border', 'border-error-light') ?? '#fecdca',
  'Light.Border.border-error-light'
);
addToken(
  'fads-sys-alert-title-default',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display (title color on the White surface and the tinted-Neutral surface)'
);
addToken(
  'fads-sys-alert-title-info',
  getLightToken('Text', 'text-info') ?? '#175cd3',
  'Light.Text.text-info (title color on the tinted-Info surface only)'
);
addToken(
  'fads-sys-alert-title-success',
  getLightToken('Text', 'text-success') ?? '#067647',
  'Light.Text.text-success (title color on the tinted-Success surface only)'
);
addToken(
  'fads-sys-alert-title-warning',
  getLightToken('Text', 'text-warning') ?? '#b54708',
  'Light.Text.text-warning (title color on the tinted-Warning surface only)'
);
addToken(
  'fads-sys-alert-title-error',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error (title color on the tinted-Error surface only)'
);
addToken(
  'fads-sys-alert-description',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (description color — constant across every tone/surface combination, live-verified)'
);
addToken(
  'fads-sys-alert-icon-bg-neutral',
  getLightToken('Background', 'background-neutral-50') ?? '#f9fafb',
  'Light.Background.background-neutral-50 (featured-icon circle fill, Neutral)'
);
addToken(
  'fads-sys-alert-icon-bg-info',
  getLightToken('Background', 'background-info-50') ?? '#eff8ff',
  'Light.Background.background-info-50 (aka Icon.background-info-light — featured-icon circle fill, Info)'
);
addToken(
  'fads-sys-alert-icon-bg-success',
  getLightToken('Background', 'background-success-50') ?? '#ecfdf3',
  'Light.Background.background-success-50 (featured-icon circle fill, Success)'
);
addToken(
  'fads-sys-alert-icon-bg-warning',
  getLightToken('Background', 'background-warning-50') ?? '#fffaeb',
  'Light.Background.background-warning-50 (featured-icon circle fill, Warning)'
);
addToken(
  'fads-sys-alert-icon-bg-error',
  getLightToken('Background', 'background-error-50') ?? '#fef3f2',
  'Light.Background.background-error-50 (featured-icon circle fill, Error/Destructive)'
);
addToken(
  'fads-sys-alert-icon-neutral',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default (featured-icon glyph color, Neutral; also reused for the dismiss-button icon)'
);
addToken(
  'fads-sys-alert-icon-info',
  getLightToken('Icon', 'icon-info') ?? '#175cd3',
  'Light.Icon.icon-info'
);
addToken(
  'fads-sys-alert-icon-success',
  getLightToken('Icon', 'icon-success') ?? '#067647',
  'Light.Icon.icon-success'
);
addToken(
  'fads-sys-alert-icon-warning',
  getLightToken('Icon', 'icon-warning') ?? '#b54708',
  'Light.Icon.icon-warning'
);
addToken(
  'fads-sys-alert-icon-error',
  getLightToken('Icon', 'icon-error') ?? '#b42318',
  'Light.Icon.icon-error'
);
addToken(
  'fads-sys-alert-dismiss-icon',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default (dismiss button glyph — not independently color-annotated in the extracted markup, reasonably matches the default icon color; Needs Confirmation)'
);
addToken(
  'fads-sys-alert-stripe-neutral',
  getLightToken('Background', 'background-neutral-200') ?? '#e5e7eb',
  'Light.Background.background-neutral-200 (accent-stripe color, Neutral)'
);
addToken(
  'fads-sys-alert-stripe-info',
  getLightToken('Background', 'background-info') ?? '#1570ef',
  'Light.Background.background-info (accent-stripe color, Info)'
);
addToken(
  'fads-sys-alert-stripe-success',
  getLightToken('Background', 'background-success') ?? '#079455',
  'Light.Background.background-success (accent-stripe color, Success)'
);
addToken(
  'fads-sys-alert-stripe-warning',
  getLightToken('Background', 'background-warning') ?? '#dc6803',
  'Light.Background.background-warning (accent-stripe color, Warning)'
);
addToken(
  'fads-sys-alert-stripe-error',
  getLightToken('Background', 'background-error') ?? '#d92d20',
  'Light.Background.background-error (accent-stripe color, Error/Destructive)'
);
addToken(
  'fads-sys-alert-stripe-thickness',
  '8px',
  'Figma MCP get_design_context w-[8px]/h-[8px] on the "Vertical line" accent stripe (live-verified, both the vertical default-layout and horizontal Mobile-layout orientations)'
);
addToken(
  'fads-sys-alert-radius',
  '8px',
  'Figma MCP get_variable_defs Radius/radius-md (live-verified — outer box corners)'
);
addToken(
  'fads-sys-alert-radius-sm',
  '4px',
  'Figma MCP get_variable_defs Radius/radius-sm (live-verified — dismiss-button corners)'
);
addToken(
  'fads-sys-alert-padding-block',
  '16px',
  'Figma MCP get_variable_defs Notification/notification-padding (live-verified)'
);
addToken(
  'fads-sys-alert-padding-inline',
  '24px',
  'Figma MCP get_variable_defs Notification/notification-h-padding (live-verified — Mobile layout uses the block padding value on all sides instead, see Alert.module.css)'
);
addToken(
  'fads-sys-alert-gap',
  '16px',
  'Figma MCP get_variable_defs Notification/notification-gap (live-verified — the outer stack gap between the header row and the actions row, both layouts)'
);
addToken(
  'fads-sys-alert-header-gap',
  '12px',
  'Figma MCP get_variable_defs Global/spacing-lg (live-verified — gap between the featured icon and the text block, default layout only)'
);
addToken(
  'fads-sys-alert-icon-circle-size',
  '40px',
  'Figma MCP get_design_context size-[40px] on the "Featured icon" circle (live-verified)'
);
addToken(
  'fads-sys-alert-text-gap',
  '8px',
  'Figma MCP get_variable_defs Text/text-content-gap (live-verified — gap between title and description)'
);
addToken(
  'fads-sys-alert-title-font-size',
  '16px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-md'
);
addToken(
  'fads-sys-alert-title-line-height',
  '24px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-md'
);
addToken(
  'fads-sys-alert-description-font-size',
  '14px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-sm'
);
addToken(
  'fads-sys-alert-description-line-height',
  '20px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-sm'
);
addToken(
  'fads-sys-alert-actions-gap',
  '8px',
  'Figma MCP get_variable_defs Button/buttons-group-gap (live-verified, both layouts)'
);
addToken(
  'fads-sys-alert-actions-padding-start',
  '40px',
  'Figma MCP get_variable_defs Global/spacing-5xl (live-verified — default-layout Actions row indent; 0 in the Mobile layout, see Alert.module.css)'
);
addToken(
  'fads-sys-alert-dismiss-size',
  '32px',
  'Figma MCP get_design_context size-[32px] on Button-Close (live-verified)'
);

// Official Loading (CMP-31) tokens — verified live against the official component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 5698:11136 — 84 variants: size[7] x
// style[Neutral/Primary/On-Color] x indicator[1-4, an animation-frame sample, not a
// distinct visual state]) via Figma MCP get_metadata/get_design_context/get_variable_defs —
// see docs/FIGMA_LOADING_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Loading/VISUAL_COMPLIANCE_LOADING.md. Every sampled variant is a
// raster per-frame image export (not inline-styled markup), so exact colors come from
// get_variable_defs directly; stroke width/arc angle are approximated (Needs Confirmation).
addToken(
  'fads-sys-loading-track-neutral',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100'
);
addToken(
  'fads-sys-loading-indicator-neutral',
  getLightToken('Background', 'background-black') ?? '#161616',
  'Light.Background.background-black'
);
addToken(
  'fads-sys-loading-track-primary',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  "Light.Background.background-neutral-100 (Primary style's track — same neutral track color as Neutral style, live-verified via get_variable_defs on the shared component-set root)"
);
addToken(
  'fads-sys-loading-indicator-primary',
  getLightToken('Background', 'background-primary') ?? '#1b8354',
  'Light.Background.background-primary'
);
addToken(
  'fads-sys-loading-track-oncolor',
  getLightAlphaColor('Alpha', 'alpha-white-30') ?? 'rgba(255, 255, 255, 0.3)',
  'Light.Alpha.alpha-white-30'
);
addToken(
  'fads-sys-loading-indicator-oncolor',
  getLightToken('Background', 'surface-oncolor') ?? '#ffffff',
  'Light.Background.surface-oncolor'
);
addToken(
  'fads-sys-loading-stroke-width',
  '3px',
  'Figma MCP get_design_context — approximated proportional ring thickness (raster image export has no extractable vector stroke-width; Needs Confirmation)'
);
addToken(
  'fads-sys-loading-size-xxs',
  '20px',
  'Figma MCP get_metadata size-[20px], Size="xx Small" (live-verified)'
);
addToken(
  'fads-sys-loading-size-xs',
  '24px',
  'Figma MCP get_metadata size-[24px], Size="x Small" (live-verified)'
);
addToken(
  'fads-sys-loading-size-sm',
  '28px',
  'Figma MCP get_metadata size-[28px], Size="Small" (live-verified)'
);
addToken(
  'fads-sys-loading-size-md',
  '32px',
  'Figma MCP get_metadata size-[32px], Size="Medium" (live-verified)'
);
addToken(
  'fads-sys-loading-size-lg',
  '36px',
  'Figma MCP get_metadata size-[36px], Size="Large" (live-verified)'
);
addToken(
  'fads-sys-loading-size-xl',
  '40px',
  'Figma MCP get_metadata size-[40px], Size="x Large" (live-verified)'
);
addToken(
  'fads-sys-loading-size-xxl',
  '44px',
  'Figma MCP get_metadata size-[44px], Size="xx Large" (live-verified)'
);

// Official Avatar (CMP-12, Data Display) tokens — verified live against the official
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 5699:53529 — 7 sizes [24/32/40/
// 48/64/80/120px] x 2 shapes [Rounded/Square] x 3 types [Initials/Icon/Image] x border
// [true/false]) via Figma MCP get_design_context/get_variable_defs — see
// docs/FIGMA_AVATAR_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Avatar/VISUAL_COMPLIANCE_AVATAR.md. Additive only: only
// Avatar.module.css consumes these, even where a value coincides with an existing
// component's token (e.g. background-neutral-100 #f3f4f6, also used by
// fads-sys-loading-track-neutral) — each independently sourced from the same underlying
// Figma primitive per the "no cross-component aliasing" policy (docs/TOKEN_MAPPING.md).
addToken(
  'fads-sys-avatar-background-fallback',
  getLightToken('Background', 'background-neutral-100') ?? '#f3f4f6',
  'Light.Background.background-neutral-100 (live-verified via get_variable_defs as Button/button-background-neutral-default on the Avatar node)'
);
addToken(
  'fads-sys-avatar-border-color',
  getLightToken('Background', 'background-white') ?? '#ffffff',
  'Light.Background.background-white (live-verified via get_variable_defs as Border/border-white on the Avatar node)'
);
addToken(
  'fads-sys-avatar-icon-color',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default (live-verified via get_variable_defs)'
);
addToken(
  'fads-sys-avatar-text-color',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default (live-verified via get_variable_defs)'
);
addToken(
  'fads-sys-avatar-size-2xl',
  '80px',
  'Figma MCP get_design_context Size="80px" (live-verified; no matching value on the existing space scale, which stops at 64px)'
);
addToken(
  'fads-sys-avatar-size-3xl',
  '120px',
  'Figma MCP get_design_context Size="120px" (live-verified; no matching value on the existing space scale)'
);
addToken(
  'fads-sys-avatar-border-width',
  '2px',
  'Figma MCP get_screenshot — approximated proportional white framing thickness (raster image export has no extractable vector stroke-width; Needs Confirmation)'
);
// Per-size typography — the official component set pairs each of the 7 sizes with a
// distinct text/display style (font-size, weight and line-height all vary together),
// live-verified via get_variable_defs: Text 2xs/Bold -> Text xs/Semibold -> Text sm/
// Semibold -> Text md/Medium -> Text xl/Medium -> Display sm/Regular -> Display md/Regular.
addToken('fads-sys-avatar-font-size-xs', '10px', 'Light.Size/Text.typo-size-text-2xs (Size=24px)');
addToken(
  'fads-sys-avatar-line-height-xs',
  '14px',
  'Light.Line Height/Text.line-heights-text-2xs (Size=24px)'
);
addToken('fads-sys-avatar-font-weight-xs', '700', 'Light.Font Wieght/font-weight-bold (Size=24px)');
addToken('fads-sys-avatar-font-size-sm', '12px', 'Light.Size/Text.typo-size-text-xs (Size=32px)');
addToken(
  'fads-sys-avatar-line-height-sm',
  '18px',
  'Light.Line Height/Text.line-heights-text-xs (Size=32px)'
);
addToken(
  'fads-sys-avatar-font-weight-sm',
  '600',
  'Light.Font Wieght/font-weight-semibold (Size=32px)'
);
addToken('fads-sys-avatar-font-size-md', '14px', 'Light.Size/Text.typo-size-text-sm (Size=40px)');
addToken(
  'fads-sys-avatar-line-height-md',
  '20px',
  'Light.Line Height/Text.line-heights-text-sm (Size=40px)'
);
addToken(
  'fads-sys-avatar-font-weight-md',
  '600',
  'Light.Font Wieght/font-weight-semibold (Size=40px)'
);
addToken('fads-sys-avatar-font-size-lg', '16px', 'Light.Size/Text.typo-size-text-md (Size=48px)');
addToken(
  'fads-sys-avatar-line-height-lg',
  '24px',
  'Light.Line Height/Text.line-heights-text-md (Size=48px)'
);
addToken(
  'fads-sys-avatar-font-weight-lg',
  '500',
  'Light.Font Wieght/font-weight-medium (Size=48px)'
);
addToken('fads-sys-avatar-font-size-xl', '20px', 'Light.Size/Text.typo-size-text-xl (Size=64px)');
addToken(
  'fads-sys-avatar-line-height-xl',
  '30px',
  'Light.Line Height/Text.line-heights-text-xl (Size=64px)'
);
addToken(
  'fads-sys-avatar-font-weight-xl',
  '500',
  'Light.Font Wieght/font-weight-medium (Size=64px)'
);
addToken(
  'fads-sys-avatar-font-size-2xl',
  '30px',
  'Light.Size/Display.typo-size-display-sm (Size=80px)'
);
addToken(
  'fads-sys-avatar-line-height-2xl',
  '38px',
  'Light.Line Height/Display.line-heights-display-sm (Size=80px)'
);
addToken(
  'fads-sys-avatar-font-weight-2xl',
  '400',
  'Light.Font Wieght/font-weight-regular (Size=80px)'
);
addToken(
  'fads-sys-avatar-font-size-3xl',
  '36px',
  'Light.Size/Display.typo-size-display-md (Size=120px)'
);
addToken(
  'fads-sys-avatar-line-height-3xl',
  '44px',
  'Light.Line Height/Display.line-heights-display-md (Size=120px)'
);
addToken(
  'fads-sys-avatar-font-weight-3xl',
  '400',
  'Light.Font Wieght/font-weight-regular (Size=120px)'
);

// Official Tooltip (CMP-30, Feedback & Overlays) tokens — verified live against the official
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:139266 — rtl x inverted x
// beakPlacement[None/Top/Bottom/Left/Right] x beakAlignment[Start/Center/End] x icon x title)
// via Figma MCP get_design_context/get_variable_defs — see docs/FIGMA_TOOLTIP_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/Tooltip/VISUAL_COMPLIANCE_TOOLTIP.md. The live default is the
// *light* bubble (inverted=false) — the pre-existing implementation was always dark, a genuine
// defect fixed this pass. Additive only; each value independently sourced from the live Figma
// variable group even where it coincides with another component's own token (e.g. the dark
// background matches TrailingIcon's separately-scoped `tooltip-bg`, per the "no cross-component
// aliasing" policy, docs/TOKEN_MAPPING.md).
addToken(
  'fads-sys-tooltip-background-light',
  getLightToken('Tooltip', 'tooltip-background-light') ?? '#ffffff',
  'Light.Tooltip.tooltip-background-light'
);
addToken(
  'fads-sys-tooltip-background-dark',
  getLightToken('Tooltip', 'tooltip-background-dark') ?? '#1f2a37',
  'Light.Tooltip.tooltip-background-dark'
);
addToken(
  'fads-sys-tooltip-text-heading-light',
  getLightToken('Tooltip', 'tooltip-text-heading-light') ?? '#1f2a37',
  'Light.Tooltip.tooltip-text-heading-light'
);
addToken(
  'fads-sys-tooltip-text-heading-dark',
  getLightToken('Tooltip', 'tooltip-text-heading-dark') ?? '#f9fafb',
  'Light.Tooltip.tooltip-text-heading-dark'
);
addToken(
  'fads-sys-tooltip-text-paragraph-light',
  getLightToken('Tooltip', 'tooltip-text-paragraph-light') ?? '#384250',
  'Light.Tooltip.tooltip-text-paragraph-light'
);
addToken(
  'fads-sys-tooltip-text-paragraph-dark',
  getLightToken('Tooltip', 'tooltip-text-paragraph-dark') ?? '#f3f4f6',
  'Light.Tooltip.tooltip-text-paragraph-dark'
);
addToken(
  'fads-sys-tooltip-icon-color-light',
  getLightToken('Icon', 'icon-neutral') ?? '#384250',
  'Light.Icon.icon-neutral (live-verified as the Tooltip FeedbackIcon color in light mode)'
);
addToken(
  'fads-sys-tooltip-icon-color-dark',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (live-verified as the Tooltip FeedbackIcon color in dark mode)'
);
addToken(
  'fads-sys-tooltip-min-width',
  '160px',
  'Figma MCP get_design_context min-w-[160px] (live-verified)'
);
addToken(
  'fads-sys-tooltip-max-width',
  '240px',
  'Figma MCP get_design_context max-w-[240px] (live-verified; was 16rem/256px in the pre-existing implementation)'
);
addToken(
  'fads-sys-tooltip-beak-size',
  '8px',
  "Figma MCP get_screenshot — a rotated-square diamond beak, same construction technique already established for TrailingIcon (docs/FIGMA_TRAILING_ICON_SPECIFICATION.md), independently sized here at the live-verified 28x6px beak asset's approximate visual weight"
);
addToken(
  'fads-sys-tooltip-shadow',
  '0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)',
  'Light.Shadows.shadow-lg (live-verified via get_variable_defs: two DROP_SHADOW effects, offset (0,4)/radius 6/spread -2/#10182808 and offset (0,12)/radius 16/spread -4/#10182814)'
);

// Official Progress Indicator (CMP-21, "Steps") tokens — verified live against the official
// component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 30150:68350 — 48 variants: rtl x
// alignment[Horizontal/Vertical] x state[Completed/Current/Upcomming] x hover x focused) via
// Figma MCP get_metadata/get_design_context/get_variable_defs — see
// docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Steps/VISUAL_COMPLIANCE_STEPS.md. Only 3 states are officially
// defined (no Disabled/Error) — the disabled/error tokens below are explicitly disclosed reuses
// of this design system's existing cross-cutting Global/Text/Border tokens, not independently
// live-verified for the Stepper.
addToken(
  'fads-sys-steps-completed',
  getLightToken('Stepper', 'stepper-button-completed') ?? '#1b8354',
  'Light.Stepper.stepper-button-completed'
);
addToken(
  'fads-sys-steps-completed-hovered',
  getLightToken('Stepper', 'stepper-button-completed-hovered') ?? '#166a45',
  'Light.Stepper.stepper-button-completed-hovered'
);
addToken(
  'fads-sys-steps-completed-icon',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (checkmark on the filled Completed circle)'
);
addToken(
  'fads-sys-steps-current',
  getLightToken('Stepper', 'stepper-button-current') ?? '#1b8354',
  'Light.Stepper.stepper-button-current'
);
addToken(
  'fads-sys-steps-upcoming',
  getLightToken('Stepper', 'stepper-button-upcomming') ?? '#d2d6db',
  'Light.Stepper.stepper-button-upcomming'
);
addToken(
  'fads-sys-steps-text-primary',
  getLightToken('Stepper', 'stepper-text-primary') ?? '#1f2a37',
  'Light.Stepper.stepper-text-primary'
);
addToken(
  'fads-sys-steps-text-secondary',
  getLightToken('Stepper', 'stepper-text-secondary') ?? '#384250',
  'Light.Stepper.stepper-text-secondary'
);
addToken(
  'fads-sys-steps-text-tertiary',
  getLightToken('Stepper', 'stepper-text-tertiary') ?? '#6c737f',
  'Light.Stepper.stepper-text-tertiary (used for the FADS-authored optional-label suffix)'
);
addToken(
  'fads-sys-steps-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Reused from the existing cross-cutting Light.Global.text-default-disabled — no official Figma Disabled state exists for this component (Needs Confirmation)'
);
addToken(
  'fads-sys-steps-error',
  getLightToken('Border', 'border-error') ?? '#b42318',
  'Reused from the existing cross-cutting Light.Border.border-error — no official Figma Error state exists for this component (Needs Confirmation)'
);
addToken(
  'fads-sys-steps-marker-size',
  '32px',
  'Figma MCP get_design_context size-[32px] on the Circle (live-verified)'
);
addToken(
  'fads-sys-steps-marker-border-width',
  '2px',
  'Figma MCP get_design_context border-2 on the Current/Upcoming Circle outline (live-verified)'
);
addToken(
  'fads-sys-steps-marker-font-size',
  '16px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-md (step-number text)'
);
addToken(
  'fads-sys-steps-connector-thickness',
  '2px',
  'Figma MCP get_design_context h-[2px]/w-[2px] on the connector Line (live-verified, both orientations)'
);
addToken(
  'fads-sys-steps-label-font-size',
  '16px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-md'
);
addToken(
  'fads-sys-steps-label-line-height',
  '24px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-md'
);
addToken(
  'fads-sys-steps-description-font-size',
  '14px',
  'Figma MCP get_variable_defs Size/Text/typo-size-text-sm'
);
addToken(
  'fads-sys-steps-description-line-height',
  '20px',
  'Figma MCP get_variable_defs Line Height/Text/line-heights-text-sm'
);
addToken(
  'fads-sys-steps-text-content-gap',
  '4px',
  'Figma MCP get_variable_defs Spacing/Progress Indicator/progress-text-content-gap (live-verified — step-name to description gap)'
);
addToken(
  'fads-sys-steps-text-side-padding',
  '16px',
  'Figma MCP get_variable_defs Progress Indicator/progress-text-content-side-padding (live-verified)'
);
addToken(
  'fads-sys-steps-gap',
  '0px',
  'Figma MCP get_design_context — steps are laid out edge-to-edge with the connector filling all space between markers (no separate inter-step gap in the extracted structure); live-verified as zero, not assumed'
);
addToken(
  'fads-sys-steps-text-gap',
  '8px',
  'Figma MCP get_variable_defs Progress Indicator/progress-indicator-gap (live-verified — marker-row to text-block gap)'
);

// Shared, non-component-scoped token — "radius-full" appears identically (raw value 9999) in the
// get_variable_defs output for both Table (node 5698:40875) and Pagination (node 7936:8133),
// confirming it's a genuine shared Figma primitive, not a per-component value. Used by
// Pagination's current-page underline indicator.
addToken(
  'fads-sys-radius-full',
  '9999px',
  'Figma MCP get_variable_defs radius-full (live-verified identically on both Table and Pagination component-set roots)'
);

// Official Horizontal Tab / Horizontal Tab List (CMP-09) tokens — verified live against the
// official component sets (Figma file J0xq7JG3JKshRDzrgAM7E0, Horizontal Tab node 30150:125017 —
// 68 variants: rtl x state[Default/Hovered/Pressed/Focused/Disabled] x size[Small/Medium/Large] x
// selected, plus a moreTab=Yes axis; Horizontal Tab List node 30150:125364 — 10 variants: rtl x
// size x tabIcons x flush) via Figma MCP get_metadata/get_design_context/get_variable_defs — see
// docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/HorizontalTab/VISUAL_COMPLIANCE_HORIZONTAL_TAB.md. Additive only —
// the pre-existing implementation used only generic shared tokens with no relationship to the
// official component (a bordered pill, not a bottom-underline tab). Icon color intentionally has
// no dedicated token: Figma's `Icon/icon-default`/`Icon/unselected-tab-icon`/
// `Global/icon-default-disabled` are byte-identical to this same table's text-color values, so the
// icon inherits `currentColor` from the text color instead of duplicating the token. Radius,
// font-weight, font-size, and line-height reuse the already-shared generic
// `--fads-sys-radius-sm`/`--fads-ref-font-weight-bold`/`--fads-ref-font-weight-medium`/
// `--fads-sys-typography-text-sm`/`--fads-sys-typography-line-height-sm` tokens (live-verified
// identical values, same reuse-over-duplication precedent as Table/Pagination's radius-full).
addToken(
  'fads-sys-tabs-gap',
  '4px',
  'Figma MCP get_variable_defs Tab/tab-button-gap (live-verified, all sizes)'
);
addToken(
  'fads-sys-tabs-md-padding-inline',
  '16px',
  'Figma MCP get_variable_defs Tab/horizontal-tab-md-button-h-padding'
);
addToken(
  'fads-sys-tabs-md-padding-block',
  '12px',
  'Figma MCP get_variable_defs Tab/horizontal-tab-md-button-v-padding'
);
addToken(
  'fads-sys-tabs-sm-padding-inline',
  '12px',
  'Figma MCP get_variable_defs Tab/horizontal-tab-sm-button-h-padding'
);
addToken(
  'fads-sys-tabs-sm-padding-block',
  '8px',
  'Figma MCP get_variable_defs Tab/horizontal-tab-sm-button-v-padding'
);
addToken(
  'fads-sys-tabs-lg-padding',
  '16px',
  'Figma MCP get_design_context p-[16px] uniform on the Large variant — reuses the same raw value as Tab/horizontal-tab-md-button-h-padding (live-verified, not a typo)'
);
addToken(
  'fads-sys-tabs-indicator-height',
  '3px',
  'Figma MCP get_design_context h-[3px] on the Selector (live-verified, every size)'
);
addToken(
  'fads-sys-tabs-indicator-color',
  getLightToken('Border', 'border-primary') ?? '#1b8354',
  'Light.Border.border-primary (selected indicator — Default/Hovered/Pressed/Focused)'
);
addToken(
  'fads-sys-tabs-indicator-color-disabled',
  getLightToken('Global', 'border-disabled') ?? '#9da4ae',
  'Light.Global.border-disabled'
);
addToken(
  'fads-sys-tabs-indicator-color-preview',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black (unselected-tab preview indicator shown on Hover/Pressed — live-verified, not the green selected color)'
);
addToken(
  'fads-sys-tabs-text-color-selected',
  getLightToken('Text', 'text-default') ?? '#161616',
  'Light.Text.text-default'
);
addToken(
  'fads-sys-tabs-text-color-unselected',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-tabs-text-color-disabled',
  getLightToken('Global', 'text-default-disabled') ?? '#9da4ae',
  'Light.Global.text-default-disabled'
);
addToken(
  'fads-sys-tabs-background-hover',
  getLightToken('Button', 'button-background-neutral-hovered') ?? '#f3f4f6',
  'Light.Button.button-background-neutral-hovered (unselected tab only)'
);
addToken(
  'fads-sys-tabs-background-pressed',
  getLightToken('Button', 'button-background-neutral-pressed') ?? '#e5e7eb',
  'Light.Button.button-background-neutral-pressed (unselected tab only)'
);
addToken(
  'fads-sys-tabs-focus-ring-inner-width',
  '3px',
  'Figma MCP get_design_context border-3 on the Focused variant (live-verified — same double-ring construction already Approved on Button)'
);
addToken(
  'fads-sys-tabs-focus-ring-inner-color',
  getLightToken('Border', 'border-black') ?? '#161616',
  'Light.Border.border-black'
);
addToken(
  'fads-sys-tabs-focus-ring-inner-radius',
  '2px',
  'Light.Radius.radius-xs (live-verified via get_variable_defs — no existing shared --fads-sys-radius-* token matches 2px, same precedent as Checkbox/Switch)'
);
addToken(
  'fads-sys-tabs-focus-ring-outer-width',
  '1px',
  'Figma MCP get_design_context border on the "Focus outline" overlay (live-verified)'
);
addToken(
  'fads-sys-tabs-focus-ring-outer-color',
  getLightToken('Border', 'border-white') ?? '#ffffff',
  'Light.Border.border-white'
);
addToken(
  'fads-sys-tabs-focus-ring-outer-inset',
  '-1px',
  'Figma MCP get_design_context inset-[-1px] on the "Focus outline" overlay (live-verified)'
);
addToken(
  'fads-sys-tabs-more-trigger-size',
  '32px',
  'Figma MCP get_design_context size-[32px] on the moreTab "Button" sub-part (live-verified, Medium only — see spec §5 Needs Confirmation)'
);
addToken(
  'fads-sys-tabs-list-divider-color',
  getLightToken('Border', 'border-neutral-primary') ?? '#d2d6db',
  'Light.Border.border-neutral-primary'
);
addToken(
  'fads-sys-tabs-list-divider-height',
  '3px',
  'Figma MCP get_design_context h-[3px] on the Tab List Divider (live-verified)'
);

// Official Modal (CMP-25) tokens — verified live against the official component set (Figma file
// J0xq7JG3JKshRDzrgAM7E0, node 30150:55001 — 4 variants: rtl x mobile) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see docs/FIGMA_MODAL_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Modal/VISUAL_COMPLIANCE_MODAL.md. Additive only. The container's own
// 8px flex-col gap and the body's extra 16px bottom padding reuse the already-shared generic
// --fads-sys-space-stack-sm/--fads-sys-space-inset-md tokens (live-verified identical values);
// the container radius reuses --fads-sys-radius-md; the featured-icon circle fill reuses
// --fads-sys-color-background-subtle (live-verified identical to Background/background-neutral-50)
// — only the values with no exact generic-scale match get their own token here.
addToken(
  'fads-sys-modal-padding',
  '24px',
  'Figma MCP get_variable_defs Model/modal-padding (live-verified, no exact match on the generic 4/8/16/32px space scale)'
);
addToken(
  'fads-sys-modal-shadow',
  '0 32px 64px -12px rgba(16, 24, 40, 0.14)',
  'Light.Shadows.shadow-3xl (live-verified via get_variable_defs: DROP_SHADOW offset (0,32)/radius 64/spread -12/#10182824)'
);
addToken(
  'fads-sys-modal-width',
  '600px',
  'Figma MCP get_design_context w-[600px] on the Mobile=False variant (live-verified; was 30rem/480px, unverified, in the pre-existing implementation)'
);
addToken(
  'fads-sys-modal-background',
  getLightToken('Background', 'background-white') ?? '#ffffff',
  'Light.Background.background-white (pure white — the pre-existing implementation used --fads-sys-color-surface-raised, which resolves to #fcfcfd/neutral-25, a subtly different off-white)'
);
addToken(
  'fads-sys-modal-title-color',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display'
);
addToken(
  'fads-sys-modal-body-color',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (was the generic --fads-sys-color-text-default in the pre-existing implementation)'
);

// Official Vertical Tab (CMP-09b) tokens — verified live against the official component set
// (Figma file J0xq7JG3JKshRDzrgAM7E0, node 418:99793 — 68 variants: rtl x state x size x
// selected) via Figma MCP get_metadata/get_design_context/get_variable_defs — see
// docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md. Vertical Tab is the
// same official Tab/* Figma variable family as the already-Approved Horizontal Tab — colors,
// hover/pressed/focus mechanics, and radius are byte-identical and reuse the existing
// --fads-sys-tabs-* tokens directly (no duplication). Only per-size padding and indicator inset
// have no match in Horizontal Tab's own scale and get new tokens here.
addToken(
  'fads-sys-tabs-vertical-sm-padding-inline',
  '6px',
  'Figma MCP get_variable_defs Tab/vertical-tab-sm-button-h-padding (live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-sm-padding-block',
  '2px',
  'Figma MCP get_variable_defs Tab/vertical-tab-sm-button-v-padding (live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-md-padding-inline',
  '12px',
  'Figma MCP get_variable_defs Tab/vertical-tab-md-button-h-padding (live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-md-padding-block',
  '6px',
  'Figma MCP get_variable_defs Tab/vertical-tab-md-button-v-padding (live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-lg-padding-inline',
  '12px',
  'Figma MCP get_design_context px-[12px] on the Large variant — reuses the same raw value as Tab/vertical-tab-md-button-h-padding (live-verified, not a typo)'
);
addToken(
  'fads-sys-tabs-vertical-lg-padding-block',
  '8px',
  'Figma MCP get_design_context py-[8px] on the Large variant (live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-indicator-inset-sm',
  '4px',
  'Figma MCP get_variable_defs spacing-xs (Small size indicator vertical inset, live-verified)'
);
addToken(
  'fads-sys-tabs-vertical-indicator-inset-md',
  '8px',
  'Figma MCP get_variable_defs spacing-md (Medium and Large size indicator vertical inset, live-verified identical for both)'
);

// Official Notification Toast (CMP-22, PAT-06 notification family) tokens — verified live
// against the official component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node 8680:37527 — 20
// variants: rtl x type[Neutral/Info/Critical-Error/Warning/Success] x mobile) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see
// docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md and
// reports/VISUAL_COMPLIANCE/Toast/VISUAL_COMPLIANCE_TOAST.md. Additive only, independently
// sourced per the no-cross-component-aliasing policy even where values coincide with Alert's own
// separately-scoped PAT-06-family tokens (e.g. the shadow matches Modal's own shadow-3xl).
addToken('fads-sys-toast-gap', '16px', 'Figma MCP get_variable_defs Notification/notification-gap');
addToken(
  'fads-sys-toast-padding-inline',
  '24px',
  'Figma MCP get_variable_defs Notification/notification-toast-desktop-h-padding'
);
addToken(
  'fads-sys-toast-padding-inline-mobile',
  '16px',
  'Figma MCP get_variable_defs Notification/notification-toast-mobile-h-padding'
);
addToken(
  'fads-sys-toast-padding-block',
  '16px',
  'Figma MCP get_variable_defs Notification/notification-toast-v-padding'
);
addToken('fads-sys-toast-radius', '8px', 'Light.radius-md (live-verified on the Toast root)');
addToken(
  'fads-sys-toast-background',
  getLightToken('Background', 'background-notification-white') ?? '#ffffff',
  'Light.Background.background-notification-white'
);
addToken(
  'fads-sys-toast-shadow',
  '0 32px 64px -12px rgba(16, 24, 40, 0.14)',
  'Light.Shadows.shadow-3xl (live-verified via get_variable_defs — same DROP_SHADOW effect independently sourced for Modal)'
);
addToken(
  'fads-sys-toast-width',
  '484px',
  'Figma MCP get_design_context w-[484px] on the Mobile=False variant (live-verified)'
);
addToken(
  'fads-sys-toast-width-mobile',
  '343px',
  'Figma MCP get_design_context w-[343px] on the Mobile=True variant (live-verified)'
);
addToken(
  'fads-sys-toast-header-gap',
  '12px',
  'Figma MCP get_variable_defs Global/spacing-lg (icon-to-text gap in the title row)'
);
addToken(
  'fads-sys-toast-text-gap',
  '4px',
  'Figma MCP get_variable_defs Global/spacing-xs (title-to-helper-text gap)'
);
addToken(
  'fads-sys-toast-title-color',
  getLightToken('Text', 'text-display') ?? '#1f2a37',
  'Light.Text.text-display'
);
addToken(
  'fads-sys-toast-description-color',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph'
);
addToken(
  'fads-sys-toast-icon-circle-size',
  '40px',
  'Figma MCP get_design_context size-[40px] on the Featured icon (live-verified, every tone)'
);
addToken(
  'fads-sys-toast-icon-bg-neutral',
  getLightToken('Background', 'background-neutral-50') ?? '#f9fafb',
  'Light.Background.background-neutral-50'
);
addToken(
  'fads-sys-toast-icon-neutral',
  getLightToken('Icon', 'icon-default') ?? '#161616',
  'Light.Icon.icon-default'
);
addToken(
  'fads-sys-toast-icon-bg-info',
  getLightToken('Icon', 'background-info-light') ?? '#eff8ff',
  'Light.Icon.background-info-light'
);
addToken(
  'fads-sys-toast-icon-info',
  getLightToken('Icon', 'icon-info') ?? '#175cd3',
  'Light.Icon.icon-info'
);
addToken(
  'fads-sys-toast-icon-bg-success',
  getLightToken('Icon', 'background-success-light') ?? '#ecfdf3',
  'Light.Icon.background-success-light'
);
addToken(
  'fads-sys-toast-icon-success',
  getLightToken('Icon', 'icon-success') ?? '#067647',
  'Light.Icon.icon-success'
);
addToken(
  'fads-sys-toast-icon-bg-warning',
  getLightToken('Icon', 'background-warning-light') ?? '#fffaeb',
  'Light.Icon.background-warning-light'
);
addToken(
  'fads-sys-toast-icon-warning',
  getLightToken('Icon', 'icon-warning') ?? '#b54708',
  'Light.Icon.icon-warning'
);
addToken(
  'fads-sys-toast-icon-bg-error',
  getLightToken('Icon', 'background-error-light') ?? '#fef3f2',
  'Light.Icon.background-error-light (live-sampled directly on the Critical/Error node)'
);
addToken('fads-sys-toast-actions-gap', '8px', 'Figma MCP get_variable_defs Button/button-menu-gap');
addToken(
  'fads-sys-toast-actions-padding-start',
  '40px',
  'Figma MCP get_variable_defs Global/spacing-5xl (live-verified — does not exactly align under the icon+gap text block, reproduced as sampled, see spec §5)'
);
addToken(
  'fads-sys-toast-stripe-thickness',
  '8px',
  'Figma MCP get_design_context w-[8px]/h-[8px] on the "Vertical line" (live-verified, both orientations)'
);
addToken(
  'fads-sys-toast-stripe-neutral',
  getLightToken('Background', 'background-neutral-200') ?? '#e5e7eb',
  'Light.Background.background-neutral-200'
);
addToken(
  'fads-sys-toast-stripe-info',
  getLightToken('Background', 'background-info') ?? '#1570ef',
  'Light.Background.background-info'
);
addToken(
  'fads-sys-toast-stripe-success',
  getLightToken('Background', 'background-success') ?? '#079455',
  'Light.Background.background-success (live-sampled directly on the Success node)'
);
addToken(
  'fads-sys-toast-stripe-warning',
  getLightToken('Background', 'background-warning') ?? '#dc6803',
  'Light.Background.background-warning'
);
addToken(
  'fads-sys-toast-stripe-error',
  getLightToken('Background', 'background-error') ?? '#d92d20',
  'Light.Background.background-error (live-sampled directly on the Critical/Error node)'
);

// Official Notification (CMP-24, PAT-06 notification family — page-level banner) tokens —
// verified live against the official component set (Figma file J0xq7JG3JKshRDzrgAM7E0, node
// 30150:56889 — 10 variants: rtl x style[Critical/Warning/Success/Info/Neutral]) via Figma MCP
// get_metadata/get_design_context/get_variable_defs — see docs/FIGMA_NOTIFICATION_SPECIFICATION.md
// and reports/VISUAL_COMPLIANCE/Notification/VISUAL_COMPLIANCE_NOTIFICATION.md. Additive only,
// independently sourced per the no-cross-component-aliasing policy even where several values
// coincide with Alert's/Toast's own separately-scoped PAT-06-family tokens. text/icon-glyph color
// is a single token per tone (live-verified byte-identical for both roles); the solid color
// covers both the icon-circle background and the accent line (also byte-identical per tone).
addToken(
  'fads-sys-notification-gap',
  '16px',
  'Figma MCP get_variable_defs Notification/notification-gap'
);
addToken(
  'fads-sys-notification-padding-inline',
  '24px',
  'Figma MCP get_variable_defs Notification/notification-h-padding + Global/spacing-3xl (live-verified identical 24px value, applied twice — container and inner row — see spec §5)'
);
addToken(
  'fads-sys-notification-padding-block',
  '8px',
  'Figma MCP get_variable_defs Notification/notification-alert-v-padding'
);
addToken(
  'fads-sys-notification-radius',
  '2px',
  'Light.Radius.radius-xs (live-verified on the Notification root)'
);
addToken(
  'fads-sys-notification-icon-size',
  '24px',
  'Figma MCP get_design_context size-[24px] on the FeedbackIcon (live-verified, every tone)'
);
addToken(
  'fads-sys-notification-icon-oncolor',
  getLightToken('Icon', 'icon-oncolor') ?? '#ffffff',
  'Light.Icon.icon-oncolor (white glyph on the solid tone-colored icon circle)'
);
addToken(
  'fads-sys-notification-tint-neutral',
  getLightToken('Background', 'background-neutral-50') ?? '#f9fafb',
  'Light.Background.background-neutral-50 (live-sampled directly on the Neutral node)'
);
addToken(
  'fads-sys-notification-text-neutral',
  getLightToken('Text', 'text-primary-paragraph') ?? '#384250',
  'Light.Text.text-primary-paragraph (no dedicated text-neutral token exists for this component, live-sampled directly on the Neutral node)'
);
addToken(
  'fads-sys-notification-solid-neutral',
  getLightToken('Background', 'background-black') ?? '#161616',
  'Light.Background.background-black (live-sampled directly on the Neutral node — the only neutral solid-dark token available)'
);
addToken(
  'fads-sys-notification-tint-info',
  getLightToken('Background', 'background-info-50') ?? '#eff8ff',
  'Light.Background.background-info-50'
);
addToken(
  'fads-sys-notification-text-info',
  getLightToken('Text', 'text-info') ?? '#175cd3',
  'Light.Text.text-info'
);
addToken(
  'fads-sys-notification-solid-info',
  getLightToken('Background', 'background-info') ?? '#1570ef',
  'Light.Background.background-info'
);
addToken(
  'fads-sys-notification-tint-success',
  getLightToken('Background', 'background-success-50') ?? '#ecfdf3',
  'Light.Background.background-success-50'
);
addToken(
  'fads-sys-notification-text-success',
  getLightToken('Text', 'text-success') ?? '#067647',
  'Light.Text.text-success'
);
addToken(
  'fads-sys-notification-solid-success',
  getLightToken('Background', 'background-success') ?? '#079455',
  'Light.Background.background-success'
);
addToken(
  'fads-sys-notification-tint-warning',
  getLightToken('Background', 'background-warning-50') ?? '#fffaeb',
  'Light.Background.background-warning-50'
);
addToken(
  'fads-sys-notification-text-warning',
  getLightToken('Text', 'text-warning') ?? '#b54708',
  'Light.Text.text-warning'
);
addToken(
  'fads-sys-notification-solid-warning',
  getLightToken('Background', 'background-warning') ?? '#dc6803',
  'Light.Background.background-warning'
);
addToken(
  'fads-sys-notification-tint-error',
  getLightToken('Background', 'background-error-50') ?? '#fef3f2',
  'Light.Background.background-error-50 (live-sampled directly on the Critical/Error node)'
);
addToken(
  'fads-sys-notification-text-error',
  getLightToken('Text', 'text-error') ?? '#b42318',
  'Light.Text.text-error (live-sampled directly on the Critical/Error node)'
);
addToken(
  'fads-sys-notification-solid-error',
  getLightToken('Background', 'background-error') ?? '#d92d20',
  'Light.Background.background-error (live-sampled directly on the Critical/Error node)'
);

// TocItem (registry "TOC Item", node 2962:37761) — reuses shared --fads-ref-*
// primitives directly where the live value matches exactly (indicator/hover/
// press/nesting-bar colors); mints its own sys tokens for values with no
// existing generic step (padding, radius, focus ring — same #161616 literal
// already used independently by Button/Card/Header/Link/Tag/TextInput).
addToken(
  'fads-sys-tocitem-padding-inline-start',
  '16px',
  'Figma MCP get_design_context spacing-xl'
);
addToken('fads-sys-tocitem-padding-inline-end', '8px', 'Figma MCP get_design_context spacing-md');
addToken('fads-sys-tocitem-padding-block', '6px', 'Figma MCP get_design_context spacing-sm');
addToken('fads-sys-tocitem-radius', '2px', 'Figma MCP get_design_context radius-xs');
addToken('fads-sys-tocitem-indicator-width', '3px', 'Figma MCP get_design_context Selector width');
addToken(
  'fads-sys-tocitem-nesting-slot',
  '16px',
  'Figma MCP get_design_context Nesteing indicator width'
);
addToken(
  'fads-sys-tocitem-nesting-bar-width',
  '2px',
  'Figma MCP get_design_context Selector width'
);
addToken(
  'fads-sys-tocitem-nesting-bar-color',
  'var(--fads-ref-neutral-300)',
  'Figma MCP get_design_context background-neutral-300 #d2d6db'
);
addToken(
  'fads-sys-tocitem-text-selected',
  '#161616',
  'Figma MCP get_design_context text/text-default'
);
addToken(
  'fads-sys-tocitem-text-unselected',
  'var(--fads-ref-neutral-700)',
  'Figma MCP get_design_context text/text-primary-paragraph #384250'
);
addToken(
  'fads-sys-tocitem-indicator-selected',
  'var(--fads-ref-primary-600)',
  'Figma MCP get_design_context background/background-primary #1b8354'
);
addToken(
  'fads-sys-tocitem-indicator-hover',
  'var(--fads-ref-neutral-400)',
  'Figma MCP get_design_context background-neutral-400 #9da4ae'
);
addToken(
  'fads-sys-tocitem-indicator-active',
  'var(--fads-ref-neutral-800)',
  'Figma MCP get_design_context background-neutral-800 #1f2a37'
);
addToken(
  'fads-sys-tocitem-bg-hover',
  'var(--fads-ref-neutral-100)',
  'Figma MCP get_design_context button-background-neutral-hovered #f3f4f6'
);
addToken(
  'fads-sys-tocitem-bg-active',
  'var(--fads-ref-neutral-200)',
  'Figma MCP get_design_context button-background-neutral-pressed #e5e7eb'
);
addToken(
  'fads-sys-tocitem-focus-ring',
  '#161616',
  'Figma MCP get_design_context border/border-black'
);

// Toc (registry "TOC", node 2962:38090) — the heading block above a stack of
// composed TocItems.
addToken('fads-sys-toc-gap', '8px', 'Figma MCP get_design_context outer gap');
addToken('fads-sys-toc-heading-gap', '8px', 'Figma MCP get_design_context Page Name gap');
addToken(
  'fads-sys-toc-eyebrow-color',
  'var(--fads-ref-neutral-700)',
  'Figma MCP get_design_context text/text-primary-paragraph #384250'
);
addToken(
  'fads-sys-toc-title-color',
  'var(--fads-ref-neutral-800)',
  'Figma MCP get_design_context text/text-display #1f2a37'
);
addToken(
  'fads-sys-toc-title-font-size',
  '20px',
  'Figma MCP get_design_context typo-size-text-xl (no existing xl step on the shared typography scale)'
);
addToken(
  'fads-sys-toc-title-line-height',
  '30px',
  'Figma MCP get_design_context line-heights-text-xl'
);

// HeaderSubMenuItem (registry "Header Sub-menu Item", Header file
// Sv0oWOS1SjWnwhQwdzRJIE, node 30150:148183) — deferred out of scope in the
// original Header pass, built now.
addToken('fads-sys-headersubmenuitem-gap', '16px', 'Figma MCP get_design_context outer gap');
addToken(
  'fads-sys-headersubmenuitem-padding-inline',
  '16px',
  'Figma MCP get_design_context spacing-xl'
);
addToken(
  'fads-sys-headersubmenuitem-padding-block',
  '8px',
  'Figma MCP get_design_context spacing-md'
);
addToken(
  'fads-sys-headersubmenuitem-content-gap',
  '12px',
  'Figma MCP get_design_context spacing-lg'
);
addToken('fads-sys-headersubmenuitem-row-gap', '8px', 'Figma MCP get_design_context spacing-md');
addToken(
  'fads-sys-headersubmenuitem-text',
  'var(--fads-ref-neutral-800)',
  'Figma MCP get_design_context text/text-display #1f2a37'
);
addToken(
  'fads-sys-headersubmenuitem-text-oncolor',
  '#ffffff',
  'Figma MCP get_design_context text/text-oncolor-primary'
);
addToken(
  'fads-sys-headersubmenuitem-helper-text',
  'var(--fads-ref-neutral-700)',
  'Figma MCP get_design_context text/text-primary-paragraph #384250'
);
addToken(
  'fads-sys-headersubmenuitem-bg-hover',
  'var(--fads-ref-neutral-100)',
  'Figma MCP get_design_context button-background-neutral-hovered #f3f4f6'
);
addToken(
  'fads-sys-headersubmenuitem-bg-active',
  'var(--fads-ref-neutral-200)',
  'Figma MCP get_design_context button-background-neutral-pressed #e5e7eb'
);
addToken(
  'fads-sys-headersubmenuitem-bg-hover-oncolor',
  'rgba(255, 255, 255, 0.2)',
  'Figma MCP get_design_context button-background-transparent-hovered'
);
addToken(
  'fads-sys-headersubmenuitem-bg-active-oncolor',
  'rgba(255, 255, 255, 0.4)',
  'Figma MCP get_design_context button-background-transparent-pressed'
);
addToken(
  'fads-sys-headersubmenuitem-focus-ring',
  '#161616',
  'Figma MCP get_design_context border/border-black'
);
addToken(
  'fads-sys-headersubmenuitem-focus-ring-oncolor',
  '#ffffff',
  'Figma MCP get_design_context border/border-white'
);
addToken(
  'fads-sys-headersubmenuitem-border',
  'var(--fads-ref-neutral-300)',
  'VISUALLY APPROXIMATED via get_screenshot on node 30150:148184 (Default state) — a real 1px card border is visible on every non-focused state (confirmed present in Default too, not just Hovered/Pressed) but neither get_design_context nor get_variable_defs surfaced its exact bound value on this node; matched to this codebase\'s own existing generic "subtle card border" token value (#d2d6db, already used identically by Card/Button). NEEDS CONFIRMATION.'
);
addToken(
  'fads-sys-headersubmenuitem-border-oncolor',
  'rgba(255, 255, 255, 0.24)',
  'VISUALLY APPROXIMATED via get_screenshot on node 30150:148248 (Default+onColor) — same extraction gap as the light-mode border; matched to the same translucent-white family already live-verified for the hover (0.2)/press (0.4) on-color backgrounds. NEEDS CONFIRMATION.'
);

// NavHeaderSubMenu (registry "Nav Header Sub-Menu", Header file
// Sv0oWOS1SjWnwhQwdzRJIE, node 30150:148877) — the multi-column mega-menu
// panel that composes HeaderSubMenuItem.
addToken('fads-sys-navheadersubmenu-bg', '#ffffff', 'Figma MCP get_design_context background-menu');
addToken(
  'fads-sys-navheadersubmenu-bg-oncolor',
  '#074d31',
  'Figma MCP get_design_context background-sa-flag (distinct from button-primary #1b8354)'
);
addToken(
  'fads-sys-navheadersubmenu-shadow',
  '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
  'Figma MCP get_design_context Shadows/shadow-lg'
);
addToken(
  'fads-sys-navheadersubmenu-padding-inline',
  '32px',
  'Figma MCP get_design_context spacing-4xl'
);
addToken(
  'fads-sys-navheadersubmenu-padding-block',
  '32px',
  'Figma MCP get_design_context spacing-4xl'
);
addToken(
  'fads-sys-navheadersubmenu-content-max-width',
  '1280px',
  'Figma MCP get_design_context Content max-width'
);
addToken(
  'fads-sys-navheadersubmenu-column-gap',
  '24px',
  'Figma MCP get_design_context spacing-3xl'
);
addToken(
  'fads-sys-navheadersubmenu-column-min-width',
  '240px',
  'Figma MCP get_design_context Section col min-width'
);
addToken(
  'fads-sys-navheadersubmenu-column-inner-gap',
  '12px',
  'Figma MCP get_design_context spacing-lg'
);
addToken('fads-sys-navheadersubmenu-nav-gap', '4px', 'Figma MCP get_design_context spacing-xs');
addToken(
  'fads-sys-navheadersubmenu-label-padding-inline',
  '16px',
  'Figma MCP get_design_context spacing-xl'
);
addToken(
  'fads-sys-navheadersubmenu-label-color',
  'var(--fads-ref-primary-600)',
  'Figma MCP get_design_context text/text-primary #1b8354'
);
addToken(
  'fads-sys-navheadersubmenu-label-color-oncolor',
  '#ffffff',
  'Figma MCP get_design_context text/text-oncolor-primary'
);
addToken(
  'fads-sys-navheadersubmenu-label-font-size',
  '18px',
  'Figma MCP get_design_context typo-size-text-lg (Figma\'s own "Ig" token name)'
);
addToken(
  'fads-sys-navheadersubmenu-label-line-height',
  '28px',
  'Figma MCP get_design_context line-heights-text-lg'
);

// ItemIcon (registry "Item Icon", node 30150:148742) — a genuinely distinct
// standalone component (corrected from an earlier incorrect
// NotApplicable/generic-slot treatment this same session), composed by
// HeaderSubMenuItem for its own icon slot.
addToken('fads-sys-itemicon-size', '24px', 'Figma MCP get_design_context icon size');
addToken('fads-sys-itemicon-contained-padding', '12px', 'Figma MCP get_design_context p-[12px]');
addToken(
  'fads-sys-itemicon-color',
  '#161616',
  "Figma MCP get_variable_defs Icon/icon-default (independently-sourced literal, matches many other components' own #161616 tokens)"
);
addToken(
  'fads-sys-itemicon-color-oncolor',
  '#ffffff',
  'Figma MCP get_design_context text-oncolor-primary convention (same white switch already verified for HeaderSubMenuItem)'
);
addToken(
  'fads-sys-itemicon-contained-bg',
  'var(--fads-ref-primary-50)',
  'Figma MCP get_design_context background-primary-50 #f3fcf6'
);
addToken(
  'fads-sys-itemicon-contained-bg-oncolor',
  'rgba(255, 255, 255, 0.1)',
  'Figma MCP get_design_context alpha-white-10'
);

// SecondNavHeader (registry "Second Nav Header", node 18800:8281) — the
// slim secondary nav bar above/below the primary Header.
addToken('fads-sys-secondnavheader-height', '40px', 'Figma MCP get_design_context bar height');
addToken(
  'fads-sys-secondnavheader-padding-inline',
  '32px',
  'Figma MCP get_design_context spacing-4xl'
);
addToken('fads-sys-secondnavheader-items-gap', '16px', 'Figma MCP get_design_context spacing-xl');
addToken('fads-sys-secondnavheader-item-gap', '4px', 'Figma MCP get_design_context spacing-xs');
addToken('fads-sys-secondnavheader-actions-gap', '6px', 'Figma MCP get_design_context spacing-sm');
addToken('fads-sys-secondnavheader-icon-size', '24px', 'Figma MCP get_design_context icon size');
addToken(
  'fads-sys-secondnavheader-bg-gray',
  'var(--fads-ref-neutral-100)',
  'Figma MCP get_design_context background-neutral-100 #f3f4f6'
);
addToken(
  'fads-sys-secondnavheader-bg-primary',
  'var(--fads-ref-primary-600)',
  'Figma MCP get_design_context background-primary #1b8354'
);
addToken(
  'fads-sys-secondnavheader-text-gray',
  'var(--fads-ref-neutral-700)',
  'Figma MCP get_design_context text/text-primary-paragraph #384250'
);
addToken(
  'fads-sys-secondnavheader-text-primary',
  '#ffffff',
  'Figma MCP get_design_context text/text-oncolor-primary'
);
addToken(
  'fads-sys-secondnavheader-divider-gray',
  'var(--fads-ref-neutral-300)',
  'Figma MCP get_design_context border/border-neutral-primary #d2d6db'
);
addToken(
  'fads-sys-secondnavheader-divider-primary',
  'rgba(255, 255, 255, 0.3)',
  'Figma MCP get_design_context alpha-white-30'
);

// ListItem (registry "List item", node 7850:3463) — a single <li>, meant to
// be composed inside a <ul>/<ol> (the upcoming "List" composite).
addToken('fads-sys-listitem-gap', '8px', 'Figma MCP get_design_context spacing-md');
addToken('fads-sys-listitem-indent-level2', '24px', 'Figma MCP get_design_context spacing-3xl');
addToken('fads-sys-listitem-icon-size', '16px', 'Figma MCP get_design_context Icon size');
addToken(
  'fads-sys-listitem-text-primary',
  'var(--fads-ref-primary-600)',
  'Figma MCP get_design_context text/text-primary #1b8354'
);
addToken(
  'fads-sys-listitem-text-neutral',
  '#161616',
  'Figma MCP get_design_context text/text-default'
);
addToken(
  'fads-sys-listitem-text-oncolor',
  '#ffffff',
  'Figma MCP get_design_context text/text-oncolor-primary'
);

// List (registry "List", node 7850:3506) — a thin semantic <ul>/<ol>
// wrapper composing already-Approved ListItems.
addToken(
  'fads-sys-list-gap',
  '0px',
  'Figma MCP get_design_context inter-item gap (confirmed zero)'
);

function getLightToken(group, key) {
  const token = lightData[group]?.[key];
  if (token?.$value?.hex) {
    return token.$value.hex.toLowerCase();
  }
  return null;
}

// Like getLightToken, but preserves alpha (resolves e.g. border-oncolor-transparent-30
// to an rgba() string rather than dropping its 30% alpha).
function getLightAlphaColor(group, key) {
  const value = lightData[group]?.[key]?.$value;
  if (value?.hex) {
    return value.alpha != null && value.alpha < 1
      ? toRgba(value.hex, value.alpha)
      : value.hex.toLowerCase();
  }
  return null;
}

const spacingMap = [
  ['fads-ref-space-0', 0],
  ['fads-ref-space-1', 4],
  ['fads-ref-space-2', 8],
  ['fads-ref-space-3', 12],
  ['fads-ref-space-4', 16],
  ['fads-ref-space-5', 24],
  ['fads-ref-space-6', 32],
  ['fads-ref-space-7', 40],
  ['fads-ref-space-8', 48],
  ['fads-ref-space-9', 64],
];

spacingMap.forEach(([name, px]) => {
  addToken(name, toRem(px), `Spacing.${px}px`);
});

const radiusMap = [
  ['fads-ref-radius-sm', 4],
  ['fads-ref-radius-md', 8],
  ['fads-ref-radius-lg', 16],
  ['fads-ref-radius-pill', 9999],
];
radiusMap.forEach(([name, px]) => addToken(name, `${px}px`, `Radius.${px}px`));

const fontFamily =
  data.Typography?.['Font Family']?.['font-family-display']?.$value ?? 'IBM Plex Sans Arabic';
addToken(
  'fads-ref-font-family-base',
  `'${fontFamily}', system-ui, -apple-system, 'Segoe UI', sans-serif`,
  'Typography.Font Family.font-family-display'
);
addToken('fads-ref-font-weight-regular', '400', 'Typography.Font Weight.font-weight-regular');
addToken('fads-ref-font-weight-medium', '500', 'Typography.Font Weight.font-weight-medium');
addToken('fads-ref-font-weight-semibold', '600', 'Typography.Font Weight.font-weight-semibold');
addToken('fads-ref-font-weight-bold', '700', 'Typography.Font Weight.font-weight-bold');
addToken('fads-ref-font-size-2xs', toRem(10), 'Typography.Size.text-size-10');
addToken('fads-ref-font-size-xs', toRem(12), 'Typography.Size.text-size-12');
addToken('fads-ref-font-size-sm', toRem(14), 'Typography.Size.text-size-14');
addToken('fads-ref-font-size-md', toRem(16), 'Typography.Size.text-size-16');
addToken('fads-ref-font-size-lg', toRem(18), 'Typography.Size.text-size-18');
addToken('fads-ref-font-size-xl', toRem(24), 'Typography.Size.text-size-24');
addToken('fads-ref-font-size-2xl', toRem(32), 'Typography.Size.text-size-32');
addToken('fads-ref-font-size-3xl', toRem(40), 'Typography.Size.text-size-40');
addToken('fads-ref-line-height-tight', '1.25', 'Typography.Line Hight.line-hight-20');
addToken('fads-ref-line-height-normal', '1.5', 'Typography.Line Hight.line-hight-24');
addToken('fads-ref-line-height-relaxed', '1.75', 'Typography.Line Hight.line-hight-28');

const semanticTokens = [
  // NOTE: the Figma "Neutral" scale starts at shade 25 (there is no shade 0 —
  // verified against references/figma/foundations/Values.tokens.json), so the
  // lightest adopted value is neutral-25, not an invented pure-white neutral-0.
  ['fads-sys-color-background-default', 'var(--fads-ref-neutral-25)'],
  ['fads-sys-color-background-subtle', 'var(--fads-ref-neutral-50)'],
  ['fads-sys-color-background-raised', 'var(--fads-ref-neutral-25)'],
  ['fads-sys-color-background-inverse', 'var(--fads-ref-neutral-900)'],
  ['fads-sys-color-text-default', 'var(--fads-ref-neutral-900)'],
  ['fads-sys-color-text-muted', 'var(--fads-ref-neutral-600)'],
  ['fads-sys-color-text-inverse', 'var(--fads-ref-neutral-25)'],
  ['fads-sys-color-text-link', 'var(--fads-ref-primary-600)'],
  ['fads-sys-color-border-default', 'var(--fads-ref-neutral-200)'],
  ['fads-sys-color-border-strong', 'var(--fads-ref-neutral-400)'],
  ['fads-sys-color-border-focus', 'var(--fads-ref-primary-600)'],
  ['fads-sys-color-primary', 'var(--fads-ref-primary-500)'],
  ['fads-sys-color-primary-strong', 'var(--fads-ref-primary-600)'],
  ['fads-sys-color-status-success', 'var(--fads-ref-success-500)'],
  ['fads-sys-color-status-error', 'var(--fads-ref-error-500)'],
  ['fads-sys-color-status-warning', 'var(--fads-ref-warning-500)'],
  ['fads-sys-color-status-information', 'var(--fads-ref-information-500)'],
  ['fads-sys-color-on-color-text', 'var(--fads-ref-neutral-25)'],
  ['fads-sys-color-on-color-border', 'var(--fads-ref-neutral-25)'],
  ['fads-sys-space-inset-xs', 'var(--fads-ref-space-1)'],
  ['fads-sys-space-inset-sm', 'var(--fads-ref-space-2)'],
  ['fads-sys-space-inset-md', 'var(--fads-ref-space-4)'],
  ['fads-sys-space-inset-lg', 'var(--fads-ref-space-6)'],
  ['fads-sys-space-stack-xs', 'var(--fads-ref-space-1)'],
  ['fads-sys-space-stack-sm', 'var(--fads-ref-space-2)'],
  ['fads-sys-space-stack-md', 'var(--fads-ref-space-4)'],
  ['fads-sys-space-stack-lg', 'var(--fads-ref-space-6)'],
  ['fads-sys-space-inline-sm', 'var(--fads-ref-space-2)'],
  ['fads-sys-space-inline-md', 'var(--fads-ref-space-4)'],
  ['fads-sys-space-inline-lg', 'var(--fads-ref-space-6)'],
  ['fads-sys-space-section-gap', 'var(--fads-ref-space-9)'],
  ['fads-sys-radius-sm', 'var(--fads-ref-radius-sm)'],
  ['fads-sys-radius-md', 'var(--fads-ref-radius-md)'],
  ['fads-sys-radius-lg', 'var(--fads-ref-radius-lg)'],
  ['fads-sys-radius-pill', 'var(--fads-ref-radius-pill)'],
  ['fads-sys-font-family-base', 'var(--fads-ref-font-family-base)'],
  ['fads-sys-typography-display-xl', 'var(--fads-ref-font-size-3xl)'],
  ['fads-sys-typography-display-lg', 'var(--fads-ref-font-size-2xl)'],
  ['fads-sys-typography-display-md', 'var(--fads-ref-font-size-xl)'],
  ['fads-sys-typography-text-lg', 'var(--fads-ref-font-size-lg)'],
  ['fads-sys-typography-text-md', 'var(--fads-ref-font-size-md)'],
  ['fads-sys-typography-text-sm', 'var(--fads-ref-font-size-sm)'],
  ['fads-sys-typography-text-xs', 'var(--fads-ref-font-size-xs)'],
  ['fads-sys-typography-text-2xs', 'var(--fads-ref-font-size-2xs)'],
  ['fads-sys-motion-duration-instant', '75ms'],
  ['fads-sys-motion-duration-fast', '150ms'],
  ['fads-sys-motion-duration-base', '225ms'],
  ['fads-sys-motion-duration-slow', '325ms'],
  ['fads-sys-motion-easing-standard', 'cubic-bezier(0.4, 0, 0.2, 1)'],
  ['fads-sys-motion-easing-entrance', 'cubic-bezier(0, 0, 0.2, 1)'],
  ['fads-sys-motion-easing-exit', 'cubic-bezier(0.4, 0, 1, 1)'],
  ['fads-sys-z-base', '0'],
  ['fads-sys-z-dropdown', '1000'],
  ['fads-sys-z-sticky-header', '1100'],
  ['fads-sys-z-drawer', '1200'],
  ['fads-sys-z-modal', '1300'],
  ['fads-sys-z-toast', '1400'],
  ['fads-sys-z-tooltip', '1500'],
  ['fads-sys-focus-ring-width', '2px'],
  ['fads-sys-focus-ring-offset', '2px'],
  ['fads-sys-focus-ring-color', 'var(--fads-sys-color-border-focus)'],
  ['fads-sys-control-gap', 'var(--fads-ref-space-2)'],
];
semanticTokens.forEach(([name, value]) => addToken(name, value, 'semantic-layer'));

const cssContent = [':root {', ...cssLines, '}', ''].join('\n');
const tsContent = `export const token = {\n  color: {\n    background: {\n      default: 'var(--fads-sys-color-background-default)',\n      subtle: 'var(--fads-sys-color-background-subtle)',\n      raised: 'var(--fads-sys-color-background-raised)',\n      inverse: 'var(--fads-sys-color-background-inverse)',\n    },\n    text: {\n      default: 'var(--fads-sys-color-text-default)',\n      muted: 'var(--fads-sys-color-text-muted)',\n      inverse: 'var(--fads-sys-color-text-inverse)',\n      link: 'var(--fads-sys-color-text-link)',\n    },\n    border: {\n      default: 'var(--fads-sys-color-border-default)',\n      strong: 'var(--fads-sys-color-border-strong)',\n      focus: 'var(--fads-sys-color-border-focus)',\n    },\n    primary: {\n      default: 'var(--fads-sys-color-primary)',\n      strong: 'var(--fads-sys-color-primary-strong)',\n    },\n    status: {\n      success: 'var(--fads-sys-color-status-success)',\n      error: 'var(--fads-sys-color-status-error)',\n      warning: 'var(--fads-sys-color-status-warning)',\n      information: 'var(--fads-sys-color-status-information)',\n    },\n    onColor: {\n      text: 'var(--fads-sys-color-on-color-text)',\n      border: 'var(--fads-sys-color-on-color-border)',\n    },\n    button: {\n      primary: {\n        default: 'var(--fads-sys-button-primary-bg-default)',\n        hover: 'var(--fads-sys-button-primary-bg-hover)',\n        pressed: 'var(--fads-sys-button-primary-bg-pressed)',\n        selected: 'var(--fads-sys-button-primary-bg-selected)',\n        focused: 'var(--fads-sys-button-primary-bg-focused)',\n      },\n    },\n  },\n  space: {\n    inset: {\n      xs: 'var(--fads-sys-space-inset-xs)',\n      sm: 'var(--fads-sys-space-inset-sm)',\n      md: 'var(--fads-sys-space-inset-md)',\n      lg: 'var(--fads-sys-space-inset-lg)',\n    },\n    stack: {\n      xs: 'var(--fads-sys-space-stack-xs)',\n      sm: 'var(--fads-sys-space-stack-sm)',\n      md: 'var(--fads-sys-space-stack-md)',\n      lg: 'var(--fads-sys-space-stack-lg)',\n    },\n    inline: {\n      sm: 'var(--fads-sys-space-inline-sm)',\n      md: 'var(--fads-sys-space-inline-md)',\n      lg: 'var(--fads-sys-space-inline-lg)',\n    },\n    sectionGap: 'var(--fads-sys-space-section-gap)',\n  },\n  radius: {\n    sm: 'var(--fads-sys-radius-sm)',\n    md: 'var(--fads-sys-radius-md)',\n    lg: 'var(--fads-sys-radius-lg)',\n    pill: 'var(--fads-sys-radius-pill)',\n  },\n  typography: {\n    fontFamily: 'var(--fads-sys-font-family-base)',\n    display: {\n      xl: 'var(--fads-sys-typography-display-xl)',\n      lg: 'var(--fads-sys-typography-display-lg)',\n      md: 'var(--fads-sys-typography-display-md)',\n    },\n    text: {\n      lg: 'var(--fads-sys-typography-text-lg)',\n      md: 'var(--fads-sys-typography-text-md)',\n      sm: 'var(--fads-sys-typography-text-sm)',\n      xs: 'var(--fads-sys-typography-text-xs)',\n    },\n  },\n  motion: {\n    duration: {\n      instant: 'var(--fads-sys-motion-duration-instant)',\n      fast: 'var(--fads-sys-motion-duration-fast)',\n      base: 'var(--fads-sys-motion-duration-base)',\n      slow: 'var(--fads-sys-motion-duration-slow)',\n    },\n    easing: {\n      standard: 'var(--fads-sys-motion-easing-standard)',\n      entrance: 'var(--fads-sys-motion-easing-entrance)',\n      exit: 'var(--fads-sys-motion-easing-exit)',\n    },\n  },\n  z: {\n    base: 'var(--fads-sys-z-base)',\n    dropdown: 'var(--fads-sys-z-dropdown)',\n    stickyHeader: 'var(--fads-sys-z-sticky-header)',\n    drawer: 'var(--fads-sys-z-drawer)',\n    modal: 'var(--fads-sys-z-modal)',\n    toast: 'var(--fads-sys-z-toast)',\n    tooltip: 'var(--fads-sys-z-tooltip)',\n  },\n} as const;\n\nexport type Token = typeof token;\n`;

const mapContent = {
  generatedAt: new Date().toISOString(),
  source: path.relative(repoRoot, inputPath).replace(/\\/g, '/'),
  tokens: Object.fromEntries(
    metaTokens.map((token) => [token.name, { value: token.value, source: token.source }])
  ),
};

fs.writeFileSync(path.join(outputDir, 'tokens.css'), cssContent);
fs.writeFileSync(path.join(outputDir, 'tokens.ts'), tsContent);
fs.writeFileSync(
  path.join(outputDir, 'token-map.json'),
  `${JSON.stringify(mapContent, null, 2)}\n`
);

console.log(`Generated ${metaTokens.length} tokens into ${path.relative(repoRoot, outputDir)}`);
