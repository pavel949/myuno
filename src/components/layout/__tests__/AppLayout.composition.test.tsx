import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AppLayout } from '../AppLayout';
import { NavShellContext } from '@/components/nav/NavShellContext';
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeRole: 'admin' }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({}) }));
vi.mock('@/hooks/useUserTracking', () => ({ useUserTracking: () => {} }));
vi.mock('@/hooks/usePlatformAnalytics', () => ({ usePlatformAnalytics: () => {} }));
vi.mock('@/components/nav/NavShell', () => ({ NavShell: ({ children }: { children: React.ReactNode }) => <NavShellContext.Provider value={{ active: true }}><header>Shared header</header>{children}</NavShellContext.Provider> }));
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
