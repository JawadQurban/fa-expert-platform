/**
 * Shared hooks. Provider-backed hooks are re-exported here so consumers have a
 * single import surface.
 */
export { useMediaQuery } from './useMediaQuery';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';
export { useFocusTrap } from './useFocusTrap';
export { useDirection, useIsRtl, useTheme } from '@ds/providers';
export { useLocale } from '@i18n/LocaleProvider';
