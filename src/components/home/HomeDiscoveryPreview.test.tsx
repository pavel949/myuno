import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeHousingPreview, HomeNewbuildsPreview, HomeSalePreview } from './HomeDiscoveryPreview';
const state = vi.hoisted(() => ({ homes: { data: [], isLoading: false, isError: false, refetch: vi.fn() }, projects: { data: [], isLoading: false, isError: false, refetch: vi.fn() }, readHomes: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: (...args: unknown[]) => { state.readHomes(...args); return state.homes; } }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: () => state.projects }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: () => null }));
afterEach(() => { cleanup(); state.projects.data = []; state.homes.isLoading = state.projects.isLoading = state.homes.isError = state.projects.isError = false; vi.clearAllMocks(); });
const show = () => render(<MemoryRouter><HomeHousingPreview /><HomeNewbuildsPreview /></MemoryRouter>);
it('loads the same purchase price range advertised by the homepage sale section', () => {
  render(<MemoryRouter><HomeSalePreview /></MemoryRouter>);
  expect(state.readHomes).toHaveBeenCalledWith({ listingType: 'sale', minPrice: 0.01, maxPrice: 10_000_000 }, 48);
  expect(screen.getByText('Up to ฿10,000,000')).toBeVisible();
  expect(screen.getByRole('link', { name: 'See homes' })).toHaveAttribute('href', '/property/search?mode=buy&maxPrice=10000000');
});
it('keeps full catalogues reachable with honest empty previews', () => {
  show();
  expect(screen.getByRole('link', { name: 'All homes' })).toHaveAttribute('href', '/property/search?mode=rent');
  expect(screen.getByRole('link', { name: 'All new developments' })).toBeVisible();
  expect(screen.getByText(/No photo preview to show/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'For a holiday' })).toHaveAttribute('href', '/property/rent/short-term');
  expect(screen.getByRole('link', { name: 'For a longer stay' })).toHaveAttribute('href', '/property/rent/long-term');
  expect(screen.getByText(/Published projects will appear here/)).toBeVisible();
});
it('distinguishes loading from empty and supports retry after a failed read', () => {
  state.homes.isLoading = true; state.projects.isError = true; show();
  expect(screen.getByRole('status')).toHaveTextContent('Loading homes');
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load projects');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(state.projects.refetch).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Published projects will appear here/)).toBeNull();
});

it('uses the same native rail contract for purchase projects with a visible catalogue action', () => {
  Object.assign(state.projects, { data: Array.from({ length: 6 }, (_, i) => ({ id: `project-${i}`, nameEn: `Project ${i}`, nameRu: '', priceFrom: null, coverImage: null, district: 'Phuket' })) });
  show();
  const section = document.querySelector('.premium-newbuilds')!;
  expect(section.querySelector('.premium-project-grid')).toBeNull();
  expect(section.querySelectorAll('.home-rail article')).toHaveLength(6);
  expect(screen.getByRole('link', { name: 'All new developments' })).toHaveAttribute('href', '/property/offplan');
});
