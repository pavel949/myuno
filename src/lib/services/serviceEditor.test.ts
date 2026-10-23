import { describe, expect, it } from 'vitest';
import { serviceEditorPayload, type ServiceEditorValues } from './serviceEditor';
const base: ServiceEditorValues = {
  provider_id: 'synthetic-provider', category_id: '', subcategory_id: '', name_en: ' Synthetic service ', name_ru: '',
  description_en: '', description_ru: '', price: '100', currency: 'EUR', duration_minutes: '60', lead_time_hours: '0',
  images: [], is_active: true, approval_status: 'pending', booking_flow: 'in_app_request',
};
describe('admin service persistence contract', () => {
  it('emits only real service fields and preserves price currency and review state', () => {
    const result = serviceEditorPayload(base);
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.data).toMatchObject({ name_en: 'Synthetic service', currency: 'EUR', price: 100, approval_status: 'pending', lead_time_hours: 0 });
    // These old form fields do not exist in the connected services schema.
    expect(result.data).not.toHaveProperty('max_capacity'); expect(result.data).not.toHaveProperty('is_featured');
  });
  it('can create a price-on-request service without inventing a zero quote', () => {
    const result = serviceEditorPayload({ ...base, price: '' });
    expect(result.ok && result.data.price).toBeNull();
  });
  it('preserves a genuine zero price and clears removed photos/descriptions', () => {
    const result = serviceEditorPayload({ ...base, price: '0', description_en: ' ', images: [] });
    expect(result.ok && result.data).toMatchObject({ price: 0, images: [], description_en: '' });
  });
  it.each(['-1', 'Infinity', 'bad'])('rejects invalid price %s before a backend call', price => expect(serviceEditorPayload({ ...base, price })).toEqual({ ok: false, reason: 'price' }));
  it.each(['0', '-1', 'NaN', '1.5', '1441'])('rejects invalid configured duration %s', duration_minutes => expect(serviceEditorPayload({ ...base, duration_minutes })).toEqual({ ok: false, reason: 'duration' }));
  it('requires an explicit duration for instant booking', () => expect(serviceEditorPayload({ ...base, duration_minutes: '', booking_flow: 'instant' })).toEqual({ ok: false, reason: 'duration' }));
  it('does not require slot duration for a request', () => expect(serviceEditorPayload({ ...base, duration_minutes: '' }).ok).toBe(true));
});
