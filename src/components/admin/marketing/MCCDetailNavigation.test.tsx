import { Fragment, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MCCFunnelDiagnosticsTab } from './MCCFunnelDiagnosticsTab';
import { MCCUserTimelineTab } from './MCCUserTimelineTab';
const state = vi.hoisted(() => ({ navigate: vi.fn(), landings: [] as string[], users: [] as string[] }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/pages/admin/marketing/MarketingDashboard', () => ({ useMCCNavigation: () => ({ navContext: {}, navigateTo: state.navigate }) }));
vi.mock('@/hooks/useLandingRegistry', () => ({ useLandingRegistry: () => ({
  data: [{ landing_id: 'synthetic-a', name_en: 'QA landing A' }, { landing_id: 'synthetic-b', name_en: 'QA landing B' }],
  isLoading: false, isError: false, refetch: vi.fn(),
}) }));
vi.mock('@/hooks/useMCCControlTower', () => ({
  useFunnelDiagnostics: (id: string) => { state.landings.push(id); return { data: undefined, isLoading: !!id, isError: false, refetch: vi.fn() }; },
  useUserTimeline: (id: string) => { state.users.push(id); return { data: undefined, isLoading: !!id, isError: false, refetch: vi.fn() }; },
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) =>
    <select aria-label="Fixture selection" value={value} onChange={event => onValueChange(event.target.value)}><option value="">Choose</option>{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <Fragment>{children}</Fragment>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));
beforeEach(() => { vi.clearAllMocks(); state.landings = []; state.users = []; });
afterEach(cleanup);
describe('manual marketing record navigation', () => {
  it('persists a selected landing through the shared address/history contract and reads that exact landing', () => {
    render(<MCCFunnelDiagnosticsTab />);
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'synthetic-b' } });
    expect(state.navigate).toHaveBeenCalledWith('funnel-diag', { landingId: 'synthetic-b' });
    expect(state.landings[state.landings.length - 1]).toBe('synthetic-b');
  });
  it('persists a valid user ID when opening the recorded timeline', () => {
    render(<MCCUserTimelineTab />);
    const id = '22222222-2222-4222-8222-222222222222';
    fireEvent.change(screen.getByPlaceholderText('Enter User ID...'), { target: { value: id } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(state.navigate).toHaveBeenCalledWith('timeline', { userId: id });
    expect(state.users[state.users.length - 1]).toBe(id);
  });
  it('does not put arbitrary contact text in the navigation URL', () => {
    render(<MCCUserTimelineTab />);
    fireEvent.change(screen.getByPlaceholderText('Enter User ID...'), { target: { value: 'private@example.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(state.navigate).not.toHaveBeenCalled();
  });
});
