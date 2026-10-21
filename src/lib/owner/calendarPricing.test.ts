import { describe, it, expect } from 'vitest';
import { inclusivePriceRange, parseCalendarPrice, priceRangeSnapshot } from './calendarPricing';
describe('canonical calendar price contract', () => {
  it('converts inclusive UI selection to half-open civil nights across leap day', () => {
    expect(inclusivePriceRange('2028-02-28','2028-03-01')).toEqual({from:'2028-02-28',end:'2028-03-02',count:3});
  });
  it('rejects reversed, invalid, and oversized ranges', () => {
    for(const [a,b] of [['2026-02-30','2026-03-01'],['2026-03-01','2026-02-01'],['2026-01-01','2027-01-02']]) expect(() => inclusivePriceRange(a,b)).toThrow();
  });
  it('preserves native currency units without satang conversion', () => {
    expect(parseCalendarPrice('2500,50')).toBe(2500.5);
    for(const v of ['0','-1','Infinity','1e4','1.001','']) expect(() => parseCalendarPrice(v)).toThrow();
  });
  it('includes inventory and restriction fields in optimistic snapshots', () => {
    const rows = [{date:'2026-10-21',price_override:120,status:'blocked',booking_id:'booking',min_nights_override:3}];
    expect(priceRangeSnapshot(rows,'2026-10-21','2026-10-22',false)).toEqual({'2026-10-21':{price:120,minimum:3,status:'blocked',booking:'booking'}});
    expect(priceRangeSnapshot(rows,'2026-10-20','2026-10-21',false)).toEqual({});
    expect(priceRangeSnapshot([{date:'2026-10-21',price_override:250,stop_sell:true}],'2026-10-21','2026-10-22',true)['2026-10-21']).toMatchObject({price:250,stop:true});
  });
});
