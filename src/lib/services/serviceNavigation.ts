/** Return only to public discovery or the catalogue, never an arbitrary/external URL. */
export function serviceCatalogueReturnTo(value: string | null): string {
  if (!value) return '/discover/services';
  const path = value.split('?')[0];
  return ['/', '/services', '/discover/services', '/discover', '/me/services'].includes(path) ? value : '/discover/services';
}
