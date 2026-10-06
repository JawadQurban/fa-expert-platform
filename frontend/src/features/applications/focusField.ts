/**
 * Focus the first focusable control inside an `eh-field-*` wrapper — shared by
 * the error summary's in-page links and the page's focus-first-invalid
 * behavior (`05` EH-TP-05 §18).
 */
export function focusFieldTarget(targetId: string): void {
  document
    .getElementById(targetId)
    ?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')
    ?.focus();
}
