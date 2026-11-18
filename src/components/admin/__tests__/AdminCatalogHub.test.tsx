import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { AdminCatalogHub } from '../AdminCatalogHub';

const state = vi.hoisted(() => ({ language: 'ru' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
afterEach(cleanup);
describe('three canonical admin catalogs', () => {
  it.each(['ru', 'en'])('has three clear catalogs with valid existing destinations in %s', language => {
    state.language = language;
    render(<MemoryRouter><AdminCatalogHub /></MemoryRouter>);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    const routes = readFileSync('src/components/layout/routes/adminRoutes.tsx', 'utf8');
    for (const link of screen.getAllByRole('link')) {
      expect(routes).toContain(`path="${link.getAttribute('href')!.split('?')[0]}"`);
    }
    expect(screen.getByRole('link', { name: language === 'ru' ? 'Редактировать объекты' : 'Edit properties' })).toHaveAttribute('href', '/admin/properties');
    expect(screen.getByRole('link', { name: language === 'ru' ? 'Категории впечатлений' : 'Experience categories' })).toHaveAttribute('href', '/admin/experience-categories');
  });
});
