import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeHousingPreview, HomeNewbuildsPreview } from './HomeDiscoveryPreview';
const state = vi.hoisted(() => ({ homes: { data: [], isLoading: false, isError: false, refetch: vi.fn() }, projects: { data: [], isLoading: false, isError: false, refetch: vi.fn() } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: () => state.homes }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: () => state.projects }));
afterEach(() => { cleanup(); state.homes.isLoading = state.projects.isLoading = state.homes.isError = state.projects.isError = false; vi.clearAllMocks(); });
const show = () => render(<MemoryRouter><HomeHousingPreview /><HomeNewbuildsPreview /></MemoryRouter>);
it('keeps full catalogues reachable with honest empty previews', () => {
  show();
  expect(screen.getByRole('link', { name: 'All homes' })).toHaveAttribute('href', '/property/search?mode=rent');
  expect(screen.getByRole('link', { name: 'All new developments' })).toBeVisible();
  expect(screen.getByText(/No homes with published photos/)).toBeVisible();
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
