import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UnavailableDate } from '@/hooks/usePropertyUnavailableDates';
import type { DateRange } from 'react-day-picker';
import { PropertyBookingCard } from '../PropertyBookingCard';
import { PropertyDetailDateSheet } from '../detail/PropertyDetailDateSheet';
const query = vi.hoisted(()=>({ data: [] as UnavailableDate[], isSuccess:false,isError:false,refetch:vi.fn() }));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/CurrencyContext',()=>({useCurrency:()=>({formatPrice:(v:number)=>String(v)})}));
vi.mock('@/hooks/usePropertyUnavailableDates',()=>({usePropertyUnavailableDates:()=>query}));
vi.mock('@/hooks/usePropertyRateSeasons',()=>({usePropertyRateSeasons:()=>({data:[]})}));
vi.mock('@/hooks/useBreakpoint',()=>({useBreakpoint:()=>({isDesktop:true})}));
vi.mock('../GuestPriceProposal',()=>({GuestPriceProposal:()=>null}));
vi.mock('@/components/ui/calendar',()=>({Calendar:({disabled,onSelect}:{disabled:(date:Date)=>boolean;onSelect:(range:DateRange)=>void})=><button data-testid="calendar-date" disabled={disabled(new Date(2027,0,10))} onClick={()=>onSelect({from:new Date(2027,0,10),to:new Date(2027,0,12)})}>Pick dates</button>}));
afterEach(()=>{cleanup(); Object.assign(query,{data:[],isSuccess:false,isError:false});query.refetch.mockClear();});
const desktop=()=>render(<MemoryRouter><PropertyBookingCard propertyId="synthetic" pricePerNight={1000}/></MemoryRouter>);
function mobile(ready:boolean,error:boolean,minStayNights=1) { const onConfirm=vi.fn(); render(<PropertyDetailDateSheet open onOpenChange={()=>{}} dateRange={{from:new Date(2027,0,10),to:new Date(2027,0,12)}} onDateRangeChange={()=>{}} guestCount={2} onGuestCountChange={()=>{}} availability={[]} unavailableDates={new Set()} availabilityReady={ready} availabilityError={error} onRetryAvailability={query.refetch} onConfirm={onConfirm} minStayNights={minStayNights}/>); return onConfirm; }
describe('availability is unknown until loaded',()=>{
 it('desktop shows loading and disables continuation',()=>{desktop();expect(screen.getByRole('status')).toHaveTextContent('Checking availability');expect(screen.getByRole('button',{name:'Check availability'})).toBeDisabled();});
 it('desktop shows an error and retry instead of silently open inventory',()=>{query.isError=true;desktop();expect(screen.getByRole('alert')).toHaveTextContent('unknown');fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(query.refetch).toHaveBeenCalledOnce();expect(screen.getByRole('button',{name:'Check availability'})).toBeDisabled();});
 it('successful empty inventory has no loading/error notice',()=>{query.isSuccess=true;desktop();expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.queryByRole('status')).not.toBeInTheDocument();});
 it('mobile blocks dates and confirmation during loading',()=>{const confirm=mobile(false,false);expect(screen.getByTestId('calendar-date')).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Continue to booking'}));expect(confirm).not.toHaveBeenCalled();});
 it('mobile blocks stale selected dates after a load error',()=>{query.isError=true;const confirm=mobile(false,true);expect(screen.getByRole('alert')).toHaveTextContent('unknown');expect(screen.getByRole('button',{name:'Continue to booking'})).toBeDisabled();expect(confirm).not.toHaveBeenCalled();});
 it('mobile continues after successful load and valid selection',()=>{const confirm=mobile(true,false);fireEvent.click(screen.getByRole('button',{name:'Continue to booking'}));expect(confirm).toHaveBeenCalledOnce();});
 it('mobile does not continue below the displayed minimum stay',()=>{mobile(true,false,3);expect(screen.getByText('Minimum stay: 3 nights')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Continue to booking'})).toBeDisabled();});
});
