import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeProjectGallery } from '@/components/home/HomeProjectGallery';

const state = vi.hoisted(() => ({
  projects: [
    { id: 'layan', name_en: 'Layan Garden Homes', name_ru: 'Дома в Лаяне', district: 'bang_tao', location_area: 'bang_tao', cover_image: null, images: [], is_active: true },
    { id: 'rawai', name_en: 'Rawai Residence', name_ru: 'Резиденция Равай', district: 'rawai', location_area: 'rawai', cover_image: null, images: [], is_active: true },
  ],
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyProjects', () => ({ usePublicPropertyProjects: () => ({ data: state.projects, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ propertyTypes: [{ id: 'villa', labelRu: 'Вилла', labelEn: 'Villa' }, { id: 'condo', labelRu: 'Кондо', labelEn: 'Condo' }] }) }));
vi.mock('@/hooks/useProperties', () => ({
  usePropertiesByProject: (id: string, _limit: number, options: { mode: string; propertyType?: string }) => ({
    data: { properties: [], total: id === 'layan'
      ? options.mode === 'rent' ? options.propertyType === 'villa' ? 2 : 5 : 1
      : options.mode === 'rent' ? options.propertyType === 'condo' ? 4 : 0 : 3 },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/lib/taxonomies', () => ({ getDistrictLabel: (value: string) => value }));

afterEach(cleanup);

function show() {
  return render(<MemoryRouter><HomeProjectGallery /></MemoryRouter>);
}

it('shows public complex portals with live listing counts and supports area and home-type filters', () => {
  show();

  expect(screen.getByRole('heading', { name: 'Residential communities in Phuket' })).toBeVisible();
  expect(screen.getByText('5 listings')).toBeVisible();
  const layanLink = screen.getByRole('link', { name: 'Layan Garden Homes — Explore community' });
  expect(layanLink).toHaveAttribute('href', '/property/complex/layan?mode=rent');

  fireEvent.change(screen.getByLabelText('Area'), { target: { value: 'rawai' } });
  expect(screen.getByRole('link', { name: 'Rawai Residence — Explore community' })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Layan Garden Homes — Explore community' })).toBeNull();

  fireEvent.change(screen.getByLabelText('Home type'), { target: { value: 'condo' } });
  const rawaiLink = screen.getByRole('link', { name: 'Rawai Residence — Explore community' });
  expect(rawaiLink).toHaveAttribute('href', '/property/complex/rawai?mode=rent&propertyType=condo');
  expect(within(rawaiLink).getByText('4 listings')).toBeVisible();
});

it('updates the displayed count when guests switch between rent and purchase', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
  const layanLink = screen.getByRole('link', { name: 'Layan Garden Homes — Explore community' });
  expect(layanLink).toHaveAttribute('href', '/property/complex/layan?mode=buy');
  expect(within(layanLink).getByText('1 listings')).toBeVisible();
});
