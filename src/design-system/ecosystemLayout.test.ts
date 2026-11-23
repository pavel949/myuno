import { describe, expect, it } from 'vitest';
import { publicContentFrame, PUBLIC_CONTENT_LAYOUT, PUBLIC_CONTENT_WIDTH, pageFrameClass } from './ecosystemLayout';
describe('opt-in public width contracts', () => {
 it.each(['/discover/services','/services','/property/search/','/property/one','/area/bang-tao'])('uses catalogue frame for %s', path => expect(publicContentFrame(path)).toBe('catalogue'));
 it('widens business sections while preserving default marketing and form frames', () => {
  expect(publicContentFrame('/for-business')).toBe('business');
  expect(PUBLIC_CONTENT_WIDTH.catalogue).toBe('var(--layout-width-catalogue)');
  expect(PUBLIC_CONTENT_LAYOUT.marketing).toContain('ds-frame-wide');
  expect(PUBLIC_CONTENT_LAYOUT.business).toContain('ds-frame-workspace');
 });
 it.each(['/yachts/boat','/transport/vehicle/car','/services/provider/guide','/experiences/park/'])('aligns opted-in detail with chrome: %s', path => {
  expect(publicContentFrame(path)).toBe('detail');
  expect(PUBLIC_CONTENT_LAYOUT.detail).toBe(pageFrameClass('detail'));
  expect(PUBLIC_CONTENT_WIDTH.detail).toBe('var(--public-width-detail)');
 });
 it('keeps legacy narrow and wide defaults available and compact form named', () => {
  expect(pageFrameClass('form')).toBe('ds-frame ds-frame-form');
  expect(pageFrameClass('narrow')).toBe('ds-frame ds-frame-article');
  expect(pageFrameClass('wide')).toBe(PUBLIC_CONTENT_LAYOUT.marketing);
 });
 it.each(['/yachts','/yachts/boat/booking','/transport/booking/car','/experiences/park/book','/services/booking/id','/profile','/','/become-partner','/property/search/details','/area/bang-tao/details','/for-owners','/articles/one','/auth','/checkout'])('keeps bounded/default frame for %s', path => expect(publicContentFrame(path)).toBe('default'));
});
