import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  HomeExperienceGallery,
  HomeLocationGallery,
  HomeServiceGallery,
} from './HomeCatalogGalleries';
const state = vi.hoisted(() => ({
  language: 'en',
  loading: false,
  error: false,
  retry: vi.fn(),
  projects: [] as object[],
  experiences: [] as object[],
  services: [] as object[],
  bouquets: [] as object[],
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: state.language }),
}));
vi.mock('@/hooks/usePropertyProjects', () => ({
  usePublicPropertyProjects: () => ({
    data: state.projects,
    isLoading: state.loading,
    isError: state.error,
    refetch: state.retry,
  }),
}));
vi.mock('@/hooks/useExperiences', () => ({
  useExperiences: (options: { publishedOnly?: boolean }) => {
    expect(options.publishedOnly).toBe(true);
    return {
      experiences: state.experiences,
      isLoading: state.loading,
      error: state.error,
      refetch: state.retry,
    };
  },
}));
vi.mock('@/hooks/useServiceMarketplace', () => ({
  useMarketplaceServices: () => ({
    data: state.services,
    isLoading: state.loading,
    isError: state.error,
    refetch: state.retry,
  }),
}));
vi.mock('@/hooks/useBouquets', () => ({
  useBouquets: () => ({
    bouquets: state.bouquets,
    isLoading: state.loading,
    error: state.error,
    refetch: state.retry,
  }),
}));
beforeEach(() => {
  Object.assign(state, {
    language: 'en',
    loading: false,
    error: false,
    projects: [],
    experiences: [],
    services: [],
    bouquets: [],
  });
  state.retry.mockClear();
});
afterEach(cleanup);
const show = () =>
  render(
    <MemoryRouter>
      <HomeLocationGallery />
      <HomeExperienceGallery />
      <HomeServiceGallery />
    </MemoryRouter>,
  );
it('keeps successful empty catalogues distinct from errors and category requests', () => {
  show();
  expect(
    screen.getByText('No areas in the published catalog yet.'),
  ).toBeVisible();
  expect(
    screen.getByText('No published experiences yet. Check back later.'),
  ).toBeVisible();
  expect(
    screen.getByText(/No published services or bouquets yet/),
  ).toBeVisible();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(
    screen.getByRole('link', { name: 'Air conditioning' }),
  ).toHaveAttribute('href', '/services?category=ac');
  expect(screen.getByRole('link', { name: 'Water' })).toHaveAttribute(
    'href',
    '/services?q=water',
  );
});
it('shows failures with retry and never reports failed reads as empty supply', () => {
  state.error = true;
  show();
  expect(screen.getAllByRole('alert')).toHaveLength(4);
  expect(screen.queryByText(/No published/)).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0]);
  expect(state.retry).toHaveBeenCalledOnce();
});
it('shows loading separately', () => {
  state.loading = true;
  show();
  expect(screen.getAllByText('Loading the catalog…')).toHaveLength(4);
  expect(screen.queryByText(/No published/)).toBeNull();
});
it('renders only supplied records, deduplicates districts and preserves public detail routes', () => {
  state.projects = [{ district: 'rawai' }, { district: 'rawai' }];
  state.experiences = [
    {
      id: 'tour-1',
      title_en: 'Catalog tour',
      images: [],
      cover_image: 'javascript:alert(1)',
    },
  ];
  state.services = [
    {
      id: 'service-1',
      name_en: 'Catalog repair',
      provider_id: 'provider-1',
      provider: { name: 'Catalog provider' },
      images: [],
    },
  ];
  state.bouquets = [
    {
      id: 'bouquet-1',
      name_en: 'Catalog bouquet',
      shop: { name_en: 'Catalog florist' },
    },
    { id: 'orphan', name_en: 'Unpublished shop', shop: null },
  ];
  show();
  expect(screen.getByRole('link', { name: /Rawai/ })).toHaveAttribute(
    'href',
    '/property/search?mode=rent&district=rawai',
  );
  expect(screen.getByRole('link', { name: /Catalog tour/ })).toHaveAttribute(
    'href',
    '/experiences/tour-1',
  );
  expect(screen.getByRole('link', { name: /Catalog repair/ })).toHaveAttribute(
    'href',
    '/services/provider/provider-1?returnTo=%2F',
  );
  expect(screen.getByRole('link', { name: /Catalog bouquet/ })).toHaveAttribute(
    'href',
    '/flowers/bouquet/bouquet-1',
  );
  expect(screen.queryByText('Unpublished shop')).toBeNull();
  expect(document.querySelector('img')).toBeNull();
  expect(screen.queryByText(/rating|available|popular/i)).toBeNull();
});
it.each(['ru', 'th'])(
  'localizes empty and navigation states in %s',
  (language) => {
    state.language = language;
    show();
    expect(
      screen.queryByText(/No published|All services|All experiences/),
    ).toBeNull();
  },
);

it('identifies partial catalog failures while retaining successfully loaded flowers', () => {
  state.bouquets = [{ id: 'bouquet-1', name_en: 'Catalog bouquet', shop: { name_en: 'Catalog florist' } }];
  show();
  expect(screen.getByText(/No other published services yet/)).toBeVisible();
  expect(screen.getByRole('link', { name: /Catalog bouquet/ })).toBeVisible();
});
it('replaces a failed stored photograph with the neutral media state', () => {
  state.experiences = [{ id: 'tour-1', title_en: 'Catalog tour', cover_image: 'https://example.invalid/missing.jpg', images: [] }];
  show();
  const image = document.querySelector('img')!;
  fireEvent.error(image);
  expect(document.querySelector('img')).toBeNull();
  expect(screen.getByRole('link', { name: /Catalog tour/ })).toBeVisible();
});
