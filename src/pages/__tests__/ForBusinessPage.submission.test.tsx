import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import ForBusinessPage from '../ForBusinessPage';
const fixture = vi.hoisted(() => ({ insert:vi.fn(), table:vi.fn(), success:vi.fn(), error:vi.fn() }));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:ReactNode})=><main>{children}</main>}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(name:string)=>{fixture.table(name);return {insert:fixture.insert};}}}));
vi.mock('sonner',()=>({toast:{success:fixture.success,error:fixture.error}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
function mount(){const r=render(<HelmetProvider><MemoryRouter><ForBusinessPage/></MemoryRouter></HelmetProvider>);fireEvent.change(screen.getByLabelText('Business name *'),{target:{value:'Synthetic QA business'}});fireEvent.change(screen.getByLabelText('Your name *'),{target:{value:'Synthetic guest'}});fireEvent.change(screen.getByLabelText('Email'),{target:{value:'synthetic@example.invalid'}});return r.container.querySelector('form')!;}
it('keeps one pending request, preserves values on error and allows retry',async()=>{
 let resolve!:(value:{error:null|Error})=>void;fixture.insert.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
 const form=mount();fireEvent.submit(form);fireEvent.submit(form);expect(fixture.insert).toHaveBeenCalledTimes(1);expect(fixture.table).toHaveBeenCalledWith('lead_magnet_submissions');expect(screen.getByRole('button',{name:'Sending...'})).toBeDisabled();expect(fixture.success).not.toHaveBeenCalled();
 await act(async()=>resolve({error:new Error('Synthetic rejected request')}));await waitFor(()=>expect(fixture.error).toHaveBeenCalledOnce());expect(screen.getByLabelText('Business name *')).toHaveValue('Synthetic QA business');
 fixture.insert.mockResolvedValueOnce({error:null});fireEvent.submit(form);await waitFor(()=>expect(fixture.success).toHaveBeenCalledOnce());expect(fixture.insert).toHaveBeenCalledTimes(2);expect(screen.getByLabelText('Business name *')).toHaveValue('');
});
it('rejects an empty contact without starting a writer',()=>{
 const form=mount();fireEvent.change(screen.getByLabelText('Email'),{target:{value:''}});fireEvent.submit(form);expect(fixture.insert).not.toHaveBeenCalled();expect(fixture.error).toHaveBeenCalledOnce();
});
