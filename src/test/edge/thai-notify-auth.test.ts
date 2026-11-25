import { describe, it, expect } from 'vitest';
import {
  canNotifyBooking,
  canNotifyMessage,
  canNotifyPartnerLead,
  isFresh,
  isThaiNotifyKind,
  THAI_NOTIFY_FRESH_WINDOW_MS,
  type ThaiNotifyCaller,
} from '../../../supabase/functions/_shared/thai-notify-auth.ts';

const NOW = Date.parse('2026-11-25T12:00:00Z');
const fresh = new Date(NOW - 60_000).toISOString();
const stale = new Date(NOW - THAI_NOTIFY_FRESH_WINDOW_MS - 1).toISOString();

const service: ThaiNotifyCaller = { mode: 'service' };
const anonymous: ThaiNotifyCaller = { mode: 'anonymous' };
const customer: ThaiNotifyCaller = { mode: 'user', userId: 'customer-1' };
const owner: ThaiNotifyCaller = { mode: 'user', userId: 'owner-1' };
const stranger: ThaiNotifyCaller = { mode: 'user', userId: 'stranger-1' };

const booking = (createdAt: string | null = fresh) => ({
  customerId: 'customer-1',
  businessOwnerId: 'owner-1',
  createdAt,
});

describe('thai-notify authorization', () => {
  it('accepts only known kinds', () => {
    expect(isThaiNotifyKind('new_booking')).toBe(true);
    expect(isThaiNotifyKind('partner_lead')).toBe(true);
    expect(isThaiNotifyKind('broadcast')).toBe(false);
    expect(isThaiNotifyKind(undefined)).toBe(false);
  });

  it('freshness rejects stale, missing and malformed timestamps', () => {
    expect(isFresh(fresh, NOW)).toBe(true);
    expect(isFresh(stale, NOW)).toBe(false);
    expect(isFresh(null, NOW)).toBe(false);
    expect(isFresh('not-a-date', NOW)).toBe(false);
    expect(isFresh(new Date(NOW + 10 * 60_000).toISOString(), NOW)).toBe(false);
  });

  it('service callers may send every kind', () => {
    expect(canNotifyBooking(service, 'new_booking', booking(stale), NOW)).toBe(true);
    expect(canNotifyBooking(service, 'booking_status', booking(), NOW)).toBe(true);
    expect(canNotifyMessage(service)).toBe(true);
    expect(canNotifyPartnerLead(service, { status: 'contacted', createdAt: stale }, NOW)).toBe(true);
  });

  it('new_booking: only the booking customer, only while fresh', () => {
    expect(canNotifyBooking(customer, 'new_booking', booking(), NOW)).toBe(true);
    expect(canNotifyBooking(customer, 'new_booking', booking(stale), NOW)).toBe(false);
    expect(canNotifyBooking(owner, 'new_booking', booking(), NOW)).toBe(false);
    expect(canNotifyBooking(stranger, 'new_booking', booking(), NOW)).toBe(false);
    expect(canNotifyBooking(anonymous, 'new_booking', booking(), NOW)).toBe(false);
  });

  it('booking_status: either participant, never a stranger or anonymous caller', () => {
    expect(canNotifyBooking(customer, 'booking_status', booking(stale), NOW)).toBe(true);
    expect(canNotifyBooking(owner, 'booking_status', booking(stale), NOW)).toBe(true);
    expect(canNotifyBooking(stranger, 'booking_status', booking(), NOW)).toBe(false);
    expect(canNotifyBooking(anonymous, 'booking_status', booking(), NOW)).toBe(false);
  });

  it('booking with unknown owner does not authorize a null user id match', () => {
    const orphan = { customerId: null, businessOwnerId: null, createdAt: fresh };
    expect(canNotifyBooking(stranger, 'booking_status', orphan, NOW)).toBe(false);
  });

  it('new_message is server-dispatched only', () => {
    expect(canNotifyMessage(customer)).toBe(false);
    expect(canNotifyMessage(owner)).toBe(false);
    expect(canNotifyMessage(anonymous)).toBe(false);
  });

  it('partner_lead: anonymous form may alert once for a fresh, untouched lead only', () => {
    expect(canNotifyPartnerLead(anonymous, { status: 'new', createdAt: fresh }, NOW)).toBe(true);
    expect(canNotifyPartnerLead(anonymous, { status: 'new', createdAt: stale }, NOW)).toBe(false);
    expect(canNotifyPartnerLead(anonymous, { status: 'contacted', createdAt: fresh }, NOW)).toBe(false);
    expect(canNotifyPartnerLead(customer, { status: 'new', createdAt: stale }, NOW)).toBe(false);
  });
});
