/**
 * Shared, product-agnostic types for the Financial Academy foundation.
 * Domain entities mirror docs/CONTENT_MODEL.md §4 (kept generic — no
 * hackathon business logic lives here).
 */

/* ---- Localization & direction ------------------------------------------- */
export type Direction = 'rtl' | 'ltr';

/** Supported locales. Arabic is primary (docs DC-10). */
export type Locale = 'ar' | 'en';

export interface LocaleMeta {
  readonly code: Locale;
  readonly label: string;
  readonly dir: Direction;
}

/* ---- Theme --------------------------------------------------------------- */
/** Only the DGA light theme is defined; dark is out of scope (Q22). */
export type ThemeName = 'light';

/* ---- Generic result/async ----------------------------------------------- */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type Result<T, E = Error> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/* ---- Generic domain entity shapes (docs/CONTENT_MODEL.md §4) ------------- */
export interface Attachment {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface NavNode {
  readonly id: string;
  readonly labelKey: string;
  readonly href: string;
  readonly external?: boolean;
  readonly children?: readonly NavNode[];
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
