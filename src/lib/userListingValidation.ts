import { z } from 'zod';
import { UserListingDraft } from '@/types/userListing';

export const USER_LISTING_CURRENCIES = ['THB', 'USD', 'RUB'] as const;

export const userListingDraftSchema = z.object({
  title_en: z.string().trim().min(3),
  title_ru: z.string().optional(),
  description_en: z.string().trim().min(1),
  description_ru: z.string().optional(),
  category_slug: z.string().trim().min(1),
  subcategory: z.string().optional(),
  price: z.number().finite().positive(),
  currency: z.enum(USER_LISTING_CURRENCIES),
  is_negotiable: z.boolean(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'for_parts']),
  cover_image: z.string().trim().min(1),
  images: z.array(z.string().trim().min(1)).min(1),
  location: z.string().trim().min(1),
  contact_phone: z.string().trim().optional(),
  contact_whatsapp: z.string().trim().optional(),
  show_phone: z.boolean(),
}).superRefine((value, context) => {
  if (!value.contact_phone?.trim() && !value.contact_whatsapp?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contact_phone'],
      message: 'At least one contact method is required',
    });
  }
});

export type UserListingValidationResult =
  | { success: true; data: UserListingDraft }
  | { success: false; message: string };

export function validateUserListingDraft(draft: UserListingDraft): UserListingValidationResult {
  const result = userListingDraftSchema.safeParse(draft);
  if (result.success) return { success: true, data: result.data };

  const issue = result.error.issues[0];
  return {
    success: false,
    message: issue?.message || 'Please complete all required listing information',
  };
}

export function isUserListingStepComplete(draft: UserListingDraft, step: number): boolean {
  switch (step) {
    case 0:
      return Boolean(draft.title_en?.trim().length >= 3 && draft.description_en?.trim() && draft.category_slug?.trim());
    case 1:
      return Boolean(draft.condition);
    case 2:
      return Boolean(draft.images?.length && draft.cover_image?.trim());
    case 3:
      return Boolean(
        typeof draft.price === 'number' && Number.isFinite(draft.price) && draft.price > 0 &&
        USER_LISTING_CURRENCIES.includes(draft.currency as (typeof USER_LISTING_CURRENCIES)[number]),
      );
    case 4:
      return Boolean(
        draft.location?.trim() && (draft.contact_phone?.trim() || draft.contact_whatsapp?.trim()),
      );
    case 5:
      return validateUserListingDraft(draft).success;
    default:
      return false;
  }
}
