import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeHousingPreview, HomeNewbuildsPreview } from './HomeDiscoveryPreview';
const state = vi.hoisted(() => ({ homes: { data: [], isLoading: false, isError: false, refetch: vi.fn() }, projects: { data: [], isLoading: false, isError: false, refetch: vi.fn() } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: () => state.homes }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: () => state.projects }));
afterEach(() => { cleanup(); state.projects.data = []; state.homes.isLoading = state.projects.isLoading = state.homes.isError = state.projects.isError = false; vi.clearAllMocks(); });
const show = () => render(<MemoryRouter><HomeHousingPreview /><HomeNewbuildsPreview /></MemoryRouter>);
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
