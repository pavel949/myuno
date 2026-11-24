import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyMarketEnquiry, type PropertyEnquiryIntent } from './PropertyMarketEnquiry';

const fixture = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(() => { throw new Error('Synthetic test: no business table direct write'); }),
  invoke: vi.fn(() => { throw new Error('Synthetic test: no notification or external send'); }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: fixture }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/ui/responsive-modal', () => ({
  ResponsiveModal: ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) =>
    <section aria-label={title}><p>{description}</p>{children}</section>,
}));

const propertyId = '00000000-0000-4000-8000-000000000091';
const requestId = '00000000-0000-4000-8000-000000000092';
function mount(intent: PropertyEnquiryIntent) {
  return render(<PropertyMarketEnquiry propertyId={propertyId} title="Synthetic display property" intent={intent} onClose={vi.fn()} />);
}
function furnish() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic visitor' } });
  fireEvent.change(screen.getByLabelText('Phone or WhatsApp'), { target: { value: '+6600000000' } });
  fireEvent.change(screen.getByLabelText('Your question (optional)'), { target: { value: 'Can I review terms?' } });
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Send to myUNO' }));
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); sessionStorage.clear(); fixture.rpc.mockReset(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); expect(fixture.from).not.toHaveBeenCalled(); expect(fixture.invoke).not.toHaveBeenCalled(); });

describe('public property enquiry applies existing consultation intake', () => {
  it.each([
    [{ mode: 'buy' }, 'purchase_enquiry', 'mode=buy'],
    [{ mode: 'rent', tenancy: 'medium' }, 'rental_enquiry', 'mode=rent&tenancy=medium'],
    [{ mode: 'rent', tenancy: 'long' }, 'rental_enquiry', 'mode=rent&tenancy=long'],
  ] as const)('preserves intent for an exact property without making a booking', async (intent, verb, query) => {
    fixture.rpc.mockResolvedValue({ data: requestId, error: null });
    mount(intent);
    expect(screen.getByText(/does not reserve the property or charge/)).toBeVisible();
    furnish(); submit();
    expect((await screen.findByRole('status')).textContent).toContain(requestId);
    expect(fixture.rpc).toHaveBeenCalledOnce();
    expect(fixture.rpc).toHaveBeenCalledWith('submit_consultation_request', { payload: expect.objectContaining({
      request_type: 'property_consultation', vertical_id: 'properties',
      entry_point: `/property/${propertyId}?${query}`,
      vertical_metadata: { ...intent, property_id: propertyId, intent: verb, request_only: true, schema_version: 1 },
      notes: expect.stringContaining('Can I review terms?'),
    }) });
    const payload = fixture.rpc.mock.lastCall?.[1].payload;
    for (const key of ['provider_id','owner_property_id','status','total_amount','payment','availability']) expect(payload).not.toHaveProperty(key);
  });

  it('does not send again when the older server cannot establish an ambiguous outcome', async () => {
    fixture.rpc.mockResolvedValue({ data: null, error: { code: 'HTTP_FAILED' } });
    const first = mount({ mode: 'buy' });
    furnish(); submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/previous request status is unknown/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    first.unmount();
    mount({ mode: 'buy' });
    furnish(); submit();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/previous request status is unknown/i));
    expect(fixture.rpc).toHaveBeenCalledOnce();
  });
});
