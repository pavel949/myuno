import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroGreeting } from '../HeroGreeting';
import { WorkspaceHomeBanner } from '../WorkspaceHomeBanner';
import { PersonalHomeActions } from '../PersonalHomeActions';
import { HomePreferencesEntry } from '../HomePreferencesEntry';

const state = vi.hoisted(() => ({
  language: 'ru', user: { id: 'account-a', email: 'person@example.invalid', user_metadata: { full_name: 'Pavel Example' } } as { id: string; email: string; user_metadata: { full_name: unknown } } | null,
  availableRoles: ['user'], activeRole: 'user', isLoading: false, ownerLoading: false, isMCPortal: false,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => state }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: state.isMCPortal, isLoading: state.ownerLoading }) }));
vi.mock('../HomeTopBar', () => ({ HomeTopBar: () => <div>myUNO</div> }));
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}<Location /></MemoryRouter>;
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  localStorage.clear();
  state.language = 'ru'; state.user = { id: 'account-a', email: 'person@example.invalid', user_metadata: { full_name: 'Pavel Example' } };
  state.availableRoles = ['user']; state.activeRole = 'user'; state.isLoading = false; state.ownerLoading = false; state.isMCPortal = false;
});

describe('compact personal identity and actions', () => {
  it('greets the actual user inline without promoting an interest to identity', () => {
    const { container } = render(<HeroGreeting personas={['pet_owner']} onRoleSheetOpen={vi.fn()} onAppDrawerOpen={vi.fn()} />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pavel');
    expect(screen.queryByText(/В приоритете|Питомцы|Спросите/)).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden]')).toBeNull();
    expect(screen.getByRole('heading').querySelector('span')).toBeNull();
  });
  it('handles absent and non-string name metadata without crashing', () => {
    state.user!.user_metadata.full_name = { malformed: true };
    render(<HeroGreeting personas={[]} onRoleSheetOpen={vi.fn()} onAppDrawerOpen={vi.fn()} />, { wrapper });
    expect(screen.getByRole('heading')).toHaveTextContent('person');
  });
  it.each([
    ['ru', 'Личные разделы', 'Найти жильё, услугу, документ', ['Жильё', 'Услуги', 'Брони и заявки', 'Помощь']],
    ['en', 'Personal shortcuts', 'Find a home, service or document', ['Homes', 'Services', 'Bookings & requests', 'Help']],
    ['th', 'ทางลัดส่วนตัว', 'ค้นหาที่พัก บริการ หรือเอกสาร', ['ที่พัก', 'บริการ', 'การจองและคำขอ', 'ความช่วยเหลือ']],
  ] as const)('has one concise search and four stable actions in %s', (language, nav, search, labels) => {
    state.language = language;
    render(<PersonalHomeActions />, { wrapper });
    expect(screen.getByRole('link', { name: search })).toHaveAttribute('href', '/search');
    const paths = ['/property', '/services', '/bookings', '/support'];
    labels.forEach((label, index) => expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', paths[index]));
    expect(screen.getByRole('navigation', { name: nav }).querySelectorAll('a')).toHaveLength(4);
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByRole('link', { name: language === 'ru' ? 'Спланировать поездку' : language === 'th' ? 'วางแผนการเดินทาง' : 'Plan a trip' })).toHaveAttribute('href', '/trip-planner');
    fireEvent.click(screen.getByRole('link', { name: labels[2] }));
    expect(screen.getByTestId('location')).toHaveTextContent('/bookings');
  });
  it('opens interest editing only on the explicit lower control', () => {
    const open = vi.fn();
    render(<HomePreferencesEntry onOpen={open} />, { wrapper });
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Настроить главную' }));
    expect(open).toHaveBeenCalledOnce();
  });
  it('keeps the preference focus ring immediate instead of animating all properties', () => {
    render(<HomePreferencesEntry onOpen={vi.fn()} />, { wrapper });
    const button = screen.getByRole('button', { name: 'Настроить главную' });
    expect(button).toHaveClass('transition-colors', 'focus-visible:ring-2', 'focus-visible:ring-ring');
    expect(button).not.toHaveClass('transition-all');
  });
});

describe('personal and verified work navigation', () => {
  it.each(['guest', 'resident', 'loading', 'owner-loading'])('does not expose workspace links for %s', mode => {
    if (mode === 'guest') state.user = null;
    if (mode === 'resident') state.availableRoles = ['user', 'resident'];
    if (mode === 'loading') { state.isLoading = true; state.availableRoles = ['admin']; }
    if (mode === 'owner-loading') { state.ownerLoading = true; state.availableRoles = ['owner']; }
    localStorage.setItem('myuno:home-workspace:account-a', '/admin');
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('gives a verified admin one explicit management entry, keeping personal home current', () => {
    state.availableRoles = ['user', 'admin'];
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Личное' })).toHaveAttribute('aria-current', 'page');
    const work = screen.getByRole('link', { name: 'Работа: Управление объектами' });
    expect(work).toHaveAttribute('href', '/mc');
    expect(screen.getByTestId('location')).toHaveTextContent('/');
    fireEvent.click(work);
    expect(screen.getByTestId('location')).toHaveTextContent('/mc');
    expect(localStorage.getItem('myuno:home-workspace:account-a')).toBe('/mc');
  });
  it('remembers an explicit permitted destination without auto-redirecting', () => {
    state.availableRoles = ['user', 'admin', 'vendor'];
    const { unmount } = render(<WorkspaceHomeBanner />, { wrapper });
    fireEvent.click(screen.getByRole('link', { name: 'Кабинет поставщика' }));
    unmount();
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Работа: Кабинет поставщика' })).toHaveAttribute('href', '/vendor');
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
  it.each(['/admin', 'https://attacker.invalid', 'javascript:alert(1)'])('ignores revoked or unsafe saved target %s', saved => {
    state.availableRoles = ['user', 'vendor'];
    localStorage.setItem('myuno:home-workspace:account-a', saved);
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Работа: Кабинет поставщика' })).toHaveAttribute('href', '/vendor');
  });
  it('does not carry a destination across an account change', () => {
    state.availableRoles = ['user', 'admin', 'vendor'];
    localStorage.setItem('myuno:home-workspace:account-a', '/vendor');
    const { rerender } = render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Работа: Кабинет поставщика' })).toBeInTheDocument();
    state.user = { ...state.user!, id: 'account-b' };
    rerender(<WorkspaceHomeBanner />);
    expect(screen.getByRole('link', { name: 'Работа: Управление объектами' })).toHaveAttribute('href', '/mc');
  });
  it.each([['uno_team', '/team']])('does not treat %s as property-management authority', (role, path) => {
    state.availableRoles = ['user', role];
    render(<WorkspaceHomeBanner />, { wrapper });
    const links = screen.getAllByRole('link');
    expect(links.some(link => link.getAttribute('href') === path)).toBe(true);
    expect(links.some(link => link.getAttribute('href') === '/mc')).toBe(false);
  });
  it('does not expose the removed staff dashboard or substitute team authority', () => {
    state.availableRoles = ['user', 'staff'];
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('offers the guarded Capital workspace only to an existing investor role', () => {
    state.language = 'en'; state.availableRoles = ['investor'];
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Capital deal workspace' })).toHaveAttribute('href', '/capital');
  });
  it('routes an MC-managed owner to the owner portal', () => {
    state.availableRoles = ['user', 'owner']; state.isMCPortal = true;
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('link', { name: 'Работа: Кабинет собственника' })).toHaveAttribute('href', '/my-property');
  });
  it('tolerates blocked device storage', () => {
    state.availableRoles = ['user', 'vendor'];
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<WorkspaceHomeBanner />, { wrapper });
    fireEvent.click(screen.getByRole('link', { name: 'Работа: Кабинет поставщика' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/vendor');
  });
  it.each([['en', 'Personal and work', 'Personal', 'Work: Provider workspace'], ['th', 'ส่วนตัวและงาน', 'ส่วนตัว', 'งาน: พื้นที่ทำงานผู้ให้บริการ']])('localizes the workspace switch in %s', (language, nav, personal, work) => {
    state.language = language; state.availableRoles = ['vendor'];
    render(<WorkspaceHomeBanner />, { wrapper });
    expect(screen.getByRole('navigation', { name: nav })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: personal })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: work })).toHaveAttribute('href', '/vendor');
  });
});
