import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({rpc:vi.fn(),language:'en'}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:state.rpc}}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:state.language})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:React.ReactNode})=><main>{children}</main>}));
vi.mock('@/components/seo',()=>({SEOHead:()=>null}));
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import ExchangeBotPage from '../ExchangeBotPage';
const mount=()=>render(<CurrencyProvider><ExchangeBotPage /></CurrencyProvider>);
beforeEach(()=>{state.language='en';state.rpc.mockReset();localStorage.clear();vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Network forbidden');}));});
afterEach(()=>vi.unstubAllGlobals());
describe('canonical reference exchange rates',()=>{
 it('shows a real recorded timestamp and inverse THB calculation, never fabricated merchants or trends',async()=>{
  state.rpc.mockResolvedValue({data:{USD:{rate:0.025,updated_at:'2026-10-01T00:00:00Z'},EUR:{rate:0.02,updated_at:'2026-10-02T00:00:00Z'}},error:null});
  mount();await screen.findByText('40,000 THB');
  expect(state.rpc).toHaveBeenCalledWith('get_all_currency_rates');
  expect(document.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-01T00:00:00Z');
  fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'EUR'}});
  expect(await screen.findByText('50,000 THB')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'-2'}});
  expect(document.querySelector('output')).toHaveTextContent('—');
  expect(screen.queryByText(/SuperRich|K79|SiamExchange|4\.8|Updated:/)).toBeNull();
  expect(screen.queryByText(/0\.3%|37\.20/)).toBeNull();
 });
 it('does not publish fallback context rates as actual reference data when RPC fails',async()=>{
  state.rpc.mockResolvedValue({data:null,error:new Error('offline')});mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Rates could not be loaded');
  expect(screen.queryByRole('combobox')).toBeNull();expect(document.querySelector('time')).toBeNull();
 });
 it.each([null,{}, {USD:{rate:0.025,updated_at:null}}, {USD:{rate:-1,updated_at:'2026-10-01T00:00:00Z'}}, {USD:{rate:0.025,updated_at:'invalid'}}])('keeps missing or invalid data unavailable %#',async data=>{
  state.rpc.mockResolvedValue({data,error:null});mount();
  expect(await screen.findByRole('status')).toHaveTextContent('No rates with a recorded update date');
  expect(screen.queryByRole('combobox')).toBeNull();
 });
 it('keeps loading distinct until the read resolves',async()=>{
  let resolve!:(r:unknown)=>void;state.rpc.mockReturnValue(new Promise(r=>{resolve=r;}));mount();
  expect(screen.getByRole('status')).toHaveTextContent('Loading rates');
  await act(async()=>resolve({data:{},error:null}));
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('No rates'));
 });
 it.each(['ru','th'])('localizes unavailable state in %s',async language=>{
  state.language=language;state.rpc.mockResolvedValue({data:{},error:null});mount();
  await waitFor(()=>expect(screen.getByRole('status')).not.toHaveTextContent('Loading'));
  expect(screen.getByRole('heading',{level:1})).not.toHaveTextContent('Reference exchange rates');
 });
});
