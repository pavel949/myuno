import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { HomeListingCard } from './HomeListingCard';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => String(n) }) }));
afterEach(cleanup);
const home = { id: 'home', title_en: 'Stored home', title_ru: 'Жильё', cover_image: 'https://example.invalid/cover.jpg', images: ['https://example.invalid/cover.jpg', 'https://example.invalid/gallery.jpg', 'https://example.invalid/gallery.jpg'] } as Property;
it('keeps the home and its route after cover failure when its own gallery can load', () => {
 const unavailable = vi.fn(); const { container } = render(<MemoryRouter><HomeListingCard property={home} onUnavailable={unavailable} /></MemoryRouter>);
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.invalid/gallery.jpg');
 fireEvent.load(container.querySelector('img')!);
 expect(screen.getByRole('link')).toHaveAttribute('href', '/property/home?mode=rent');
 expect(unavailable).not.toHaveBeenCalled();
});
it('excludes the home only after all unique stored candidates fail', () => {
 const unavailable = vi.fn(); const { container } = render(<MemoryRouter><HomeListingCard property={home} onUnavailable={unavailable} /></MemoryRouter>);
 fireEvent.error(container.querySelector('img')!);
 expect(unavailable).not.toHaveBeenCalled();
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('article')).toBeNull();
 expect(unavailable).toHaveBeenCalledExactlyOnceWith('home');
});

 it('shows both recorded periods on the actual homepage card', () => {
  render(<MemoryRouter><HomeListingCard property={{ ...home, currency: 'THB', price: 3000, price_period: 'month', price_per_night: 3000 }} /></MemoryRouter>);
  expect(screen.getByLabelText('Rental rates')).toHaveTextContent('3000 per night');
  expect(screen.getByLabelText('Rental rates')).toHaveTextContent('3000 per month');
 });

 it('keeps the homepage fallback for unsupported-currency multiple tariffs', () => {
  render(<MemoryRouter><HomeListingCard property={{ ...home, currency: 'USD', price: 3000, price_period: 'month', price_per_night: 3000 }} /></MemoryRouter>);
  expect(screen.getByText('Pricing and terms on the listing')).toBeVisible();
  expect(screen.queryByLabelText('Rental rates')).toBeNull();
 });
