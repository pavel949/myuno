import { describe, expect, it } from 'vitest';
import { publicContentFrame, PUBLIC_CONTENT_LAYOUT, PUBLIC_CONTENT_WIDTH } from './ecosystemLayout';
describe('opt-in public width contracts', () => {
 it.each(['/discover/services','/services','/property/search/','/property/one','/area/bang-tao'])('uses catalogue frame for %s', path => expect(publicContentFrame(path)).toBe('catalogue'));
 it('widens business sections while preserving default marketing and form frames', () => {
  expect(publicContentFrame('/for-business')).toBe('business');
  expect(PUBLIC_CONTENT_WIDTH.catalogue).toBe('var(--layout-width-catalogue)');
  expect(PUBLIC_CONTENT_LAYOUT.marketing).toContain('ds-frame-wide');
  expect(PUBLIC_CONTENT_LAYOUT.business).toContain('ds-frame-workspace');
 });
 it.each(['/','/become-partner','/property/search/details','/area/bang-tao/details','/for-owners','/articles/one','/auth','/checkout'])('keeps bounded/default frame for %s', path => expect(publicContentFrame(path)).toBe('default'));
});
