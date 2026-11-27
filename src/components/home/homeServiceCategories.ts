import type { CategoryEntry } from '@/lib/catalog/taxonomy';
import { buildServiceCategoryUrl } from '@/lib/services/serviceDiscoveryQuery';
import { serviceDiscoveryMenu } from '@/lib/services/serviceDiscoveryProjection';

/** Use the same published category grouping as the service marketplace. */
export function homeServiceCategories(categories: CategoryEntry[]) {
  const { primary, more } = serviceDiscoveryMenu(categories);
  return [...primary, ...more].map(category => ({
    ...category,
    path: buildServiceCategoryUrl(category.id),
  }));
}
