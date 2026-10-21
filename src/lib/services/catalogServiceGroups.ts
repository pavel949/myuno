import { CATEGORIES, type CategoryEntry } from '@/lib/catalog/taxonomy';

/** Group existing destinations only; this is navigation, not service inventory. */
export function groupCatalogDestinations<T extends { serviceId: string; path: string }>(items: T[]): { id: string; category: CategoryEntry | null; items: T[] }[] {
  const seen = new Set<string>();
  const unique = items.filter(item => {
    const key = `${item.serviceId}:${item.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const categoryOf = (item: T) => CATEGORIES.find(category => category.services.some(service => service.id === item.serviceId));
  const groups = CATEGORIES.map(category => ({
    id: category.id,
    category,
    items: unique.filter(item => categoryOf(item)?.id === category.id),
  })).filter(group => group.items.length > 0);
  const other = unique.filter(item => !categoryOf(item));
  return other.length ? [...groups, { id: 'other', category: null, items: other }] : groups;
}
