import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CanonicalPropertyForm } from './CanonicalPropertyForm';
import { propertyCommercialInitial } from '@/lib/propertyCommercialFields';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/owner/property-wizard/steps', async () => ({
  PricingStep: (await import('@/components/owner/property-wizard/steps/PricingStep')).PricingStep,
  BasicInfoStep: () => null, PhotosStep: () => null, LocationStep: () => null, UtilitiesStep: () => null, ServicesStep: () => null, AdminSettingsStep: () => null, HouseRulesSection: () => null, CancellationPolicySection: () => null,
}));
beforeEach(() => vi.clearAllMocks());
const source = { price: 90000, price_period: 'month', currency: 'USD', price_per_night: 3000, price_per_month: null, price_per_year: null, sale_price: 200000, sale_currency: 'EUR', listing_modes: ['rent', 'sale'], listing_type: 'rent', is_for_sale: true };
it('uses one amount control per stored field in the actual shared pricing step, with native currencies and no fixed FX preview', async () => {
  const saved = vi.fn(); render(<CanonicalPropertyForm mode="admin" initialData={{ title_en: 'Synthetic', ...propertyCommercialInitial(source) }} onSubmit={saved} />);
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pricing' }), { button: 0, ctrlKey: false });
  await screen.findByLabelText('Offer amount');
  expect(screen.getAllByLabelText('Price per night')).toHaveLength(1);
  expect(screen.getByLabelText('Offer amount')).toHaveValue('90000');
  expect(screen.getByLabelText('Price per night')).toHaveValue('3000');
  expect(screen.getByLabelText('Sale currency')).toHaveValue('EUR');
  expect(screen.queryByText('THB')).not.toBeInTheDocument();
  expect(screen.queryByText(/≈ \$/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Price per night'), { target: { value: '3200.25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0]).toMatchObject({ price: 90000, price_period: 'month', currency: 'USD', price_per_night: '3200.25', sale_price: '200000', sale_currency: 'EUR', listing_modes: ['rent', 'sale'], listing_type: 'rent' });
});
it('does not infer a rent offer from a stored nightly amount on a sale-only row', async () => {
  const saved = vi.fn(); render(<CanonicalPropertyForm mode="vendor" initialData={{ title_en: 'Synthetic', ...propertyCommercialInitial({ ...source, listing_type: 'sale', listing_modes: ['sale'] }) }} onSubmit={saved} />);
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pricing' }), { button: 0, ctrlKey: false });
  expect(await screen.findByRole('switch', { name: 'Offer for rent' })).not.toBeChecked();
  fireEvent.change(screen.getByLabelText('Price per night'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0]).toMatchObject({ listing_modes: ['sale'], listing_type: 'sale', price_per_night: '', price: 90000, currency: 'USD' });
});
it('keeps validation failures in the editor and never calls a writer', async () => {
  const saved = vi.fn(); render(<CanonicalPropertyForm mode="admin" initialData={{ title_en: 'Synthetic', ...propertyCommercialInitial(source) }} onSubmit={saved} />);
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pricing' }), { button: 0, ctrlKey: false });
  fireEvent.change(await screen.findByLabelText('Price per night'), { target: { value: 'NaN' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid amount');
  expect(screen.getByLabelText('Price per night')).toHaveValue('NaN');
  expect(saved).not.toHaveBeenCalled();
});
