import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BecomePartnerPage from './BecomePartnerPage';

const fixture = vi.hoisted(() => ({ error: false, insert: vi.fn(), notify: vi.fn(), toastError: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children, usePageContainer }: { children: React.ReactNode; usePageContainer?: boolean }) => <main data-auto-frame={String(usePageContainer)}>{children}</main> }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: fixture.toastError }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 from: () => ({
  select: () => ({ eq: () => ({ in: () => ({ gte: () => ({ limit: async () => ({ data: [] }) }) }) }) }),
  insert: (payload: unknown) => { fixture.insert(payload); return { select: () => ({ single: async () => fixture.error ? { data: null, error: new Error('Synthetic error') } : { data: { id: 'synthetic-only' }, error: null } }) }; },
 }),
 functions: { invoke: fixture.notify },
} }));
beforeEach(() => {
 fixture.error = false;
 vi.clearAllMocks();
 fixture.notify.mockResolvedValue({ data: null, error: null });
 localStorage.clear(); // isolated JSDOM storage, never the connected browser.
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function assertFrame(container: HTMLElement) {
 expect(container.querySelector('main')).toHaveAttribute('data-auto-frame', 'false');
 const frame = container.querySelector('main > div');
 expect(frame).toHaveClass('max-w-3xl', 'mx-auto');
 expect(frame).not.toHaveClass('max-w-full', 'max-w-[1280px]');
}

it('keeps one explicitly bounded frame before submission', () => {
 const { container } = render(<MemoryRouter><BecomePartnerPage /></MemoryRouter>);
 assertFrame(container);
 expect(container.querySelector('form')).not.toBeNull();
 expect(fixture.insert).not.toHaveBeenCalled();
});

it.each([false, true])('preserves the bounded frame through synthetic submit (error=%s)', async error => {
 fixture.error = error;
 vi.spyOn(console, 'error').mockImplementation(() => {});
 const { container } = render(<MemoryRouter><BecomePartnerPage /></MemoryRouter>);
 const form = container.querySelector('form')!;
 fireEvent.click(form.querySelector('button[type="button"]')!);
 const fields = form.querySelectorAll('input[required]');
 ['Synthetic business', 'Synthetic contact', 'fixture@example.invalid', '123456789'].forEach((value, index) => fireEvent.change(fields[index], { target: { value } }));
 fireEvent.change(form.querySelector('textarea')!, { target: { value: 'Synthetic description only' } });
 fireEvent.submit(form);
 await waitFor(() => expect(fixture.insert).toHaveBeenCalledOnce());
 if (error) {
  await waitFor(() => expect(fixture.toastError).toHaveBeenCalled());
  expect(container.querySelector('form button[type="submit"]')).not.toBeDisabled();
  expect(fixture.notify).not.toHaveBeenCalled();
 } else {
  expect(await screen.findByRole('heading', { name: 'Application Received!' })).toBeVisible();
  expect(fixture.notify).toHaveBeenCalledWith('notify-admin-partner-application', { body: { application_id: 'synthetic-only' } });
 }
 assertFrame(container);
});
