import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MarketplaceServiceCard } from './MarketplaceServiceCard';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';

const state = vi.hoisted(() => ({ language: 'en' as 'en' | 'ru' }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: state.language }),
}));

const service = (overrides: Partial<MarketplaceService> = {}): MarketplaceService => ({
  id: 'fixture-service',
  provider_id: 'fixture-provider',
  name_en: 'Fixture cleaning',
  name_ru: 'Уборка в апартаментах',
  description_en: 'Recorded cleaning scope',
  description_ru: 'Сохранённый объём уборки',
  price: 35,
  currency: 'USD',
  duration_minutes: 60,
  images: ['https://cdn.example.test/cleaning.jpg'],
  lead_time_hours: 4,
  unit: 'hour',
  pricing_model: 'per_hour',
  is_active: true,
  approval_status: 'approved',
  provider: {
    id: 'fixture-provider',
    name: 'Fixture provider',
    is_verified: true,
    rating: 4.5,
    logo_url: null,
    review_count: 12,
  },
  ...overrides,
});

const mount = (
  value: MarketplaceService = service(),
  props: Partial<React.ComponentProps<typeof MarketplaceServiceCard>> = {},
) => render(
  <MemoryRouter>
    <MarketplaceServiceCard
      service={value}
      returnTo="/discover/services?q=cleaning"
      onRequest={props.onRequest ?? vi.fn()}
      {...props}
    />
  </MemoryRouter>,
);

beforeEach(() => { state.language = 'en'; });
afterEach(cleanup);

describe('MarketplaceServiceCard', () => {
  it('renders stored English content, rating, location, availability, and safe return navigation', () => {
    mount({
      ...service(),
      location: { district: 'Rawai' },
    } as MarketplaceService, {
      availability: { status: 'available', date: '2026-12-01', firstSlot: '2026-12-01T02:30:00.000Z' },
    });

    expect(screen.getByRole('heading', { name: 'Fixture cleaning' })).toBeVisible();
    expect(screen.getByText('Recorded cleaning scope')).toBeVisible();
    expect(screen.getByText('USD 35')).toBeVisible();
    expect(screen.getByText('Pricing unit: hour · per_hour')).toBeVisible();
    expect(screen.getByText('60 min')).toBeVisible();
    expect(screen.getByText('Rawai')).toBeVisible();
    expect(screen.getByTestId('marketplace-provider-rating')).toHaveTextContent('Provider rating');
    expect(screen.getByTestId('marketplace-provider-rating')).toHaveTextContent('4.5');
    expect(screen.getByTestId('marketplace-provider-rating')).toHaveTextContent(/12\s+reviews/);
    expect(screen.getByText(/Free request slots subject to confirmation · 2026-12-01 · 09:30/)).toBeVisible();

    const image = screen.getByRole('img', { name: 'Fixture cleaning' });
    expect(image).toHaveAttribute('src', 'https://cdn.example.test/cleaning.jpg');
    expect(screen.getByRole('link', { name: /Fixture provider/ })).toHaveAttribute(
      'href',
      '/services/provider/fixture-provider?returnTo=%2Fdiscover%2Fservices%3Fq%3Dcleaning',
    );
  });

  it('uses a non-stock fallback after a real service image fails', () => {
    mount();
    const image = screen.getByRole('img', { name: 'Fixture cleaning' });

    fireEvent.error(image);

    expect(screen.queryByRole('img', { name: 'Fixture cleaning' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Service image unavailable' })).toBeVisible();
    expect(screen.getByText('Service photo unavailable')).toBeVisible();
  });

  it('keeps unknown price, invalid rating, and unknown availability honest in Russian', () => {
    state.language = 'ru';
    mount({
      ...service(),
      price: null,
      currency: null,
      images: ['data:image/png;base64,not-a-real-photo'],
      provider: { ...service().provider!, rating: 0, review_count: null },
    }, {
      availability: { status: 'unknown', date: '2026-12-01' },
    });

    expect(screen.getByRole('heading', { name: 'Уборка в апартаментах' })).toBeVisible();
    expect(screen.getByText('Цена по запросу')).toBeVisible();
    expect(screen.getByText('Нет отзывов')).toBeVisible();
    expect(screen.getByText(/Доступность неизвестна · 2026-12-01/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Изображение услуги недоступно' })).toBeVisible();
    expect(screen.queryByText(/забронировано|booked/i)).not.toBeInTheDocument();
  });

  it('calls request and optional concierge actions without claiming a booking', () => {
    const onRequest = vi.fn();
    const onConcierge = vi.fn();
    mount(service(), { onRequest, onConcierge, availability: { status: 'available', date: '2026-12-01', firstSlot: '2026-12-01T03:00:00.000Z' } });

    fireEvent.click(screen.getByRole('button', { name: 'Request service' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask concierge' }));

    expect(onRequest).toHaveBeenCalledOnce();
    expect(onConcierge).toHaveBeenCalledOnce();
    expect(screen.getByText(/Free request slots subject to confirmation · 2026-12-01 · 10:00/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Book|Booked/ })).not.toBeInTheDocument();
  });
});
