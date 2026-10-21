import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TeamDashboard from './TeamDashboard';
import { AdminAllVerticalsGrid } from '@/components/admin/dashboard/AdminAllVerticalsGrid';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

const state = vi.hoisted(() => ({ isAdmin: false, checking: false, language: 'en', from: vi.fn(() => { throw new Error('Unexpected global platform read'); }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-team' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.isAdmin, isLoading: state.checking }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
vi.mock('@/hooks/useTeamMember', () => ({ useTeamMember: () => ({ member: { display_name: 'Synthetic team', specializations: [] }, hasSpecialization: () => false, isTeamLead: false, isLoading: false }), SPECIALIZATION_LABELS: {} }));
vi.mock('@/hooks/useTeamGamification', () => ({ useMyGamification: () => ({ stats: {} }) }));
vi.mock('@/hooks/useTeamLeads', () => ({ useTeamLeads: () => ({ stats: { pending: 3, overdue: 1, inProgress: 2, completed: 4 } }) }));
vi.mock('@/components/team/TeamLayout', () => ({ TeamLayout: ({ children }: React.PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/team/gamification/PointsDisplay', () => ({ PointsDisplay: () => <p>Scoped points boundary</p> }));
vi.mock('@/components/team/gamification/Leaderboard', () => ({ Leaderboard: () => <p>Scoped leaderboard boundary</p> }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
vi.mock('@/components/ds', () => ({ SectionHeader: ({ title }: { title: string }) => <h2>{title}</h2> }));

let client: QueryClient;
const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter></QueryClientProvider>;
beforeEach(() => { state.isAdmin = false; state.checking = false; state.language = 'en'; state.from.mockClear(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); });

describe('team caller of admin-only platform counts', () => {
  it('keeps the actual hook idle for a non-admin team actor', () => {
    const { result } = renderHook(useAdminDashboardStats, { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(state.from).not.toHaveBeenCalled();
  });

  it.each(['en', 'ru', 'th'])('shows unavailable instead of fabricated global zeros in %s', language => {
    state.language = language;
    render(<TeamDashboard />, { wrapper });
    const platform = screen.getByTestId('team-platform-stats');
    expect(platform.querySelectorAll('[data-count-state="unavailable"]')).toHaveLength(4);
    expect(within(platform).queryByText('0')).not.toBeInTheDocument();
    expect(within(platform).getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Scoped points boundary')).toBeInTheDocument();
    expect(state.from).not.toHaveBeenCalled();
  });

  it('does not display cached admin totals after this actor no longer has admin access', () => {
    client.setQueryData(['admin-dashboard-stats', 'synthetic-team'], { properties: 999, yachts: 999, tours: 999, restaurants: 999, totalUsers: 999, providers: 999 });
    render(<TeamDashboard />, { wrapper });
    expect(screen.getByTestId('team-platform-stats')).not.toHaveTextContent('999');
    expect(screen.getByTestId('team-platform-stats').querySelectorAll('[data-count-state="unavailable"]')).toHaveLength(4);
    expect(state.from).not.toHaveBeenCalled();
  });

  it('does not turn disabled shared-hook data into empty verticals or a zero total', () => {
    render(<AdminAllVerticalsGrid />, { wrapper });
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(1);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(state.from).not.toHaveBeenCalled();
  });
});
