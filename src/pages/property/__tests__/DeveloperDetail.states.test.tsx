import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DeveloperDetail from '../DeveloperDetail';
import { hasPublicDeveloperProfile } from '@/lib/adapters/developerAdapter';
const state = vi.hoisted(() => ({ language: 'en', isError: false, isLoading: false, refetch: vi.fn() }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null, ...state }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: () => ({ data: [] }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: () => null }));
vi.mock('@/components/invest/MyunoScoreWidget', () => ({ MyunoScoreWidget: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
beforeEach(() => { state.language = 'en'; state.isError = false; state.isLoading = false; state.refetch.mockClear(); });
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
});
describe('published developer badge eligibility', () => {
  it('links only an embedded matching active public profile', () => {
    expect(hasPublicDeveloperProfile('developer', { id: 'developer', is_active: true })).toBe(true);
  });
  it.each([null, undefined, { id: 'developer' }, { id: 'developer', is_active: false }, { id: 'other', is_active: true }])('does not infer a published profile from %j', developer => {
    expect(hasPublicDeveloperProfile('developer', developer)).toBe(false);
  });
});
