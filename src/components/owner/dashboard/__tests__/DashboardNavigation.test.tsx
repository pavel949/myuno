import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { DashboardDestinations } from '../DashboardDestinations';
import { BusinessRoleSwitcher } from '../BusinessRoleSwitcher';
import { DashboardGreeting } from '../DashboardGreeting';
import { OverviewBlock, OverviewSection } from '../OverviewSection';
import { BUSINESS_ROLES } from '@/lib/businessRoles';

const state = vi.hoisted(() => ({ language: 'ru', loading: false, error: false, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { email: 'synthetic@example.test' } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: { full_name: 'Synthetic Operator' } }) }));
vi.mock('@/contexts/DashboardFilterContext', () => ({ useDashboardFilter: () => ({ selectedPropertyId: null }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ activeProperties: [] }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({ useAllPropertyBookings: () => ({ activeBookings: [], upcomingBookings: [], isLoading: state.loading, error: state.error, refetch: state.retry }) }));
vi.mock('@/hooks/useOperationalTasks', () => ({ useOperationalTasks: () => ({ tasks: [], isLoading: state.loading, error: state.error, refetch: state.retry }) }));
vi.mock('@/hooks/useCrmTasks', () => ({ useCrmTasks: () => ({ data: [], isLoading: state.loading, isError: state.error, refetch: state.retry }) }));
vi.mock('@/hooks/usePropertyFinancials', () => ({ usePropertyFinancialsFull: () => ({ data: [], isLoading: state.loading, isError: state.error, refetch: state.retry }) }));
vi.mock('@/hooks/useDayBriefing', () => ({ useDayBriefing: () => ({ data: [], isLoading: state.loading, isError: state.error, refetch: state.retry }) }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));

function Boundary() { return <output data-testid="destination">{useLocation().pathname}</output>; }
afterEach(cleanup);
beforeEach(() => { state.language = 'ru'; state.loading = false; state.error = false; state.retry.mockClear(); });

describe('Dashboard navigation', () => {
  it.each(['property_manager', 'sales_agent', 'service_provider', 'general'] as const)('uses existing real destinations in %s view', role => {
    render(<MemoryRouter initialEntries={['/mc']}><DashboardDestinations businessRole={role} propertyCount={3} /><Boundary /></MemoryRouter>);
    for (const [name, destination] of [['Объекты', '/mc/properties'], ['Календарь', '/mc/calendar'], ['Задачи', '/mc/tasks']]) {
      fireEvent.click(screen.getByRole('link', { name }));
      expect(screen.getByTestId('destination')).toHaveTextContent(destination);
    }
  });
  it('keeps view selection clearly distinct from navigation', () => {
    const onRoleChange = vi.fn();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(<QueryClientProvider client={client}><BusinessRoleSwitcher activeRole="general" onRoleChange={onRoleChange} /></QueryClientProvider>);
    const select = screen.getByRole('combobox', { name: 'Дополнительные блоки' });
    expect(select).toHaveAccessibleDescription('Выберите, какие блоки показывать ниже');
    fireEvent.change(select, { target: { value: 'property_manager' } });
    expect(onRoleChange).toHaveBeenCalledWith('property_manager');
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Управление объектами/ })).not.toBeInTheDocument();
  });
  it('does not invalidate on unchanged view', () => {
    const onRoleChange = vi.fn();
    render(<QueryClientProvider client={new QueryClient()}><BusinessRoleSwitcher activeRole="general" onRoleChange={onRoleChange} /></QueryClientProvider>);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'general' } });
    expect(onRoleChange).not.toHaveBeenCalled();
  });
  it('keeps the actual company role in the greeting without duplicating the view', () => {
    render(<DashboardGreeting roleConfig={BUSINESS_ROLES.general} mcRoleLabel={{ en: 'Director', ru: 'Директор', icon: 'x' }} />);
    expect(screen.getByText('Директор')).toBeInTheDocument();
    expect(screen.queryByText('Все модули')).not.toBeInTheDocument();
  });
  it('provides English destinations', () => {
    state.language = 'en';
    render(<MemoryRouter><DashboardDestinations businessRole="general" propertyCount={0} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Properties' })).toHaveAttribute('href', '/mc/properties');
    expect(screen.getByRole('link', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
  });
});

describe('Compact operational overview', () => {
  it('shows one empty summary and a real destination per section', () => {
    render(<MemoryRouter><OverviewSection /></MemoryRouter>);
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByText('Следующее действие')).not.toBeInTheDocument();
    expect(screen.queryByText('События')).not.toBeInTheDocument();
    expect(screen.queryByText('Заездов и выездов, требующих действий, нет.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть календарь' })).toHaveAttribute('href', '/mc/calendar');
  });
  it('never turns a loading source into an empty all-clear', () => {
    state.loading = true;
    render(<MemoryRouter><OverviewSection /></MemoryRouter>);
    expect(screen.getAllByRole('status')).toHaveLength(4);
    expect(screen.queryByText(/заезды и выезды не запланированы/)).not.toBeInTheDocument();
  });
  it('shows source errors instead of empty summaries and permits a retry', () => {
    state.error = true;
    render(<MemoryRouter><OverviewSection /></MemoryRouter>);
    expect(screen.getAllByRole('alert')).toHaveLength(4);
    expect(screen.queryByText(/заезды и выезды не запланированы/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Повторить' })[0]);
    expect(state.retry).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });
});

const SyntheticIcon = () => <svg aria-hidden />;
const populatedBlock = {
  title: 'Synthetic tasks', icon: SyntheticIcon,
  items: [{ id: 'synthetic', title: 'Synthetic overdue task', subtitle: 'Synthetic property', detail: 'Review assigned work', urgency: 'overdue' as const, href: '/mc/tasks', icon: SyntheticIcon }],
  summary: 'One overdue task', ctaLabel: 'Open tasks', ctaHref: '/mc/tasks',
};
it('keeps urgent work visible and actionable in populated compact cards', () => {
  render(<MemoryRouter initialEntries={['/mc']}><OverviewBlock {...populatedBlock} /><Boundary /></MemoryRouter>);
  expect(screen.getByText('Просрочено')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Synthetic overdue task/ }));
  expect(screen.getByTestId('destination')).toHaveTextContent('/mc/tasks');
});
it('does not present stale rows as current after a reported source failure', () => {
  render(<MemoryRouter><OverviewBlock {...populatedBlock} hasError /></MemoryRouter>);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('Synthetic overdue task')).not.toBeInTheDocument();
  expect(screen.queryByText('One overdue task')).not.toBeInTheDocument();
});
