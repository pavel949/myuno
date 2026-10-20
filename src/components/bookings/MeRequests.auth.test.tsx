import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { MyRequest, RequestSource } from '@/hooks/useMyRequests';
import MeRequests from '@/pages/me/MeRequests';
const state = vi.hoisted(() => ({ user: null as null | { id: string }, isLoading: false, language: 'en', data: [] as MyRequest[], failedSources: [] as RequestSource[], refetch: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useMyRequests', () => ({ useMyRequests: () => ({ data: state.data, failedSources: state.failedSources, refetch: state.refetch, isLoading: false }) }));
vi.mock('@/components/layout/MeShellLayout', () => ({ MeShellLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/page', () => ({ LoadingState: () => <p role="status">Loading requests</p>, EmptyState: ({ title, description }: { title: string; description: string }) => <div><h2>{title}</h2><p>{description}</p></div> }));
const Where = () => { const location = useLocation(); return <span data-testid="where">{location.pathname + location.search + location.hash}</span>; };
const show = (entry = '/me/requests?source=visa&persona=P3&returnTo=%2Flegal#request-list') => render(<MemoryRouter initialEntries={[entry]}><Where /><Routes><Route path="/me/requests" element={<MeRequests />} /><Route path="/auth" element={<p>Sign in</p>} /></Routes></MemoryRouter>);
afterEach(cleanup);
beforeEach(() => { state.user = null; state.isLoading = false; state.language = 'en'; state.data = []; state.failedSources = []; vi.clearAllMocks(); });
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

it('retains successful records and offers retry when another source fails', () => {
 state.user = { id: 'synthetic-customer' };
 state.failedSources = ['visa'];
 state.data = [{ id: 'help-one', source: 'help', status: 'new', title: 'Synthetic help request', createdAt: '2026-10-20T00:00:00Z' }];
 show('/me/requests');
 expect(screen.getByRole('alert')).toHaveTextContent('Some requests could not be loaded');
 expect(screen.getByText('Synthetic help request')).toBeVisible();
 expect(screen.queryByText('No requests')).toBeNull();
 expect(screen.queryByText('Empty')).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));
 expect(state.refetch).toHaveBeenCalledOnce();
});
it('does not claim an empty result when every source fails', () => {
 state.user = { id: 'synthetic-customer' };
 state.failedSources = ['visa', 'order', 'concierge', 'help'];
 show('/me/requests');
 expect(screen.getByRole('alert')).toBeVisible();
 expect(screen.queryByText('No requests')).toBeNull();
});
it('shows a verified successful empty result', () => {
 state.user = { id: 'synthetic-customer' };
 show('/me/requests');
 expect(screen.queryByRole('alert')).toBeNull();
 expect(screen.getByText('No requests')).toBeVisible();
});
it.each([['visa', true], ['help', false]] as const)('limits read-completeness warnings to source filter %s', (source, shouldWarn) => {
 state.user = { id: 'synthetic-customer' };
 state.failedSources = ['visa'];
 show('/me/requests?source=' + source);
 expect(Boolean(screen.queryByRole('alert'))).toBe(shouldWarn);
 expect(Boolean(screen.queryByText('Nothing found'))).toBe(!shouldWarn);
});
it.each([['ru', 'Повторить загрузку'], ['th', 'ลองโหลดอีกครั้ง']] as const)('localizes the failure retry in %s', (language, label) => {
 state.user = { id: 'synthetic-customer' };
 state.language = language;
 state.failedSources = ['visa'];
 show('/me/requests?source=visa');
 expect(screen.getByRole('button', { name: label })).toBeVisible();
});

it('clears only the source filter while preserving router context and anchor', async () => {
 state.user = { id: 'synthetic-customer' };
 show();
 fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
 await waitFor(() => {
   const url = new URL(screen.getByTestId('where').textContent || '', 'https://www.myuno.app');
   expect(url.searchParams.has('source')).toBe(false);
   expect(url.searchParams.get('persona')).toBe('P3');
   expect(url.searchParams.get('returnTo')).toBe('/legal');
   expect(url.hash).toBe('#request-list');
 });
});

it('localizes Thai request headings, filters and verified empty state', () => {
 state.user = { id: 'synthetic-th-customer' };
 state.language = 'th';
 show('/me/requests?source=help');
 expect(screen.getByRole('heading', { name: 'คำขอของฉัน' })).toBeVisible();
 expect(screen.getByText('ติดตามคำขอของคุณได้ในที่เดียว')).toBeVisible();
 expect(screen.getByRole('button', { name: 'ล้างตัวกรอง' })).toBeVisible();
 expect(screen.getByRole('heading', { name: 'ไม่พบรายการ' })).toBeVisible();
 expect(screen.getByText('ไม่มีคำขอตรงกับตัวกรองที่เลือก')).toBeVisible();
});
it('localizes Thai request columns and dates without translating authored user content', () => {
 state.user = { id: 'synthetic-th-customer' };
 state.language = 'th';
 state.data = [{ id: 'help-th', source: 'help', status: 'new', title: 'Original user request', subtitle: 'Original user note', createdAt: '2026-10-20T00:00:00Z' }];
 show('/me/requests');
 expect(screen.getByText('Original user request')).toBeVisible();
 expect(screen.getByText(/Original user note/)).toBeVisible();
 expect(screen.getByRole('heading', { name: 'ใหม่' })).toBeVisible();
 expect(screen.getByRole('heading', { name: 'กำลังดำเนินการ' })).toBeVisible();
 expect(screen.getAllByText('ไม่มีรายการ')).toHaveLength(3);
 expect(screen.getByText('ความช่วยเหลือ myUNO')).toBeVisible();
});
