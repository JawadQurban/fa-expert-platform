import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class values and drops falsy ones', () => {
    expect(cn('a', false, undefined, 'b', null, 'c')).toBe('a b c');
  });
});
