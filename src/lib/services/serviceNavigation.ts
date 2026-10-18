/** Return only to the catalogue, never an arbitrary/external URL. */
export function serviceCatalogueReturnTo(value: string | null): string {
  if (!value) return '/discover/services';
  const path = value.split('?')[0];
  return path === '/services' || path === '/discover/services' ? value : '/discover/services';
}
