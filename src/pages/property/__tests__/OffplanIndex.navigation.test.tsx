import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import type { MapLibreMapProps } from '@/components/map/MapLibreMap';
import OffplanIndex from '../OffplanIndex';
const state = vi.hoisted(() => ({ language: 'en', filters: vi.fn(), isLoading: false, isError: false, projects: [] as Array<{ id: string; nameEn: string; nameRu: string; district: string; lat?: number; lng?: number }> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: (filters: unknown) => { state.filters(filters); return { data: state.projects, isLoading: state.isLoading, isError: state.isError, refetch: vi.fn() }; }, useProjectDistricts: () => ({ data: [] }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDevelopers: () => ({ data: [] }) }));
vi.mock('@/components/property/SaveOffplanSearchDialog', () => ({ SaveOffplanSearchDialog: () => null }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: ({ project }: { project: { nameEn: string } }) => <p>Card: {project.nameEn}</p> }));
vi.mock('@/components/map/MapLibreMap', () => ({ MapLibreMap: ({ center, zoom, markers, onMarkerClick, onUserViewportChange }: MapLibreMapProps) => <>
 <output data-testid="viewport">{[center.lat, center.lng, zoom].join(',')}</output>
 {markers?.map(marker => <button key={marker.id} onClick={() => onMarkerClick?.(marker)}>Pin: {marker.title}</button>)}
 <button onClick={() => onUserViewportChange?.({ lat: 8, lng: 98.34, zoom: 13 })}>Pan map</button>
</> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
afterEach(() => { cleanup(); state.language = 'en'; state.filters.mockClear(); state.isLoading = false; state.isError = false; state.projects = []; sessionStorage.removeItem('nb_apply_saved_search'); });
function Probe() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="url">{location.search}</output><Link to="/away">Leave catalog</Link><button onClick={() => navigate(-1)}>History back</button></>; }
function mount(initial = '/property/offplan') { return render(<MemoryRouter initialEntries={[initial]}><Routes><Route path="/property/offplan" element={<OffplanIndex />} /><Route path="/away" element={<p>Away</p>} /><Route path="/property/offplan/:id" element={<p>Project detail</p>} /></Routes><Probe /></MemoryRouter>); }
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
 const developer='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; sessionStorage.setItem('nb_apply_saved_search',JSON.stringify({q:'Ocean',fZone:'Bang Tao',fDev:developer,fSort:'price_desc'}));
 mount('/property/offplan?budget=lt5&ref=fixture'); const query=new URLSearchParams(screen.getByTestId('url').textContent!);
 expect(query.get('q')).toBe('Ocean'); expect(query.get('district')).toBe('Bang Tao'); expect(query.get('developer')).toBe(developer); expect(query.get('sort')).toBe('price_desc'); expect(query.has('budget')).toBe(false); expect(query.get('ref')).toBe('fixture');
});
it('names the supported fields and does not offer withheld facets in the public drawer', () => {
 mount(); fireEvent.click(screen.getByRole('button',{name:'Filters'})); expect(screen.getByRole('combobox',{name:'District'})).toBeVisible(); expect(screen.getByRole('combobox',{name:'Developer'})).toBeVisible(); expect(screen.getByRole('combobox',{name:'Budget'})).toBeVisible(); expect(screen.queryByText('Completion')).toBeNull(); expect(screen.queryByText('Ownership')).toBeNull();
});


const offplanFixtures = [
 { id: 'ocean', nameEn: 'Ocean Suites', nameRu: 'Ocean Suites', district: 'Bang Tao', lat: 8.01, lng: 98.3 },
 { id: 'missing', nameEn: 'Ocean Residence', nameRu: 'Ocean Residence', district: 'Bang Tao' },
 { id: 'lagoon', nameEn: 'Lagoon Villas', nameRu: 'Lagoon Villas', district: 'Bang Tao', lat: 8.02, lng: 98.31 },
];

it('draws only located filtered results and restores pin, filters and viewport on detail back', async () => {
 state.projects = offplanFixtures;
 mount('/property/offplan?q=Ocean&district=Bang+Tao&ref=fixture');
 fireEvent.click(screen.getByRole('button', { name: 'Map' }));
 const pin = await screen.findByRole('button', { name: 'Pin: Ocean Suites' });
 expect(screen.queryByRole('button', { name: 'Pin: Lagoon Villas' })).not.toBeInTheDocument();
 expect(screen.queryByRole('button', { name: 'Pin: Ocean Residence' })).not.toBeInTheDocument();
 expect(screen.getByText('Card: Ocean Residence')).toBeVisible();
 expect(screen.getByText(/without map locations/)).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: 'Pan map' }));
 expect(screen.getByTestId('viewport')).toHaveTextContent('8,98.34,13');
 fireEvent.click(pin);
 const detail = screen.getByRole('link', { name: 'Ocean Suites' });
 expect(detail).toHaveAttribute('href', '/property/offplan/ocean');
 fireEvent.click(detail);
 expect(screen.getByText('Project detail')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: 'History back' }));
 expect(await screen.findByRole('link', { name: 'Ocean Suites' })).toBeVisible();
 expect(screen.getByTestId('viewport')).toHaveTextContent('8,98.34,13');
 const query = new URLSearchParams(screen.getByTestId('url').textContent!);
 expect(query.get('q')).toBe('Ocean');
 expect(query.get('district')).toBe('Bang Tao');
 expect(query.get('view')).toBe('map');
 expect(query.get('ref')).toBe('fixture');
 expect(query.get('mapViewport')).toBe('8.00000,98.34000,13.00');
 fireEvent.click(screen.getByRole('button', { name: 'List' }));
 expect(screen.queryByRole('region', { name: 'Project map' })).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'History back' }));
 expect(await screen.findByRole('region', { name: 'Project map' })).toBeVisible();
 expect(screen.getByTestId('viewport')).toHaveTextContent('8,98.34,13');
});

it('does not render a misleading empty map when matching projects have no coordinates', async () => {
 state.projects = [offplanFixtures[1]];
 mount('/property/offplan?view=map&mapViewport=8,98.34,13');
 expect(await screen.findByText(/no map locations/)).toBeVisible();
 expect(screen.queryByTestId('viewport')).not.toBeInTheDocument();
 expect(screen.getByText('Card: Ocean Residence')).toBeVisible();
});
