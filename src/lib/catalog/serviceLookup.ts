/**
 * O(1) lookups into the static catalog SSOT (`taxonomy.ts`).
 * Used by cluster landing grids for icon + availability resolution.
 */
import type { LucideIcon } from 'lucide-react';
import { CATEGORIES, FLAT_SERVICES, type ServiceStatus } from './taxonomy';

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
  const service = Object.prototype.hasOwnProperty.call(SERVICE_BY_ID, serviceId) ? SERVICE_BY_ID[serviceId] : undefined;
  if (!service) return { status: 'unavailable', reason: 'unknown-service' };
  if (service.status !== 'available' && service.status !== 'info') {
    return { status: 'unavailable', reason: 'inactive-service' };
  }
  return { status: 'resolved', href: service.path };
}

/** No mounted UI currently accepts arbitrary canonical category IDs.
 * Keep that limitation explicit; a cluster landing silently loses the filter.
 * Search may project the existing children without inventing a category route.
 */
export function projectCatalogCategory(categoryId: string) {
  const category = CATEGORIES.find(entry => entry.id === categoryId);
  return {
    status: 'unavailable' as const,
    reason: category ? 'category-destination-unresolved' as const : 'unknown-category' as const,
    services: category && (!category.status || category.status === 'available' || category.status === 'info')
      ? category.services.filter(service => resolveCatalogServiceDestination(service.id).status === 'resolved')
      : [],
  };
}
