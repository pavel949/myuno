import { describe, expect, it } from 'vitest';
import { cleaningServicePrice, groupHomeServices, homeServiceCategoryLabel, servicePriceLabel } from './servicePresentation';
import { HOME_SERVICE_FUNCTIONS } from '@/lib/config/homeServiceFunctions';

describe('canonical service presentation', () => {
  it('groups every home function exactly once by its existing category and preserves item order', () => {
    const groups = groupHomeServices(HOME_SERVICE_FUNCTIONS);
    const rows = groups.flatMap(group => group.items);
    expect(rows).toHaveLength(HOME_SERVICE_FUNCTIONS.length);
    expect(new Set(rows.map(item => item.id)).size).toBe(rows.length);
    for (const group of groups) expect(group.items).toEqual(HOME_SERVICE_FUNCTIONS.filter(item => item.category === group.id));
  });
  it('uses the same localized category labels for filters and headings', () => {
    expect(homeServiceCategoryLabel('cleaning', 'ru')).toBe('Уборка');
    expect(homeServiceCategoryLabel('cleaning', 'en')).toBe('Cleaning');
    expect(homeServiceCategoryLabel('cleaning', 'th')).toBe('ทำความสะอาด');
  });
  it('retains unknown categories neutrally and deduplicates repeated IDs', () => {
    const rows = [{ id: 'first', category: 'cleaning' }, { id: 'other', category: 'future' }];
    expect(groupHomeServices([...rows, rows[0]])).toEqual([
      { id: 'cleaning', items: [rows[0]] }, { id: 'other', items: [rows[1]] },
    ]);
    expect(homeServiceCategoryLabel('other', 'en')).toBe('Other services');
  });
  it('retains explicit zero and actual currency without converting a missing price to free', () => {
    expect(servicePriceLabel(0, 'USD', 'en')).toBe('USD 0');
    expect(servicePriceLabel(1250, 'EUR', 'en')).toBe('EUR 1,250');
    expect(servicePriceLabel(null, 'THB', 'en')).toBe('Request a quote');
    expect(servicePriceLabel(100, null, 'en')).toBe('Request a quote');
    expect(servicePriceLabel(-1, 'THB', 'en')).toBe('Request a quote');
  });
  it('never labels a fixed cleaning price per hour when both fields exist', () => {
    expect(cleaningServicePrice({ price_fixed: 1200, price_per_hour: 300 })).toEqual({ price: 1200, hourly: false });
    expect(cleaningServicePrice({ price_fixed: 0, price_per_hour: 300 })).toEqual({ price: 0, hourly: false });
    expect(cleaningServicePrice({ price_fixed: null, price_per_hour: 300 })).toEqual({ price: 300, hourly: true });
    expect(cleaningServicePrice({})).toEqual({ price: undefined, hourly: false });
  });
});
