import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OffplanProjectCard } from './OffplanProjectCard';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => String(n) }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
const toggle = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useUserCollections', () => ({ useUserCollections: () => ({ isInCollection: () => false, toggleCollection: toggle }) }));
vi.mock('./DeveloperBadge', () => ({ DeveloperBadge: () => <a href="/developers/developer">Developer</a> }));
const project = { id: 'test-project', nameEn: 'A complete descriptive project name', nameRu: '', priceFrom: null, images: [], coverImage: null } as unknown as OffplanProject;
afterEach(cleanup);
describe('project card independent actions', () => {
 it('exposes a keyboard-accessible canonical title link without nesting developer or favourite actions', () => {
  render(<MemoryRouter><OffplanProjectCard project={project} /></MemoryRouter>);
  const title = screen.getByRole('link', { name: project.nameEn });
  expect(title).toHaveAttribute('href', '/property/offplan/test-project');
  expect(screen.getByRole('link', { name: 'Developer' }).closest('h3')).toBeNull();
  const favourite = screen.getByRole('button', { name: 'Add to favourites' });
  expect(favourite.closest('a')).toBeNull();
  fireEvent.click(favourite);
  expect(toggle).not.toHaveBeenCalled();
 });
});
