import type { CategoryEntry, LifeSituationEntry, ServiceEntry } from '@/lib/catalog/taxonomy';

const visible = (status: string | undefined) => !status || status === 'available' || status === 'info';
export function serviceDiscoveryCategories(categories: CategoryEntry[]) {
  return categories.filter(category => !['cat-real-estate', 'cat-partner-portal'].includes(category.id) && visible(category.status))
    .map(category => ({ ...category, services: category.services.filter(service => visible(service.status) && service.path.startsWith('/') && !service.path.startsWith('//')) }))
    .filter(category => category.services.length > 0 || category.id === 'cat-home-services');
}
export function serviceDiscoverySituations(categories: CategoryEntry[], situations: LifeSituationEntry[]) {
  const codes = new Set(categories.flatMap(category => category.services.flatMap(service => service.situationCodes ?? [])));
  return situations.filter(situation => situation.isActive && codes.has(situation.code));
}
export function matchesServiceQuery(query: string, values: (string | undefined)[]) {
  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().trim();
  const text = values.filter(Boolean).map(value => normalize(value!)).join(' ');
  return normalize(query).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
export function projectServiceDiscovery(categories: CategoryEntry[], filters: { query: string; category: string; situation: string }) {
  const seen = new Set<string>();
  return categories.flatMap(category => {
    if (filters.category && category.id !== filters.category) return [];
    return category.services.filter(service => {
      if (!serviceMatchesSituation(service, filters.situation)) return false;
      return matchesServiceQuery(filters.query, [service.labelRu, service.labelEn, service.labelTh, category.labelRu, category.labelEn, category.labelTh]);
    }).flatMap(service => {
      // Same canonical service may be associated with multiple categories.
      if (seen.has(service.id)) return [];
      seen.add(service.id);
      return [{ service, category }];
    });
  });
}
export function serviceMatchesSituation(service: ServiceEntry, code: string) {
  return !code || Boolean(service.situationCodes?.includes(code));
}

/** The published provider layer has no category/situation IDs in its reader contract.
 * Share text matching, but never invent those associations.
 */
export function filterMarketplaceServices<T extends { name_en: string; name_ru?: string | null; provider?: { name: string } | null }>(items: T[], query: string): T[] {
  return items.filter(item => matchesServiceQuery(query, [item.name_en, item.name_ru ?? undefined, item.provider?.name]));
}
