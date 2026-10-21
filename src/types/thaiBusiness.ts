/**
 * Thai Business Layer (Local Services) — shared types & constants.
 *
 * These tables are NOT yet in the auto-generated `src/integrations/supabase/types.ts`
 * (regenerate via Supabase MCP after the migration is applied to prod). Until then,
 * queries cast at the supabase boundary through the helpers in
 * `src/hooks/thaiServices/*`. Do NOT hand-edit the generated types file.
 */

export type ThaiCategory =
  | 'car_rental'
  | 'bike_rental'
  | 'car_service'
  | 'car_wash'
  | 'cafe'
  | 'restaurant'
  | 'flowers'
  | 'delivery'
  | 'other_services';

export type ThaiDistrict = 'Patong' | 'Kata' | 'Karon' | 'Rawai' | 'Chalong' | 'Other';

export type ThaiOwnershipType = 'thai_owned' | 'russian_owned' | 'mixed';

export type ThaiPaymentMethod = 'cash' | 'card' | 'promptpay' | 'bank_transfer' | 'crypto';

export type ThaiServiceType = 'one_time' | 'by_time';

export type ThaiBookingStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';

export type ThaiPaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export type ChatLang = 'ru' | 'th' | 'en';

/** Per-day working hours, keyed by lowercase weekday (mon..sun). */
export type WorkingHours = Partial<Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  { open: string; close: string } | null
>>;

export interface ThaiBusiness {
  id: string;
  owner_id: string;
  provider_id: string | null;
  name_th: string;
  name_en: string | null;
  name_ru: string | null;
  slug: string;
  category: ThaiCategory;
  address: string | null;
  district: ThaiDistrict | null;
  lat: number | null;
  lng: number | null;
  working_hours: WorkingHours;
  phone: string | null;
  line_id: string | null;
  payment_methods: ThaiPaymentMethod[];
  ownership_type: ThaiOwnershipType | null;
  description_th: string | null;
  description_ru: string | null;
  logo_url: string | null;
  gallery_urls: string[];
  rating_avg: number | null;
  rating_count: number;
  is_active: boolean;
  landing_title_ru: string | null;
  landing_subtitle_ru: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThaiService {
  id: string;
  business_id: string;
  name_th: string;
  name_ru: string | null;
  description_th: string | null;
  description_ru: string | null;
  price_thb: number;
  type: ThaiServiceType;
  duration_minutes: number | null;
  options: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ThaiBooking {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string | null;
  date_time: string | null;
  status: ThaiBookingStatus;
  payment_status: ThaiPaymentStatus;
  total_amount_thb: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThaiChat {
  id: string;
  business_id: string;
  customer_id: string;
  last_message_at: string;
  created_at: string;
}

export interface ThaiChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  text_original: string;
  lang_original: ChatLang;
  text_translated: string;
  lang_target: ChatLang;
  is_image: boolean;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ThaiReview {
  id: string;
  business_id: string;
  customer_id: string;
  booking_id: string | null;
  rating: number;
  text: string | null;
  images: string[];
  created_at: string;
}

// ── Display metadata (trilingual; icon = lucide name) ────────────────────────
// Thai labels are machine-translated, pending native review (th.machine-pending.json).

export const THAI_CATEGORIES: { id: ThaiCategory; ru: string; en: string; th: string; icon: string }[] = [
  { id: 'car_rental', ru: 'Аренда авто', en: 'Car rental', th: 'เช่ารถยนต์', icon: 'car' },
  { id: 'bike_rental', ru: 'Аренда байков', en: 'Bike rental', th: 'เช่ามอเตอร์ไซค์', icon: 'bike' },
  { id: 'car_service', ru: 'Автосервис', en: 'Car service', th: 'ศูนย์บริการรถยนต์', icon: 'wrench' },
  { id: 'car_wash', ru: 'Автомойка', en: 'Car wash', th: 'ล้างรถ', icon: 'droplets' },
  { id: 'cafe', ru: 'Кафе', en: 'Cafe', th: 'คาเฟ่', icon: 'coffee' },
  { id: 'restaurant', ru: 'Рестораны', en: 'Restaurants', th: 'ร้านอาหาร', icon: 'utensils' },
  { id: 'flowers', ru: 'Цветы', en: 'Flowers', th: 'ดอกไม้', icon: 'flower' },
  { id: 'delivery', ru: 'Доставка', en: 'Delivery', th: 'บริการส่งของ', icon: 'package' },
  { id: 'other_services', ru: 'Другие услуги', en: 'Other services', th: 'บริการอื่น ๆ', icon: 'store' },
];

export const THAI_DISTRICTS: ThaiDistrict[] = ['Patong', 'Kata', 'Karon', 'Rawai', 'Chalong', 'Other'];

export const THAI_PAYMENT_METHODS: { id: ThaiPaymentMethod; ru: string; en: string; th: string }[] = [
  { id: 'cash', ru: 'Наличные', en: 'Cash', th: 'เงินสด' },
  { id: 'card', ru: 'Карта', en: 'Card', th: 'บัตร' },
  { id: 'promptpay', ru: 'PromptPay', en: 'PromptPay', th: 'พร้อมเพย์' },
  { id: 'bank_transfer', ru: 'Банковский перевод', en: 'Bank transfer', th: 'โอนผ่านธนาคาร' },
  { id: 'crypto', ru: 'Крипто', en: 'Crypto', th: 'คริปโต' },
];

export const THAI_OWNERSHIP_LABELS: Record<ThaiOwnershipType, { ru: string; en: string; th: string }> = {
  thai_owned: { ru: 'Тайский бизнес', en: 'Thai-owned', th: 'เจ้าของคนไทย' },
  russian_owned: { ru: 'Русский бизнес', en: 'Russian-owned', th: 'เจ้าของคนรัสเซีย' },
  mixed: { ru: 'Смешанное владение', en: 'Mixed', th: 'เจ้าของผสม' },
};

export function thaiCategoryMeta(id: ThaiCategory) {
  return THAI_CATEGORIES.find((c) => c.id === id) ?? THAI_CATEGORIES[THAI_CATEGORIES.length - 1];
}
