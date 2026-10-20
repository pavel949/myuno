import type { ModerationItem } from './adminModeration';

const listingCollections: Record<string, string> = {
  yacht: '/admin/yachts', restaurant: '/admin/restaurants', clinic: '/admin/clinics',
  vehicle: '/admin/vehicles', experience: '/admin/experiences', education: '/admin/education',
  pet_service: '/admin/pets', cleaning: '/admin/cleaning', babysitter: '/admin/babysitters',
};

// Only a verified item-selection route may be labelled Review. Existing catalog
// and service screens ignore ?edit=, so their fallbacks remain collection links.
export function moderationReviewDestination(item: Pick<ModerationItem, 'id' | 'type' | 'provider_id' | 'vertical'>, returnTo?: string) {
  if (item.type === 'property') {
    const destination = moderationReturnPath(returnTo);
    return { review: `/admin/properties?edit=${encodeURIComponent(item.id)}${destination ? `&return=${encodeURIComponent(destination)}` : ''}`, collection: null };
  }
  if (item.type === 'service') return {
    review: null,
    collection: item.provider_id ? `/admin/services?provider=${encodeURIComponent(item.provider_id)}` : '/admin/services',
  };
  if (item.type === 'product') return { review: null, collection: '/admin/catalog' };
  return { review: null, collection: listingCollections[item.vertical ?? ''] ?? null };
}

// Return navigation is UI context only. Never accept arbitrary external/admin
// destinations from query text, or replay unrelated action parameters.
export function moderationReturnPath(value?: string | null): string | null {
  if (!value?.startsWith('/admin/operations?') && value !== '/admin/review' && !value?.startsWith('/admin/review?')) return null;
  const url = new URL(value, 'https://myuno.invalid');
  if (!['/admin/operations', '/admin/review'].includes(url.pathname) || (url.pathname === '/admin/operations' && url.searchParams.get('tab') !== 'moderation') || (url.pathname === '/admin/review' && url.searchParams.has('tab') && url.searchParams.get('tab') !== 'moderation')) return null;
  const params = new URLSearchParams({ tab: 'moderation' });
  for (const key of ['queue', 'q', 'type', 'category', 'page']) {
    const field = url.searchParams.get(key);
    if (field) params.set(key, field);
  }
  return `${url.pathname}?${params}`;
}
