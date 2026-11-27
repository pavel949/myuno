import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { RentalCommunities } from '../RentalCommunities';

const catalogue = vi.hoisted(() => ({ homes: vi.fn(), projects: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: catalogue.homes }));
vi.mock('@/hooks/usePropertyProjects', () => ({ usePublicPropertyProjects: catalogue.projects }));

it('links featured Phuket projects only to their short-stay catalogue', () => {
  catalogue.homes.mockReturnValue({ data: [
    { project_id: 'many-stays' }, { project_id: 'many-stays' },
    { project_id: 'featured', is_featured: true }, { project_id: null },
  ] });
  catalogue.projects.mockReturnValue({ data: [
    { id: 'many-stays', name_ru: 'Комплекс в Равае', district: 'rawai' },
    { id: 'catalogue-only', name_ru: 'Проект без посуточных предложений' },
    { id: 'featured', name_ru: 'Комплекс в Кате', district: 'kata' },
  ] });
  render(<MemoryRouter><RentalCommunities /></MemoryRouter>);

  expect(catalogue.homes).toHaveBeenCalledWith(expect.objectContaining({
    listingType: 'rent', rentTenancy: 'short', districts: expect.arrayContaining(['rawai', 'kata']),
  }), 60);
  expect(catalogue.projects).toHaveBeenCalledWith(6, undefined, ['featured', 'many-stays']);
  const projectLinks = screen.getAllByRole('link').filter(link => link.getAttribute('href')?.includes('&project='));
  expect(projectLinks.map(link => link.getAttribute('href'))).toEqual([
    '/property/search?mode=rent&tenancy=short&project=featured',
    '/property/search?mode=rent&tenancy=short&project=many-stays',
  ]);
  expect(screen.queryByText('Проект без посуточных предложений')).toBeNull();
});
