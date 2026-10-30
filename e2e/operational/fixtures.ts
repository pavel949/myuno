import type { Page } from '@playwright/test';

export const property = {
  id: '11111111-1111-4111-8111-111111111111', title_en: 'Synthetic Canvas', title_ru: 'Synthetic Canvas',
  listing_type: 'rent', listing_modes: ['rent'], currency: 'THB', price: 3000, price_period: 'month',
  price_per_night: null, tenancy_modes: ['long'], is_active: true, approval_status: 'approved',
  district: 'Bang Tao', images: [], amenities: [], bedrooms: 1, bathrooms: 1, max_guests: 2,
  cancellation_policy: 'strict', property_type: 'condo',
};

export async function isolate(page: Page, fixture: Record<string, unknown> = property) {
  const unexpected: string[] = [];
  await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === 'http://127.0.0.1:8098') return route.continue();
      if (url.origin !== 'http://127.0.0.1:54321') return route.abort();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      // Analytics is stubbed locally too; it is not a business mutation.
      if (url.pathname === '/rest/v1/analytics_events') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      const rpc = ['search_catalog', 'check_property_availability', 'get_property_unavailable_dates', 'get_all_currency_rates', 'get_property_date_prices'].some(name => url.pathname === `/rest/v1/rpc/${name}`);
      if (!['GET', 'HEAD'].includes(request.method()) && !rpc) {
        unexpected.push(`${request.method()} ${url.pathname}`);
        return route.abort();
      }
      const data = url.pathname.includes('public_property_catalog') ? (url.searchParams.get('id')?.startsWith('eq.') ? fixture : [fixture]) : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  });
  return unexpected;
}
