import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router-dom';
import { PropertyAreaGuide, PropertyOfferLinks } from '../PropertyJourney';
import { PropertyDetailGallery } from '../detail/PropertyDetailGallery';
import { readPropertyJourneyReturn } from '@/lib/real-estate/propertyJourney';
import type { Property } from '@/hooks/useProperties';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
afterEach(cleanup);
const home: Property = { id: 'unit-1', title_ru: 'Вилла', title_en: 'Villa', listing_type: 'rent', listing_modes: ['rent', 'sale'], property_type: 'villa', district: 'Bang Tao', created_at: '', updated_at: '' };

function AreaFixture() {
  const { state } = useLocation();
  const destination = readPropertyJourneyReturn(state);
  return destination ? <Link to={destination.href}>Назад к вилле</Link> : <span>Район</span>;
}
function LocationFixture() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search}</output>; }

describe('connected property discovery', () => {
  it('opens the canonical area and returns to the same home and selected dates', () => {
    const url = '/property/unit-1?mode=rent&checkIn=2026-12-01&checkOut=2026-12-08&guests=3';
    render(<MemoryRouter initialEntries={[url]}><LocationFixture /><Routes>
      <Route path="/property/:id" element={<PropertyAreaGuide property={home} />} />
      <Route path="/area/:slug" element={<AreaFixture />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Открыть путеводитель' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/area/bang-tao');
    fireEvent.click(screen.getByRole('link', { name: 'Назад к вилле' }));
    expect(screen.getByTestId('location').textContent).toBe(url);
  });
  it('hides a purchase action on a rental-only home', () => {
    render(<MemoryRouter><PropertyOfferLinks property={{ ...home, listing_modes: ['rent'] }} mode="rent" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Арендовать' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Купить' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Снять надолго' })).toBeNull();
  });
  it('opens the existing buying route from a dual-listed home', () => {
    render(<MemoryRouter initialEntries={['/property/unit-1?mode=rent']}><LocationFixture /><PropertyOfferLinks property={home} search="?guests=3&tenancy=short" /></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Купить' }));
    expect(screen.getByTestId('location').textContent).toBe('/property/unit-1?mode=buy');
  });
  it('does not send unknown districts to a guessed area URL', () => {
    render(<MemoryRouter><PropertyAreaGuide property={{ ...home, district: 'Unknown' }} /></MemoryRouter>);
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('opens the actual selected image using keyboard-operable buttons', () => {
    const open = vi.fn();
    render(<PropertyDetailGallery images={['one.jpg', 'two.jpg', 'three.jpg']} alt="Вилла" onOpenLightbox={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать фото 3' }));
    expect(screen.getByRole('button', { name: 'Показать фото 3' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Открыть фото 3' }));
    expect(open).toHaveBeenCalledWith(2);
  });
});
