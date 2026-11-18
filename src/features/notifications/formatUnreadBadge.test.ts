import { describe, expect, it } from 'vitest';
import { formatUnreadBadge } from './messages';

describe('formatUnreadBadge', () => {
  it('returns null for zero or negative counts', () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(-1)).toBeNull();
  });

  it('shows the exact count up to 99', () => {
    expect(formatUnreadBadge(1)).toBe('1');
    expect(formatUnreadBadge(42)).toBe('42');
    expect(formatUnreadBadge(99)).toBe('99');
  });

  it('caps the badge at 99+', () => {
    expect(formatUnreadBadge(100)).toBe('99+');
    expect(formatUnreadBadge(500)).toBe('99+');
  });
});