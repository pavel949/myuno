import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import VehicleDetail from './VehicleDetail';

const vehicle = vi.hoisted(() => ({
  id: 'vehicle-test',
  vehicle_type: 'car',
  name_en: 'Fixture car',
  name_ru: 'Тестовый автомобиль',
  images: ['/fixture-car.webp'],
  price_per_day: 1600,
  currency: 'THB',
}));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useVehicles', () => ({ useVehicle: () => ({ vehicle, isLoading: false }) }));
vi.mock('@/hooks/useViewHistory', () => ({ useViewHistory: () => ({ trackView: vi.fn() }) }));
vi.mock('@/components/uno/FavoriteButton', () => ({ FavoriteButton: () => null }));
vi.mock('@/components/uno/TrustBadges', () => ({ TrustBadges: () => null }));
vi.mock('@/components/crosssell', () => ({ RelatedServicesSection: () => null }));

afterEach(cleanup);

it('uses one Reserve action and preserves the vehicle booking route and state', () => {
  function BookingTarget() {
    const location = useLocation();
    return <output aria-label="booking target">{JSON.stringify({ path: location.pathname, state: location.state })}</output>;
  }
  render(
    <MemoryRouter initialEntries={['/transport/vehicle/vehicle-test']}>
      <Routes>
        <Route path="/transport/vehicle/:id" element={<VehicleDetail />} />
        <Route path="/transport/booking/:id" element={<BookingTarget />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: vehicle.name_en })).toBeInTheDocument();
  const reserve = screen.getByRole('button', { name: 'Reserve' });
  expect(reserve.closest('[data-listing-booking-rail]')).toHaveClass('fixed', 'lg:sticky');
  fireEvent.click(reserve);
  expect(JSON.parse(screen.getByLabelText('booking target').textContent || '{}')).toEqual({
    path: '/transport/booking/vehicle-test',
    state: { vehicle: { nameEn: vehicle.name_en, nameRu: vehicle.name_ru, pricePerDay: vehicle.price_per_day, image: vehicle.images[0] } },
  });
});
