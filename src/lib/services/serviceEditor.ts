import type { Database } from '@/integrations/supabase/types';

export interface ServiceEditorValues {
  provider_id: string; category_id: string; subcategory_id: string;
  name_en: string; name_ru: string; description_en: string; description_ru: string;
  price: string; currency: string; duration_minutes: string; lead_time_hours: string;
  images: string[]; is_active: boolean; approval_status: string; booking_flow: string;
}
type Payload = Database['public']['Tables']['services']['Insert'];
export function serviceEditorPayload(v: ServiceEditorValues): { ok: true; data: Payload } | { ok: false; reason: 'required' | 'price' | 'duration' | 'lead' } {
  if (!v.provider_id || !v.name_en.trim() || !v.currency.trim()) return { ok: false, reason: 'required' };
  const price = v.price.trim() === '' ? null : Number(v.price);
  const duration = v.duration_minutes.trim() === '' ? null : Number(v.duration_minutes);
  const lead = v.lead_time_hours.trim() === '' ? null : Number(v.lead_time_hours);
  if (price != null && (!Number.isFinite(price) || price < 0)) return { ok: false, reason: 'price' };
  if ((duration != null && (!Number.isInteger(duration) || duration <= 0 || duration > 1440)) || (v.booking_flow === 'instant' && duration == null)) return { ok: false, reason: 'duration' };
  if (lead != null && (!Number.isFinite(lead) || lead < 0)) return { ok: false, reason: 'lead' };
  return { ok: true, data: {
    provider_id: v.provider_id, category_id: v.subcategory_id || v.category_id || null,
    name_en: v.name_en.trim(), name_ru: v.name_ru.trim() || v.name_en.trim(),
    description_en: v.description_en.trim(), description_ru: v.description_ru.trim(),
    price, currency: v.currency.trim().toUpperCase(), duration_minutes: duration,
    lead_time_hours: lead, images: v.images, is_active: v.is_active,
    approval_status: v.approval_status, booking_flow: v.booking_flow,
  } };
}
