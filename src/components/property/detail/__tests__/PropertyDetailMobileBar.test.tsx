import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropertyDetailMobileBar } from '../PropertyDetailMobileBar';

const state = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (price: number) => String(price) }) }));
vi.mock('@/components/property', () => ({ MessageHostButton: ({ labelEn = 'Message manager', propertyId }: { labelEn?: string; propertyId: string }) => <button data-property-id={propertyId}>{labelEn}</button> }));

afterEach(() => { cleanup(); state.navigate.mockClear(); });
const base = { propertyId: 'fixture-home', isSaleListing: false, salePrice: 0, pricePerNight: 2000, guestCount: 3, onOpenDatePicker: vi.fn() };

describe('mobile property action contract', () => {
  it('uses the shared safe-area-aware navigation offset for the fixed action bar', () => {
    const { container } = render(<PropertyDetailMobileBar {...base} />);
    expect(container.firstChild).toHaveClass('bottom-[var(--bottom-nav-h)]', 'z-40');
    expect(container.firstChild).not.toHaveClass('bottom-0');
  });
  it('opens dates for an undated short stay and preserves dated inquiry context', () => {
    const openDates = vi.fn();
    const view = render(<PropertyDetailMobileBar {...base} onOpenDatePicker={openDates} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select dates' }));
    expect(openDates).toHaveBeenCalledOnce();
    view.rerender(<PropertyDetailMobileBar {...base} dateRange={{ from: new Date(2027, 10, 10), to: new Date(2027, 10, 15) }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reserve' }));
    const url = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app');
    expect(url.pathname).toBe('/property/fixture-home/inquiry');
    expect(Object.fromEntries(url.searchParams)).toEqual({ checkIn: '2027-11-10', checkOut: '2027-11-15', guests: '3' });
  });
  it('offers the existing manager request for long-stay-only homes without opening short-stay inquiry', () => {
    const openDates = vi.fn();
    render(<PropertyDetailMobileBar {...base} isLongStayOnly onOpenDatePicker={openDates} dateRange={{ from: new Date(2027, 10, 10), to: new Date(2027, 10, 15) }} />);
    expect(screen.getByRole('button', { name: 'Request rental' })).toHaveAttribute('data-property-id', 'fixture-home');
    expect(screen.queryByRole('button', { name: 'Reserve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Select dates' })).toBeNull();
    expect(state.navigate).not.toHaveBeenCalled();
    expect(openDates).not.toHaveBeenCalled();
  });
  it('preserves consultation for sale intent', () => {
    render(<PropertyDetailMobileBar {...base} isSaleListing isLongStayOnly salePrice={5000000} />);
    expect(screen.getByRole('button', { name: 'Request consultation' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Request rental' })).toBeNull();
  });
});
