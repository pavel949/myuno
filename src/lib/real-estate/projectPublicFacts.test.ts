import { describe, expect, it } from 'vitest';
import { knownProjectCount, knownProjectLifecycle, knownProjectProgress } from './projectPublicFacts';

describe('project public facts', () => {
  it.each([undefined, null, '', 'constructor', 'planned'])('keeps unknown lifecycle %s unknown', value => {
    expect(knownProjectLifecycle(value)).toBeNull();
  });
  it.each(['offplan', 'under_construction', 'completed'])('preserves explicit lifecycle %s', value => {
    expect(knownProjectLifecycle(value)).toBe(value);
  });
  it.each([undefined, null, '0', -1, 101, NaN, Infinity])('rejects invalid progress %s', value => {
    expect(knownProjectProgress(value)).toBeNull();
  });
  it.each([0, 35, 100])('preserves explicit progress %s', value => {
    expect(knownProjectProgress(value)).toBe(value);
  });
  it.each([undefined, null, '3', -1, 1.5, NaN, Infinity])('rejects invalid count %s', value => {
    expect(knownProjectCount(value)).toBeNull();
  });
  it('preserves an explicit zero without inventing a missing count', () => {
    expect(knownProjectCount(0)).toBe(0);
    expect(knownProjectCount(12)).toBe(12);
  });
});
