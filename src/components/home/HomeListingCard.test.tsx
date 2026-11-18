import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { HomeListingCard } from './HomeListingCard';
const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: locale.value }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => String(n) }) }));
afterEach(() => { cleanup(); locale.value = 'en'; });
const home = { id: 'home', title_en: 'Stored home', title_ru: 'Жильё', cover_image: 'https://example.invalid/cover.jpg', images: ['https://example.invalid/cover.jpg', 'https://example.invalid/gallery.jpg', 'https://example.invalid/gallery.jpg'] } as Property;
it('keeps the home and its route after cover failure when its own gallery can load', () => {
 const unavailable = vi.fn(); const { container } = render(<MemoryRouter><HomeListingCard property={home} onUnavailable={unavailable} /></MemoryRouter>);
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.invalid/gallery.jpg');
 fireEvent.load(container.querySelector('img')!);
 const links = screen.getAllByRole('link', {name:'Stored home'});
 expect(links).toHaveLength(1);
 for (const link of links) expect(link).toHaveAttribute('href', '/property/search?mode=rent&focus=home&q=Stored+home');
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


it.each(['en', 'ru', 'th'])('keeps %s previews photographic and sends the chosen home to the existing marketplace', language => {
 locale.value = language;
 const property = { ...home, district: 'layan', bedrooms: 3, area_sqm: 275, currency: 'THB', price: 3000, price_period: 'month', price_per_night: 3000 };
 const { container } = render(<MemoryRouter><HomeListingCard property={property} /></MemoryRouter>);
 const title = language === 'ru' ? home.title_ru : home.title_en;
 const link = screen.getByRole('link', { name: title! });
 const url = new URL(link.getAttribute('href')!, 'https://example.invalid');
 expect(url.pathname).toBe('/property/search');
 expect(url.searchParams.get('mode')).toBe('rent');
 expect(url.searchParams.get('focus')).toBe(home.id);
 expect(url.searchParams.get('q')).toBe(title);
 expect(container.querySelectorAll('a')).toHaveLength(1);
 expect(container.querySelector('h3')).toHaveTextContent(title!);
 expect(container.querySelector('.home-listing-location')).toBeVisible();
 expect(container.querySelector('.home-listing-facts,.home-listing-pricing,.home-listing-rate-note')).toBeNull();
 expect(screen.queryByText(/3000|275|View rental details|Explore the neighbourhood/)).toBeNull();
});
it('encodes titles without allowing them to change marketplace intent', () => {
 render(<MemoryRouter><HomeListingCard property={{ ...home, title_en: 'Home & mode=buy #1' }} /></MemoryRouter>);
 const url = new URL(screen.getByRole('link').getAttribute('href')!, 'https://example.invalid');
 expect(url.searchParams.get('q')).toBe('Home & mode=buy #1');
 expect(url.searchParams.get('mode')).toBe('rent');
});
