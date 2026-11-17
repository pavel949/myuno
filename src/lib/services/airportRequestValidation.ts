import { toBangkokDateKey } from '@/lib/hotelDates';
import type { TransferDirection, TransferFormData } from '@/components/transport/booking-steps/types';

export const FLIGHT_NUMBER_PATTERN = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;
export const REQUEST_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHUKET_TIME_ZONE = 'UTC+7';

export function parseTransferDirection(value: unknown): TransferDirection | undefined {
  if (value === 'from-airport' || value === 'to-airport') return value;
}

export function phuketScheduledTime(date: string, time: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
  const timestamp = Date.parse(`${date}T${time}:00+07:00`);
  if (Number.isFinite(timestamp) && toBangkokDateKey(new Date(timestamp).toISOString()) === date) return timestamp;
}

export function isRequestPhone(value: string): boolean {
  const phone = value.trim();
  return /^\+?[\d\s().-]+$/.test(phone) && /^\d{8,15}$/.test(phone.replace(/\D/g, ''));
}

function isCount(value: string, min: number, max: number): boolean {
  return /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
}

export function getTransferRouteIssues(form: TransferFormData) {
  const fields = [];
  if (!parseTransferDirection(form.direction)) fields.push('direction' as const);
  if (form.terminal !== 'domestic' && form.terminal !== 'international') fields.push('terminal' as const);
  if (!form.destinationAddress.trim()) fields.push('destinationAddress' as const);
  return fields;
}

export function getTransferDetailIssues(form: TransferFormData, maxPassengers: number, now: number) {
  const fields = [];
  if (!FLIGHT_NUMBER_PATTERN.test(form.flightNumber.trim())) fields.push('flightNumber' as const);
  const scheduledTime = phuketScheduledTime(form.arrivalDate, form.arrivalTime);
  if (!form.arrivalDate || (form.arrivalTime && (scheduledTime === undefined || scheduledTime <= now))) fields.push('arrivalDate' as const);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.arrivalTime)) fields.push('arrivalTime' as const);
  if (!isCount(form.passengers, 1, maxPassengers)) fields.push('passengers' as const);
  if (!isCount(form.luggage, 0, 10)) fields.push('luggage' as const);
  if (!form.name.trim()) fields.push('name' as const);
  if (!isRequestPhone(form.phone)) fields.push('phone' as const);
  if (form.email.trim() && !REQUEST_EMAIL_PATTERN.test(form.email.trim())) fields.push('email' as const);
  return fields;
}
