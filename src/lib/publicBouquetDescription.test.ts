import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { publicBouquetDescription } from './publicBouquetDescription';

describe('legacy bouquet description publication guard', () => {
  it.each([
    'Premium roses. Freshness up to 10 days.',
    'Розы. Свежесть до 10 дней.',
    'Букет остаётся свежим до 10 дней.',
    'Букет остается свежим до 10 дней.',
    'Цветы остаются свежими до 10 дней.',
    'Flowers stay fresh for ten days',
    'Order by 2 PM for same-day delivery',
    'Доставка сегодня при заказе до 14:00',
    'Delivered in 1–3 hours',
    'Freshness is not guaranteed',
    'Доставку уточните у флориста',
  ])('withholds the entire claim-bearing field: %s', (value) => {
    expect(publicBouquetDescription(value)).toBeNull();
  });
  it.each([undefined, null, {}, '', '   '])('fails closed for absent/non-text input', (value) => {
    expect(publicBouquetDescription(value)).toBeNull();
  });
  it.each(['Pink roses in a round box.', 'Розовые розы в круглой коробке.'])('preserves neutral descriptions', (value) => {
    expect(publicBouquetDescription(value)).toBe(value);
  });
  it('does not claim to verify all possible supplier promises', () => {
    expect(publicBouquetDescription('A delightful gift.')).toBe('A delightful gift.');
  });
  it('routes both public description and SEO through the guard and omits urgency data', () => {
    const source = readFileSync('src/pages/flowers/BouquetDetail.tsx', 'utf8');
    expect(source).toContain('const publicDescription = publicBouquetDescription(');
    expect(source).toContain('content={publicDescription ||');
    expect(source).toContain('{publicDescription || (isRu');
    expect(source).not.toMatch(/urgency_badge|urgencyBadge/);
    expect(source).not.toContain('{isRu ? bouquet.description_ru : bouquet.description_en}');
  });
});
