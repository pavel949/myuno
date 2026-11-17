import { describe, expect, it, vi } from 'vitest';
import type { Yacht } from '@/hooks/useYachts';
import { mapBouquetToCatalogCard, mapYachtToCatalogCard } from './catalogCardAdapters';
vi.mock('@/hooks/useExperiences', () => ({ formatDuration: () => '' }));
describe('honest catalogue presentation', () => {
  it('keeps descriptive packaging but never urgency and unverified popularity flags', () => {
    const card = mapBouquetToCatalogCard({ id:'flower', name_en:'Roses', price:1200, is_popular:true, scarcity_level:'high', social_proof_badge:'Customer favorite', box_type:'velvet_box' }, 'en', vi.fn());
    expect(card.badges).toHaveLength(1);
    expect(card.badges?.[0].text).toContain('Velvet');
    expect(card.socialProof).toBeUndefined();
    expect(card.price).toBe(1200);
  });
  it('displays the recorded yacht currency and period, rather than treating USD as THB', () => {
    const card = mapYachtToCatalogCard({id:'yacht',name_en:'Boat',currency:'USD',price_full_day:500,price_half_day:300} as Yacht,'en',vi.fn());
    expect(card.priceLabel).toBe('USD 300.00 /half day');
    expect(card.price).toBeUndefined();
  });
  it('does not invent a price from invalid tariffs', () => {
    const card = mapYachtToCatalogCard({id:'yacht',name_en:'Boat',currency:'THB',price_full_day:Infinity} as Yacht,'en',vi.fn());
    expect(card.priceLabel).toBe('Price on request');
  });
});
