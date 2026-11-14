import { describe, expect, it } from 'vitest';
import { isUserListingStepComplete, validateUserListingDraft } from './userListingValidation';
import { UserListingDraft } from '@/types/userListing';

const completeDraft: UserListingDraft = {
  title_en: 'Working phone',
  description_en: 'Used phone in good condition',
  category_slug: 'electronics',
  price: 12000,
  currency: 'THB',
  is_negotiable: true,
  condition: 'good',
  cover_image: 'https://example.com/phone.jpg',
  images: ['https://example.com/phone.jpg'],
  location: 'Phuket',
  contact_phone: '+66000000000',
  show_phone: false,
};

describe('user listing draft validation', () => {
  it('rejects incomplete drafts before an insert, including zero price', () => {
    const result = validateUserListingDraft({ ...completeDraft, price: 0 });
    expect(result.success).toBe(false);
  });

  it('requires a category, media, location, and at least one contact method', () => {
    expect(validateUserListingDraft({ ...completeDraft, category_slug: '' }).success).toBe(false);
    expect(validateUserListingDraft({ ...completeDraft, images: [], cover_image: '' }).success).toBe(false);
    expect(validateUserListingDraft({ ...completeDraft, location: '' }).success).toBe(false);
    expect(validateUserListingDraft({ ...completeDraft, contact_phone: '', contact_whatsapp: '' }).success).toBe(false);
  });

  it('gates each wizard step and accepts a complete final draft', () => {
    expect(isUserListingStepComplete({ ...completeDraft, description_en: '' }, 0)).toBe(false);
    expect(isUserListingStepComplete({ ...completeDraft, images: [], cover_image: '' }, 2)).toBe(false);
    expect(isUserListingStepComplete({ ...completeDraft, price: undefined }, 3)).toBe(false);
    expect(isUserListingStepComplete({ ...completeDraft, location: '' }, 4)).toBe(false);
    expect(isUserListingStepComplete(completeDraft, 5)).toBe(true);
  });
});
