import { describe, expect, it } from 'vitest';
import { buildPropertyPayload } from './buildPayload';
import { initialFormData, initialOwnershipData } from './initialData';
import { validatePricing } from '@/components/owner/property-wizard/propertyValidation';

describe('property sale authoring', () => {
  it('maps sale currency without inventing a transaction', () => {
    const payload = buildPropertyPayload({ formData: { ...initialFormData, is_for_sale: true, sale_price: '5000000', sale_currency: 'thb' }, ownershipData: initialOwnershipData, activeOrgId: null, approvalStatus: 'draft' });
    expect(payload).toMatchObject({ is_for_sale: true, sale_price: 5000000, sale_currency: 'THB' });
  });
  it('requires sale price and currency only when sale is enabled', () => {
    expect(validatePricing({ price_per_night: '', min_stay_nights: 1, max_guests: 2, deposit_amount: '', is_for_sale: false, sale_price: '', sale_currency: '' })).toEqual([]);
    expect(validatePricing({ price_per_night: '', min_stay_nights: 1, max_guests: 2, deposit_amount: '', is_for_sale: true, sale_price: '', sale_currency: '' })).toEqual(expect.arrayContaining(['Sale price is required when the property is for sale', 'Sale currency is required when the property is for sale']));
  });
});
