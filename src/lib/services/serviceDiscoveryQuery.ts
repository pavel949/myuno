/** One URL contract for two views of the existing service catalogue. */
export function readServiceDiscoveryQuery(params: URLSearchParams) {
  const categoryAliases: Record<string, string> = { 'pest-control': 'pest_control', 'ac-repair': 'ac', gardening: 'garden' };
  const rawCategory = params.get('category') ?? params.get('type') ?? 'all';
  const category = categoryAliases[rawCategory] ?? rawCategory;
  return {
    query: params.get('q') ?? '',
    view: params.get('browse') === 'categories' ? 'categories' as const : 'situations' as const,
    section: params.get('section') || (category !== 'all' ? 'home' : 'all'),
    category, rawCategory,
  };
}

export function updateServiceDiscoveryQuery(source: URLSearchParams, key: 'q' | 'category' | 'section' | 'browse', value: string) {
  const next = new URLSearchParams(source);
  if (value && value !== 'all') next.set(key, value); else next.delete(key);
  if (key === 'category') {
    next.delete('type');
    if (value !== 'all') next.set('section', 'home');
  }
  if (key === 'section' && value !== 'home') {
    next.delete('category'); next.delete('type');
  }
  return next;
}

export function clearServiceDiscoveryQuery(source: URLSearchParams) {
  const next = new URLSearchParams(source);
  ['q', 'category', 'type', 'sort', 'section'].forEach(key => next.delete(key));
  return next;
}
