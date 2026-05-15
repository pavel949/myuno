/**
 * O(1) lookups into the static catalog SSOT (`taxonomy.ts`).
 * Used by cluster landing grids for icon + availability resolution.
 */
import type { LucideIcon } from 'lucide-react';
import { FLAT_SERVICES, type ServiceStatus } from './taxonomy';

const SERVICE_BY_ID = Object.fromEntries(FLAT_SERVICES.map((s) => [s.id, s]));

export function getServiceCatalogStatus(serviceId: string): ServiceStatus | undefined {
  return SERVICE_BY_ID[serviceId]?.status;
}

export function getServiceIcon(serviceId: string, fallback: LucideIcon): LucideIcon {
  return SERVICE_BY_ID[serviceId]?.icon ?? fallback;
}
