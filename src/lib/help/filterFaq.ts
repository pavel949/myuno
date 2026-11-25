/**
 * Client-side help-centre search (Design Bible K8: "search first").
 * Matches every whitespace-separated term against question + answer,
 * case-insensitively; categories with no remaining questions are dropped.
 */
export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqCategoryLike<T extends FaqEntry = FaqEntry> {
  items: T[];
}

export function filterFaqCategories<C extends FaqCategoryLike>(categories: readonly C[], query: string): C[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...categories];
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const haystack = `${item.q} ${item.a}`.toLocaleLowerCase();
        return terms.every((term) => haystack.includes(term));
      }),
    }))
    .filter((category) => category.items.length > 0);
}
