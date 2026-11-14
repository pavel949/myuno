export type DeveloperProjectPublicationState = {
  is_approved?: boolean | null;
  public_listing_enabled?: boolean | null;
  needs_review?: boolean | null;
};

export function publicationPayload(
  existing: DeveloperProjectPublicationState | null | undefined,
  submitForReview: boolean,
): Pick<DeveloperProjectPublicationState, 'is_approved' | 'public_listing_enabled' | 'needs_review'> {
  if (submitForReview) {
    return {
      is_approved: false,
      public_listing_enabled: false,
      needs_review: true,
    };
  }

  // Ordinary edits preserve moderation/publication state. New projects are safe drafts.
  return {
    is_approved: existing?.is_approved ?? false,
    public_listing_enabled: existing?.public_listing_enabled ?? false,
    needs_review: existing?.needs_review ?? false,
  };
}
