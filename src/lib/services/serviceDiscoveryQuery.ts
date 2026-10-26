/** URL state for projections of the existing catalogue, never another inventory. */
const aliases: Record<string, string> = { 'pest-control': 'pest_control', 'ac-repair': 'ac', gardening: 'garden' };
export function readServiceDiscoveryQuery(params: URLSearchParams) {
  const rawCategory = params.get('category') ?? params.get('type') ?? '';
  return {
    query: params.get('q') ?? '',
    view: params.get('browse') === 'situations' ? 'situations' as const : 'categories' as const,
    category: rawCategory === 'all' ? '' : Object.prototype.hasOwnProperty.call(aliases, rawCategory) ? aliases[rawCategory] : rawCategory,
    // Exact public parent context for a home task; never an authorization scope.
    homeCategory: params.get('home') ?? '',
    situation: params.get('situation') === 'all' ? '' : params.get('situation') ?? '',
  };
}
export function updateServiceDiscoveryQuery(source: URLSearchParams, key: 'q' | 'category' | 'situation' | 'browse', value: string, homeCategory?: string) {
  const next = new URLSearchParams(source);
  if (value && value !== 'all') next.set(key, value); else next.delete(key);
  if (key === 'category') {
    next.delete('type');
    if (homeCategory) next.set('home', homeCategory); else next.delete('home');
  }
  // Switching views changes presentation only. Visible filters remain combined.
  return next;
}
export function clearServiceDiscoveryQuery(source: URLSearchParams) {
  const next = new URLSearchParams(source);
  ['q', 'category', 'home', 'type', 'sort', 'section', 'situation'].forEach(key => next.delete(key));
  return next;
}

/** Mounted category-aware destination shared by search, categories and landing links. */
export function buildServiceCategoryUrl(categoryId: string) {
  return `/discover/services?${new URLSearchParams({ category: categoryId })}`;
}
