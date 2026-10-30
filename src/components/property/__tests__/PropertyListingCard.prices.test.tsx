import { propertyCommercialInitial, propertyCommercialPayload, propertyCommercialValues } from '@/lib/propertyCommercialFields';
import { propertyDetailPricing } from '@/lib/real-estate/propertyDetailIntent';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PropertyListingCard } from '../PropertyListingCard';
import type { Property } from '@/hooks/useProperties';

const state = vi.hoisted(() => ({ language: 'en', currency: '฿' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (value: number) => `${state.currency}${value}` }) }));
vi.mock('@/components/uno/FavoriteButton', () => ({ FavoriteButton: () => null }));
vi.mock('../PropertyImageCarousel', () => ({ PropertyImageCarousel: () => null }));
vi.mock('../TrustStrip', () => ({ TrustStrip: () => null }));
vi.mock('../StayRulesInline', () => ({ StayRulesInline: () => null }));
vi.mock('../GuestFavoriteBadge', () => ({ GuestFavoriteBadge: () => null, isGuestFavorite: () => false }));
beforeEach(() => { state.language = 'en'; state.currency = '฿'; });
afterEach(cleanup);
function mount(values: Partial<Property>, mode: 'rent' | 'buy' = 'rent') {
  const property = { id: 'test', title_en: 'Test home', title_ru: 'Дом', listing_type: 'rent', currency: 'THB', ...values } as Property;
  return render(<MemoryRouter><PropertyListingCard property={property} mode={mode} nights={3} /></MemoryRouter>);
}
describe('public listing amount and billing period', () => {
  it('shows independent nightly and monthly tariffs together without converting either', () => {
    mount({ price_per_night: 3000, price: 90000, price_period: 'month' });
    expect(screen.getByText('฿90000').parentElement).toHaveTextContent('฿90000 per month');
    expect(screen.queryByText(/Estimated/)).toBeNull();
    expect(screen.getByLabelText('Rental rates')).toHaveTextContent('฿3000 per night');
  });
  it.each(['$', '€', '₽'])('retains the currency formatter for %s without changing the billing period', currency => {
    state.currency = currency;
    mount({ price_per_night: 3000, price: 3000, price_period: 'night' });
    expect(screen.getByText(`${currency}3000`).parentElement).toHaveTextContent(`${currency}3000 night`);
    expect(screen.getByText(`Estimated: ${currency}9000`)).toBeVisible();
  });
  it.each([['ru', 'ночь', 'Ориентировочно'], ['th', '/ คืน', 'ประมาณ']])('localizes nightly price and estimate in %s', (language, period, estimate) => {
    state.language = language;
    mount({ price_per_night: 3000, price_period: 'night' });
    expect(screen.getByText('฿3000').parentElement).toHaveTextContent(`฿3000 ${period}`);
    expect(screen.getByText(`${estimate}: ฿9000`)).toBeVisible();
  });
  it('keeps a legacy monthly amount monthly without multiplying it by nights', () => {
    mount({ price_per_night: null, price: 90000, price_period: 'month' });
    expect(screen.getByText('฿90000').parentElement).toHaveTextContent('฿90000 month');
    expect(screen.queryByText(/Estimated/)).toBeNull();
  });
  it('does not show the rental amount as a dual-listed sale asking price', () => {
    mount({ listing_modes: ['rent', 'sale'], sale_price: null, price: 3000 }, 'buy');
    expect(screen.getByText('Price on request')).toBeVisible();
    expect(screen.queryByText('฿3000')).toBeNull();
  });
  it('does not promote nightly rent to asking price for contradictory legacy sale-type rows', () => {
    mount({ listing_type: 'sale', listing_modes: ['platform', 'rent', 'short'], sale_price: null, price: 14000, price_per_night: 14000 }, 'buy');
    expect(screen.getByText('Price on request')).toBeVisible();
    expect(screen.queryByText('฿14000')).toBeNull();
  });
  it('preserves the legacy amount of an explicitly sale-only listing', () => {
    mount({ listing_type: 'sale', sale_price: null, price: 5000000 }, 'buy');
    expect(screen.getByText('฿5000000')).toBeVisible();
  });
  it.each([null, 'USD', ''])('keeps unknown or unsupported rental currency %s request-only', currency => {
    mount({ currency, price: 3000, price_period: 'night' });
    expect(screen.getByText('Price on request')).toBeVisible();
    expect(screen.queryByText(/Estimated/)).toBeNull();
  });
  it('does not borrow rental currency for an explicit sale amount', () => {
    mount({ listing_type: 'sale', sale_price: 5000000, sale_currency: null }, 'buy');
    expect(screen.getByText('Price on request')).toBeVisible();
  });
  it.each([null, 0, -1, NaN])('does not invent a free rental for unknown/invalid amount %s', price => {
    mount({ price, price_per_night: null });
    expect(screen.getByText('Price on request')).toBeVisible();
    expect(screen.queryByText(/Estimated/)).toBeNull();
  });
});


it('keeps the monthly card and independent nightly inquiry consistent after an editor roundtrip', () => {
  const source = { price: 90000, price_period: 'month', currency: 'THB', price_per_night: 3000, listing_type: 'rent', listing_modes: ['rent', 'sale'], sale_price: 200000, sale_currency: 'USD' };
  const roundtrip = propertyCommercialPayload(propertyCommercialValues(propertyCommercialInitial(source)), source);
  mount(roundtrip);
  expect(screen.getByText('฿90000').parentElement).toHaveTextContent('month');
  expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument();
  expect(propertyDetailPricing(roundtrip, { price_per_night: roundtrip.price_per_night }, 'rent')).toMatchObject({ canQuoteShortStay: true, pricePerNight: 3000 });
});

 it('does not choose between conflicting prices for the same nightly period', () => {
  mount({ price: 90000, price_period: 'night', price_per_night: 3000 });
  expect(screen.getByText('Price on request')).toBeVisible();
  expect(screen.getByText(/Rental rates need confirmation/)).toBeVisible();
  expect(screen.queryByText(/Estimated/)).toBeNull();
 });

 it('keeps the request-only fallback when multiple recorded rates have unsupported currency', () => {
  mount({ currency: 'USD', price: 3000, price_period: 'month', price_per_night: 3000 });
  expect(screen.getByText('Price on request')).toBeVisible();
  expect(screen.queryByLabelText('Rental rates')).toBeNull();
 });
