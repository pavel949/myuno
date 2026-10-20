import { supabase } from '@/integrations/supabase/client';
import { getTranslations, type Language } from '@/i18n';
import { STORAGE_KEYS } from '@/lib/constants';
import { PROPERTY_BOOKING_RELEASE_FILTER } from '@/lib/propertyInventory';
import { BookingConflictError, type ConflictInput } from '@/lib/pms/bookingConflicts';
import {
  PMS_PROPERTY_COLUMNS, mapBlockRow, mapBookingRow, mapPropertyRow,
  type PmsBookingRow, type PmsPropertyRow,
} from '@/lib/pms/mapRows';

export type FamilyHolds = Omit<ConflictInput, 'stay' | 'ignoreBookingId'>;

async function loadFamilyRows(propertyId: string): Promise<PmsPropertyRow[]> {
  const columns: string = PMS_PROPERTY_COLUMNS;
  const { data: self, error } = await supabase.from('properties').select(columns).eq('id', propertyId).maybeSingle();
  if (error) throw error;
  const me = self as unknown as PmsPropertyRow | null;
  if (!me) return [];
  const rootId = me.parent_property_id ?? me.id;
  const { data: family, error: famError } = await supabase
    .from('properties')
    .select(columns)
    .or(`id.eq.${rootId},parent_property_id.eq.${rootId}`);
  if (famError) throw famError;
  return (family ?? []) as unknown as PmsPropertyRow[];
}

/** Loads held bookings + manual blocks on a property's family (villa and its room keys). */
export async function loadFamilyHolds(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  ignoreOrderId?: string,
): Promise<FamilyHolds | null> {
  const rows = (await loadFamilyRows(propertyId)).map(mapPropertyRow);
  const target = rows.find(r => r.id === propertyId);
  if (!target) return null;
  const ids = rows.map(r => r.id);
  const [bookingsRes, blocksRes] = await Promise.all([
    supabase.from('property_bookings')
      .select('id, order_id, property_id, check_in, check_out, status, source, guest_name')
      .in('property_id', ids)
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)
      .not('status', 'in', PROPERTY_BOOKING_RELEASE_FILTER),
    supabase.from('property_availability')
      .select('property_id, date')
      .in('property_id', ids)
      .eq('status', 'blocked')
      .gte('date', checkIn)
      .lt('date', checkOut),
  ]);
  if (bookingsRes.error) throw bookingsRes.error;
  if (blocksRes.error) throw blocksRes.error;
  return {
    target,
    keys: new Map(rows.map(r => [r.id, r] as const)),
    bookings: ((bookingsRes.data ?? []) as PmsBookingRow[])
      .filter(b => !ignoreOrderId || b.order_id !== ignoreOrderId)
      .map(mapBookingRow),
    blocks: (blocksRes.data ?? []).map(mapBlockRow),
  };
}

function currentLanguage(): Language {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (v === 'ru' || v === 'en' || v === 'th') return v;
  } catch {
    /* storage unavailable */
  }
  return 'ru';
}

const CONFLICT_MESSAGES: Record<string, { ru: string; en: string }> = {
  'pms.conflict.villaVsRoom': {
    ru: 'Нельзя забронировать виллу целиком: на эти даты уже занята одна из её комнат',
    en: 'Cannot book the whole villa: one of its rooms is already booked for these dates',
  },
  'pms.conflict.roomVsVilla': {
    ru: 'Нельзя забронировать комнату: вилла целиком уже занята на эти даты',
    en: 'Cannot book this room: the whole villa is already booked for these dates',
  },
  'pms.conflict.blocked': {
    ru: 'Выбранные даты заблокированы в календаре',
    en: 'The selected dates are blocked in the calendar',
  },
  'pms.conflict.sameKey': {
    ru: 'Выбранные даты пересекаются с существующим бронированием',
    en: 'The selected dates overlap an existing booking',
  },
};

function conflictKey(err: BookingConflictError): string {
  const kind = err.hits[0]?.kind;
  if (kind === 'villa_vs_room') return 'pms.conflict.villaVsRoom';
  if (kind === 'room_vs_villa') return 'pms.conflict.roomVsVilla';
  if (kind === 'manual_block') return 'pms.conflict.blocked';
  return 'pms.conflict.sameKey';
}

/** Bilingual, user-facing message for a family/key conflict. */
export function pmsConflictMessage(err: BookingConflictError, lang: Language = currentLanguage()): string {
  const key = conflictKey(err);
  const fallback = CONFLICT_MESSAGES[key];
  return getTranslations(lang)[key] ?? (lang === 'ru' ? fallback.ru : fallback.en);
}
