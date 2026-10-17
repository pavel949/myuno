import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  language: 'en', loading: false, failed: false, hasCompany: true, retry: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({
  activeCompany: fixture.hasCompany ? { company_id: 'synthetic-company' } : null,
  isLoading: fixture.loading, isError: fixture.failed, refetch: fixture.retry,
}) }));
vi.mock('@/components/mc/settings/CompanyProfileSettings', () => ({ CompanyProfileSettings: () => <p>Profile editor fixture</p> }));
vi.mock('@/components/mc/settings/FinanceCategorySettings', () => ({ FinanceCategorySettings: () => <p>Finance editor fixture</p> }));
vi.mock('@/components/mc/settings/DataBackupSettings', () => ({ DataBackupSettings: () => <p>Backup editor fixture</p> }));
vi.mock('@/pages/owner/PipelineSettingsPage', () => ({ default: () => <p>CRM editor fixture</p> }));
vi.mock('@/components/uno/LoadingSpinner', () => ({ LoadingState: () => <p role="status">Loading company</p> }));
import MCSettingsPage from '../MCSettingsPage';

function Probe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname + location.search}</output>
    <button onClick={() => navigate('/mc/settings?tab=crm&keep=yes')}>Open CRM destination</button></>;
}
function mount(entry = '/mc/settings') {
  return render(<MemoryRouter initialEntries={[entry]}><MCSettingsPage /><Probe /></MemoryRouter>);
}
beforeEach(() => {
  fixture.language = 'en'; fixture.loading = false; fixture.failed = false; fixture.hasCompany = true;
  fixture.retry.mockReset();
  vi.stubGlobal('fetch', () => { throw new Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('existing company configuration connections', () => {
  it('opens the CRM section from the existing tab destination and responds to navigation', async () => {
    mount('/mc/settings?tab=finance&keep=yes');
    expect(screen.getByText('Finance editor fixture')).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open CRM destination' })); });
    expect(await screen.findByText('CRM editor fixture')).toBeInTheDocument();
    expect(screen.queryByText('Finance editor fixture')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('tab=crm&keep=yes');
  });

  it('syncs multiple open sections without dropping unrelated query values', () => {
    mount('/mc/settings?tab=profile&keep=yes');
    fireEvent.click(screen.getByRole('button', { name: /Finance/ }));
    expect(screen.getByText('Profile editor fixture')).toBeInTheDocument();
    expect(screen.getByText('Finance editor fixture')).toBeInTheDocument();
    const query = new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);
    expect(query.getAll('tab')).toEqual(['profile', 'finance']);
    expect(query.get('keep')).toBe('yes');
  });

  it('provides existing operational destinations instead of promising a missing checklist builder', () => {
    mount('/mc/settings?tab=operations');
    expect(screen.getByRole('link', { name: 'Operational tasks' })).toHaveAttribute('href', '/mc/operations');
    expect(screen.getByRole('link', { name: 'Automatic messages' })).toHaveAttribute('href', '/mc/auto-messaging');
    expect(screen.getByRole('link', { name: 'Message templates' })).toHaveAttribute('href', '/mc/message-templates');
    expect(screen.queryByText(/coming soon/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Automatic messages' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/mc/auto-messaging');
  });

  it('does not treat a membership failure as an empty company or mount private editors', () => {
    fixture.failed = true;
    mount('/mc/settings?tab=profile');
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load company');
    expect(screen.queryByText('Profile editor fixture')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create company' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.retry).toHaveBeenCalledOnce();
  });

  it('keeps loading separate from a genuinely unconfigured company', () => {
    fixture.loading = true; fixture.hasCompany = false;
    const view = mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading company');
    expect(screen.queryByRole('link', { name: 'Create company' })).not.toBeInTheDocument();
    fixture.loading = false;
    view.rerender(<MemoryRouter><MCSettingsPage /><Probe /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Create company' })).toHaveAttribute('href', '/mc/onboarding');
  });

  it('ignores unknown sections and keeps Russian operation labels', () => {
    fixture.language = 'ru';
    mount('/mc/settings?tab=unknown');
    expect(screen.queryByText('Profile editor fixture')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Операции/ }));
    expect(screen.getByRole('link', { name: 'Автоматические сообщения' })).toHaveAttribute('href', '/mc/auto-messaging');
  });
});

