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
  categories: [] as object[],
  fromDB: true,
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
vi.mock('@/lib/catalog/useCatalogFromDB', () => ({
  useCatalogFromDB: () => ({ categories: state.categories, isFromDB: state.fromDB,
    isLoading: state.loading, error: state.error ? new Error('Fixture error') : null, refetch: state.retry }),
}));
beforeEach(() => {
  Object.assign(state, {
    language: 'en',
    loading: false,
    error: false,
    projects: [],
    experiences: [],
    categories: [],
    fromDB: true,
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
    screen.getByRole('link', { name: /Kamala/ }),
  ).toBeVisible();
  expect(document.querySelector('.home-experiences')).toBeNull();
  expect(document.querySelector('.home-services')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();

});
it('shows failures with retry and never reports failed reads as empty supply', () => {
  state.error = true;
  show();
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  expect(screen.queryByText(/No published/)).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0]);
  expect(state.retry).toHaveBeenCalledTimes(1);
});
it('shows loading separately', () => {
  state.loading = true;
  show();
  expect(screen.getAllByText('Loading the catalog…')).toHaveLength(2);
  expect(screen.queryByText(/No published/)).toBeNull();
});
it('renders only supplied catalog records and preserves public detail routes', () => {
  state.projects = [{ district: 'rawai' }, { district: 'rawai' }];
  state.experiences = [
    {
      id: 'tour-1',
      title_en: 'Catalog tour',
      images: [],
      cover_image: 'https://example.invalid/synthetic-tour.jpg',
    },
  ];
  state.categories = [{id:'cat-leisure',labelEn:'Leisure',labelRu:'Досуг',services:[{id:'flowers',path:'/flowers',status:'available',labelEn:'Flowers',labelRu:'Цветы'}]}];
  show();
  expect(screen.queryByRole('link', { name: /Rawai/ })).toBeNull();
  expect(screen.getByRole('link', { name: /Catalog tour/ })).toHaveAttribute(
    'href',
    '/experiences/tour-1',
  );
  expect(screen.getByRole('link', { name: /Flowers/ })).toHaveAttribute('href', '/flowers');
  expect(screen.queryByText(/Catalog bouquet|Unpublished shop/)).toBeNull();
  expect(document.querySelector('.home-experiences img')).toHaveAttribute('src', 'https://example.invalid/synthetic-tour.jpg');
  expect(screen.queryByText(/rating|available units|popular/i)).toBeNull();
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

it('does not present the shared static navigation fallback as live categories', () => {
  state.fromDB=false;
  state.categories=[{id:'flowers',labelEn:'Flowers',services:[]}];
  show();
  expect(screen.queryByRole('link',{name:/Flowers/})).toBeNull();
  expect(document.querySelector('.home-services')).toBeNull();
});
it('retries category errors and keeps product cards out of category discovery', () => {
  state.error=true;show();
  const section=document.querySelector('.home-services')!;
  fireEvent.click(section.querySelector('button')!);
  expect(state.retry).toHaveBeenCalledTimes(1);
  expect(section.querySelector('.home-rail')).toBeNull();
});
it('omits an experience when its stored photograph fails instead of displaying a placeholder', () => {
  state.experiences = [{ id: 'tour-1', title_en: 'Catalog tour', cover_image: 'https://example.invalid/missing.jpg', images: [] }];
  show();
  const image = document.querySelector('.home-experiences img')!;
  fireEvent.error(image);
  expect(document.querySelector('.home-experiences img')).toBeNull();
  expect(screen.queryByRole('link', { name: /Catalog tour/ })).toBeNull();
  expect(document.querySelector('.home-experiences')).toBeNull();
});

it('keeps verified guide routes independent of project records and photos', () => {
  state.projects = [{ district: 'unknown_district', name_en: 'Unknown', cover_image: 'https://example.invalid/project.jpg' }];
  show();
  const areaLinks = Array.from(document.querySelectorAll('.home-area-guide-link')).map(link => link.getAttribute('href'));
  expect(areaLinks).toEqual(['/area/laguna', '/area/kamala', '/area/surin', '/area/bang-tao']);
  expect(screen.getAllByText('Area guide')).toHaveLength(4);
  expect(document.querySelectorAll('.home-locations img')).toHaveLength(4);
  expect(screen.getAllByText('Illustration')).toHaveLength(4);
  expect([...document.querySelectorAll('.home-locations img')].every(image => Boolean(image.getAttribute('src')) && !image.getAttribute('src')?.startsWith('https://'))).toBe(true);
  expect(screen.queryByText(/photograph not available|Unknown|available units|popular|rating/i)).toBeNull();
});

it('never relabels a project photo or title as area evidence', () => {
  state.projects = [{ district: 'Surin', name_en: 'Published Surin community', cover_image: 'https://images.unsplash.com/photo-example' }];
  show();
  expect(document.querySelectorAll('.home-locations img')).toHaveLength(4);
  expect(screen.getAllByText('Illustration')).toHaveLength(4);
  expect([...document.querySelectorAll('.home-locations img')].every(image => Boolean(image.getAttribute('src')) && !image.getAttribute('src')?.startsWith('https://'))).toBe(true);
  expect(screen.queryByText(/Published Surin community/)).toBeNull();
  expect(screen.getByRole('link', { name: /Surin/ })).toHaveAttribute('href', '/area/surin');
});

it.each([
  ['en', 'Flowers for a gift or a special occasion'],
  ['ru', 'Цветы для подарка или особого повода'],
  ['th', 'ดอกไม้สำหรับของขวัญหรือโอกาสพิเศษ'],
])('localizes descriptive service navigation in %s without supply promises', (language, benefit) => {
  state.language = language;
  state.categories = [{ id: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы', services: [] }];
  show();
  expect(screen.getByText(benefit)).toBeVisible();
  expect(document.querySelector('.home-service-category-card a')).toHaveAttribute('href', '/flowers');
  expect(screen.queryByText(/available|confirmed|instant/i)).toBeNull();
});

it('omits experiences without usable stored media and caps the preview at four', () => {
  state.experiences = [{ id: 'missing', title_en: 'No media', cover_image: 'javascript:bad' }, ...Array.from({ length: 6 }, (_, i) => ({ id: `tour-${i}`, title_en: `Tour ${i}`, cover_image: `https://example.invalid/tour-${i}.jpg` }))];
  show();
  expect(document.querySelectorAll('.home-experiences article')).toHaveLength(4);
  expect(screen.queryByText('No media')).toBeNull(); expect(screen.queryByText('Tour 4')).toBeNull();
});
