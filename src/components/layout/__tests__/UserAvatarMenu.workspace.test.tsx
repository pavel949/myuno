import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserAvatarMenu } from '../UserAvatarMenu';
const state = vi.hoisted(() => ({ roles: ['owner'], isMCPortal: true, loading: false, language: 'en', switchContext: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test', email: 'test@example.invalid', user_metadata: {} }, signOut: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ availableRoles: state.roles, switchContext: state.switchContext }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: state.isMCPortal, isLoading: state.loading }) }));
vi.mock('@/hooks/useNotifications', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false }) }));
vi.mock('@/contexts/PlatformViewAsContext', () => ({ usePlatformViewAs: () => ({ enter: vi.fn() }) }));
vi.mock('@/components/ui/dropdown-menu', () => {
 const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
 return { DropdownMenu: Wrapper, DropdownMenuContent: Wrapper, DropdownMenuGroup: Wrapper, DropdownMenuLabel: Wrapper, DropdownMenuSeparator: () => null, DropdownMenuTrigger: Wrapper, DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button> };
});
function Location() { return <output>{useLocation().pathname}</output>; }
function setup() { return render(<MemoryRouter><UserAvatarMenu /><Location /></MemoryRouter>); }
afterEach(() => { cleanup(); state.roles = ['owner']; state.isMCPortal = true; state.loading = false; state.language = 'en'; vi.clearAllMocks(); });
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
