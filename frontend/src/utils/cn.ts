/**
 * Tiny className joiner. Filters falsy values so conditional classes read
 * cleanly: cn('base', isActive && 'active'). No external dependency.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
