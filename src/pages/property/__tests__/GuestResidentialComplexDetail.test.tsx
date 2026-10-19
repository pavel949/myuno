import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GuestResidentialComplexDetail from '../GuestResidentialComplexDetail';
import { ResidentialComplexLink } from '@/components/property/ResidentialComplexLink';
import type { PublicComplexDetail } from '@/hooks/usePropertyComplexes';
import { APP_ROUTES } from '@/lib/config/routes';
import { residentialComplexDetailHref } from '@/lib/real-estate/propertyDetailIntent';
const state = vi.hoisted(() => ({
  language: 'en',
  complex: { data: { id: 'managed', name: 'Ocean', name_ru: 'Океан', description_en: 'Description', images: [] } as PublicComplexDetail | null, isLoading: false, isError: false, refetch: vi.fn() },
  units: { data: { properties: [] as { id: string }[], total: 0 }, isLoading: false, isError: false, refetch: vi.fn() },
  readUnits: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ usePublicComplexDetail: () => state.complex }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesByComplex: (...args: unknown[]) => { state.readUnits(...args); return state.units; } }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: ({ property, mode }: { property: { id: string }; mode: string }) => <a href={`/property/${property.id}?mode=${mode}`}>{property.id}</a> }));
vi.mock('@/components/property/PhotoLightbox', () => ({ PhotoLightbox: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
afterEach(cleanup);
beforeEach(() => {
  state.language = 'en'; state.complex.data = { id: 'managed', name: 'Ocean', name_ru: 'Океан', description_en: 'Description', images: [] };
  state.complex.isLoading = false; state.complex.isError = false;
  state.units.data = { properties: [], total: 0 }; state.units.isLoading = false; state.units.isError = false;
  vi.clearAllMocks();
});
function LocationProbe() { return <output data-testid="location">{useLocation().search}</output>; }
function mount(search = '') { return render(<MemoryRouter initialEntries={[`/property/residential-complex/managed${search}`]}><Routes><Route path="/property/residential-complex/:id" element={<GuestResidentialComplexDetail />} /></Routes><LocationProbe /></MemoryRouter>); }
describe('managed complex guest route', () => {
  it('keeps project and managed-complex URLs distinct and carries guest context', () => {
    expect(APP_ROUTES.COMPLEX_DETAIL('id')).toBe('/property/complex/id');
    expect(APP_ROUTES.RESIDENTIAL_COMPLEX_DETAIL('id')).toBe('/property/residential-complex/id');
    expect(residentialComplexDetailHref('id', 'rent', '?checkIn=2026-12-01&checkOut=2026-12-05&guests=3')).toBe('/property/residential-complex/id?mode=rent&checkIn=2026-12-01&checkOut=2026-12-05&guests=3');
  });
  it('uses the public managed ID and retains mode, dates, guests and operator', () => {
    state.units.data = { properties: [{ id: 'unit' }], total: 25 };
    mount('?checkIn=2026-12-01&guests=2&managementCompanyId=operator');
    expect(screen.getByRole('heading', { name: 'Ocean' })).toBeInTheDocument();
    expect(state.readUnits).toHaveBeenLastCalledWith('managed', 24, { mode: 'rent', managementCompanyId: 'operator' });
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(state.readUnits).toHaveBeenLastCalledWith('managed', 48, { mode: 'rent', managementCompanyId: 'operator' });
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(state.readUnits).toHaveBeenLastCalledWith('managed', 24, { mode: 'buy', managementCompanyId: 'operator' });
    expect(screen.getByRole('link', { name: 'unit' })).toHaveAttribute('href', '/property/unit?mode=buy');
    expect(screen.getByTestId('location')).toHaveTextContent('checkIn=2026-12-01&guests=2&managementCompanyId=operator&mode=buy');
  });
  it.each([['en', 'Published homes'], ['ru', 'Опубликованные предложения'], ['th', 'ที่พักที่เผยแพร่แล้ว']])('localizes %s', (language, heading) => {
    state.language = language; mount();
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
  it.each([
    ['en', 'Swimming Pool', 'Concierge', 'CCTV', 'Restaurant', 'Facility opening hours have not been provided.'],
    ['ru', 'Бассейн', 'Консьерж', 'Видеонаблюдение', 'Ресторан', 'Часы работы удобств пока не указаны.'],
    ['th', 'สระว่ายน้ำ', 'บริการคอนเซียร์จ', 'กล้องวงจรปิด', 'ร้านอาหาร', 'ยังไม่ได้ระบุเวลาเปิดให้บริการของสิ่งอำนวยความสะดวก'],
  ])('renders real complex taxonomy in %s without invented schedules', (language, ...labels) => {
    state.language = language;
    Object.assign(state.complex.data!, { amenities: ['swimming_pool', 'swimming_pool', 'Custom facility'], services: ['concierge'], security_features: ['cctv'], infrastructure: ['restaurant'] });
    mount();
    labels.forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getByText('Custom facility')).toBeInTheDocument();
    expect(screen.getAllByText(labels[0])).toHaveLength(1);
    expect(screen.queryByText(/24h|24\/7|08:00/)).not.toBeInTheDocument();
  });
  it('does not fetch units or reveal private complex data when public detail is absent', () => {
    state.complex.data = null; mount();
    expect(screen.getByRole('heading', { name: 'Complex not found' })).toBeInTheDocument();
    expect(state.readUnits).toHaveBeenLastCalledWith(undefined, 24, { mode: 'rent', managementCompanyId: undefined });
  });
  it('keeps catalogue errors distinct from unpublished/not-found results', () => {
    state.complex.data = null; state.complex.isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load this complex.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.complex.refetch).toHaveBeenCalled();
  });
  it('shows failed units as an error, never as empty inventory', () => {
    state.units.isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load homes.');
    expect(screen.queryByText('No published homes match these choices yet.')).not.toBeInTheDocument();
  });
  it('links published unit pages to their canonical complex, with guest context', () => {
    render(<MemoryRouter initialEntries={['/property/unit?guests=2']}><ResidentialComplexLink complexId="managed" mode="buy" /></MemoryRouter>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/property/residential-complex/managed?mode=buy&guests=2');
  });
  it('does not link or label an unpublished complex on a public unit page', () => {
    state.complex.data = null;
    render(<MemoryRouter><ResidentialComplexLink complexId="private" mode="rent" /></MemoryRouter>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
