import 'i18next';
import type { resources, defaultNS } from './config';

/** Gives `t()` autocomplete + key checking against the Arabic resource shape. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['ar'];
  }
}
