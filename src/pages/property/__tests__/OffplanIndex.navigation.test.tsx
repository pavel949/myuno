import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import OffplanIndex from '../OffplanIndex';
const state = vi.hoisted(() => ({ language: 'en', filters: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: (filters: unknown) => { state.filters(filters); return { data: [], isLoading: false, isError: false }; }, useProjectDistricts: () => ({ data: [] }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDevelopers: () => ({ data: [] }) }));
vi.mock('@/components/property/SaveOffplanSearchDialog', () => ({ SaveOffplanSearchDialog: () => null }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
afterEach(() => { cleanup(); state.language = 'en'; state.filters.mockClear(); });
function Probe() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="url">{location.search}</output><Link to="/away">Leave catalog</Link><button onClick={() => navigate(-1)}>History back</button></>; }
function mount(initial = '/property/offplan') { return render(<MemoryRouter initialEntries={[initial]}><Routes><Route path="/property/offplan" element={<OffplanIndex />} /><Route path="/away" element={<p>Away</p>} /></Routes><Probe /></MemoryRouter>); }
describe('newbuild catalogue navigation', () => {
 it('restores canonical district/developer and title search from a direct URL', () => {
  mount('/property/offplan?district=Bang+Tao&developer=known-id&q=Ocean&guests=2');
  expect(state.filters).toHaveBeenLastCalledWith({ district: 'Bang Tao', developerId: 'known-id' });
  expect(screen.getByRole('textbox', { name: 'Project name or district' })).toHaveValue('Ocean');
  fireEvent.change(screen.getByRole('textbox', { name: 'Project name or district' }), { target: { value: 'Lagoon' } });
  expect(screen.getByTestId('url')).toHaveTextContent('guests=2');
  fireEvent.click(screen.getByRole('link', { name: 'Leave catalog' }));
  fireEvent.click(screen.getByRole('button', { name: 'History back' }));
  expect(screen.getByRole('textbox', { name: 'Project name or district' })).toHaveValue('Lagoon');
 });
 it('clears text-only empty results and preserves unrelated journey criteria', () => {
  mount('/property/offplan?q=missing&tenancy=long');
  fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
  expect(screen.getByRole('textbox', { name: 'Project name or district' })).toHaveValue('');
  expect(screen.getByTestId('url')).toHaveTextContent('?tenancy=long');
 });
 it('provides a Thai search name and truthful empty state', () => {
  state.language = 'th'; mount();
  expect(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือย่าน' })).toBeVisible();
  expect(screen.getByText('ไม่พบโครงการ')).toBeVisible();
 });
});
