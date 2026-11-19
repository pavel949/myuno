import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AirportFastTrackPage from '../AirportFastTrackPage';
const f=vi.hoisted(()=>({user:{id:'synthetic-user'} as {id:string}|null,invoke:vi.fn(),toast:vi.fn()}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:f.user})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en',t:(key:string)=>key})}));
vi.mock('@/contexts/CurrencyContext',()=>({useCurrency:()=>({currencyInfo:{symbol:'฿'},convertPrice:(n:number)=>n})}));
vi.mock('@/hooks/useAirportServices',()=>({useAirportServices:()=>({fastTrackServices:[{id:'synthetic-arrival',sku:'synthetic-arrival',name_en:'Synthetic arrival',direction:'arrival',base_price:2000,night_surcharge:0,currency:'THB',includes_items:[]},{id:'synthetic-departure',sku:'synthetic-departure',name_en:'Synthetic departure',direction:'departure',base_price:2200,night_surcharge:0,currency:'THB',includes_items:[]}],addons:[],bundles:[],isLoading:false})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:any)=><main>{children}</main>}));
vi.mock('@/components/transport/TransferUpsellScreen',()=>({TransferUpsellScreen:()=> <p>Synthetic upsell boundary</p>}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke:(...args:any[])=>f.invoke(...args)}}}));
vi.mock('sonner',()=>{const toast=Object.assign((...args:any[])=>f.toast(...args),{error:(...args:any[])=>f.toast(...args)});return{toast};});
vi.mock('@/hooks/useHapticFeedback',()=>({triggerHaptic:()=>{}}));
vi.mock('@/hooks/useSoundEffects',()=>({playSound:()=>{},isTypingKey:()=>false}));
vi.mock('@/hooks/useFeedbackSettings',()=>({getFeedbackSettings:()=>({})}));
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname+l.search}</output>;}
function mount(direction='arrival',date='2099-12-01',passport:unknown='TEST123456'){
 sessionStorage.setItem('booking_draft:fasttrack_airport',JSON.stringify({ts:Date.now(),data:{direction,selectedServiceId:`synthetic-${direction}`,flightNumber:'TG123',flightDate:date,flightTime:'12:00',contactWhatsapp:'66812345678',contactEmail:'synthetic@example.test',preferredLang:'en',passengers:[{firstName:'Synthetic',lastName:'Guest',passportNumber:passport,nationality:'Synthetic nationality',dateOfBirth:'2000-01-01'}],selectedAddons:[],step:'review'}}));
 return render(<MemoryRouter initialEntries={['/transport/fast-track']}><Location/><AirportFastTrackPage/></MemoryRouter>);
}
beforeEach(()=>{sessionStorage.clear();f.user={id:'synthetic-user'};f.invoke.mockReset().mockResolvedValue({data:{success:true,booking_id:'synthetic-booking'},error:null});f.toast.mockReset();vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
describe('Fast Track review and submission with synthetic boundary',()=>{
 it.each(['arrival','departure'])('omits passports in review but sends the intact passport for %s',async direction=>{mount(direction);await screen.findByText('Synthetic Guest');expect(screen.queryByText(/TEST123456/)).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Send request'}));await waitFor(()=>expect(f.invoke).toHaveBeenCalledTimes(1));expect(f.invoke.mock.calls[0][0]).toBe('notify-fasttrack-booking');expect(f.invoke.mock.calls[0][1].body).toMatchObject({direction,passengers:[{passport_number:'TEST123456'}]});await waitFor(()=>expect(sessionStorage.getItem('booking_draft:fasttrack_airport')).toBeNull());});
 it('keeps the draft on failed submit',async()=>{f.invoke.mockResolvedValue({data:{success:false,error:'Synthetic rejection'},error:null});mount();fireEvent.click(await screen.findByRole('button',{name:'Send request'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('could not verify receipt'));expect(sessionStorage.getItem('booking_draft:fasttrack_airport')).not.toBeNull();expect(screen.queryByText('Synthetic upsell boundary')).toBeNull();});
 it('retains an incomplete receipt and blocks duplicate submit even after remount',async()=>{
  f.invoke.mockResolvedValue({data:{success:false,booking_id:'synthetic-partial',receipt_status:'incomplete',error:'PASSENGERS_NOT_SAVED'},error:null});
  const view=mount();fireEvent.click(await screen.findByRole('button',{name:'Send request'}));
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Request synthetic-partial was created, but passenger details were not saved'));
  expect(screen.getByRole('button',{name:'Send request'})).toBeDisabled();
  expect(screen.queryByText('Synthetic upsell boundary')).toBeNull();
  await waitFor(()=>expect(JSON.parse(sessionStorage.getItem('booking_draft:fasttrack_airport')!).data.incompleteBookingId).toBe('synthetic-partial'));
  view.unmount();
  render(<MemoryRouter initialEntries={['/transport/fast-track']}><AirportFastTrackPage/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Do not send another request'));
  fireEvent.click(screen.getByRole('button',{name:'Send request'}));
  expect(f.invoke).toHaveBeenCalledTimes(1);
 });
 it('retains the restored draft while sending a guest to the canonical auth return',async()=>{f.user=null;mount();fireEvent.click(await screen.findByRole('button',{name:'Send request'}));expect(screen.getByTestId('location')).toHaveTextContent('/auth?redirect=%2Ftransport%2Ffast-track');expect(f.invoke).not.toHaveBeenCalled();expect(sessionStorage.getItem('booking_draft:fasttrack_airport')).not.toBeNull();});
 it('rechecks the clock when a valid review was left open across the cutoff',()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2099-11-30T04:59:00Z'));mount('arrival','2099-12-01');const book=screen.getByRole('button',{name:'Send request'});expect(book).toBeEnabled();vi.setSystemTime(new Date('2099-11-30T05:01:00Z'));fireEvent.click(book);expect(f.invoke).not.toHaveBeenCalled();expect(screen.getByText('Request at least 24 hours ahead')).toBeVisible();expect(document.getElementById('fasttrack-flightDate')).toHaveAttribute('aria-invalid','true');});
 it('omits a malformed restored passport without crashing or submitting it',async()=>{mount('arrival','2099-12-01',null);await screen.findByText('Synthetic Guest');fireEvent.click(screen.getByRole('button',{name:'Send request'}));expect(f.invoke).not.toHaveBeenCalled();});
 it('blocks a normalised invalid calendar date restored at review',async()=>{mount('arrival','2099-02-30');await screen.findByText('Synthetic Guest');expect(screen.getByRole('button',{name:'Send request'})).toBeDisabled();expect(f.invoke).not.toHaveBeenCalled();});
});
