import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AdminOperationalAlerts } from './AdminOperationalAlerts';
import { AdminKPIGrid } from './AdminKPIGrid';

const state = vi.hoisted(() => ({ count: null as number | null, language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useAdminDashboardStats', () => ({ useAdminDashboardStats: () => ({ data: { pendingContent: state.count }, isLoading: false }) }));
vi.mock('@/hooks/useAdminAnalytics', () => ({ useAdminAnalytics: () => ({ summary: {}, isLoading: false }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
vi.mock('@/components/ds', () => ({ SectionHeader: ({ title }: { title: string }) => <h2>{title}</h2> }));
function Probe() { const route = useLocation(); return <output data-testid="route">{route.pathname}{route.search}</output>; }
const mount = (element: React.ReactNode) => render(<MemoryRouter>{element}<Probe /></MemoryRouter>);
beforeEach(() => { state.count = null; state.language = 'en'; });
afterEach(cleanup);

describe('dashboard moderation count truthfulness', () => {
  it('retains an actionable unknown state instead of All clear when moderation counts fail', () => {
    mount(<AdminOperationalAlerts />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByText('All clear!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Listings & properties pending review/ }));
    expect(screen.getByTestId('route')).toHaveTextContent('/admin/operations?tab=moderation');
  });
  it('allows All clear only for a verified zero moderation count', () => {
    state.count = 0; mount(<AdminOperationalAlerts />);
    expect(screen.getByText('All clear!')).toBeInTheDocument();
  });
  it('shows the shared exact count and its listing/property scope', () => {
    state.count = 248; mount(<AdminOperationalAlerts />);
    expect(screen.getByRole('button', { name: /Listings & properties pending review 248/ })).toBeInTheDocument();
  });
  it('renders unknown in the moderation KPI rather than fabricating zero', () => {
    mount(<AdminKPIGrid />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
  it('localizes unavailable moderation counts', () => {
    state.language = 'ru'; mount(<AdminOperationalAlerts />);
    expect(screen.getByText('Неизвестно')).toBeInTheDocument();
    expect(screen.queryByText('Всё в порядке!')).not.toBeInTheDocument();
  });
});

it('keeps failed moderation counts explicit and actionable in Thai', () => {
  state.language = 'th'; mount(<AdminOperationalAlerts />);
  expect(screen.getByText('ไม่ทราบ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /รายการและที่พักรอตรวจสอบ/ })).toBeInTheDocument();
});
