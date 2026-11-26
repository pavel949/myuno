import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DeveloperDetail from '../DeveloperDetail';
import { hasPublicDeveloperProfile } from '@/lib/adapters/developerAdapter';
const state = vi.hoisted(() => ({
  language: 'en',
  hasDeveloper: false,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
  projects: { data: [], isError: false, isLoading: false, refetch: vi.fn() },
}));
vi.mock('@/hooks/useDevelopers', () => ({
  useDeveloper: () => ({
    ...state,
    data: state.hasDeveloper ? {
      id: 'developer',
      nameEn: 'Test Developer',
      isVerified: true,
      projectsCompleted: 3,
      totalUnitsSold: 43,
      averageRating: 0,
    } : null,
  }),
}));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: () => state.projects }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: () => null }));
vi.mock('@/components/invest/MyunoScoreWidget', () => ({ MyunoScoreWidget: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
beforeEach(() => {
  state.language = 'en';
  state.hasDeveloper = false;
  state.isError = false;
  state.isLoading = false;
  state.refetch.mockClear();
  state.projects.isError = false;
  state.projects.isLoading = false;
  state.projects.refetch.mockClear();
});
afterEach(cleanup);
describe('developer detail read states', () => {
  it.each([['en', 'Try again'], ['ru', 'Повторить'], ['th', 'ลองอีกครั้ง']])('offers localized recovery for failed reads in %s', (language, retry) => {
    state.language = language; state.isError = true;
    render(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('Developer not found')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: retry }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });
  it('shows missing only after a successful empty read', () => {
    render(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.getByText('Developer not found')).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('does not show missing during loading', () => {
    state.isLoading = true;
    render(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.queryByText('Developer not found')).toBeNull();
  });
  it('keeps the verified profile visible when its projects fail and retries the projects only', () => {
    state.hasDeveloper = true;
    state.projects.isError = true;
    render(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Test Developer' })).toBeVisible();
    expect(screen.getByText('Verified developer')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Projects could not be loaded');
    expect(screen.queryByText(/No published projects/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(state.projects.refetch).toHaveBeenCalledOnce();
    expect(state.refetch).not.toHaveBeenCalled();
  });
  it('shows an empty projects state only after the projects read succeeds', () => {
    state.hasDeveloper = true;
    state.projects.isLoading = true;
    const { rerender } = render(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');
    expect(screen.queryByText(/No published projects/)).toBeNull();

    state.projects.isLoading = false;
    rerender(<MemoryRouter><DeveloperDetail /></MemoryRouter>);
    expect(screen.getByText(/No published projects/)).toBeVisible();
  });
});
describe('published developer badge eligibility', () => {
  it('links only an embedded matching active public profile', () => {
    expect(hasPublicDeveloperProfile('developer', { id: 'developer', is_active: true })).toBe(true);
  });
  it.each([null, undefined, { id: 'developer' }, { id: 'developer', is_active: false }, { id: 'other', is_active: true }])('does not infer a published profile from %j', developer => {
    expect(hasPublicDeveloperProfile('developer', developer)).toBe(false);
  });
});
