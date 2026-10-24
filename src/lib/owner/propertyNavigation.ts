/** URL context selects only from the current accessible list; it never grants access. */
export function accessiblePropertySelection(
  requested: string | null,
  properties: readonly { property_id: string }[],
  loading: boolean,
  fallback: 'first' | 'all',
): string {
  if (loading || properties.length === 0) return '';
  if (requested !== null) return properties.some(p => p.property_id === requested) ? requested : '';
  return fallback === 'all' ? 'all' : properties[0].property_id;
}

/** Only existing management destinations; an edited selection follows the current property. */
export function propertyContextBackPath(returnTo: string | null, propertyId: string): string {
  const selected = propertyId && propertyId !== 'all' ? propertyId : '';
  const fallback = selected ? `/mc/properties/${encodeURIComponent(selected)}` : '/mc/properties';
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return fallback;
  try {
    const url = new URL(returnTo, 'https://myuno.invalid');
    if (url.origin !== 'https://myuno.invalid') return fallback;
    if (url.pathname === '/mc/calendar') {
      if (!selected) return fallback;
      if (url.searchParams.get('property') !== selected) url.searchParams.delete('category');
      url.searchParams.set('property', selected);
      // Avoid recursive return chains between contextual pages.
      url.searchParams.delete('returnTo');
      return url.pathname + url.search;
    }
    if (url.pathname === '/mc' || url.pathname === '/mc/properties') return url.pathname + url.search;
    if (/^\/mc\/properties\/[^/]+$/.test(url.pathname) && selected) return fallback;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Request forms return only to a property still in the selectable collection.
 * No URL-provided destination can change the fixed management route. */
export function propertyRequestReturnPath(
  propertyId: string,
  properties: readonly { property_id: string }[],
  loading: boolean,
): string {
  const selected = accessiblePropertySelection(propertyId, properties, loading, 'first');
  return selected ? `/mc/properties/${encodeURIComponent(selected)}` : '/mc';
}
