export const token = {
  color: {
    background: {
      default: 'var(--fads-sys-color-background-default)',
      subtle: 'var(--fads-sys-color-background-subtle)',
      raised: 'var(--fads-sys-color-background-raised)',
      inverse: 'var(--fads-sys-color-background-inverse)',
    },
    text: {
      default: 'var(--fads-sys-color-text-default)',
      muted: 'var(--fads-sys-color-text-muted)',
      inverse: 'var(--fads-sys-color-text-inverse)',
      link: 'var(--fads-sys-color-text-link)',
    },
    border: {
      default: 'var(--fads-sys-color-border-default)',
      strong: 'var(--fads-sys-color-border-strong)',
      focus: 'var(--fads-sys-color-border-focus)',
    },
    primary: {
      default: 'var(--fads-sys-color-primary)',
      strong: 'var(--fads-sys-color-primary-strong)',
    },
    status: {
      success: 'var(--fads-sys-color-status-success)',
      error: 'var(--fads-sys-color-status-error)',
      warning: 'var(--fads-sys-color-status-warning)',
      information: 'var(--fads-sys-color-status-information)',
    },
    onColor: {
      text: 'var(--fads-sys-color-on-color-text)',
      border: 'var(--fads-sys-color-on-color-border)',
    },
    button: {
      primary: {
        default: 'var(--fads-sys-button-primary-bg-default)',
        hover: 'var(--fads-sys-button-primary-bg-hover)',
        pressed: 'var(--fads-sys-button-primary-bg-pressed)',
        selected: 'var(--fads-sys-button-primary-bg-selected)',
        focused: 'var(--fads-sys-button-primary-bg-focused)',
      },
    },
  },
  space: {
    inset: {
      xs: 'var(--fads-sys-space-inset-xs)',
      sm: 'var(--fads-sys-space-inset-sm)',
      md: 'var(--fads-sys-space-inset-md)',
      lg: 'var(--fads-sys-space-inset-lg)',
    },
    stack: {
      xs: 'var(--fads-sys-space-stack-xs)',
      sm: 'var(--fads-sys-space-stack-sm)',
      md: 'var(--fads-sys-space-stack-md)',
      lg: 'var(--fads-sys-space-stack-lg)',
    },
    inline: {
      sm: 'var(--fads-sys-space-inline-sm)',
      md: 'var(--fads-sys-space-inline-md)',
      lg: 'var(--fads-sys-space-inline-lg)',
    },
    sectionGap: 'var(--fads-sys-space-section-gap)',
  },
  radius: {
    sm: 'var(--fads-sys-radius-sm)',
    md: 'var(--fads-sys-radius-md)',
    lg: 'var(--fads-sys-radius-lg)',
    pill: 'var(--fads-sys-radius-pill)',
  },
  typography: {
    fontFamily: 'var(--fads-sys-font-family-base)',
    display: {
      xl: 'var(--fads-sys-typography-display-xl)',
      lg: 'var(--fads-sys-typography-display-lg)',
      md: 'var(--fads-sys-typography-display-md)',
    },
    text: {
      lg: 'var(--fads-sys-typography-text-lg)',
      md: 'var(--fads-sys-typography-text-md)',
      sm: 'var(--fads-sys-typography-text-sm)',
      xs: 'var(--fads-sys-typography-text-xs)',
    },
  },
  motion: {
    duration: {
      instant: 'var(--fads-sys-motion-duration-instant)',
      fast: 'var(--fads-sys-motion-duration-fast)',
      base: 'var(--fads-sys-motion-duration-base)',
      slow: 'var(--fads-sys-motion-duration-slow)',
    },
    easing: {
      standard: 'var(--fads-sys-motion-easing-standard)',
      entrance: 'var(--fads-sys-motion-easing-entrance)',
      exit: 'var(--fads-sys-motion-easing-exit)',
    },
  },
  z: {
    base: 'var(--fads-sys-z-base)',
    dropdown: 'var(--fads-sys-z-dropdown)',
    stickyHeader: 'var(--fads-sys-z-sticky-header)',
    drawer: 'var(--fads-sys-z-drawer)',
    modal: 'var(--fads-sys-z-modal)',
    toast: 'var(--fads-sys-z-toast)',
    tooltip: 'var(--fads-sys-z-tooltip)',
  },
} as const;

export type Token = typeof token;
