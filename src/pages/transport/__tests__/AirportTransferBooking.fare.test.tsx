import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AirportTransferBooking from '../AirportTransferBooking';
const f=vi.hoisted(()=>({
  user:null as null|{id:string},vehicles:[] as any[],destinations:[] as any[],loading:false,error:null as Error|null,
  nightRead:vi.fn(),create:vi.fn(),invoke:vi.fn(),toast:vi.fn(),
  tripRead:vi.fn(),propertyRead:vi.fn(),tripFilter:vi.fn(),
}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:f.user})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useTransportConfig',()=>({useVehicleTypes:()=>({vehicleTypes:f.vehicles,isLoading:f.loading,error:f.error}),useTransportDestinations:()=>({destinations:f.destinations,isLoading:false,error:null})}));
vi.mock('@/hooks/useOrders',()=>({useOrders:()=>({createOrder:f.create,isCreating:false})}));
vi.mock('@/hooks/useProfile',()=>({useProfile:()=>({profile:null})}));
vi.mock('@/hooks/useGeolocation',()=>({useGeolocation:()=>({supported:false})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:any)=><main>{children}</main>}));
vi.mock('@/components/transport/booking-steps/StepRoute', () => ({
  StepRoute: ({ formData }: { formData: { destinationAddress: string; passengers: string; flightNumber: string } }) => (
    <output data-testid="transfer-route-values">
      {JSON.stringify([formData.destinationAddress, formData.passengers, formData.flightNumber])}
    </output>
  ),
}));
vi.mock('@/components/transport/booking-steps/StepDetails',()=>({StepDetails:()=>null}));
vi.mock('@/components/auth/InlineAuthGate',()=>({InlineAuthGate:({open,onOpenChange,onAuthenticated}:any)=>open?<div><button onClick={()=>{f.user={id:'synthetic-user'};onAuthenticated();onOpenChange(false);}}>Synthetic sign in</button><button onClick={()=>onOpenChange(false)}>Cancel auth</button></div>:null}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const reads = {
        transfer_night_surcharge_config: f.nightRead,
        property_bookings: f.tripRead,
        public_property_catalog: f.propertyRead,
      };
      const read = reads[table as keyof typeof reads];
      if (!read) throw Error('Unexpected read');
      const query = {
        select: () => query,
        eq: (column: string, value: string) => {
          if (table === 'property_bookings') f.tripFilter(column, value);
          return query;
        },
        limit: () => query,
        in: () => query,
        maybeSingle: () => read(),
      };
      return query;
    },
    functions: { invoke: (...args: unknown[]) => f.invoke(...args) },
  },
}));
vi.mock('sonner',()=>({toast:{error:(...args:any[])=>f.toast(...args),info:vi.fn()}}));
vi.mock('@/hooks/useHapticFeedback',()=>({triggerHaptic:()=>{}}));
vi.mock('@/hooks/useSoundEffects',()=>({playSound:()=>{},isTypingKey:()=>false}));
vi.mock('@/hooks/useFeedbackSettings',()=>({getFeedbackSettings:()=>({})}));
const data={direction:'from-airport',terminal:'international',destinationAddress:'Synthetic address',selectedDestinationId:'',flightNumber:'TG123',arrivalDate:'2099-12-01',arrivalTime:'12:00',passengers:'1',luggage:'1',vehicleType:'sedan',name:'Synthetic Guest',phone:'66812345678',email:'',notes:'',meetingSignName:'SYNTHETIC',paymentMethod:'cash'};
function mount(step=3,changes={}){sessionStorage.setItem('booking_draft:transfer_airport',JSON.stringify({ts:Date.now(),data:{step,formData:{...data,...changes}}}));return render(<MemoryRouter><AirportTransferBooking/></MemoryRouter>);}
beforeEach(()=>{sessionStorage.clear();f.user={id:'synthetic-user'};f.vehicles=[{id:'sedan',name_en:'Synthetic sedan',name_ru:'Седан',base_price:1200,price_multiplier:1,max_passengers:4}];f.destinations=[];f.loading=false;f.error=null;f.nightRead.mockReset().mockResolvedValue({data:null,error:null});f.create.mockReset().mockResolvedValue({success:false});f.invoke.mockReset().mockResolvedValue({data:{},error:null});f.toast.mockReset();});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});

describe('transfer opened from a stay', () => {
  const bookingId = '91cacccb-659e-4012-83f5-91542779f160';

  beforeEach(() => {
    f.tripRead.mockReset().mockResolvedValue({ data: { property_id: 'property', guests_count: 4 }, error: null });
    f.propertyRead.mockReset().mockResolvedValue({ data: { address: 'Recorded stay address' }, error: null });
    f.tripFilter.mockClear();
  });

  function openTripTransfer() {
    return render(
      <MemoryRouter initialEntries={['/transport/airport-transfer?booking_id=' + bookingId]}>
        <AirportTransferBooking />
      </MemoryRouter>,
    );
  }

  it('copies stay details only from the current guest’s exact booking', async () => {
    openTripTransfer();
    expect(f.tripRead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use stay details' }));

    await screen.findByText('Stay details added. Review the route and passenger count.');
    expect(f.tripFilter.mock.calls).toEqual([['id', bookingId], ['guest_id', 'synthetic-user']]);
    expect(screen.getByTestId('transfer-route-values')).toHaveTextContent('["Recorded stay address","4",""]');
    expect(f.create).not.toHaveBeenCalled();
    expect(f.invoke).not.toHaveBeenCalled();
  });

  it('avoids a property read when the booking is outside the guest’s access', async () => {
    f.tripRead.mockResolvedValue({ data: null, error: null });
    openTripTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Use stay details' }));

    await screen.findByText(/stay details are unavailable/i);
    expect(f.propertyRead).not.toHaveBeenCalled();
    expect(screen.getByTestId('transfer-route-values')).toHaveTextContent('["","1",""]');
  });

  it('does not restore linked stay details from a different account or offer the read to a guest', () => {
    sessionStorage.setItem(
      'booking_draft:transfer_airport:another-user:' + bookingId,
      JSON.stringify({ ts: Date.now(), data: { step: 0, formData: { ...data, destinationAddress: 'Another stay' } } }),
    );
    f.user = null;
    openTripTransfer();

    expect(screen.queryByRole('button', { name: 'Use stay details' })).not.toBeInTheDocument();
    expect(screen.getByTestId('transfer-route-values')).toHaveTextContent('["","1",""]');
    expect(f.tripRead).not.toHaveBeenCalled();
  });
});

describe('actual transfer page with synthetic read/write boundaries',()=>{
 it('restores a review draft and never displays or submits the old 800 fallback',async()=>{f.vehicles[0].base_price=0;mount();await screen.findAllByText('Price requires confirmation');expect(screen.queryByText(/฿800/)).toBeNull();const button=screen.getByRole('button',{name:'Price requires confirmation'});expect(button).toBeDisabled();fireEvent.click(button);expect(f.create).not.toHaveBeenCalled();});
 it('uses the same confirmation label in the actual vehicle picker',async()=>{f.vehicles[0].base_price=0;mount(1);await screen.findByText('Choose your vehicle');expect(screen.getAllByText('Price requires confirmation').length).toBeGreaterThan(0);expect(screen.getByRole('button',{name:/Continue/})).toBeDisabled();});
 it('rejects an orphaned saved vehicle even when a route rate exists',async()=>{f.destinations=[{id:'zone',base_price:1800}];mount(3,{vehicleType:'removed',selectedDestinationId:'zone'});await screen.findAllByText('Price requires confirmation');expect(f.create).not.toHaveBeenCalled();});
 it.each(['from-airport','to-airport'])('preserves a valid configured cash submission for %s',async direction=>{mount(3,{direction});fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));await waitFor(()=>expect(f.create).toHaveBeenCalledTimes(1));expect(f.create.mock.calls[0][0]).toMatchObject({total_amount:1200,currency:'THB',metadata:{base_price:1200,direction},payment:{method:'cash',amount:1200}});});
 it.each(['cash','concierge_advance'])('keeps configured %s notification dispatch on the existing boundary',async method=>{vi.spyOn(window,'open').mockImplementation(()=>null);f.create.mockResolvedValue({success:true,order_id:'synthetic-order',order_number:'SYNTHETIC'});mount(3,{paymentMethod:method});fireEvent.click(await screen.findByRole('button',{name:/Book •/}));await screen.findByText('Transfer request saved');expect(f.invoke).toHaveBeenCalledTimes(1);expect(f.invoke.mock.calls[0]).toMatchObject(['notify-transfer-booking',{body:{order_id:'synthetic-order',total_amount:1200,payment_method:method}}]);});
 it('shows only saved request, not confirmation or delivered alerts, when notification fails',async()=>{
  f.create.mockResolvedValue({success:true,order_id:'synthetic-order',order_number:'SYNTHETIC'});
  f.invoke.mockResolvedValue({data:{success:false},error:null});
  mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));
  await screen.findByText('Transfer request saved');
  expect(screen.getByText('Awaiting myUNO confirmation')).toBeVisible();
  expect(screen.queryByText('Confirmed')).toBeNull();
  expect(screen.queryByText('Transfer Booked!')).toBeNull();
  expect(screen.getByText(/trip is not confirmed yet/)).toBeVisible();
  expect(f.create).toHaveBeenCalledTimes(1);
 });
 it('a guest authenticates before a saved request appears, with no duplicate creation',async()=>{
  f.user=null;f.create.mockResolvedValue({success:true,order_id:'synthetic-order',order_number:'SYNTHETIC'});
  const view=mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));
  expect(f.create).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole('button',{name:'Synthetic sign in'}));
  view.rerender(<MemoryRouter><AirportTransferBooking/></MemoryRouter>);
  await screen.findByText('Transfer request saved');
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.invoke.mock.calls[0][0]).toBe('notify-transfer-booking');
 });
 it('does not notify before card payment and surfaces checkout failure',async()=>{vi.spyOn(console,'error').mockImplementation(()=>{});f.create.mockResolvedValue({success:true,order_id:'synthetic-order'});f.invoke.mockResolvedValue({data:null,error:Error('Synthetic checkout failure')});mount(3,{paymentMethod:'stripe'});fireEvent.click(await screen.findByRole('button',{name:/Pay ฿/}));await screen.findByText(/Your order exists/);expect(f.invoke).toHaveBeenCalledTimes(1);expect(f.invoke.mock.calls[0][0]).toBe('create-checkout');expect(f.invoke.mock.calls[0][1].body.amount).toBe(1200);expect(sessionStorage.getItem('booking_draft:transfer_airport')).not.toBeNull();});
 it('does not clear the draft or notify when order creation fails',async()=>{mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));await waitFor(()=>expect(f.create).toHaveBeenCalledTimes(1));expect(f.invoke).not.toHaveBeenCalled();expect(sessionStorage.getItem('booking_draft:transfer_airport')).not.toBeNull();});
 it('revalidates a tariff removed during the delayed auth resume',async()=>{f.user=null;const view=mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));await screen.findByRole('button',{name:'Synthetic sign in'});vi.useFakeTimers();fireEvent.click(screen.getByRole('button',{name:'Synthetic sign in'}));f.vehicles=[{...f.vehicles[0],base_price:0}];view.rerender(<MemoryRouter><AirportTransferBooking/></MemoryRouter>);await act(async()=>{vi.advanceTimersByTime(60);});expect(f.create).not.toHaveBeenCalled();expect(f.invoke).not.toHaveBeenCalled();expect(f.toast).toHaveBeenCalledWith('Price requires confirmation');});
 it('resumes with the current fare after successful auth exactly once',async()=>{f.user=null;const view=mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));await screen.findByRole('button',{name:'Synthetic sign in'});vi.useFakeTimers();fireEvent.click(screen.getByRole('button',{name:'Synthetic sign in'}));f.vehicles=[{...f.vehicles[0],base_price:1300}];view.rerender(<MemoryRouter><AirportTransferBooking/></MemoryRouter>);await act(async()=>{vi.advanceTimersByTime(60);});expect(f.create).toHaveBeenCalledTimes(1);expect(f.create.mock.calls[0][0].total_amount).toBe(1300);});
 it('does not resume a dismissed authentication attempt',async()=>{f.user=null;const view=mount();fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));fireEvent.click(await screen.findByRole('button',{name:'Cancel auth'}));vi.useFakeTimers();f.user={id:'synthetic-user'};view.rerender(<MemoryRouter><AirportTransferBooking/></MemoryRouter>);await act(async()=>{vi.advanceTimersByTime(60);});expect(f.create).not.toHaveBeenCalled();});
 it('waits for the night configuration before admitting the restored night booking',async()=>{let resolve!: (value:any)=>void;f.nightRead.mockReturnValue(new Promise(r=>{resolve=r;}));mount(3,{arrivalTime:'01:00'});expect(screen.getByRole('button',{name:'Price requires confirmation'})).toBeDisabled();expect(f.create).not.toHaveBeenCalled();await act(async()=>{resolve({data:{start_time:'22:00',end_time:'06:00',sedan_gross:500,sedan_net:300,van_gross:700,van_net:400},error:null});});fireEvent.click(await screen.findByRole('button',{name:/Book • Cash/}));await waitFor(()=>expect(f.create).toHaveBeenCalledTimes(1));expect(f.create.mock.calls[0][0]).toMatchObject({total_amount:1400,metadata:{base_price:1200,night_surcharge_amount:200}});});
 it('does not use stale configuration after a reader failure',async()=>{f.error=Error('Synthetic tariff error');mount();await screen.findAllByText('Price requires confirmation');expect(f.create).not.toHaveBeenCalled();});
});
