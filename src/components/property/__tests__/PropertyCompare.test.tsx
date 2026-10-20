import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CompareProvider, CompareButton, PropertyCompareTrigger, type CompareProperty } from '../PropertyCompare';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (v: number) => `THB ${v}` }) }));
const home: CompareProperty = { id: 'dual', title_en: 'Dual home', mode: 'buy', listing_type: 'rent', sale_price: 5000000, currency: 'THB', sale_currency: 'USD', price: 2000, price_per_night: 2000, guestSearch: 'checkIn=2026-12-01&checkOut=2026-12-04&guests=3&operator=private' };
function Location() { const location = useLocation(); return <output data-testid="url">{location.pathname + location.search}</output>; }
function mount(items: CompareProperty[]) {
  localStorage.setItem('myuno_compare_properties', JSON.stringify(items));
  render(<MemoryRouter><CompareProvider><Location /><PropertyCompareTrigger /><CompareButton property={home} /></CompareProvider></MemoryRouter>);
}
afterEach(() => { cleanup(); localStorage.clear(); });
function open() { fireEvent.click(screen.getByRole('button', { name: /Compare \(/ })); }
describe('comparison preserves property offer intent', () => {
  it('keeps the comparison entry in document flow without a floating overlay', () => {
    mount([home]);
    const trigger = screen.getByRole('button', { name: 'Compare (1)' });
    expect(trigger.closest('.fixed')).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByRole('heading', { name: 'Compare properties' })).toBeInTheDocument();
  });
  it('shows the sale amount, and links back with safe purchase and guest context', () => {
    mount([home]); open();
    expect(screen.getByText('Purchase: 5,000,000.00 USD')).toBeInTheDocument();
    expect(screen.queryByText(/2,000 THB/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dual home' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/property/dual?mode=buy&checkIn=2026-12-01&checkOut=2026-12-04&guests=3');
    expect(screen.getByTestId('url')).not.toHaveTextContent('operator');
  });
  it('adds another home through the intent-aware catalogue route', () => {
    mount([home]); open(); fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/property/browse?mode=buy&checkIn=2026-12-01&checkOut=2026-12-04&guests=3');
  });
  it('keeps rental and purchase values distinguishable in a mixed comparison', () => {
    mount([home, { ...home, id: 'rental', title_en: 'Rental home', mode: 'rent' }]); open();
    expect(screen.getByText('Purchase: 5,000,000.00 USD')).toBeInTheDocument();
    expect(screen.getByText('Rent: 2,000 THB / night')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rental home' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/property/rental?mode=rent');
  });
  it('does not invent a sale amount for dual homes or legacy snapshots', () => {
    mount([{ ...home, sale_price: null }, { id: 'legacy', title_en: 'Legacy', price: 1800, price_per_night: 1800 }]); open();
    expect(screen.getAllByText('Price on request')).toHaveLength(2);
    expect(screen.queryByText(/THB/)).not.toBeInTheDocument();
  });
  it('uses the canonical pure-sale legacy fallback', () => {
    mount([{ ...home, listing_type: 'sale', sale_price: null, price: 7000000 }]); open();
    expect(screen.getByText('Purchase: 7,000,000 THB')).toBeInTheDocument();
  });
  it.each([['week', 'week'], ['month', 'month']])('labels a rental %s amount in its stored currency', (price_period, label) => {
    mount([{ ...home, mode: 'rent', currency: 'USD', price_per_night: undefined, price: 1200, price_period }]); open();
    expect(screen.getByText(`Rent: 1,200.00 USD / ${label}`)).toBeInTheDocument();
  });
  it('never invents a currency for a known amount', () => {
    mount([{ ...home, sale_currency: undefined }]); open();
    expect(screen.getByText('Purchase: 5,000,000 currency unspecified')).toBeInTheDocument();
  });
  it('refreshes the same property when revisited in another intent', () => {
    mount([{ ...home, mode: 'rent' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Compare' })); open();
    expect(screen.getByText('Purchase: 5,000,000.00 USD')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('myuno_compare_properties')!)).toHaveLength(1);
  });
});
