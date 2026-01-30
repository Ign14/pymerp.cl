import { describe, expect, it } from 'vitest';
import { canSelectMore, getEffectiveMin, getSelectedCount, isInvalidConfig, remainingToMin } from '../previewRules';

describe('previewRules', () => {
  it('counts selected items', () => {
    expect(getSelectedCount([])).toBe(0);
    expect(getSelectedCount(['a', 'b'])).toBe(2);
  });

  it('computes remaining selections to reach min', () => {
    expect(remainingToMin(1, 0)).toBe(1);
    expect(remainingToMin(2, 1)).toBe(1);
    expect(remainingToMin(2, 2)).toBe(0);
    expect(remainingToMin(0, 0)).toBe(0);
  });

  it('blocks selection when max is reached', () => {
    expect(canSelectMore(2, 2, false)).toBe(false);
    expect(canSelectMore(2, 1, false)).toBe(true);
  });

  it('allows deselecting when already selected', () => {
    expect(canSelectMore(1, 1, true)).toBe(true);
  });

  it('derives effective min when required', () => {
    expect(getEffectiveMin(0, true)).toBe(1);
    expect(getEffectiveMin(2, true)).toBe(2);
    expect(getEffectiveMin(0, false)).toBe(0);
  });

  it('flags invalid config when max is lower than min', () => {
    expect(isInvalidConfig(0, 1)).toBe(true);
    expect(isInvalidConfig(2, 1)).toBe(false);
  });
});
