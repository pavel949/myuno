import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserAvatarMenu } from '../UserAvatarMenu';
const state = vi.hoisted(() => ({ roles: ['owner'], isMCPortal: true, loading: false, isMobile: false, isAdmin: false, language: 'en', switchContext: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test', email: 'test@example.invalid', user_metadata: {} }, signOut: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ availableRoles: state.roles, switchContext: state.switchContext }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: state.isMCPortal, isLoading: state.loading }) }));
vi.mock('@/hooks/useNotifications', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.isMobile }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: state.isAdmin }) }));
vi.mock('@/contexts/PlatformViewAsContext', () => ({ usePlatformViewAs: () => ({ enter: vi.fn() }) }));
vi.mock('@/components/ui/dropdown-menu', () => {
 const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
 return { DropdownMenu: Wrapper, DropdownMenuContent: Wrapper, DropdownMenuGroup: Wrapper, DropdownMenuLabel: Wrapper, DropdownMenuSeparator: () => null, DropdownMenuTrigger: Wrapper, DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button> };
});
function Location() { return <output>{useLocation().pathname}</output>; }
function setup(consumerHeader = false) { return render(<MemoryRouter><UserAvatarMenu consumerHeader={consumerHeader} /><Location /></MemoryRouter>); }
afterEach(() => { cleanup(); localStorage.removeItem("myuno:lastOperateRole"); state.roles = ['owner']; state.isMCPortal = true; state.loading = false; state.isMobile = false; state.isAdmin = false; state.language = 'en'; vi.clearAllMocks(); });
describe('verified workspace menu destinations', () => {
 it('sends a managed owner to the owner portal through the existing context switch', async () => {
   setup(); fireEvent.click(screen.getByRole('button', { name: /Owner portal/ }));
   expect(await screen.findByText('/my-property')).toBeInTheDocument();
   expect(state.switchContext).toHaveBeenCalledWith({ role: 'owner' });
 });
 it('keeps self-managed owners in property management', async () => {
   state.isMCPortal = false; setup(); fireEvent.click(screen.getByRole('button', { name: /Property management/ }));
   expect(await screen.findByText('/mc')).toBeInTheDocument();
 });
 it('waits for owner type and does not show the removed staff workspace', () => {
   state.loading = true; state.roles = ['owner', 'staff']; setup();
   expect(screen.queryByRole('button', { name: /Owner portal|Property management|Staff workspace/ })).toBeNull();
 });
 it.each([['en', 'Property developer portal'], ['ru', 'Кабинет застройщика'], ['th', 'พอร์ทัลผู้พัฒนาอสังหาริมทรัพย์']])('identifies the property developer portal in %s', (language, label) => {
   state.language = language; setup(); expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
 });
});

it('localizes ordinary Thai account destinations without changing their routes', async () => {
 state.language = 'th';
 setup();
 expect(screen.getByRole('button', { name: 'เมนูบัญชี' })).toBeVisible();
 for (const label of ['รายการโปรด', 'การจองและคำสั่งซื้อ', 'การแจ้งเตือน', 'โปรไฟล์', 'การตั้งค่า', 'กระเป๋าเงินและการชำระเงิน', 'ศูนย์ช่วยเหลือ', 'ออกจากระบบ']) expect(screen.getByRole('button', { name: label })).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: 'การจองและคำสั่งซื้อ' }));
 expect(await screen.findByText('/bookings')).toBeInTheDocument();
});


describe('mobile consumer account navigation', () => {
 function crowded() {
  state.roles = ['user', 'admin', 'uno_team', 'investor', 'vendor', 'owner', 'property_manager'];
  state.isAdmin = true;
 }
 it('puts personal destinations first, retains all workspace actions, and routes Settings exactly once', async () => {
  crowded(); state.isMobile = true; setup(true);
  const buttons = screen.getAllByRole('button');
  const before = (left: string, right: string) => {
   expect(buttons.indexOf(screen.getByRole('button', { name: left })))
    .toBeLessThan(buttons.indexOf(screen.getByRole('button', { name: new RegExp(`^${right}`) })));
  };
  expect(screen.getByRole('button', { name: 'Close account menu' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  for (const name of ['Investor portfolio', 'myUNO team', 'Provider workspace', 'Owner portal', 'Property management company', 'View as user', 'Newbuilds Console', 'Property developer portal']) {
   before('Profile', name);
   before('Settings', name);
   before('Bookings & Orders', name);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(await screen.findByText('/profile/settings')).toBeInTheDocument();
  expect(state.switchContext).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Investor portfolio/ }));
  expect(await screen.findByText('/invest/dashboard')).toBeInTheDocument();
  expect(state.switchContext).toHaveBeenCalledExactlyOnceWith({ role: 'investor' });
 });
 it.each([[false, true], [true, false]])('preserves the role-first menu for mobile=%s and consumer=%s outside the targeted context', (isMobile, consumerHeader) => {
  crowded(); state.isMobile = isMobile; setup(consumerHeader);
  const buttons = screen.getAllByRole('button');
  expect(buttons.indexOf(screen.getByRole('button', { name: /Investor portfolio/ })))
   .toBeLessThan(buttons.indexOf(screen.getByRole('button', { name: 'Settings' })));
  expect(screen.queryByRole('button', { name: 'Close account menu' })).not.toBeInTheDocument();
 });
});
