/**
 * Short-stay booking has exactly two modes, both of which commit:
 *   instant — pay now, confirmed on payment;
 *   request — card hold now, answer inside a fixed window, released otherwise.
 * The server derives the mode from the stored listing flag; this mirror only
 * labels the UI and must never be sent as an instruction.
 */
export type BookingMode = 'instant' | 'request';

/** Mirrors supabase/functions/_shared/property-request-hold.ts. */
export const REQUEST_REPLY_WINDOW_MINUTES = 15;

export function resolveBookingMode(instantBooking: boolean | null | undefined): BookingMode {
  return instantBooking === true ? 'instant' : 'request';
}

type Lang = 'ru' | 'en';

export function bookingModeCopy(mode: BookingMode, language: string): { cta: string; note: string; badge: string } {
  const lang: Lang = language === 'ru' ? 'ru' : 'en';
  if (mode === 'instant') {
    return {
      ru: { cta: 'Забронировать', badge: 'Мгновенное бронирование', note: 'Бронь подтверждается сразу после оплаты.' },
      en: { cta: 'Book now', badge: 'Instant booking', note: 'Your booking is confirmed as soon as you pay.' },
    }[lang];
  }
  return {
    ru: {
      cta: 'Запросить бронь',
      badge: `Ответ за ${REQUEST_REPLY_WINDOW_MINUTES} минут`,
      note: `Блокируем предоплату на карте и отвечаем за ${REQUEST_REPLY_WINDOW_MINUTES} минут. Если ответа нет, блокировка снимается и деньги не списываются.`,
    },
    en: {
      cta: 'Request to book',
      badge: `Reply within ${REQUEST_REPLY_WINDOW_MINUTES} minutes`,
      note: `We place a hold on your card for the prepayment and reply within ${REQUEST_REPLY_WINDOW_MINUTES} minutes. With no reply the hold is released and nothing is charged.`,
    },
  }[lang];
}

export type RequestHoldStatus = 'awaiting_card' | 'authorized' | 'capturing' | 'captured' | 'declined' | 'expired';

export interface RequestHoldView {
  status: RequestHoldStatus;
  replyDeadlineAt: string | null;
}

const HOLD_STATUSES: readonly RequestHoldStatus[] = ['awaiting_card', 'authorized', 'capturing', 'captured', 'declined', 'expired'];

/** Read the hold a guest or operator may see from order metadata; unknown stays null. */
export function readRequestHoldView(metadata: unknown): RequestHoldView | null {
  if (typeof metadata !== 'object' || metadata === null || !('request_hold' in metadata)) return null;
  const hold = metadata.request_hold;
  if (typeof hold !== 'object' || hold === null || !('status' in hold)) return null;
  const status = HOLD_STATUSES.find(value => value === hold.status);
  if (!status) return null;
  const deadline = 'reply_deadline_at' in hold && typeof hold.reply_deadline_at === 'string' ? hold.reply_deadline_at : null;
  return { status, replyDeadlineAt: deadline };
}

/** Whole seconds left in the reply window; never negative, null when unknown. */
export function secondsUntilDeadline(replyDeadlineAt: string | null, now: number): number | null {
  if (!replyDeadlineAt) return null;
  const deadline = Date.parse(replyDeadlineAt);
  if (!Number.isFinite(deadline)) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export type RequestHoldPhase = 'awaiting_card' | 'awaiting_reply' | 'confirming' | 'confirmed' | 'declined' | 'expired' | 'unknown';

/**
 * One phase for guest and operator screens. The order status wins over the
 * hold marker: a booking is confirmed only when the order says so.
 */
export function requestHoldPhase(orderStatus: string | null | undefined, hold: RequestHoldView | null): RequestHoldPhase {
  if (orderStatus === 'confirmed') return 'confirmed';
  if (orderStatus === 'expired' || hold?.status === 'expired') return 'expired';
  if (orderStatus === 'cancelled' || hold?.status === 'declined') return 'declined';
  if (!hold) return 'unknown';
  if (hold.status === 'awaiting_card') return 'awaiting_card';
  if (hold.status === 'authorized') return 'awaiting_reply';
  return 'confirming';
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
