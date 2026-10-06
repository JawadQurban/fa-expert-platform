/**
 * Typed accessors for FADS design tokens.
 *
 * These return `var(--fads-…)` references — the actual VALUES live in
 * tokens.css and are now sourced from the official Figma foundations export
 * referenced in docs/DESIGN_TOKENS.md and docs/TOKEN_INTEGRATION_REPORT.md.
 *
 * Usage keeps components free of hard-coded values (DESIGN_CONSTRAINTS.md DC-03):
 *   style={{ color: token.color.text.default, padding: token.space.inset.md }}
 */

const cssVar = (name: string): string => `var(--fads-${name})`;

export const token = {
  color: {
    background: {
      default: cssVar('sys-color-background-default'),
      subtle: cssVar('sys-color-background-subtle'),
      raised: cssVar('sys-color-background-raised'),
      inverse: cssVar('sys-color-background-inverse'),
    },
    text: {
      default: cssVar('sys-color-text-default'),
      muted: cssVar('sys-color-text-muted'),
      inverse: cssVar('sys-color-text-inverse'),
      link: cssVar('sys-color-text-link'),
    },
    border: {
      default: cssVar('sys-color-border-default'),
      strong: cssVar('sys-color-border-strong'),
      focus: cssVar('sys-color-border-focus'),
    },
    primary: {
      default: cssVar('sys-color-primary'),
      strong: cssVar('sys-color-primary-strong'),
    },
    /** RESERVED for status only (DC-05). Never use for decoration/category. */
    status: {
      success: cssVar('sys-color-status-success'),
      error: cssVar('sys-color-status-error'),
      warning: cssVar('sys-color-status-warning'),
      information: cssVar('sys-color-status-information'),
    },
    onColor: {
      text: cssVar('sys-color-on-color-text'),
      border: cssVar('sys-color-on-color-border'),
    },
  },
  space: {
    inset: {
      xs: cssVar('sys-space-inset-xs'),
      sm: cssVar('sys-space-inset-sm'),
      md: cssVar('sys-space-inset-md'),
      lg: cssVar('sys-space-inset-lg'),
    },
    stack: {
      xs: cssVar('sys-space-stack-xs'),
      sm: cssVar('sys-space-stack-sm'),
      md: cssVar('sys-space-stack-md'),
      lg: cssVar('sys-space-stack-lg'),
    },
    inline: {
      sm: cssVar('sys-space-inline-sm'),
      md: cssVar('sys-space-inline-md'),
      lg: cssVar('sys-space-inline-lg'),
    },
    sectionGap: cssVar('sys-space-section-gap'),
  },
  radius: {
    sm: cssVar('sys-radius-sm'),
    md: cssVar('sys-radius-md'),
    lg: cssVar('sys-radius-lg'),
    pill: cssVar('sys-radius-pill'),
  },
  typography: {
    fontFamily: cssVar('sys-font-family-base'),
    display: {
      xl: cssVar('sys-typography-display-xl'),
      lg: cssVar('sys-typography-display-lg'),
      md: cssVar('sys-typography-display-md'),
    },
    text: {
      lg: cssVar('sys-typography-text-lg'),
      md: cssVar('sys-typography-text-md'),
      sm: cssVar('sys-typography-text-sm'),
      xs: cssVar('sys-typography-text-xs'),
    },
  },
  motion: {
    duration: {
      instant: cssVar('sys-motion-duration-instant'),
      fast: cssVar('sys-motion-duration-fast'),
      base: cssVar('sys-motion-duration-base'),
      slow: cssVar('sys-motion-duration-slow'),
    },
    easing: {
      standard: cssVar('sys-motion-easing-standard'),
      entrance: cssVar('sys-motion-easing-entrance'),
      exit: cssVar('sys-motion-easing-exit'),
    },
  },
  z: {
    base: cssVar('sys-z-base'),
    dropdown: cssVar('sys-z-dropdown'),
    stickyHeader: cssVar('sys-z-sticky-header'),
    drawer: cssVar('sys-z-drawer'),
    modal: cssVar('sys-z-modal'),
    toast: cssVar('sys-z-toast'),
    tooltip: cssVar('sys-z-tooltip'),
  },
} as const;

export type Token = typeof token;
