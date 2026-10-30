import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import type { PropertyFormData } from '@/hooks/usePropertyWizard';
import VendorProperties from '../VendorProperties';
const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, create: vi.fn(), update: vi.fn(), city: 'THB' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-vendor' }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: state.city }) }));
vi.mock('@/hooks/useVendor', () => ({ useVendorProfile: () => ({ profile: { id: 'vendor' }, isLoading: false }) }));
vi.mock('@/hooks/useVendorProperties', () => ({ useVendorProperties: () => ({ properties: state.rows, isLoading: false, createProperty: state.create, updateProperty: state.update }) }));
vi.mock('@/hooks/useFormDraft', () => ({ useFormDraft: () => ({ hasDraft: false, clearDraft: vi.fn(), restoreDraft: vi.fn() }) }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: React.PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/vendor', () => ({ DraftRestorationBanner: () => null }));
vi.mock('@/components/ui/dropdown-menu', () => ({ DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>, DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>, DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>, DropdownMenuItem: ({ children, onClick }: React.PropsWithChildren<{ onClick: () => void }>) => <button onClick={onClick}>{children}</button> }));
vi.mock('@/components/owner/property-wizard/steps', () => ({
  BasicInfoStep: ({ formData, updateFormData }: { formData: PropertyFormData; updateFormData: (patch: Partial<PropertyFormData>) => void }) => <label htmlFor="vendor-fixture-title">Fixture title<input id="vendor-fixture-title" value={formData.title} onChange={event => updateFormData({ title: event.target.value })} /></label>,
  LocationStep: () => null, PhotosStep: () => null, PricingStep: () => null, UtilitiesStep: () => null, ServicesStep: () => null, AdminSettingsStep: () => null, HouseRulesSection: () => null, CancellationPolicySection: () => null,
}));
const blank = { price: null, price_per_night: null, price_per_month: null, price_per_year: null, sale_price: null, price_period: null, currency: null, sale_currency: null, listing_modes: null, listing_type: null, is_for_sale: null };
beforeEach(() => {
  vi.clearAllMocks(); state.city = 'THB'; state.rows = [];
  state.create.mockImplementation(async payload => { state.rows = [{ id: 'created', provider_id: 'vendor', ...payload }]; return { error: null }; });
  state.update.mockImplementation(async (id, payload) => { state.rows = state.rows.map(row => row.id === id ? { ...row, ...payload } : row); return { error: null }; });
});
function mount() { return render(<MemoryRouter><VendorProperties /></MemoryRouter>); }
async function pricing() {
  const editor = await screen.findByRole('dialog');
  fireEvent.mouseDown(within(editor).getByRole('tab', { name: 'Pricing' }), { button: 0, ctrlKey: false });
  await within(editor).findByLabelText('Offer amount');
  return editor;
}
it.each([
  { name: 'monthly USD', ...blank, price: 90000, price_period: 'month', currency: 'USD', listing_type: 'rent', listing_modes: ['rent'] },
  { name: 'legacy sale EUR', ...blank, price: 200000, currency: 'EUR', listing_type: 'sale' },
  { name: 'dual', ...blank, price: 90000, price_period: 'month', price_per_night: 3100, price_per_month: 85000, sale_price: 5000000, currency: 'THB', sale_currency: 'USD', listing_type: 'rent', listing_modes: ['platform', 'rent', 'sale'], is_for_sale: true },
  { name: 'unknown', ...blank },
])('preserves a $name row on metadata-only save with a different city default', async ({ name: _name, ...commercial }) => {
  state.rows = [{ id: 'record', provider_id: 'vendor', title_en: 'Synthetic property', ...commercial }];
  mount();
  if (commercial.currency === 'USD') { expect(screen.getByText(/\$/)).toBeVisible(); expect(screen.queryByText(/฿/)).not.toBeInTheDocument(); }
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  const editor = await pricing();
  expect(within(editor).getByLabelText('Price per night')).toHaveValue(commercial.price_per_night == null ? '' : String(commercial.price_per_night));
  expect(within(editor).getByLabelText('Rental / offer currency')).toHaveValue(commercial.currency ?? '');
  fireEvent.click(within(editor).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(state.update).toHaveBeenCalledWith('record', expect.objectContaining(commercial)));
  expect(state.create).not.toHaveBeenCalled();
});
it('creates a foreign-currency dual offer, reopens it and clears a dedicated price without conversion or loss of modes', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Add Property' }));
  let editor = await screen.findByRole('dialog');
  fireEvent.change(within(editor).getByLabelText('Fixture title'), { target: { value: 'Synthetic created' } });
  editor = await pricing();
  for (const [label, value] of [['Offer amount', '90000'], ['Billing period', 'month'], ['Rental / offer currency', 'EUR'], ['Price per night', '3000'], ['Sale price', '200000'], ['Sale currency', 'USD']]) fireEvent.change(within(editor).getByLabelText(label), { target: { value } });
  fireEvent.click(within(editor).getByRole('switch', { name: 'Offer for sale' }));
  fireEvent.click(within(editor).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  expect(state.create.mock.calls[0][0]).toMatchObject({ price: 90000, price_period: 'month', currency: 'EUR', price_per_night: 3000, sale_price: 200000, sale_currency: 'USD', listing_modes: ['rent', 'sale'] });
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  editor = await pricing();
  expect(within(editor).getByLabelText('Price per night')).toHaveValue('3000');
  expect(within(editor).getByLabelText('Sale currency')).toHaveValue('USD');
  fireEvent.change(within(editor).getByLabelText('Price per night'), { target: { value: '' } });
  fireEvent.click(within(editor).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(state.update).toHaveBeenCalled());
  expect(state.update.mock.calls[0][1]).toMatchObject({ price: 90000, price_period: 'month', currency: 'EUR', price_per_night: null, sale_price: 200000, sale_currency: 'USD', listing_modes: ['rent', 'sale'] });
});
it('allows a request-only blank-price draft without inventing a monthly or nightly amount', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Add Property' }));
  const editor = await screen.findByRole('dialog');
  fireEvent.change(within(editor).getByLabelText('Fixture title'), { target: { value: 'Price on request' } });
  fireEvent.click(within(editor).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  expect(state.create.mock.calls[0][0]).toMatchObject({ price: null, price_per_night: null, price_per_month: null, price_per_year: null, sale_price: null, price_period: null });
});
