import { describe, expect, it } from 'vitest';
import { publicationPayload } from './developerProjectPublication';

describe('developer project publication transitions', () => {
  it('creates an explicit unpublished draft by default', () => {
    expect(publicationPayload(undefined, false)).toEqual({
      is_approved: false,
      public_listing_enabled: false,
      needs_review: false,
    });
  });

  it('preserves approval and public listing on ordinary edits', () => {
    expect(publicationPayload({ is_approved: true, public_listing_enabled: true, needs_review: false }, false)).toEqual({
      is_approved: true,
      public_listing_enabled: true,
      needs_review: false,
    });
  });

  it('uses the existing schema flags for submit-for-review', () => {
    expect(publicationPayload({ is_approved: true, public_listing_enabled: true }, true)).toEqual({
      is_approved: false,
      public_listing_enabled: false,
      needs_review: true,
    });
  });
});
