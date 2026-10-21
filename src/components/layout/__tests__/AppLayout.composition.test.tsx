import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AppLayout } from '../AppLayout';
import { NavShellContext } from '@/components/nav/NavShellContext';
const state = vi.hoisted(() => ({ activeRole: 'admin' }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeRole: state.activeRole }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({}) }));
vi.mock('@/hooks/useUserTracking', () => ({ useUserTracking: () => {} }));
vi.mock('@/hooks/usePlatformAnalytics', () => ({ usePlatformAnalytics: () => {} }));
vi.mock('@/components/nav/NavShell', () => ({ NavShell: ({ children, role }: { children: React.ReactNode; role: string }) => <NavShellContext.Provider value={{ active: true }}><header data-role={role}>Shared header</header>{children}</NavShellContext.Provider> }));
vi.mock('../Footer', () => ({ Footer: () => <footer>Footer</footer> }));
vi.mock('@/components/auth/EmailVerificationBanner', () => ({ EmailVerificationBanner: () => <div>Verification</div> }));
vi.mock('@/components/pwa/InstallBanner', () => ({ InstallBanner: () => null }));
vi.mock('@/components/pwa/MobileInstallSheet', () => ({ MobileInstallSheet: () => null }));
afterEach(cleanup);
it('keeps one owner of navigation and banners across nested feature layouts', () => {
 render(<AppLayout><AppLayout><p>Feature</p></AppLayout></AppLayout>);
 expect(screen.getAllByText('Shared header')).toHaveLength(1);
 expect(screen.getAllByText('Verification')).toHaveLength(1);
 expect(screen.getByText('Feature')).toBeInTheDocument();
});
it('renders a footer only when explicitly requested', () => {
 const { rerender } = render(<AppLayout><p>Content</p></AppLayout>);
 expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
 rerender(<AppLayout showFooter><p>Content</p></AppLayout>);
 expect(screen.getByRole('contentinfo')).toBeInTheDocument();
});

it.each(['guest', 'owner', 'property_manager', 'vendor', 'admin', 'uno_team', 'investor'])('keeps the public shell stable for active role %s', role => {
 state.activeRole = role;
 render(<AppLayout><p>Public tracking</p></AppLayout>);
 expect(screen.getByText('Shared header')).toHaveAttribute('data-role', 'guest');
});
it('preserves an explicitly selected workspace navigation role', () => {
 render(<AppLayout variant="workspace" navRole="owner"><p>Workspace</p></AppLayout>);
 expect(screen.getByText('Shared header')).toHaveAttribute('data-role', 'owner');
});
