import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OffplanProjectCard } from './OffplanProjectCard';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: String }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useUserCollections', () => ({ useUserCollections: () => ({ isInCollection: () => false, toggleCollection: vi.fn() }) }));
vi.mock('./DeveloperBadge', () => ({ DeveloperBadge: () => null }));
vi.mock('@/components/newbuilds/ProjectStartingPrice', () => ({ ProjectStartingPrice: () => null }));
afterEach(cleanup);
it('exposes the canonical project URL as a crawlable title anchor separate from favourite controls', () => {
  const project = { id: 'fixture-project', nameEn: 'Synthetic project', nameRu: 'Тест', isClearviewRated: false } as OffplanProject;
  render(<MemoryRouter><OffplanProjectCard project={project} /></MemoryRouter>);
  const link = screen.getByRole('link', { name: 'Synthetic project' });
  expect(link).toHaveAttribute('href', '/property/offplan/fixture-project');
  expect(link.querySelector('button')).toBeNull();
});
