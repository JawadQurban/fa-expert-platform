import type { Ref } from 'react';

/**
 * Merge multiple React refs into one callback ref. Useful when a component
 * needs an internal ref (e.g. to set `indeterminate`) while still forwarding a
 * consumer ref.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
