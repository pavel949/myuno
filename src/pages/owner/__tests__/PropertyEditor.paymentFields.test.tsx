import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CanonicalPropertyForm } from '@/components/property/canonical-form/CanonicalPropertyForm';
import PropertyEditor from '../PropertyEditor';
import { propertySupportsMode } from '@/lib/real-estate/propertyDetailIntent';

const mocks = vi.hoisted(() => ({
  property: {} as Record<string, unknown>,
  provider: vi.fn(),
  revisionRead: vi.fn(),
  revisionSave: vi.fn(),
  canAccess: vi.fn(),
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  navigate: vi.fn(),
  syncAvailability: vi.fn(),
  availability: [],
}));

vi.mock('@/lib/propertyAuthoring', async importOriginal => ({ ...(await importOriginal<typeof import('@/lib/propertyAuthoring')>()), isIndependentPropertyProvider: mocks.provider }));
vi.mock('@/lib/propertyRevisions', async importOriginal => ({ ...(await importOriginal<typeof import('@/lib/propertyRevisions')>()), readPropertyRevision: mocks.revisionRead, savePropertyRevision: mocks.revisionSave }));
const renderEditor = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><PropertyEditor /></QueryClientProvider>);

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'synthetic-property' }),
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-owner' } }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false, isLoading: false }) }));
vi.mock('@/hooks/useTeamPermissions', () => ({ useTeamPermissions: () => ({ canAccess: mocks.canAccess, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/hooks/usePropertyCare', () => ({
  useOwnerProperty: () => ({ data: mocks.property, isLoading: false }),
  useUpdateOwnerProperty: () => ({ mutateAsync: mocks.mutateAsync, mutate: mocks.mutate, isPending: false }),
}));
vi.mock('@/hooks/usePropertyAvailabilityManagement', () => ({
  usePropertyAvailabilityManagement: () => ({
    availability: mocks.availability,
    syncAvailability: mocks.syncAvailability,
    isSaving: false,
  }),
}));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ actions }: { actions: React.ReactNode }) => <div>{actions}</div> }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: ({ property }: { property: unknown }) => <output data-testid="preview-property">{JSON.stringify(property)}</output> }));
vi.mock('@/components/property/PropertyRooms', () => ({ PropertyRooms: () => null }));
vi.mock('@/components/property/PropertyCalendar', () => ({ PropertyCalendar: ({ currency }: { currency?: string }) => <output data-testid="calendar-currency">{currency || "unknown"}</output> }));
vi.mock('@/components/owner/PropertyTeamTab', () => ({ PropertyTeamTab: () => null }));
vi.mock('@/components/owner/property-wizard/AIIntakePanel', () => ({ AIIntakePanel: () => null }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock('@/components/property/canonical-form/CanonicalPropertyForm', () => ({
  CanonicalPropertyForm: ({ initialData, controlledFormData, onFormDataChange, onSubmit, controlledUtilities, onUtilitiesChange, extraTabs }: ComponentProps<typeof CanonicalPropertyForm>) => {
    const form = controlledFormData!;
    return <div>
      {extraTabs?.map(tab => <div key={tab.id}>{tab.content}</div>)}
      <label>Nightly amount<input aria-label="Nightly amount" value={form.price_per_night} onChange={event => onFormDataChange!({ ...form, price_per_night: event.target.value })} /></label>
      <label>Sale offer<input type="checkbox" aria-label="Sale offer" checked={form.is_for_sale} onChange={event => onFormDataChange!({ ...form, is_for_sale: event.target.checked })} /></label>
      <label>Sale amount<input aria-label="Sale amount" value={form.sale_price} onChange={event => onFormDataChange!({ ...form, sale_price: event.target.value })} /></label>
      <output data-testid="initial-data">{JSON.stringify(initialData)}</output>
      <output data-testid="controlled-data">{JSON.stringify(form)}</output>
      <label htmlFor="property-title">Title<input id="property-title" aria-label="Title" value={form.title} onChange={event => onFormDataChange!({ ...form, title: event.target.value })} /></label>
      <label htmlFor="deposit-currency">Deposit currency<select id="deposit-currency" value={form.deposit_currency || ''} onChange={event => onFormDataChange!({ ...form, deposit_currency: event.target.value })}>
        <option value="">Unknown</option><option value="USD">USD</option><option value="THB">THB</option>
      </select></label>
      <label htmlFor="test-unit">Unit number<input id="test-unit" aria-label="Unit number" value={form.unit_number || ''} onChange={event => onFormDataChange!({ ...form, unit_number: event.target.value })} /></label>
      <label htmlFor="test-utility">Utility note<input id="test-utility" aria-label="Utility note" value={controlledUtilities?.electricity_notes || ''} onChange={event => onUtilitiesChange!({ ...controlledUtilities, electricity_notes: event.target.value })} /></label>
      <button onClick={() => onSubmit(form)}>Save property</button>
    </div>;
  },
}));

const paymentFields = ['deposit_currency', 'payment_policy', 'prepay_percent', 'balance_due_days'];
const renderedData = (testId: string) => JSON.parse(screen.getByTestId(testId).textContent!);
const savedPayload = () => JSON.parse(JSON.stringify(mocks.mutateAsync.mock.calls[0][0]));

async function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Save property' }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/mc/properties/synthetic-property'));
  expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
  expect(mocks.syncAvailability).toHaveBeenCalledWith([]);
  return savedPayload();
}

describe('PropertyEditor payment-field round trip', () => {
  beforeEach(() => {
  mocks.canAccess.mockReturnValue(true);
  mocks.provider.mockResolvedValue(false);
    vi.clearAllMocks();
    // Keep references stable across renders: changing fetched data would rehydrate the editor.
    mocks.property = {
      id: 'synthetic-property', title: 'Synthetic villa', updated_at: '2026-10-01T00:00:00Z',
      deposit_amount: 300, deposit_currency: 'USD', payment_policy: 'custom',
      prepay_percent: 0, balance_due_days: 0,
    };
    mocks.mutateAsync.mockResolvedValue({ id: 'synthetic-property' });
    mocks.syncAvailability.mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it('preserves stored USD and zero payment terms through hydration, an unrelated edit, and save in a THB city', async () => {
    renderEditor();
    const expected = { deposit_currency: 'USD', payment_policy: 'custom', prepay_percent: 0, balance_due_days: 0 };
    expect(renderedData('initial-data')).toMatchObject(expected);
    expect(renderedData('controlled-data')).toMatchObject(expected);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated title only' } });
    expect(await save()).toMatchObject({ ...expected, title: 'Updated title only', deposit_amount: 300 });
  });

  it.each([
    { price: 4200, price_period: 'month', currency: 'EUR', price_per_night: null, listing_modes: ['rent', 'sale', 'platform'], listing_type: 'rent', is_for_sale: true, sale_price: 95000, sale_currency: 'USD' },
    { price: null, price_period: null, currency: null, price_per_night: 150, listing_modes: ['sale'], listing_type: 'sale', is_for_sale: false, sale_price: 95000, sale_currency: 'EUR' },
  ])('preserves commercial source fields and offer modes through unrelated owner edits: %j', async commercial => {
    Object.assign(mocks.property, commercial);
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(renderedData('preview-property')).toMatchObject(commercial);
    expect(screen.getByTestId('calendar-currency')).toHaveTextContent(commercial.currency || 'unknown');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Owner title only' } });
    const payload = await save();
    expect(payload.listing_modes).toEqual(commercial.listing_modes);
    for (const field of ['price', 'price_period', 'currency', 'sale_price', 'sale_currency']) {
      if (field in payload) expect(payload[field]).toEqual(commercial[field as keyof typeof commercial]);
    }
    expect(renderedData('preview-property')).toMatchObject({ ...commercial, title_en: 'Owner title only' });
  });

  it.each(['0', '180', ''])('saves an explicit owner nightly edit %j in its recorded EUR without changing generic monthly or sale USD', async nightly => {
    Object.assign(mocks.property, { currency: 'EUR', price: 4200, price_period: 'month', price_per_night: 120, sale_price: 95000, sale_currency: 'USD', listing_modes: ['rent', 'sale'], is_for_sale: true });
    renderEditor();
    fireEvent.change(screen.getByLabelText('Nightly amount'), { target: { value: nightly } });
    fireEvent.change(screen.getByLabelText('Sale amount'), { target: { value: '96000' } });
    expect(await save()).toMatchObject({ price: 4200, price_period: 'month', currency: 'EUR', price_per_night: nightly === '' ? null : Number(nightly), sale_price: 96000, sale_currency: 'USD', listing_modes: ['rent', 'sale'] });
  });

  it.each([
    { listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, expectedType: null, expectedModes: [] },
    { listing_type: 'sale', listing_modes: ['sale'], is_for_sale: null, expectedType: null, expectedModes: [] },
    { listing_type: 'sale', listing_modes: ['sale'], is_for_sale: false, expectedType: null, expectedModes: [] },
    { listing_type: 'sale', listing_modes: ['sale', 'rent', 'platform'], is_for_sale: true, expectedType: 'rent', expectedModes: ['rent', 'platform'] },
  ])('explicitly disables public sale eligibility in the controlled owner writer and preview: %j', async offer => {
    Object.assign(mocks.property, { currency: 'EUR', sale_currency: 'USD', sale_price: 95000, ...offer });
    renderEditor();
    fireEvent.click(screen.getByLabelText('Sale offer'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const expected = { listing_type: offer.expectedType, listing_modes: offer.expectedModes, is_for_sale: false };
    expect(renderedData('preview-property')).toMatchObject(expected);
    expect(propertySupportsMode(renderedData('preview-property'), 'buy')).toBe(false);
    const payload = await save();
    expect(payload).toMatchObject(expected);
    expect(propertySupportsMode(payload, 'buy')).toBe(false);
    expect(payload).toMatchObject({ _authoring: true, _expectedUpdatedAt: '2026-10-01T00:00:00Z' });
  });

  it('contains invalid commercial input in the autosave error path without an unhandled rejection or write', async () => {
    Object.assign(mocks.property, { currency: 'EUR', price_per_night: 120 });
    renderEditor();
    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Nightly amount'), { target: { value: '-1' } });
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(mocks.mutateAsync).not.toHaveBeenCalled();
      expect(mocks.navigate).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('persists an explicit currency edit to THB without converting the deposit amount', async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Deposit currency'), { target: { value: 'THB' } });
    expect(renderedData('controlled-data').deposit_currency).toBe('THB');
    expect(await save()).toMatchObject({ deposit_currency: 'THB', deposit_amount: 300, prepay_percent: 0, balance_due_days: 0 });
  });

  it.each(['missing', 'null', 'blank'] as const)('omits unknown legacy payment fields (%s) from the serialized update', async (legacyState) => {
    for (const field of paymentFields) {
      if (legacyState === 'missing') delete mocks.property[field];
      else mocks.property[field] = null;
    }
    if (legacyState === 'blank') mocks.property.deposit_currency = '  ';
    renderEditor();
    for (const field of paymentFields) {
      expect(renderedData('initial-data')).not.toHaveProperty(field);
      expect(renderedData('controlled-data')).not.toHaveProperty(field);
    }
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Legacy title edit' } });
    const payload = await save();
    for (const field of paymentFields) expect(payload).not.toHaveProperty(field);
    expect(payload).toMatchObject({ title: 'Legacy title edit', deposit_amount: 300 });
  });

  it('preserves USD and zero payment terms in blur autosave too', async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Autosaved title' } });
    fireEvent.blur(screen.getByLabelText('Title'));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toMatchObject({
      title: 'Autosaved title', deposit_currency: 'USD', deposit_amount: 300,
      payment_policy: 'custom', prepay_percent: 0, balance_due_days: 0, _silent: true,
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});


describe('managed employee editor safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canAccess.mockReturnValue(true); mocks.provider.mockResolvedValue(false);
    mocks.property = { id: 'synthetic-property', owner_id: null, management_company_id: 'synthetic-company', title: 'Managed draft', updated_at: '2026-10-19T00:00:00Z', approval_status: 'draft', is_active: false };
    mocks.mutateAsync.mockResolvedValue({ id: 'synthetic-property', updated_at: '2026-10-19T00:01:00Z' });
  });
  afterEach(cleanup);
  it('submits an editable managed draft through the checked authoring transition', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.mutateAsync.mock.calls[0][0]).toMatchObject({ _authoring: true, _submitForReview: true, _expectedUpdatedAt: '2026-10-19T00:00:00Z', approval_status: 'pending', is_active: false });
    expect(mocks.syncAvailability).not.toHaveBeenCalled();
  });
  it('saves catalogue details and notes as deltas without touching ungranted rates', async () => {
    mocks.canAccess.mockImplementation(module => module === 'properties');
    mocks.property = { ...mocks.property, price_per_night: 1500, deposit_currency: 'USD', electricity_notes: 'Old note', unit_number: 'A1', guest_extra_fees: [{ id: 'stored-fee' }] };
    renderEditor();
    expect(renderedData('controlled-data').guest_extra_fees).toEqual([{ id: 'stored-fee' }]);
    fireEvent.change(screen.getByLabelText('Unit number'), { target: { value: 'A2' } });
    // Utility notes are catalogue text; actual pricing controls remain disabled.
    fireEvent.change(screen.getByLabelText('Utility note'), { target: { value: 'Meter read on arrival' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save property' }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toMatchObject({ unit_number: 'A2', electricity_notes: 'Meter read on arrival' });
    expect(savedPayload()).not.toHaveProperty('price_per_night');
    expect(savedPayload()).not.toHaveProperty('deposit_currency');
  });
  it.each(['approved', 'pending', 'unknown'])('does not mount a writable editor for %s employee content', status => {
    mocks.property = { ...mocks.property, approval_status: status };
    renderEditor();
    expect(screen.getByText('Read-only property')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
  it('does not take away independently verified owner editing', () => {
    mocks.property = { ...mocks.property, owner_id: 'synthetic-owner', approval_status: 'approved' };
    renderEditor();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.queryByText('Read-only property')).not.toBeInTheDocument();
  });
});


describe('independent provider authoring', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.provider.mockResolvedValue(false); mocks.canAccess.mockReturnValue(true); mocks.mutateAsync.mockResolvedValue({ id: 'synthetic-property', updated_at: '2026-10-19T00:01:00Z' }); mocks.syncAvailability.mockResolvedValue(undefined); });
  afterEach(cleanup);
  it.each(['direct', 'stored mapping'])('preserves %s provider editing even on a company property', async mode => {
    mocks.property = { ...mocks.property, owner_id: 'another-owner', provider_id: mode === 'direct' ? 'synthetic-owner' : 'provider-row', management_company_id: 'company', approval_status: 'approved' };
    mocks.provider.mockResolvedValue(true);
    renderEditor();
    await screen.findByRole('button', { name: 'Save property' });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Provider edit' } });
    expect(await save()).toMatchObject({ title: 'Provider edit' });
  });
  it('does not infer provider authority from a different provider record', async () => {
    mocks.property = { ...mocks.property, owner_id: 'another-owner', provider_id: 'someone-else', management_company_id: 'company', approval_status: 'approved' };
    renderEditor();
    await screen.findByText('Read-only property');
    expect(screen.queryByRole('button', { name: 'Save property' })).not.toBeInTheDocument();
  });
});


describe('published employee revision editor', () => {
  const stamp = '2026-10-19T06:00:00.123456Z';
  const version = '00000000-0000-4000-8000-000000000001';
  const state = (status: 'draft' | 'pending' | 'rejected' | null = null) => ({
    property: { ...mocks.property }, conflict: false,
    revision: status ? { version, status, base: { title: 'Live title', title_en: 'Live title' }, patch: { title: 'Proposed title', title_en: 'Proposed title' }, created_at: stamp, updated_at: stamp, reason: status === 'rejected' ? 'Please fix the title' : null } : null,
  });
  beforeEach(() => {
    vi.clearAllMocks(); mocks.canAccess.mockReturnValue(true); mocks.provider.mockResolvedValue(false);
    mocks.property = { id: 'synthetic-property', owner_id: null, management_company_id: 'synthetic-company', title: 'Live title', title_en: 'Live title', updated_at: stamp, approval_status: 'approved', is_active: true };
    mocks.revisionRead.mockResolvedValue(state());
    mocks.revisionSave.mockImplementation(async args => ({ property: { ...mocks.property, updated_at: '2026-10-19T06:01:00.123457Z' }, conflict: false,
      revision: { version: '00000000-0000-4000-8000-000000000002', status: args.submit ? 'pending' : 'draft', base: { title: 'Live title', title_en: 'Live title' }, patch: args.patch, created_at: stamp, updated_at: '2026-10-19T06:01:00.123457Z' } }));
  });
  afterEach(cleanup);
  it('reuses the employee form but saves published edits only as proposals', async () => {
    renderEditor(); await screen.findByLabelText('Title');
    expect(screen.getByText('Proposed changes to a published listing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Employee proposal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save property' }));
    await waitFor(() => expect(mocks.revisionSave).toHaveBeenCalledTimes(1));
    expect(mocks.revisionSave.mock.calls[0][0]).toMatchObject({ propertyId: 'synthetic-property', expectedUpdatedAt: stamp, expectedRevision: null, patch: { title: 'Employee proposal', title_en: 'Employee proposal' }, submit: false });
    expect(mocks.mutateAsync).not.toHaveBeenCalled(); expect(mocks.syncAvailability).not.toHaveBeenCalled();
    expect(mocks.property.title).toBe('Live title');
  });
  it('submits the exact proposal token without unpublishing the approved property', async () => {
    mocks.revisionRead.mockResolvedValue(state('draft'));
    renderEditor(); await screen.findByDisplayValue('Proposed title');
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await waitFor(() => expect(mocks.revisionSave).toHaveBeenCalledTimes(1));
    expect(mocks.revisionSave.mock.calls[0][0]).toMatchObject({ expectedRevision: version, expectedUpdatedAt: stamp, submit: true });
    expect(mocks.revisionSave.mock.calls[0][0].patch).not.toHaveProperty('is_active');
    expect(mocks.revisionSave.mock.calls[0][0].patch).not.toHaveProperty('approval_status');
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
  it('freezes pending changes and explains that the original remains public', async () => {
    mocks.revisionRead.mockResolvedValue(state('pending'));
    renderEditor(); await screen.findByText('Read-only property');
    expect(screen.getByText(/The approved listing stays published/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(mocks.revisionSave).not.toHaveBeenCalled();
  });
  it('restores returned proposal content and its reason', async () => {
    mocks.revisionRead.mockResolvedValue(state('rejected'));
    renderEditor(); await screen.findByDisplayValue('Proposed title');
    expect(screen.getByText(/Please fix the title/)).toBeInTheDocument();
  });
  it('requires explicit discard/restart after canonical content changes', async () => {
    mocks.revisionRead.mockResolvedValue({ ...state('rejected'), conflict: true });
    renderEditor(); const restart = await screen.findByRole('button', { name: 'Discard proposal and restart from published version' });
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(mocks.revisionSave).not.toHaveBeenCalled();
    fireEvent.click(restart);
    await waitFor(() => expect(mocks.revisionSave).toHaveBeenCalledTimes(1));
    expect(mocks.revisionSave.mock.calls[0][0]).toMatchObject({ restart: true, patch: {}, expectedRevision: version });
  });
  it('keeps entered values and blocks repeated saves after an unconfirmed write', async () => {
    mocks.revisionSave.mockRejectedValue(new Error('revision changed; reload before saving'));
    renderEditor(); await screen.findByLabelText('Title');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep my work visible' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save property' }));
    await screen.findByRole('button', { name: 'Reload and discard unsaved changes' });
    expect(screen.getByDisplayValue('Keep my work visible')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save property' }));
    expect(mocks.revisionSave).toHaveBeenCalledTimes(1); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('fails closed if the checked revision reader is unavailable', async () => {
    mocks.revisionRead.mockRejectedValue(new Error('Missing checked revision RPC'));
    renderEditor(); await screen.findByRole('alert');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
