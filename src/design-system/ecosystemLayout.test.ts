import { describe, expect, it } from 'vitest';
import { publicContentFrame, PUBLIC_CONTENT_LAYOUT, PUBLIC_CONTENT_WIDTH } from './ecosystemLayout';
describe('opt-in public width contracts', () => {
 it.each(['/discover/services','/services','/property/search/'])('uses catalogue frame for %s', path => expect(publicContentFrame(path)).toBe('catalogue'));
 it('widens business sections while preserving default marketing and form frames', () => {
  expect(publicContentFrame('/for-business')).toBe('business');
  expect(PUBLIC_CONTENT_WIDTH.catalogue).toBe(1760);
  expect(PUBLIC_CONTENT_LAYOUT.marketing).toContain('max-w-[1280px]');
  expect(PUBLIC_CONTENT_LAYOUT.business).toContain('max-w-[1536px]');
 });
 it.each(['/','/become-partner','/property/search/details','/property/one','/for-owners','/articles/one','/auth','/checkout'])('keeps bounded/default frame for %s', path => expect(publicContentFrame(path)).toBe('default'));
});
