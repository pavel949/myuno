/**
 * Canonical list of marketplace verticals covered by E2E loops.
 *
 * Source of truth: `src/lib/verticals.ts`. We mirror only the subset we
 * actually exercise in e2e (bookable + transfer + non-bookable smoke).
 */

export type ActorFlow = 'full_loop' | 'request_only' | 'smoke';

export interface E2EVerticalSpec {
  id: string;
  plural: string;
  table: string;
  labelEn: string;
  labelRu: string;
  bookable: boolean;
  /** Override route if discover chip path differs */
  discoverPath?: string;
  /** Override CTA matcher */
  ctaText?: RegExp;
  /** What level of actor coverage to run */
  flow: ActorFlow;
}

export const MARKETPLACE_VERTICALS: E2EVerticalSpec[] = [
  { id: 'property', plural: 'properties', table: 'properties', labelEn: 'Real Estate', labelRu: 'Недвижимость', bookable: true, flow: 'full_loop', ctaText: /book|reserve|забронировать|заявка/i },
  { id: 'yacht', plural: 'yachts', table: 'listings', labelEn: 'Yacht charter', labelRu: 'Яхт-чартер', bookable: true, flow: 'full_loop' },
  { id: 'vehicle', plural: 'vehicles', table: 'listings', labelEn: 'Car & bike rental', labelRu: 'Аренда авто', bookable: true, flow: 'full_loop' },
  { id: 'experience', plural: 'experiences', table: 'listings', labelEn: 'Experiences', labelRu: 'Впечатления', bookable: true, flow: 'full_loop' },
  { id: 'cleaning', plural: 'cleaning', table: 'listings', labelEn: 'Cleaning', labelRu: 'Клининг', bookable: true, flow: 'full_loop' },
  { id: 'babysitter', plural: 'babysitters', table: 'listings', labelEn: 'Childcare', labelRu: 'Няни', bookable: true, flow: 'full_loop' },
  { id: 'beauty', plural: 'salons', table: 'listings', labelEn: 'Beauty', labelRu: 'Красота', bookable: true, flow: 'full_loop' },
  { id: 'restaurant', plural: 'restaurants', table: 'listings', labelEn: 'Restaurants', labelRu: 'Рестораны', bookable: true, flow: 'full_loop' },
  { id: 'medical', plural: 'clinics', table: 'listings', labelEn: 'Medical', labelRu: 'Медицина', bookable: true, flow: 'full_loop' },
  { id: 'legal', plural: 'legal', table: 'listings', labelEn: 'Legal', labelRu: 'Юридические услуги', bookable: true, flow: 'full_loop' },
  { id: 'education', plural: 'education', table: 'listings', labelEn: 'Education', labelRu: 'Образование', bookable: true, flow: 'full_loop' },
  { id: 'fitness', plural: 'gyms', table: 'listings', labelEn: 'Fitness', labelRu: 'Фитнес', bookable: true, flow: 'full_loop' },
  { id: 'event', plural: 'events', table: 'events', labelEn: 'Events', labelRu: 'События', bookable: true, flow: 'full_loop' },
  { id: 'water_activity', plural: 'water_activities', table: 'listings', labelEn: 'Water Sports', labelRu: 'Водный спорт', bookable: true, flow: 'full_loop' },
  { id: 'pet_service', plural: 'pets', table: 'listings', labelEn: 'Pet Care', labelRu: 'Питомцы', bookable: true, flow: 'full_loop' },
  { id: 'flower', plural: 'flowers', table: 'listings', labelEn: 'Flowers', labelRu: 'Цветы', bookable: true, flow: 'full_loop' },
  { id: 'transfer', plural: 'transfers', table: 'listings', labelEn: 'Transfers', labelRu: 'Трансферы', bookable: true, flow: 'full_loop' },
  // Non-bookable: smoke only
  { id: 'insurance', plural: 'insurance', table: 'listings', labelEn: 'Insurance', labelRu: 'Страхование', bookable: false, flow: 'smoke' },
  { id: 'pharmacy', plural: 'pharmacies', table: 'listings', labelEn: 'Pharmacy', labelRu: 'Аптеки', bookable: false, flow: 'smoke' },
  { id: 'bank', plural: 'banks', table: 'listings', labelEn: 'Banking', labelRu: 'Банки', bookable: false, flow: 'smoke' },
];

export const BOOKABLE_VERTICALS = MARKETPLACE_VERTICALS.filter((v) => v.flow === 'full_loop');
export const SMOKE_VERTICALS = MARKETPLACE_VERTICALS.filter((v) => v.flow === 'smoke');

export const E2E_SEED_MARKER = 'e2e_seed';
export const E2E_RUN_ID = `e2e_${Date.now()}`;
