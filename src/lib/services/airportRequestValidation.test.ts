import { describe, expect, it } from 'vitest';
import type { TransferFormData } from '@/components/transport/booking-steps/types';
import { getTransferDetailIssues, getTransferRouteIssues, parseTransferDirection, phuketScheduledTime } from './airportRequestValidation';

const form: TransferFormData = {
  direction: 'to-airport',
  terminal: 'international',
  destinationAddress: 'Test hotel',
  selectedDestinationId: '',
  flightNumber: 'TG925',
  arrivalDate: '2028-02-29',
  arrivalTime: '06:30',
  passengers: '4',
  luggage: '0',
  vehicleType: 'sedan',
  name: 'Sample Traveller',
  phone: '+66 81 234 5678',
  email: '',
  notes: '',
  meetingSignName: '',
  paymentMethod: 'stripe',
};

const before = Date.parse('2028-02-28T22:00:00Z');

describe('airport request validation', () => {
  it('uses the Phuket civil date and rejects normalized invalid dates and times', () => {
    expect(phuketScheduledTime('2028-02-29', '06:30')).toBe(Date.parse('2028-02-28T23:30:00Z'));
    expect(phuketScheduledTime('2029-02-29', '06:30')).toBeUndefined();
    expect(phuketScheduledTime('2028-02-29', '24:00')).toBeUndefined();
    expect(phuketScheduledTime('2028-02-29', '6:30')).toBeUndefined();
  });

  it('accepts both supported directions and rejects unsupported links', () => {
    expect(getTransferRouteIssues(form)).toEqual([]);
    expect(getTransferRouteIssues({ ...form, direction: 'from-airport' })).toEqual([]);
    expect(parseTransferDirection('airport-to-airport')).toBeUndefined();
    expect(parseTransferDirection('return')).toBeUndefined();
    expect(getTransferRouteIssues({ ...form, terminal: 'unknown', destinationAddress: '  ' })).toEqual(['terminal', 'destinationAddress']);
  });

  it('validates departure and arrival details using the selected capacity', () => {
    expect(getTransferDetailIssues(form, 4, before)).toEqual([]);
    expect(getTransferDetailIssues({ ...form, direction: 'from-airport' }, 4, before)).toEqual([]);
    expect(getTransferDetailIssues(form, 3, before)).toEqual(['passengers']);
    expect(getTransferDetailIssues({ ...form, passengers: '1.3', luggage: '', phone: 'abc+66 81 234 5678', email: 'a@b' }, 4, before))
      .toEqual(['passengers', 'luggage', 'phone', 'email']);
    expect(getTransferDetailIssues({ ...form, flightNumber: 'unknown', luggage: '11' }, 4, Date.parse('2028-02-29T00:00:00Z')))
      .toEqual(['flightNumber', 'arrivalDate', 'luggage']);
  });
});
