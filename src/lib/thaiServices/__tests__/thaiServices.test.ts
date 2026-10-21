import { describe, it, expect } from 'vitest';
import { slugifyThaiBusiness, ensureUniqueSlug } from '@/lib/thaiServices/slug';
import { canTransition, customerCanCancel } from '@/lib/thaiServices/booking';
import { thaiBusinessToMarker, thaiBusinessesToMarkers } from '@/lib/thaiServices/mapMarkerAdapter';
import { buildIcs } from '@/lib/thaiServices/ics';
import { chatTargetLang } from '@/lib/thaiServices/chat';
import type { ThaiBusiness } from '@/types/thaiBusiness';

const baseBusiness = (over: Partial<ThaiBusiness> = {}): ThaiBusiness => ({
  id: 'b1', owner_id: 'u1', provider_id: null,
  name_th: 'ร้านเช่ารถ', name_en: 'Rent Car', name_ru: 'Аренда авто',
  slug: 'rent-car', category: 'car_rental', address: 'Patong', district: 'Patong',
  lat: 7.9, lng: 98.3, working_hours: {}, phone: '66900000000', line_id: null,
  payment_methods: ['cash'], ownership_type: 'thai_owned',
  description_th: null, description_ru: null, logo_url: null, gallery_urls: [],
  rating_avg: 4.5, rating_count: 10, is_active: true,
  landing_title_ru: null, landing_subtitle_ru: null,
  created_at: '', updated_at: '', ...over,
});

describe('slugifyThaiBusiness', () => {
  it('transliterates Russian to latin', () => {
    expect(slugifyThaiBusiness('Аренда Авто')).toBe('arenda-avto');
  });
  it('lowercases and hyphenates latin', () => {
    expect(slugifyThaiBusiness('Rent A Car!!')).toBe('rent-a-car');
  });
  it('falls back to "biz" when nothing transliterates (e.g. pure Thai)', () => {
    expect(slugifyThaiBusiness('ร้านเช่ารถ')).toBe('biz');
  });
  it('never returns an empty string', () => {
    expect(slugifyThaiBusiness('')).toBe('biz');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns the base when free', () => {
    expect(ensureUniqueSlug('rent-car', [])).toBe('rent-car');
  });
  it('appends a suffix on collision', () => {
    const out = ensureUniqueSlug('rent-car', ['rent-car'], () => 'ab12');
    expect(out).toBe('rent-car-ab12');
  });
  it('keeps trying until a free slug is found', () => {
    let n = 0;
    const out = ensureUniqueSlug('x', ['x', 'x-a', 'x-b'], () => ['a', 'b', 'c'][n++]);
    expect(out).toBe('x-c');
  });
});

describe('booking transitions', () => {
  it('allows requested → confirmed/cancelled', () => {
    expect(canTransition('requested', 'confirmed')).toBe(true);
    expect(canTransition('requested', 'cancelled')).toBe(true);
  });
  it('allows confirmed → completed', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true);
  });
  it('forbids illegal jumps and terminal exits', () => {
    expect(canTransition('requested', 'completed')).toBe(false);
    expect(canTransition('completed', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });
  it('only lets a customer cancel while requested', () => {
    expect(customerCanCancel('requested')).toBe(true);
    expect(customerCanCancel('confirmed')).toBe(false);
  });
});

describe('map marker adapter', () => {
  it('maps a business to the unified marker shape', () => {
    const m = thaiBusinessToMarker(baseBusiness());
    expect(m).toMatchObject({ id: 'b1', lat: 7.9, lng: 98.3, title: 'Rent Car', titleRu: 'Аренда авто', rating: 4.5, badge: 'Patong' });
  });
  it('drops businesses without coordinates', () => {
    const markers = thaiBusinessesToMarkers([
      baseBusiness({ id: 'a', lat: 7.9, lng: 98.3 }),
      baseBusiness({ id: 'b', lat: null, lng: null }),
    ]);
    expect(markers.map((m) => m.id)).toEqual(['a']);
  });
});

describe('chatTargetLang', () => {
  it('translates Russian → Thai (owner reads TH)', () => {
    expect(chatTargetLang('ru')).toBe('th');
  });
  it('translates Thai/English → Russian (customer reads RU)', () => {
    expect(chatTargetLang('th')).toBe('ru');
    expect(chatTargetLang('en')).toBe('ru');
  });
});

describe('buildIcs', () => {
  it('produces a valid VEVENT with summary and times', () => {
    const ics = buildIcs({ title: 'Rent Car', start: new Date('2026-07-01T10:00:00Z'), durationMinutes: 90 });
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Rent Car');
    expect(ics).toContain('DTSTART:20260701T100000Z');
    expect(ics).toContain('DTEND:20260701T113000Z');
    expect(ics).toContain('END:VCALENDAR');
  });
  it('escapes commas in the summary', () => {
    const ics = buildIcs({ title: 'Rent, Car', start: new Date('2026-07-01T10:00:00Z') });
    expect(ics).toContain('SUMMARY:Rent\\, Car');
  });
});
