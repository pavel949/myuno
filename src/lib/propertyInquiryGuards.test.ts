import { describe, expect, it } from 'vitest';
import { buildPropertyInquiryKey, shouldBlockPropertyInquirySubmission } from './propertyInquiryGuards';

describe('property inquiry guards', () => {
  it('builds the same key for the same user, property, dates, and guest count', () => {
    const input = { userId: 'user/1', propertyId: 'villa:2', checkIn: '2026-12-01', checkOut: '2026-12-05', guests: 2 };
    expect(buildPropertyInquiryKey(input)).toBe(buildPropertyInquiryKey({ ...input }));
    expect(buildPropertyInquiryKey(input)).toContain('user%2F1');
    expect(buildPropertyInquiryKey(input)).not.toBe(buildPropertyInquiryKey({ ...input, guests: 3 }));
  });

  it('blocks quoting while date pricing is loading or unavailable', () => {
    expect(shouldBlockPropertyInquirySubmission(true, false)).toBe(true);
    expect(shouldBlockPropertyInquirySubmission(false, true)).toBe(true);
    expect(shouldBlockPropertyInquirySubmission(false, false)).toBe(false);
  });
});
