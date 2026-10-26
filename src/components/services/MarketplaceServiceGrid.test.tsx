import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceServiceGrid } from './MarketplaceServiceGrid';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
let data: MarketplaceService[] = [];
let isLoading = false;
let isError = false;
const refetch = vi.fn();
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useServiceMarketplace', () => ({ useMarketplaceServices: () => ({ data, isLoading, isError, refetch }) }));
vi.mock('./ServiceBookingSheet', () => ({ ServiceBookingSheet: () => null }));
const service = { id: 'test-service', name_en: 'Fixture cleaning', provider_id: 'provider-1', provider: { id: 'provider-1', name: 'Fixture provider' } } as MarketplaceService;
const mount = (search = '') => render(<MemoryRouter><MarketplaceServiceGrid search={search} returnTo="/discover/services?q=cleaning" /></MemoryRouter>);
beforeEach(() => { data = []; isLoading = false; isError = false; refetch.mockClear(); });
describe('provider catalogue states', () => {
  it('distinguishes absent supply even when there is a search', () => {
    mount('cleaning');
    expect(screen.getByText(/No published provider offers yet/)).toBeInTheDocument();
    expect(screen.queryByText(/No services match/)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('No published provider offers yet');
    expect(screen.queryByRole('heading', { name: 'Provider offers' })).toBeNull();
  });
  it('shows no matches only when supply exists', () => {
    data = [service]; mount('plumbing');
    expect(screen.getByText(/No services match your search/)).toBeInTheDocument();
  });
  it('keeps loading distinct from empty', () => {
    isLoading = true; mount();
    expect(screen.queryByText(/No published provider offers/)).toBeNull();
  });
  it('offers retry on failure without claiming empty inventory', () => {
    isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load services.');
    fireEvent.click(screen.getByText('Retry')); expect(refetch).toHaveBeenCalledOnce();
    expect(screen.queryByText(/No published provider offers/)).toBeNull();
  });
  it('keeps the filtered catalogue on provider links', () => {
    data = [service]; mount('cleaning');
    expect(screen.getByRole('link', { name: 'Fixture provider' })).toHaveAttribute('href', '/services/provider/provider-1?returnTo=%2Fdiscover%2Fservices%3Fq%3Dcleaning');
  });
  it('displays the recorded currency and scope without assuming baht', () => {
    data = [{ ...service, price: 35, currency: 'USD', description_en: 'Recorded scope', duration_minutes: 60 }];
    mount();
    expect(screen.getByText('USD 35')).toBeVisible();
    expect(screen.getByText('Recorded scope')).toBeVisible();
    expect(screen.getByText('60 min')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Request service' })).toBeVisible();
  });
});
