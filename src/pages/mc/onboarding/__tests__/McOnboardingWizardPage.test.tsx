import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import McOnboardingWizardPage from '../McOnboardingWizardPage';
import { APP_ROUTES } from '@/lib/config/routes';

const state = vi.hoisted(() => ({
  language: 'en', company: { activeCompany: { company_id: 'company' }, isLoading: false, isError: false, refetch: vi.fn() },
  progress: { data: null as Record<string, unknown> | null, isLoading: false, isError: false, refetch: vi.fn() },
  update: vi.fn(), dismiss: vi.fn(), complete: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => state.company }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('Database access forbidden'); } }) }));
vi.mock('@/hooks/useMcOnboarding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useMcOnboarding')>();
  return { ...actual, useMcOnboarding: () => state.progress,
    useUpdateOnboardingStep: () => ({ mutate: state.update, isPending: false }),
    useDismissOnboarding: () => ({ mutate: state.dismiss, isPending: false }),
    useCompleteOnboarding: () => ({ mutate: state.complete, isPending: false }) };
});
function Destination() { return <output>{useLocation().pathname}</output>; }
function mount() {
  return render(<MemoryRouter initialEntries={['/mc/onboarding/wizard']}><Routes>
    <Route path="/mc/onboarding/wizard" element={<McOnboardingWizardPage />} />
    <Route path="*" element={<Destination />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => {
  state.language = 'en'; state.company.isError = false;
  state.progress.data = null; state.progress.isError = false; vi.clearAllMocks();
});
afterEach(cleanup);

describe('optional workspace setup', () => {
  it.each(['en', 'ru'])('opens the workspace without invoking a checklist action (%s)', (language) => {
    state.language = language; mount();
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Открыть рабочий кабинет' : 'Open workspace' }));
    expect(screen.getByText(APP_ROUTES.MC)).toBeInTheDocument();
    expect(state.update).not.toHaveBeenCalled(); expect(state.complete).not.toHaveBeenCalled(); expect(state.dismiss).not.toHaveBeenCalled();
  });
  it('keeps sections available on a checklist read failure and exposes retry rather than a zero progress claim', () => {
    state.progress.isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('saved progress is currently unknown');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark complete: Company profile' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.progress.refetch).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]);
    expect(screen.getByText(APP_ROUTES.MC_SETTINGS)).toBeInTheDocument();
  });
  it('does not redirect a failed company read into company creation', () => {
    state.company.isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your company');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.company.refetch).toHaveBeenCalledOnce();
    expect(screen.queryByText('/mc/onboarding')).not.toBeInTheDocument();
  });
  it('does not label checked boxes as payment or company readiness', () => {
    state.progress.data = Object.fromEntries(['step_company_profile','step_team_invited','step_first_property','step_pricing_set','step_channel_connected','step_payment_method','step_first_booking'].map(key => [key, true]));
    mount();
    expect(screen.getByText('All items marked')).toBeInTheDocument();
    expect(screen.queryByText(/your company is live/i)).not.toBeInTheDocument();
    expect(screen.getByText(/do not confirm configured rules or payment readiness/)).toBeInTheDocument();
  });
});
