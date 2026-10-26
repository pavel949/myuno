import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BecomePartnerPage from './BecomePartnerPage';

const fixture = vi.hoisted(() => ({ error: false, missingId: false, returned: undefined as undefined | Record<string,string>, insert: vi.fn(), notify: vi.fn(), toastError: vi.fn(), toast: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children, usePageContainer }: { children: React.ReactNode; usePageContainer?: boolean }) => <main data-auto-frame={String(usePageContainer)}>{children}</main> }));
vi.mock('sonner', () => ({ toast: Object.assign(fixture.toast, { error: fixture.toastError }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 from: () => ({
  select: () => ({ eq: () => ({ in: () => ({ gte: () => ({ limit: async () => ({ data: [] }) }) }) }) }),
  insert: (payload: unknown) => { fixture.insert(payload); return { select: () => ({ single: async () => fixture.error ? { data: null, error: new Error('Synthetic error') } : { data: fixture.returned ?? (fixture.missingId ? null : { id: 'synthetic-only' }), error: null } }) }; },
 }),
 functions: { invoke: fixture.notify },
} }));
beforeEach(() => {
 fixture.error = false;
 fixture.missingId = false;
 fixture.returned = undefined;
 vi.clearAllMocks();
 fixture.notify.mockResolvedValue({ data: null, error: null });
 localStorage.clear(); // isolated JSDOM storage, never the connected browser.
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function assertFrame(container: HTMLElement) {
 expect(container.querySelector('main')).toHaveAttribute('data-auto-frame', 'false');
 const frame = container.querySelector('main > div');
 expect(frame).toHaveClass('max-w-3xl', 'ds-frame');
 expect(frame).not.toHaveClass('max-w-full', 'max-w-[1280px]');
}

it('keeps one explicitly bounded frame before submission', () => {
 const { container } = render(<MemoryRouter><BecomePartnerPage /></MemoryRouter>);
 assertFrame(container);
 expect(container.querySelector('form')).not.toBeNull();
 expect(fixture.insert).not.toHaveBeenCalled();
});

it.each([{error:false,notifyError:false},{error:false,notifyError:true},{error:true,notifyError:false},{error:false,notifyError:false,missingId:true}])('preserves the bounded frame and persisted acknowledgement (error=$error, notification failure=$notifyError)', async ({error,notifyError,missingId}) => {
 if (notifyError) fixture.notify.mockRejectedValueOnce(new Error('Synthetic notification failure'));
 fixture.error = error;
 fixture.missingId = !!missingId;
 vi.spyOn(console, 'error').mockImplementation(() => {});
 const { container } = render(<MemoryRouter><BecomePartnerPage /></MemoryRouter>);
 const form = container.querySelector('form')!;
 fireEvent.click(form.querySelector('button[type="button"]')!);
 const fields = form.querySelectorAll('input[required]');
 ['Synthetic business', 'Synthetic contact', 'fixture@example.invalid', '123456789'].forEach((value, index) => fireEvent.change(fields[index], { target: { value } }));
 fireEvent.change(form.querySelector('textarea')!, { target: { value: 'Synthetic description only' } });
 fireEvent.submit(form);
 await waitFor(() => expect(fixture.insert).toHaveBeenCalledOnce());
 if (error || missingId) {
  await waitFor(() => expect(fixture.toastError).toHaveBeenCalled());
  expect(container.querySelector('form button[type="submit"]')).not.toBeDisabled();
  expect(fixture.notify).not.toHaveBeenCalled();
 } else {
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Application Received!' })).toBeVisible());
  expect(fixture.toast).toHaveBeenCalledWith('Application submitted!', { description: 'Your application has been saved for review.' });
  expect(screen.queryByText(/within 2-3 business days/)).toBeNull();
  expect(fixture.notify).toHaveBeenCalledWith('notify-admin-partner-application', { body: { application_id: 'synthetic-only' } });
 }
 assertFrame(container);
});

it.each([{}, {id:''}])('retains the draft and form without success for an unconfirmed insert %j',async returned=>{
 fixture.returned=returned;vi.spyOn(console,'error').mockImplementation(()=>{});
 const {container}=render(<MemoryRouter><BecomePartnerPage/></MemoryRouter>);
 const form=container.querySelector('form')!;fireEvent.click(form.querySelector('button[type="button"]')!);
 const fields=form.querySelectorAll('input[required]');
 ['Synthetic business','Synthetic contact','fixture@example.invalid','123456789'].forEach((value,index)=>fireEvent.change(fields[index],{target:{value}}));
 fireEvent.change(form.querySelector('textarea')!,{target:{value:'Synthetic retained draft'}});
 await waitFor(()=>expect(localStorage.getItem('become_partner_draft_v1')).toContain('Synthetic retained draft'));
 const draft=localStorage.getItem('become_partner_draft_v1');fireEvent.submit(form);
 await waitFor(()=>expect(fixture.toastError).toHaveBeenCalledOnce());
 expect(fixture.insert).toHaveBeenCalledOnce();expect(fixture.notify).not.toHaveBeenCalled();expect(fixture.toast).not.toHaveBeenCalled();
 expect(screen.queryByRole('heading',{name:'Application Received!'})).toBeNull();
 expect(form).toBeInTheDocument();expect(form.querySelector('button[type="submit"]')).not.toBeDisabled();
 expect(fields[0]).toHaveValue('Synthetic business');expect(form.querySelector('textarea')).toHaveValue('Synthetic retained draft');
 expect(localStorage.getItem('become_partner_draft_v1')).toBe(draft);
});
