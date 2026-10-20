import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import Bookings from '@/pages/Bookings';
const state = vi.hoisted(() => ({ user: null as null | { id: string }, result: { data: [], error: null } as unknown, language: 'en', query: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language, t: (key: string) => key }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefresh: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/bookings/BookingTrackingOverview', () => ({ BookingTrackingOverview: () => <section>Canonical tracking overview</section> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 from: (...args: unknown[]) => { state.query(...args); return { select: () => ({ eq: () => ({ order: () => state.result }), in: () => ({ order: () => ({ data: [], error: null }) }) }) }; },
 channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
 removeChannel: vi.fn(),
} }));
const Where = () => { const location = useLocation(); return <output data-testid="where">{location.pathname + location.search + location.hash}</output>; };
const show = (entry = '/bookings?cluster=arrive&status=open&persona=P3&returnTo=%2Fproperty#tracking') => render(<MemoryRouter initialEntries={[entry]}><Where /><Routes><Route path="/bookings" element={<Bookings />} /><Route path="/auth" element={<p>Sign in</p>} /></Routes></MemoryRouter>);
afterEach(cleanup);
beforeEach(() => { state.user = null; state.language = 'en'; state.result = { data: [], error: null }; vi.clearAllMocks(); });
it('returns guests to the exact tracking path after authentication without reading private records', async () => {
 show();
 await screen.findByText('Sign in');
 const path = screen.getByTestId('where').textContent || '';
 expect(new URLSearchParams(path.split('?')[1]).get('redirect')).toBe('/bookings?cluster=arrive&status=open&persona=P3&returnTo=%2Fproperty#tracking');
 expect(state.query).not.toHaveBeenCalled();
});
it('shows canonical tracking while the independent legacy reader is pending', async () => {
 state.user = { id: 'synthetic-customer' };
 state.result = new Promise(() => {});
 show();
 expect(await screen.findByText('Canonical tracking overview')).toBeVisible();
 expect(state.query).toHaveBeenCalledWith('bookings');
});
it('preserves persona and return context when clearing only legacy filters', async () => {
 state.user = { id: 'synthetic-customer' };
 show();
 await screen.findByText('Canonical tracking overview');
 const buttons = await screen.findAllByRole('button', { name: 'Show all orders' });
 fireEvent.click(buttons[0]);
 await waitFor(() => {
   const path = screen.getByTestId('where').textContent || '';
   const url = new URL(path, 'https://www.myuno.app');
   const params = url.searchParams;
   expect(url.hash).toBe('#tracking');
   expect(params.get('persona')).toBe('P3');
   expect(params.get('returnTo')).toBe('/property');
   expect(params.has('cluster')).toBe(false);
   expect(params.has('status')).toBe(false);
 });
});
it('retains canonical tracking when the separate legacy reader fails', async () => {
 state.user = { id: 'synthetic-customer' };
 state.result = { data: null, error: new Error('synthetic offline') };
 show();
 expect(await screen.findByText('We could not load your orders')).toBeVisible();
 expect(screen.getByText('Canonical tracking overview')).toBeVisible();
});

it('localizes Thai booking headings, status, dates and filter controls', async () => {
 state.user = { id: 'synthetic-th-customer' };
 state.language = 'th';
 state.result = { data: [{ id: 'booking-th', booking_type: 'property', scheduled_at: '2026-10-20T12:00:00Z', created_at: '2026-10-19T12:00:00Z', status: 'pending', total_amount: 123, currency: 'THB' }], error: null };
 show('/bookings?cluster=manage&status=open');
 expect(await screen.findByRole('button', { name: 'เปิดคำสั่ง: ที่พัก' })).toBeVisible();
 expect(screen.getByRole('heading', { name: 'การจอง' })).toBeVisible();
 expect(screen.getByText('รอการยืนยัน')).toBeVisible();
 expect(screen.getByText('20 ต.ค. 2026')).toBeVisible();
 expect(screen.getByRole('button', { name: 'แสดงคำสั่งทั้งหมด' })).toBeVisible();
 expect(screen.getByRole('button', { name: 'ประวัติคำสั่ง' })).toBeVisible();
 expect(screen.getByText('การจัดการ', { exact: false })).toBeVisible();
});
it('localizes Thai legacy reader failures and retry', async () => {
 state.user = { id: 'synthetic-th-customer-error' };
 state.language = 'th';
 state.result = { data: null, error: new Error('synthetic offline') };
 show('/bookings');
 expect(await screen.findByText('ไม่สามารถโหลดคำสั่งของคุณได้')).toBeVisible();
 expect(screen.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeVisible();
});
it('localizes Thai successful empty booking states', async () => {
 state.user = { id: 'synthetic-th-customer-empty' };
 state.language = 'th';
 show('/bookings');
 expect(await screen.findByText('ยังไม่มีการจอง')).toBeVisible();
 expect(screen.getByText('การจองของคุณจะแสดงที่นี่')).toBeVisible();
});
