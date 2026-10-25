import { describe, it, expect } from 'vitest';
import { salesAvailability, reconcileBuyerPrice, reconcileSalesAvailability, buyerRequestContext, OFFPLAN_VERTICAL } from './buyerContract';
import { getLeadVerticalById } from '@/lib/leadVerticalConfig';
describe('offplan buyer contract', () => {
  it('uses the configured canonical property vertical', () => { expect(OFFPLAN_VERTICAL).toBe('properties'); expect(getLeadVerticalById(OFFPLAN_VERTICAL)?.id).toBe(OFFPLAN_VERTICAL); });
  it.each([['reserved','reserved'], ['sold','sold'], ['blocked','unavailable'], ['not_for_sale','unavailable'], ['spa_signed','unavailable'], ['soft_hold','reserved'], [null,'unknown'], ['0','unknown']])('preserves %s semantics', (raw, expected) => expect(salesAvailability(raw)).toBe(expected));
  it('keeps project and physical unit separate from offer and commitment', () => { expect(buyerRequestContext('p','reserve_request','u')).toEqual({ schema_version: 1, project_id: 'p', unit_id: 'u', offer_id: null, intent: 'reserve_request', request_only: true }); });
});

it('never restores sold or reserved inventory through a parallel default available', () => { expect(reconcileSalesAvailability('sold', 'available')).toBe('sold'); expect(reconcileSalesAvailability('available', 'reserved')).toBe('reserved'); expect(reconcileSalesAvailability('sold', 'reserved')).toBe('unknown'); });

it('does not display conflicting or untyped prices', () => { expect(reconcileBuyerPrice(10,'THB',10000000).price).toBeNull(); expect(reconcileBuyerPrice(null,null,10000000)).toEqual({price:10000000,currency:'THB'}); expect(reconcileBuyerPrice(100,null,null).price).toBeNull(); });
