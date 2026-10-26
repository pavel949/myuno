/**
 * O(1) lookups into the static catalog SSOT (`taxonomy.ts`).
 * Used by cluster landing grids for icon + availability resolution.
 */
import { serviceDiscoveryCategories } from '@/lib/services/serviceDiscoveryProjection';
import { buildServiceCategoryUrl } from '@/lib/services/serviceDiscoveryQuery';
import type { LucideIcon } from 'lucide-react';
import { CATEGORIES, FLAT_SERVICES, type ServiceStatus } from './taxonomy';
import { CATALOG_SERVICE_SLUG_BY_LIFE_ID } from './serviceLifeIdentities.generated';

const SERVICE_BY_ID = Object.fromEntries(FLAT_SERVICES.map((s) => [s.id, s]));

export function getServiceCatalogStatus(serviceId: string): ServiceStatus | undefined {
  return SERVICE_BY_ID[serviceId]?.status;
}

export function getServiceIcon(serviceId: string, fallback: LucideIcon): LucideIcon {
  return SERVICE_BY_ID[serviceId]?.icon ?? fallback;
}

/** A catalogue ID is never a provider ID or a home-service function ID. */
export function resolveCatalogServiceDestination(serviceId: string):
  | { status: 'resolved'; href: string }
  | { status: 'unavailable'; reason: 'unknown-service' | 'inactive-service' } {
  // The existing LifeOS seed uses md5('service:' || slug)::uuid, not a provider ID.
  const lifeId = serviceId.toLowerCase();
  const slug = Object.prototype.hasOwnProperty.call(CATALOG_SERVICE_SLUG_BY_LIFE_ID, lifeId)
    ? CATALOG_SERVICE_SLUG_BY_LIFE_ID[lifeId] : serviceId;
  const service = Object.prototype.hasOwnProperty.call(SERVICE_BY_ID, slug) ? SERVICE_BY_ID[slug] : undefined;
  if (!service) return { status: 'unavailable', reason: 'unknown-service' };
  if (service.status !== 'available' && service.status !== 'info') {
    return { status: 'unavailable', reason: 'inactive-service' };
  }
  return { status: 'resolved', href: service.path };
}

/** Normalize only the seeded generic home entry; preserve other DB destinations. */
export function catalogServicePath(parentId: string, serviceId: string, appPath: string | null | undefined): string | undefined {
  if (parentId === 'cat-home-services' && serviceId === 'services'
    && (appPath === '/services' || appPath === '/discover/services')) {
    return buildServiceCategoryUrl(parentId);
  }
  return appPath ?? undefined;
}

/** Project an existing category; the public hub now consumes its canonical ID. */
export function projectCatalogCategory(categoryId: string) {
  const category = CATEGORIES.find(entry => entry.id === categoryId);
  if (!category) return { status: 'unavailable' as const, reason: 'unknown-category' as const, services: [] };
  if (!serviceDiscoveryCategories([category]).length) {
    return { status: 'unavailable' as const, reason: 'category-not-public' as const, services: [] };
  }
  return {
    status: 'resolved' as const,
    href: buildServiceCategoryUrl(category.id),
    services: category.services.filter(service => resolveCatalogServiceDestination(service.id).status === 'resolved'),
  };
}
