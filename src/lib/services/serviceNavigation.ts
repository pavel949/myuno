/** Return only to public discovery or the catalogue, never an arbitrary/external URL. */
export function serviceCatalogueReturnTo(value: string | null): string {
  if (!value) return '/discover/services';
  const path = value.split('?')[0];
  return ['/', '/services', '/discover/services', '/discover', '/me/services'].includes(path) ? value : '/discover/services';
}

/** Restore only the catalogue URL allowlist; optional in-memory context is not an order payload. */
export function serviceCatalogueReturnContext(value: string | null, context: unknown) {
  const url = new URL(serviceCatalogueReturnTo(value), 'https://catalogue.invalid');
  const saved = context && typeof context === 'object' ? context as Record<string, unknown> : {};
  return {
    to: { pathname: url.pathname, search: url.search, hash: typeof saved.catalogueHash === 'string' && saved.catalogueHash.startsWith('#') ? saved.catalogueHash : '' },
    state: saved.catalogueState ?? null,
  };
}
