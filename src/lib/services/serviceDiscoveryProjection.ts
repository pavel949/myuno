import type { CategoryEntry, LifeSituationEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { isHomeServiceCategoryId } from './publicServiceCategories';

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

/** Presentation order only: these are references to existing canonical entities. */
export function serviceDiscoveryMenu(categories: CategoryEntry[]) {
  const available = serviceDiscoveryCategories(categories);
  const home = available.find(category => isHomeServiceCategoryId(category.id));
  const primary = [home, ...['cat-transport', 'cat-tourism'].map(id => available.find(category => category.id === id))]
    .filter((category): category is CategoryEntry => Boolean(category));
  const more = available.filter(category => !primary.some(item => item.id === category.id))
    .sort((a, b) => Number(a.id === 'cat-emergency') - Number(b.id === 'cat-emergency'));
  const yacht = available.flatMap(category => category.services).find(service => service.id === 'yacht');
  return { primary, more, yacht };
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
