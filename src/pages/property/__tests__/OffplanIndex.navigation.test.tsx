import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import OffplanIndex from '../OffplanIndex';
const state = vi.hoisted(() => ({ language: 'en', filters: vi.fn(), isLoading: false, isError: false }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: (filters: unknown) => { state.filters(filters); return { data: [], isLoading: state.isLoading, isError: state.isError, refetch: vi.fn() }; }, useProjectDistricts: () => ({ data: [] }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDevelopers: () => ({ data: [] }) }));
vi.mock('@/components/property/SaveOffplanSearchDialog', () => ({ SaveOffplanSearchDialog: () => null }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
afterEach(() => { cleanup(); state.language = 'en'; state.filters.mockClear(); state.isLoading = false; state.isError = false; sessionStorage.removeItem('nb_apply_saved_search'); });
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

it.each(['year=2026', 'own=freehold', 'beach=500', 'sort=yield', 'rec=BUY'])('does not advertise a public match for withheld project facts: %s', query => {
 mount('/property/offplan?'+query+'&ref=fixture'); expect(screen.getByRole('alert')).toHaveTextContent('These terms require an enquiry');
 expect(screen.queryByText('0 results')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Reset filters' })); expect(screen.getByTestId('url')).toHaveTextContent('?ref=fixture');
});
it('rejects an unknown budget rather than showing every project', () => { mount('/property/offplan?budget=unknown'); expect(screen.getByRole('alert')).toBeVisible(); expect(screen.queryByText('0 results')).toBeNull(); });
it('does not show a zero match count while loading or after a failed read', () => {
 state.isLoading = true; const view=mount(); expect(screen.getByText('Loading…')).toBeVisible(); expect(screen.queryByText('0 results')).toBeNull(); view.unmount();
 state.isLoading = false; state.isError = true; mount(); expect(screen.getByText('Catalogue unavailable')).toBeVisible(); expect(screen.queryByText('0 results')).toBeNull();
});
it('restores the complete supported legacy saved search instead of merging stale URL filters', () => {
 const developer='11111111-1111-4111-8111-111111111111'; sessionStorage.setItem('nb_apply_saved_search',JSON.stringify({q:'Ocean',fZone:'Bang Tao',fDev:developer,fSort:'price_desc'}));
 mount('/property/offplan?budget=lt5&ref=fixture'); const query=new URLSearchParams(screen.getByTestId('url').textContent!);
 expect(query.get('q')).toBe('Ocean'); expect(query.get('district')).toBe('Bang Tao'); expect(query.get('developer')).toBe(developer); expect(query.get('sort')).toBe('price_desc'); expect(query.has('budget')).toBe(false); expect(query.get('ref')).toBe('fixture');
});
it('names the supported fields and does not offer withheld facets in the public drawer', () => {
 mount(); fireEvent.click(screen.getByRole('button',{name:'Filters'})); expect(screen.getByRole('combobox',{name:'District'})).toBeVisible(); expect(screen.getByRole('combobox',{name:'Developer'})).toBeVisible(); expect(screen.getByRole('combobox',{name:'Budget'})).toBeVisible(); expect(screen.queryByText('Completion')).toBeNull(); expect(screen.queryByText('Ownership')).toBeNull();
});
