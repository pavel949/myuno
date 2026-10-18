import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { CanonicalPropertyForm } from '@/components/property/canonical-form/CanonicalPropertyForm';
import PropertyEditor from '../PropertyEditor';

const mocks = vi.hoisted(() => ({
  property: {} as Record<string, unknown>,
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  navigate: vi.fn(),
  syncAvailability: vi.fn(),
  availability: [],
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'synthetic-property' }),
  useNavigate: () => mocks.navigate,
}));
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
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: () => null }));
vi.mock('@/components/property/PropertyRooms', () => ({ PropertyRooms: () => null }));
vi.mock('@/components/property/PropertyCalendar', () => ({ PropertyCalendar: () => null }));
vi.mock('@/components/owner/PropertyTeamTab', () => ({ PropertyTeamTab: () => null }));
vi.mock('@/components/owner/property-wizard/AIIntakePanel', () => ({ AIIntakePanel: () => null }));
vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('@/components/property/canonical-form/CanonicalPropertyForm', () => ({
  CanonicalPropertyForm: ({ initialData, controlledFormData, onFormDataChange, onSubmit }: ComponentProps<typeof CanonicalPropertyForm>) => {
    const form = controlledFormData!;
    return <div>
      <output data-testid="initial-data">{JSON.stringify(initialData)}</output>
      <output data-testid="controlled-data">{JSON.stringify(form)}</output>
      <label htmlFor="property-title">Title<input id="property-title" aria-label="Title" value={form.title} onChange={event => onFormDataChange!({ ...form, title: event.target.value })} /></label>
      <label htmlFor="deposit-currency">Deposit currency<select id="deposit-currency" value={form.deposit_currency || ''} onChange={event => onFormDataChange!({ ...form, deposit_currency: event.target.value })}>
        <option value="">Unknown</option><option value="USD">USD</option><option value="THB">THB</option>
      </select></label>
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
    render(<PropertyEditor />);
    const expected = { deposit_currency: 'USD', payment_policy: 'custom', prepay_percent: 0, balance_due_days: 0 };
    expect(renderedData('initial-data')).toMatchObject(expected);
    expect(renderedData('controlled-data')).toMatchObject(expected);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated title only' } });
    expect(await save()).toMatchObject({ ...expected, title: 'Updated title only', deposit_amount: 300 });
  });

  it('persists an explicit currency edit to THB without converting the deposit amount', async () => {
    render(<PropertyEditor />);
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
    render(<PropertyEditor />);
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
    render(<PropertyEditor />);
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
