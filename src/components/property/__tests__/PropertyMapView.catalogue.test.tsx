import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropertyMapView } from '../PropertyMapView';
import type { Property } from '@/hooks/useProperties';
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Marker: ({ title, label, onClick }: { title: string; label: { text: string }; onClick: () => void }) => <button data-price={label.text} onClick={onClick}>{title}</button>,
  InfoWindow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (amount: number) => `THB ${amount}` }) }));
vi.mock('@/contexts/GoogleMapsContext', () => ({ useGoogleMaps: () => ({ hasKey: true, isLoaded: true, loadError: null }) }));
vi.mock('@/lib/googleMaps', () => ({ DEFAULT_MAP_CENTER: { lat: 7.9, lng: 98.3 }, DEFAULT_ZOOM: 12 }));
vi.mock('../TrustStrip', () => ({ TrustStrip: () => null }));
function Location() { const value = useLocation(); return <output data-testid="location">{value.pathname}{value.search}</output>; }
const homes = [
  { id: 'synthetic-sale', title_en: 'Sale home', title_ru: 'Продажа', listing_type: 'sale', price: 8000000, sale_price: 9000000, sale_currency: 'THB', lat: 7.9, lng: 98.3 },
  { id: 'synthetic-unpriced', title_en: 'Unpriced home', title_ru: 'Цена по запросу', listing_type: 'sale', lat: 7.9, lng: 98.3 },
  { id: 'synthetic-month', title_en: 'Monthly home', title_ru: 'На месяц', listing_type: 'rent', price: 30000, price_period: 'month', currency: 'THB', lat: 7.9, lng: 98.3 },
] as Property[];
function mount() {
  vi.stubGlobal('google', { maps: { SymbolPath: { CIRCLE: 1 }, Size: class {} } });
  return render(<MemoryRouter initialEntries={['/property/search?tenancy=medium']}><PropertyMapView properties={homes} mode="all" hoveredProperty={null} onHover={() => undefined} /><Location /></MemoryRouter>);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
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

});
