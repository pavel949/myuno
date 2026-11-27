import { describe, expect, it } from 'vitest';
import { buildSearchLeadInput } from './searchLead';
const c = { name: ' Anna ', phone: '+66 80 000 0000' };
describe('buildSearchLeadInput', () => {
  it('uses a DB-admitted short-stay consultation and preserves date, guests and area', () => {
    const lead = buildSearchLeadInput('rent', new URLSearchParams('mode=rent&tenancy=short&district=rawai,kata&checkIn=2026-12-01&checkOut=2026-12-08&guests=3&f.priceLevel=1'), c);
    expect(lead).toMatchObject({ vertical_id: 'properties', request_type: 'vacation_rental', districts: ['rawai','kata'], guests_count: 3, preferred_dates: { check_in: '2026-12-01', check_out: '2026-12-08' }, name: 'Anna', budget_min: 0, budget_max: 3000, vertical_metadata: { search_kind:'rent', tenancy:'short', request_only:true, budget_basis:'nightly' } });
  });
  it.each(['medium','long'])('does not apply a nightly price band or request type to %s rental', tenancy => {
    const lead = buildSearchLeadInput('rent', new URLSearchParams({tenancy,'f.priceLevel':'2','f.district':'layan','f.propertyType':'villa,condo','f.guestsAtLeast':'4'}), c);
    expect(lead).toMatchObject({request_type:'property_consultation',districts:['layan'],property_types:['villa','condo'],guests_count:4,vertical_metadata:{tenancy,request_only:true}});
    expect(lead.budget_min).toBeUndefined();expect(lead.budget_max).toBeUndefined();
  });
  it('uses generic consultation without inventing dates, guests or tenancy on the landing', () => {
    const lead = buildSearchLeadInput('rent', new URLSearchParams('mode=rent'), c);
    expect(lead.request_type).toBe('property_consultation');
    expect(lead.preferred_dates).toBeUndefined();expect(lead.guests_count).toBeUndefined();expect(lead.vertical_metadata?.tenancy).toBeUndefined();
  });
  it.each(['checkIn=2026-12-08&checkOut=2026-12-01','checkIn=2027-02-30&checkOut=2027-03-08','checkIn=bad&checkOut=2027-03-08'])('does not invent invalid dates: %s', query => {
    expect(buildSearchLeadInput('rent',new URLSearchParams(query),c).preferred_dates).toBeUndefined();
  });
  it('purchase leads use the admitted consultation type, sale budget and no stay criteria', () => {
    const lead = buildSearchLeadInput('buy',new URLSearchParams('mode=buy&guests=4&checkIn=2026-12-01&checkOut=2026-12-08&types=villa&f.priceLevel=2'),c);
    expect(lead).toMatchObject({request_type:'property_consultation',property_types:['villa'],budget_min:5000000,budget_max:15000000,vertical_metadata:{search_kind:'buy',budget_basis:'asking_price',request_only:true}});
    expect(lead.guests_count).toBeUndefined();expect(lead.preferred_dates).toBeUndefined();
    expect(lead.vertical_metadata?.search).not.toHaveProperty('guests');
  });
  it('keeps the homepage sale cap and intersects the catalogue band', () => {
    const lead = buildSearchLeadInput('buy', new URLSearchParams('mode=buy&maxPrice=10000000&f.priceLevel=2'), c);
    expect(lead.budget_min).toBe(5000000); expect(lead.budget_max).toBe(10000000);
    expect(lead.vertical_metadata?.search).toMatchObject({ maxPrice: '10000000' });
  });
  it('retains conflicting search criteria without sending an inverted budget', () => {
    const lead = buildSearchLeadInput('buy', new URLSearchParams('mode=buy&maxPrice=10000000&f.priceLevel=3'), c);
    expect(lead.budget_min).toBeUndefined(); expect(lead.budget_max).toBeUndefined();
    expect(lead.vertical_metadata?.search).toMatchObject({ maxPrice: '10000000', 'f.priceLevel': '3' });
  });
  it.each(['-1', 'NaN', '1e7', ''])('does not invent a budget from invalid sale cap %s', maxPrice => {
    const lead = buildSearchLeadInput('buy', new URLSearchParams({ mode: 'buy', maxPrice }), c);
    expect(lead.budget_max).toBeUndefined(); expect(lead.vertical_metadata?.search).not.toHaveProperty('maxPrice');
  });
  it('keeps explicit clears and drops arbitrary or sensitive URL keys', () => {
    const lead=buildSearchLeadInput('rent',new URLSearchParams('district=&f.district=layan&types=condo&f.propertyType=villa&token=private&returnTo=%2Fadmin&f.secret=hidden&guests=invalid'),c);
    expect(lead.districts).toBeUndefined();expect(lead.property_types).toEqual(['condo']);expect(lead.guests_count).toBeUndefined();
    const search=lead.vertical_metadata?.search;
    expect(search).not.toHaveProperty('token');expect(search).not.toHaveProperty('returnTo');expect(search).not.toHaveProperty('f.secret');
  });
});
