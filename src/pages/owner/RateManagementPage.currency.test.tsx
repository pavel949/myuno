import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RateManagementPage from './RateManagementPage';
import { useMyProperties } from '@/hooks/useMyProperties';
import type { RateSeasonRecord } from '@/hooks/usePropertyRateSeasons';
const state = vi.hoisted(() => ({
  property: { id: 'p1', title: 'Fixture villa', price_per_night: 7000, currency: 'THB' as string | null, deposit_currency: 'USD', management_company_id: 'company' },
  source: 'owned', rates: [] as RateSeasonRecord[], logs: [] as Record<string, unknown>[], save: vi.fn(), update: vi.fn(), insert: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'company' } }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ hasRole: () => true }) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperties: () => ({ data: state.source === 'owned' ? [state.property] : [], isLoading: false }) }));
vi.mock('@/hooks/useAssignedProperties', () => ({ useAssignedProperties: () => ({ properties: state.source === 'managed' ? [{ ...state.property, property_id: state.property.id, currency: state.property.currency || 'THB', record_currency: state.property.currency }] : [], isLoading: false }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'EUR', symbol: '€' }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ useOwnerRateSeasons: () => ({ data: state.rates, isLoading: false }), useSaveRateSeason: () => ({ mutate: state.save }), useDeleteRateSeason: () => ({ mutate: vi.fn() }) }));
vi.mock('@/hooks/useAIPricingSuggestions', () => ({ useAIPricingSuggestions: () => ({ suggestions: [], generateSuggestions: { mutate: vi.fn() } }) }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({ data: queryKey[0] === 'company-properties' ? (state.source === 'company' ? [state.property] : []) : state.logs, isLoading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ update: (value: unknown) => { state.update(value); return { eq: async () => ({ error: null }) }; }, insert: async (value: unknown) => { state.insert(value); return { error: null }; } }) } }));
function Probe() { const { allProperties } = useMyProperties(); return <div data-testid="legacy-currency">{allProperties[0]?.currency}</div>; }
function mount() { return render(<MemoryRouter initialEntries={['/mc/rates?property=p1']}><RateManagementPage /><Probe /></MemoryRouter>); }
const season = (currency: string | null): RateSeasonRecord => ({ id: 's1', property_id: 'p1', name_en: 'Fixture season', start_date: '2026-12-01', end_date: '2026-12-31', nightly_rate: 8000, currency, is_active: true });
beforeEach(() => { state.property = { id: 'p1', title: 'Fixture villa', price_per_night: 7000, currency: 'THB', deposit_currency: 'USD', management_company_id: 'company' }; state.source = 'owned'; state.rates = []; state.logs = []; vi.clearAllMocks(); });
describe('Rates use stored denomination, never city or deposit', () => {
  it.each(['owned', 'company'])('%s rental THB stays separate from USD deposit', source => {
    state.source = source; mount();
    expect(screen.getByText('7,000 THB')).toBeVisible();
    expect(screen.getByTestId('legacy-currency')).toHaveTextContent('USD');
    expect(state.property.deposit_currency).toBe('USD');
    expect(state.update).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
  });
  it.each(['owned', 'company'])('%s USD rental is not relabelled as THB deposit', source => {
    state.source = source; state.property.currency = 'USD'; state.property.deposit_currency = 'THB'; mount();
    expect(screen.getByText('7,000 USD')).toBeVisible();
    expect(screen.getByTestId('legacy-currency')).toHaveTextContent('THB');
  });
  it.each(['owned', 'company'])('%s missing rental currency stays unspecified', source => {
    state.source = source; state.property.currency = null; mount();
    expect(screen.getByText('7,000 currency not specified')).toBeVisible();
    expect(screen.queryByText('7,000 USD')).toBeNull();
    expect(screen.queryByText('7,000 THB')).toBeNull();
  });
  it('does not reuse the managed projection legacy THB fallback for missing currency', () => {
    state.source = 'managed'; state.property.currency = null; mount();
    expect(screen.getByText('7,000 currency not specified')).toBeVisible();
    expect(screen.getByTestId('legacy-currency')).toHaveTextContent('THB');
  });
  it('keeps the base-price numeric update unchanged and never rewrites deposit/currency', async () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(7000);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledWith({ price_per_night: 7000 }));
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.property.deposit_currency).toBe('USD');
  });
  it.each(['USD', null])('season currency %s is independent of property THB and has no misleading comparison', currency => {
    state.rates = [season(currency)]; mount();
    expect(screen.getByText(`8,000 ${currency || 'currency not specified'}`)).toBeVisible();
    expect(screen.queryByText(/% vs base/)).toBeNull();
  });
  it('shows a comparison only for matching known denominations', () => {
    state.rates = [season('THB')]; mount();
    expect(screen.getByText('+14% vs base')).toBeVisible();
  });
  it('uses the saved season currency in the editor without altering its numeric payload', () => {
    state.rates = [season('USD')]; mount();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    expect(screen.getByText('Nightly Rate (USD)')).toBeVisible();
    expect(screen.getByDisplayValue('8000')).toBeVisible();
    expect(screen.queryByText(/% vs base/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const payload = state.save.mock.calls[0][0];
    expect(payload.season.nightly_rate).toBe(8000);
    expect(payload.season).not.toHaveProperty('currency');
    expect(payload.basePricePerNight).toBe(7000);
  });
  it('does not invent a currency for the new-season writer which omits it', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Season' }));
    expect(screen.getByText('Nightly Rate (currency not specified)')).toBeVisible();
    expect(screen.getByText('Base price: 7,000 THB/night')).toBeVisible();
    expect(state.save).not.toHaveBeenCalled();
  });
  it.each([null, 'USD'])('history only shows its stored denomination %s', currency => {
    state.logs = [{ id: 'l1', property_id: 'p1', action: 'season_created', created_at: '2026-10-01', details: { name: 'Historical season', nightly_rate: 6000, start_date: '2026-10-01', end_date: '2026-10-31', currency } }];
    mount(); fireEvent.click(screen.getByRole('button', { name: /Change History/ }));
    expect(screen.getByText(new RegExp(`Historical season: 6,000 ${currency || 'currency not specified'}`))).toBeVisible();
  });
});
