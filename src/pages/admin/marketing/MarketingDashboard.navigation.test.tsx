import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MarketingDashboard, { useMCCNavigation } from './MarketingDashboard';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/admin/marketing/MCCMagnetsTab', () => ({ MCCMagnetsTab: () => <p>Magnet records</p> }));
vi.mock('@/components/admin/marketing/MCCLandingBuilderTab', () => ({ MCCLandingBuilderTab: () => <p>Landing authoring</p> }));
vi.mock('@/components/admin/marketing/MCCControlTowerTab', () => ({ MCCControlTowerTab: () => {
  const { navigateTo } = useMCCNavigation();
  return <button onClick={() => navigateTo('funnel-diag', { landingId: 'synthetic-landing' })}>Open landing events</button>;
} }));
vi.mock('@/components/admin/marketing/MCCAnalyticsTab', () => ({ MCCAnalyticsTab: () => <p>Recorded analytics</p> }));
vi.mock('@/components/admin/marketing/MCCLandingControlTab', () => ({ MCCLandingControlTab: () => <p>Landing controls</p> }));
vi.mock('@/components/admin/marketing/MCCUserStatesTab', () => ({ MCCUserStatesTab: () => <p>Recorded states</p> }));
vi.mock('@/components/admin/marketing/MCCFunnelDiagnosticsTab', () => ({ MCCFunnelDiagnosticsTab: () => <p>Recorded event diagnostics</p> }));
vi.mock('@/components/admin/marketing/MCCUserTimelineTab', () => ({ MCCUserTimelineTab: () => <p>Recorded timeline</p> }));
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function mount(tab: string) { return render(<MemoryRouter initialEntries={[`/admin/analytics?tab=marketing&marketing_tab=${tab}&return=retained`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MarketingDashboard /><Location /></MemoryRouter>); }
afterEach(cleanup);
describe('marketing workspace navigation', () => {
  it('keeps the selected landing in the address when opening its event diagnostics', () => {
    mount('control-tower');
    fireEvent.click(screen.getByRole('button', { name: 'Open landing events' }));
    expect(screen.getByTestId('location')).toHaveTextContent('marketing_landingId=synthetic-landing');
    expect(screen.getByTestId('location')).toHaveTextContent('marketing_tab=funnel-diag');
    expect(screen.getByTestId('location')).toHaveTextContent('return=retained');
  });
  it('restores the selected tool from the URL and preserves the parent workspace and return context', async () => {
    mount('funnel-diag');
    expect(screen.getByRole('tab', { name: 'Funnel Diag' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Recorded event diagnostics')).toBeVisible();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Landings' }), { button: 0, ctrlKey: false });
    await waitFor(() => expect(screen.getByText('Landing controls')).toBeVisible());
    expect(screen.getByTestId('location')).toHaveTextContent('tab=marketing');
    expect(screen.getByTestId('location')).toHaveTextContent('marketing_tab=landings');
    expect(screen.getByTestId('location')).toHaveTextContent('return=retained');
  });
  it('routes the retired builder selection to real diagnostics without presenting two competing funnel tools', () => {
    mount('funnels');
    expect(screen.getByText('Recorded event diagnostics')).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Funnels' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(8);
  });
});
