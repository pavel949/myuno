import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import OwnerDashboard from '../OwnerDashboard';
import McOnboardingWizardPage from '../../mc/onboarding/McOnboardingWizardPage';
import { APP_ROUTES } from '@/lib/config/routes';

const state = vi.hoisted(() => ({
  language: 'en', signedIn: true,
  properties: { allProperties: [] as { id: string }[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  company: { activeCompany: { company_id: 'synthetic-company' }, isLoading: false, isError: false, refetch: vi.fn() },
  mutation: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.signedIn ? { id: 'synthetic-user' } : null }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => state.properties }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => state.company }));
vi.mock('@/hooks/useBusinessRole', () => ({ useBusinessRole: () => ({
  role: 'general', config: { widgets: [] }, setRole: vi.fn(), mcRole: 'manager', mcRoleLabel: null,
}) }));
vi.mock('@/hooks/use-desktop', () => ({ useIsDesktop: () => false }));
vi.mock('@/hooks/useMcOnboarding', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useMcOnboarding')>(),
  useMcOnboarding: () => ({ data: null, isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdateOnboardingStep: () => ({ mutate: state.mutation }),
  useDismissOnboarding: () => ({ mutate: state.mutation }),
  useCompleteOnboarding: () => ({ mutate: state.mutation }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Hosted backend forbidden'); } }) }));
vi.mock('@/components/page/PageShell', () => ({ PageShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/contexts/DashboardFilterContext', () => ({ DashboardFilterProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/owner/dashboard/BusinessRoleSwitcher', () => ({ BusinessRoleSwitcher: () => null }));
vi.mock('@/components/owner/dashboard/DashboardGreeting', () => ({ DashboardGreeting: () => <h1>Existing populated dashboard</h1> }));
vi.mock('@/components/owner/dashboard/RoleQuickActions', () => ({ RoleQuickActions: () => null }));
vi.mock('@/components/owner/dashboard/DashboardPropertyFilter', () => ({ DashboardPropertyFilter: () => null }));
vi.mock('@/components/owner/dashboard/CollapsibleWidget', () => ({ CollapsibleWidget: () => null }));
vi.mock('@/components/owner/dashboard/QuickTaskDialog', () => ({ QuickTaskDialog: () => null }));
vi.mock('@/components/owner/dashboard/OverviewSection', () => ({ OverviewSection: () => <p>Existing metrics boundary</p> }));
vi.mock('@/components/owner/dashboard/WidgetErrorBoundary', () => ({ WidgetErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</> }));

function Destination() { return <output>{useLocation().pathname}</output>; }
function mount(path: string = APP_ROUTES.MC) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path={APP_ROUTES.MC} element={<OwnerDashboard />} />
    <Route path="/mc/onboarding/wizard" element={<McOnboardingWizardPage />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => {
  vi.clearAllMocks(); state.language = 'en'; state.signedIn = true;
  state.properties.allProperties = []; state.properties.isLoading = false; state.properties.error = null;
  state.company.isLoading = false; state.company.isError = false;
  vi.stubGlobal('fetch', () => { throw Error('Network forbidden'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('actual empty workspace consumer with synthetic authorized sources', () => {
  it.each(['en', 'ru'])('opens the real empty dashboard from the real wizard at zero progress (%s)', language => {
    state.language = language; mount('/mc/onboarding/wizard');
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Открыть рабочий кабинет' : 'Open workspace' }));
    expect(screen.getByRole('heading', { name: language === 'ru' ? 'Рабочий кабинет' : 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText(/unlock the full management dashboard|Завершите настройку/)).not.toBeInTheDocument();
    expect(screen.queryByText('Existing metrics boundary')).not.toBeInTheDocument();
    expect(state.mutation).not.toHaveBeenCalled();
  });
  it.each([
    ['Settings', APP_ROUTES.MC_SETTINGS], ['Team', APP_ROUTES.MC_STAFF], ['Properties', APP_ROUTES.MC_PROPERTIES],
    ['Today', APP_ROUTES.MC_TODAY], ['Calendar', APP_ROUTES.MC_CALENDAR], ['Bookings', APP_ROUTES.MC_BOOKINGS_LIST],
  ])('opens existing guarded %s route without creating business data', (label, route) => {
    mount(); fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByText(route)).toBeInTheDocument(); expect(state.mutation).not.toHaveBeenCalled();
  });
  it.each(['company', 'properties'])('keeps %s failure distinct from an empty portfolio and retries', source => {
    if (source === 'company') state.company.isError = true;
    else state.properties.error = Error('Synthetic denial');
    mount(); expect(screen.getByRole('alert')).toHaveTextContent('currently unknown');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Existing metrics boundary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(source === 'company' ? state.company.refetch : state.properties.refetch).toHaveBeenCalledOnce();
  });
  it('shows pending rather than asserting an empty portfolio', () => {
    state.properties.isLoading = true; mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading workspace');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('preserves populated dashboard composition', () => {
    state.properties.allProperties = [{ id: 'synthetic-property' }]; mount();
    expect(screen.getByText('Existing populated dashboard')).toBeInTheDocument();
    expect(screen.getByText('Existing metrics boundary')).toBeInTheDocument();
  });
  it('retains the sign-in boundary', () => {
    state.signedIn = false; mount(); expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
