import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import MeRequests from '@/pages/me/MeRequests';
const state = vi.hoisted(() => ({ user: null as null | { id: string }, isLoading: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useMyRequests', () => ({ useMyRequests: () => ({ data: [], isLoading: false }) }));
vi.mock('@/components/layout/MeShellLayout', () => ({ MeShellLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/page', () => ({ LoadingState: () => <p role="status">Loading requests</p>, EmptyState: () => <p>No requests</p> }));
const Where = () => { const location = useLocation(); return <span data-testid="where">{location.pathname + location.search + location.hash}</span>; };
const show = () => render(<MemoryRouter initialEntries={['/me/requests?source=visa&persona=P3&returnTo=%2Flegal#request-list']}><Where /><Routes><Route path="/me/requests" element={<MeRequests />} /><Route path="/auth" element={<p>Sign in</p>} /></Routes></MemoryRouter>);
afterEach(cleanup);
beforeEach(() => { state.user = null; state.isLoading = false; });
it('keeps auth loading separate from an empty request list', () => {
 state.isLoading = true;
 show();
 expect(screen.getByRole('status')).toHaveTextContent('Loading requests');
 expect(screen.queryByText('No requests')).toBeNull();
 expect(screen.queryByText('Sign in')).toBeNull();
});
it('returns guests to the exact filtered request route after login', async () => {
 show();
 await screen.findByText('Sign in');
 const path = screen.getByTestId('where').textContent || '';
 expect(new URLSearchParams(path.split('?')[1]).get('redirect')).toBe('/me/requests?source=visa&persona=P3&returnTo=%2Flegal#request-list');
 expect(screen.queryByText('No requests')).toBeNull();
});
it('keeps the signed-in request tracker and hub link', () => {
 state.user = { id: 'synthetic-customer' };
 show();
 expect(screen.getByRole('heading', { name: 'My requests' })).toBeVisible();
 expect(screen.getByRole('link', { name: 'All bookings and orders' })).toHaveAttribute('href', '/bookings');
 expect(screen.queryByText('Sign in')).toBeNull();
});
