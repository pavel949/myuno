/**
 * Booking status state-machine for Thai bookings.
 *
 * Allowed transitions:
 *   requested → confirmed | cancelled
 *   confirmed → completed | cancelled
 *   completed → (terminal)
 *   cancelled → (terminal)
 */
import type { ThaiBookingStatus } from '@/types/thaiBusiness';

const TRANSITIONS: Record<ThaiBookingStatus, ThaiBookingStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransition(from: ThaiBookingStatus, to: ThaiBookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** A customer may only cancel while the request is still pending. */
export function customerCanCancel(status: ThaiBookingStatus): boolean {
  return status === 'requested';
}

export const THAI_BOOKING_STATUS_LABELS: Record<ThaiBookingStatus, { ru: string; en: string; th: string }> = {
  requested: { ru: 'Запрошено', en: 'Requested', th: 'ส่งคำขอแล้ว' },
  confirmed: { ru: 'Подтверждено', en: 'Confirmed', th: 'ยืนยันแล้ว' },
  cancelled: { ru: 'Отменено', en: 'Cancelled', th: 'ยกเลิกแล้ว' },
  completed: { ru: 'Завершено', en: 'Completed', th: 'เสร็จสิ้น' },
};
