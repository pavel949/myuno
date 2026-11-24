import { APP_ROUTES } from '@/lib/config/routes';
import { propertyDetailHref, propertyRentalRateOptions, propertySaleAskingPrice, propertySupportsMode } from '@/lib/real-estate/propertyDetailIntent';
import { projectStartingPrice } from '@/lib/real-estate/publicNewbuildPresentation';

export type ExploreLayer = 'stay' | 'rent' | 'sale' | 'newbuild' | 'service' | 'experience';
export interface ExploreItem {
  id: string; name: string; nameRu: string; lat: number; lng: number; rating: number;
  priceFrom: number | null; image?: string; layer: ExploreLayer; approximate: boolean;
  routeId: string; href: string; currency: string | null; pricePeriod: string | null;
  district?: string; projectId?: string; propertyType?: string; bedrooms?: number;
  category?: string; locationKind: 'place' | 'meeting_point';
}
export type MapRecord = Record<string, unknown>;
const str = (v: unknown): string | undefined => typeof v === 'string' && v.trim() ? v.trim() : undefined;
const currencyCode = (v: unknown): string | null => {
  const value = str(v)?.toUpperCase();
  return value && /^[A-Z]{3}$/.test(value) ? value : null;
};
const amount = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
const strings = (v: unknown): string[] | null => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : null;
const number = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;

/** Missing coordinates never become a district centre or a fabricated pin. */
export function mapCoordinates(latValue: unknown, lngValue: unknown): { lat: number; lng: number } | null {
  const parse = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && v.trim()) ? Number(v) : NaN;
  const lat = parse(latValue), lng = parse(lngValue);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0) ? { lat, lng } : null;
}
function base(record: MapRecord, coords: { lat: number; lng: number }, name = 'Property', nameRu = 'Объект') {
  return { ...coords, name: str(record.title_en) ?? str(record.name_en) ?? str(record.name) ?? name,
    nameRu: str(record.title_ru) ?? str(record.name_ru) ?? str(record.title_en) ?? str(record.name_en) ?? str(record.name) ?? nameRu,
    rating: amount(record.rating) ?? 0, image: str(record.cover_image), approximate: false,
    routeId: String(record.id), district: str(record.district), locationKind: 'place' as const };
}
export function propertyExploreItems(record: MapRecord): ExploreItem[] {
  const coords = mapCoordinates(record.lat, record.lng);
  if (!coords || !str(record.id)) return [];
  // Commercial and land continue through their dedicated map catalogue layer.
  if (record.asset_class === 'commercial' || record.asset_class === 'land') return [];
  const intent = { listing_type: str(record.listing_type), listing_modes: strings(record.listing_modes), is_for_sale: record.is_for_sale === true };
  const rateSource = { price: number(record.price), price_period: str(record.price_period), currency: str(record.currency),
    price_per_night: number(record.price_per_night), price_per_month: number(record.price_per_month), price_per_year: number(record.price_per_year) };
  const metadata = { ...base(record, coords), projectId: str(record.project_id), propertyType: str(record.property_type), bedrooms: number(record.bedrooms) ?? undefined };
  const items: ExploreItem[] = [];
  if (propertySupportsMode(intent, 'buy')) {
    const currency = currencyCode(record.sale_price != null ? record.sale_currency : record.currency);
    items.push({ ...metadata, id: `sale-${record.id}`, layer: 'sale', href: propertyDetailHref(String(record.id), 'buy'),
      priceFrom: currency ? propertySaleAskingPrice({ ...intent, sale_price: number(record.sale_price), price: number(record.price) }) : null, currency, pricePeriod: 'total' });
  }
  if (propertySupportsMode(intent, 'rent')) {
    const options = propertyRentalRateOptions(rateSource);
    const modes = strings(record.tenancy_modes) ?? [];
    const short = modes.length ? modes.includes('short') : ['night', 'week'].includes(options.declaredPeriod ?? '') || options.rates.some(r => ['night', 'week'].includes(r.period));
    const long = modes.length ? modes.some(m => ['medium', 'long'].includes(m)) : ['month', 'year'].includes(options.declaredPeriod ?? '') || options.rates.some(r => ['month', 'year'].includes(r.period));
    for (const layer of [...(short ? ['stay' as const] : []), ...(long ? ['rent' as const] : [])]) {
      const rate = options.rates.find(r => (layer === 'stay' ? ['night', 'week'] : ['month', 'year']).includes(r.period));
      const currency = currencyCode(record.currency);
      items.push({ ...metadata, id: `${layer}-${record.id}`, layer, href: propertyDetailHref(String(record.id), 'rent', `tenancy=${layer === 'stay' ? 'short' : modes.includes('medium') ? 'medium' : 'long'}`),
        priceFrom: currency ? rate?.amount ?? null : null, currency, pricePeriod: rate?.period ?? null });
    }
  }
  return items;
}
export function projectExploreItem(record: MapRecord): ExploreItem | null {
  const coords = mapCoordinates(record.lat, record.lng) ?? mapCoordinates(record.location_lat, record.location_lng);
  if (!coords || !str(record.id)) return null;
  return { ...base(record, coords, 'Project', 'Проект'), id: `newbuild-${record.id}`, layer: 'newbuild',
    href: APP_ROUTES.OFFPLAN_DETAIL(String(record.id)), priceFrom: projectStartingPrice(record.price_from), currency: 'THB', pricePeriod: 'total',
    image: str(record.cover_image_url) ?? str(record.cover_image), projectId: String(record.id) };
}
export function experienceExploreItem(record: MapRecord): ExploreItem | null {
  // Publication alone does not make a known closed venue available. Unknown
  // operating status is not an open-now claim (that filter requires hours).
  if (['temporarily_closed', 'permanently_closed', 'closed'].includes(str(record.operating_status)?.toLowerCase() ?? '')) return null;
  const place = mapCoordinates(record.lat, record.lng);
  const coords = place ?? mapCoordinates(record.meeting_point_lat, record.meeting_point_lng);
  if (!coords || !str(record.id)) return null;
  const currency = currencyCode(record.currency);
  return { ...base(record, coords, 'Experience', 'Впечатление'), id: `experience-${record.id}`, layer: 'experience',
    href: APP_ROUTES.EXPERIENCE_DETAIL(String(record.id)), currency, priceFrom: currency ? amount(record.price) : null,
    pricePeriod: str(record.price_period) ?? str(record.price_per) ?? null, category: str(record.category),
    // Primary coordinates are a venue only when explicitly identified as fixed.
    // Backup meeting-point coordinates remain meeting points even for venues.
    locationKind: place && str(record.location_type) === 'fixed_venue' ? 'place' : 'meeting_point' };
}
