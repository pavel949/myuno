import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AirbnbCalendarGrid } from './AirbnbCalendarGrid';
vi.mock('@/contexts/LanguageContext', () => ({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useCalendarPrices', () => ({useCalendarPrices:()=>({data:[{date:'2026-10-21',price_override:8500,status:'available'}]})}));
vi.mock('@/hooks/usePropertyBookings', () => ({usePropertyBookings:()=>({bookings:[],getBookingForDate:()=>undefined})}));
vi.mock('@/hooks/useOperationalTasks', () => ({useOperationalTasks:()=>({tasks:[],completeTask:{mutate:vi.fn()}})}));
vi.mock('@/hooks/usePropertyAvailabilityManagement', () => ({usePropertyAvailabilityManagement:()=>({availability:[]})}));
vi.mock('@/hooks/usePropertyAvailability', () => ({usePropertyRentalTerms:()=>({data:{price_per_night:1000}})}));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({usePropertyRateSeasons:()=>({data:[]})}));
vi.mock('./CalendarDayEventsSheet', () => ({CalendarDayEventsSheet:()=>null}));
vi.mock('./CreateServiceTaskDialog', () => ({CreateServiceTaskDialog:()=>null}));
vi.mock('./AddBookingFromCalendarDialog', () => ({AddBookingFromCalendarDialog:()=>null}));
vi.mock('./BlockDatesDialog', () => ({BlockDatesDialog:()=>null}));
describe('canonical calendar price projection', () => {
 it('shows scoped dated prices even when inventory SELECT returns no rows', () => {
  render(<MemoryRouter initialEntries={['/mc/calendar?property=fixture&date=2026-10-21']}><AirbnbCalendarGrid propertyId="fixture"/></MemoryRouter>);
  expect(screen.getByText('8.5k')).toBeInTheDocument();
  expect(screen.getByText('October 2026')).toBeInTheDocument();
 });
});
