import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropertyMapView } from '../PropertyMapView';
import type { Property } from '@/hooks/useProperties';
vi.mock('@/components/map/MapLibreMap', () => ({
  MapLibreMap: React.forwardRef(function MockMap({ markers, onMarkerClick }: { markers: { id: string; title: string; icon: string }[]; onMarkerClick: (marker: unknown) => void }, _ref) {
    return <div>{markers.map(marker => <button key={marker.id} data-price={marker.icon} onClick={() => onMarkerClick(marker)}>{marker.title}</button>)}</div>;
  }),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (amount: number) => `THB ${amount}` }) }));
vi.mock('../TrustStrip', () => ({ TrustStrip: () => null }));
function Location() { const value = useLocation(); return <output data-testid="location">{value.pathname}{value.search}</output>; }
const homes = [
  { id: 'synthetic-sale', title_en: 'Sale home', title_ru: 'Продажа', listing_type: 'sale', price: 8000000, sale_price: 9000000, sale_currency: 'THB', lat: 7.9, lng: 98.3 },
  { id: 'synthetic-usd-sale', title_en: 'USD sale home', title_ru: 'Продажа в долларах', listing_type: 'sale', price: 250000, sale_price: 250000, sale_currency: 'USD', lat: 7.9, lng: 98.3 },
  { id: 'synthetic-unpriced', title_en: 'Unpriced home', title_ru: 'Цена по запросу', listing_type: 'sale', lat: 7.9, lng: 98.3 },
  { id: 'synthetic-month', title_en: 'Monthly home', title_ru: 'На месяц', listing_type: 'rent', price: 30000, price_period: 'month', currency: 'THB', lat: 7.9, lng: 98.3 },
] as Property[];
function mount() {
  return render(<MemoryRouter initialEntries={['/property/search?tenancy=medium']}><PropertyMapView properties={homes} mode="all" hoveredProperty={null} onHover={() => undefined} /><Location /></MemoryRouter>);
}
afterEach(cleanup);
describe('mixed public catalogue map', () => {
  it('renders both supplied homes and uses the sale intent and authoritative asking price', () => {
    mount(); expect(screen.getByRole('button', { name: 'Monthly home' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Sale home' }));
    expect(screen.getByText('THB 9000000')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'View details' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/property/synthetic-sale?mode=buy&tenancy=medium');
  });
  it('retains a monthly rate label and rental detail context', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Monthly home' }));
    expect(screen.getByText('/ month', { exact: false })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'View details' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/property/synthetic-month?mode=rent&tenancy=medium');
  });
  it('does not advertise an unknown asking price as a zero-price marker', () => {
    mount(); expect(screen.getByRole('button', { name: 'Unpriced home' })).toHaveAttribute('data-price', '—');
    fireEvent.click(screen.getByRole('button', { name: 'Unpriced home' }));
    expect(screen.getByText('On request')).toBeVisible();
  });
  it('does not relabel a non-THB asking price as a THB marker', () => {
    mount(); expect(screen.getByRole('button', { name: 'USD sale home' })).toHaveAttribute('data-price', '—');
  });

  it('opens and dismisses the local card without leaving the filtered search', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Monthly home' }));
    expect(screen.getByRole('region', { name: 'Home on map' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close property card' }));
    expect(screen.queryByRole('region', { name: 'Home on map' })).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/property/search?tenancy=medium');
  });
  it('never invents a marker for missing or out-of-range coordinates', () => {
    const invalid = [null, 91, NaN].map((lat, i) => ({ ...homes[0], id: 'invalid-'+i, lat }));
    render(<MemoryRouter><PropertyMapView properties={invalid as Property[]} hoveredProperty={null} onHover={() => undefined} /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('no map coordinates');
    expect(screen.queryByRole('button', { name: 'Sale home' })).toBeNull();
  });
  it('uses controlled selection without substituting local authority', () => {
    const onSelect = vi.fn(); const onHover = vi.fn();
    render(<MemoryRouter><PropertyMapView properties={homes} selectedId="synthetic-month" onSelect={onSelect} hoveredProperty={null} onHover={onHover} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Close property card' }));
    expect(onSelect).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByRole('button', { name: 'Sale home' }));
    expect(onSelect).toHaveBeenCalledWith('synthetic-sale');
    expect(onHover).toHaveBeenCalledWith('synthetic-sale');
  });

});
