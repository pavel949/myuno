import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileSettings from './ProfileSettings';

const state = vi.hoisted(() => {
  const user = { id: 'guest-a', email: 'guest@example.test', app_metadata: { providers: ['google'] } };
  const profile = { id: 'guest-a', full_name: 'Sample Guest', phone: '' };
  const details = { id: 'guest-a', city: 'Phuket', country: 'TH', emergency_contact_relationship: 'friend', postal_code: '83000' };
  return {
    initial: { user, profile, details },
    current: { user, profile, details, dataUpdatedAt: 10, error: null as Error | null, language: 'en' },
    update: vi.fn(), setCity: vi.fn(),
  };
});

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.current.user, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.current.language }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: state.current.profile, isLoading: false }) }));
vi.mock('@/hooks/useProfileDetails', () => ({ useProfileDetails: () => ({
  details: state.current.details, dataUpdatedAt: state.current.dataUpdatedAt, error: state.current.error, isLoading: false, isUpdating: false, updateDetailsAsync: state.update,
}) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
vi.mock('@/components/uno/ThemeSwitcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/uno/CurrencySwitcher', () => ({ CurrencySwitcher: () => null }));
vi.mock('@/components/profile/SecuritySettingsSection', () => ({ SecuritySettingsSection: () => null }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({
  currentCitySlug: 'phuket',
  activeCities: [{ slug: 'phuket', name_en: 'Phuket', name_ru: 'Пхукет' }, { slug: 'sample', name_en: 'Sample City' }],
  getCityName: () => 'Phuket', isLoading: false, setCity: state.setCity,
}) }));

const page = () => <MemoryRouter initialEntries={['/profile/settings']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ProfileSettings /></MemoryRouter>;
const save = () => screen.getByRole('button', { name: 'Save changes' });
const city = () => screen.getByRole('textbox', { name: 'City' });
const changeCity = (value: string) => fireEvent.change(city(), { target: { value } });

beforeEach(() => {
  Object.assign(state.current, state.initial, { dataUpdatedAt: 10, error: null, language: 'en' });
  state.update.mockReset().mockResolvedValue({});
  state.setCity.mockReset();
});
afterEach(cleanup);

describe('profile settings', () => {
  it('groups destinations, shows true provider status and does not simulate deleting or unlinking', () => {
    render(page());
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(within(nav).getByRole('link', { name: 'Personal details' })).toHaveAttribute('href', '#personal-details');
    expect(screen.getByRole('link', { name: /Notifications/ })).toHaveAttribute('href', '/profile/notifications');
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/support');
    expect(screen.getByRole('heading', { name: 'Account deletion' })).toBeVisible();
    expect(screen.getByText('Connected', { exact: true })).toBeVisible();
    expect(screen.getByText('Not connected', { exact: true })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^(connect|disconnect|delete account)$/i })).not.toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(state.update).not.toHaveBeenCalled();
  });

  it('keeps edited values across a refetch and writes only changed fields when saving', async () => {
    const view = render(page());
    changeCity('Patong');
    state.current.details = { ...state.current.details, country: 'RU', postal_code: '12345' };
    state.current.dataUpdatedAt += 1;
    view.rerender(page());
    expect(city()).toHaveValue('Patong');
    expect(screen.getByRole('button', { name: 'Country' })).toHaveTextContent('Russia');
    expect(state.update).not.toHaveBeenCalled();
    fireEvent.click(save());
    expect(state.update).toHaveBeenCalledExactlyOnceWith({ city: 'Patong' });
    expect(await screen.findByText('Changes saved')).toBeVisible();
    expect(city()).toHaveValue('Patong');
    expect(save()).toBeDisabled();
    state.current.details = { ...state.current.details, city: 'Patong' };
    state.current.dataUpdatedAt += 1;
    view.rerender(page());
    expect(city()).toHaveValue('Patong');
    state.current.details = { ...state.current.details, city: 'Phuket' };
    state.current.dataUpdatedAt += 1;
    view.rerender(page());
    expect(city()).toHaveValue('Phuket');

  });

  it('retains draft after a failed save and does not share it with the next signed-in account', async () => {
    state.update.mockRejectedValueOnce(new Error('synthetic failure'));
    const view = render(page());
    changeCity('Still pending');
    fireEvent.click(save());
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
    expect(city()).toHaveValue('Still pending');
    expect(save()).toBeEnabled();
    state.current.user = { ...state.current.user, id: 'guest-b' };
    view.rerender(page());
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'City' })).not.toBeInTheDocument());
    expect(screen.queryByText('Sample Guest')).not.toBeInTheDocument();
    state.current.details = { ...state.current.details, id: 'guest-b', city: 'Bangkok' };
    view.rerender(page());
    expect(city()).toHaveValue('Bangkok');
    expect(save()).toBeDisabled();
    expect(state.update).toHaveBeenCalledTimes(1);
  });

  it('does not render an editable empty form when the read fails', () => {
    state.current.error = new Error('synthetic read failure');
    render(page());
    expect(screen.getByText(/Details could not be loaded/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('writes region selection through the existing active-city context, not the profile writer', async () => {
    render(page());
    fireEvent.keyDown(screen.getByRole('button', { name: 'City: Phuket' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sample City' }));
    expect(state.setCity).toHaveBeenCalledExactlyOnceWith('sample');
    expect(state.update).not.toHaveBeenCalled();
  });
});
