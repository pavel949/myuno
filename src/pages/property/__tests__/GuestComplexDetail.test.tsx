import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GuestComplexDetail from '../GuestComplexDetail';
import { complexVideoSource } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES } from '@/lib/config/routes';
const state = vi.hoisted(() => ({
  project: { data: { id: 'complex', name_en: 'Ocean Place', name_ru: '', description_en: 'A peaceful place.', images: [] as string[], video_url: undefined as string | undefined, units_available: 19, amenities: [] as string[] }, isLoading: false, isError: false, refetch: vi.fn() },
  rent: { data: { properties: [] as Array<{ id: string; management_company_id?: string }>, total: 0 }, isLoading: false, isError: false, isSuccess: true, refetch: vi.fn() },
  sale: { data: { properties: [] as Array<{ id: string; management_company_id?: string }>, total: 0 }, isLoading: false, isError: false, isSuccess: true, refetch: vi.fn() },
  units: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyProjects', () => ({ usePropertyProject: () => state.project }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesByProject: (...args: unknown[]) => { state.units(...args); return (args[2] as { mode: string }).mode === 'buy' ? state.sale : state.rent; } }));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => ({ data: [{ id: 'operator', name_en: 'Actual Operator', slug: 'actual' }] }) }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: ({ property, companyName }: { property: { id: string }; companyName?: string }) => <a href={`/property/${property.id}`}>{property.id} {companyName}</a> }));
vi.mock('@/components/property/PhotoLightbox', () => ({ PhotoLightbox: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
afterEach(cleanup);
beforeEach(() => { state.project.data.images = []; state.project.data.amenities = []; state.project.data.video_url = undefined; state.project.isError = false; state.project.isLoading = false; state.rent.data = { properties: [], total: 0 }; state.sale.data = { properties: [], total: 0 }; state.rent.isError = false; state.units.mockClear(); });
function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.search}</output>; }
const mount = (search = '') => render(<MemoryRouter initialEntries={[`/property/complex/complex${search}`]}><Routes><Route path="/property/complex/:id" element={<GuestComplexDetail />} /></Routes><LocationProbe /></MemoryRouter>);

describe('informational complex detail', () => {
  it('shows only known facilities from the mixed project metadata array without inventing labels', () => {
    state.project.data.amenities = ['set_listed', 'early_delivery', '637_units', 'bang_tao', 'pool', 'beach-access', 'pool', 'rooftop_observatory'];
    mount();
    expect(screen.getByRole('heading', { name: 'Around the grounds' })).toBeVisible();
    expect(screen.getAllByText('Pool', { exact: true })).toHaveLength(1);
    expect(screen.getByText('Beach Access', { exact: true })).toBeVisible();
    for (const metadata of ['set_listed', 'early_delivery', '637_units', 'bang_tao', 'rooftop_observatory']) expect(screen.queryByText(metadata)).toBeNull();
  });
  it('omits the facility section when the record contains only project metadata', () => {
    state.project.data.amenities = ['set_listed', 'early_delivery', '637_units', 'bang_tao'];
    mount();
    expect(screen.queryByRole('heading', { name: 'Around the grounds' })).toBeNull();
    expect(screen.getByText('A peaceful place.')).toBeVisible();
  });
  it('uses a compact no-photo hero and exposes accurate offer anchors early', () => {
    mount('?checkIn=2026-12-01&checkOut=2026-12-04&guests=2&managementCompanyId=operator');
    expect(screen.getByTestId('complex-hero')).toHaveClass('min-h-[280px]');
    expect(screen.getByTestId('complex-hero')).not.toHaveClass('h-[60svh]');
    expect(screen.getByRole('link', { name: 'Property catalog' })).toHaveAttribute('href', '/property/browse?mode=rent&checkIn=2026-12-01&checkOut=2026-12-04&guests=2&company=operator');
    const buy = screen.getByRole('link', { name: 'Buy: 0' });
    expect(buy).toHaveAttribute('href', '#complex-units');
    fireEvent.click(buy);
    expect(screen.getByRole('link', { name: 'Property catalog' })).toHaveAttribute('href', '/property/browse?mode=buy&checkIn=2026-12-01&checkOut=2026-12-04&guests=2&company=operator');
    const params = new URLSearchParams(screen.getByTestId('location').textContent!);
    expect(Object.fromEntries(params)).toEqual({ checkIn: '2026-12-01', checkOut: '2026-12-04', guests: '2', managementCompanyId: 'operator', mode: 'buy' });
  });
  it('places homes before gallery and video while retaining genuine media', () => {
    state.project.data.images = ['https://example.com/photo.jpg'];
    state.project.data.video_url = 'https://example.com/tour.mp4';
    mount();
    expect(screen.getByTestId('complex-hero')).toHaveClass('h-[60svh]');
    const homes = screen.getByRole('heading', { name: 'Homes to rent' });
    expect(homes.compareDocumentPosition(screen.getByRole('heading', { name: 'A closer look' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(homes.compareDocumentPosition(screen.getByRole('heading', { name: 'Get a feel for the place' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('leaves the main landmark to the owning route shell', () => {
    render(<MemoryRouter initialEntries={['/property/complex/complex']}><main aria-label="Property shell"><Routes><Route path="/property/complex/:id" element={<GuestComplexDetail />} /></Routes></main></MemoryRouter>);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAccessibleName('Property shell');
  });
  it('has a distinct guest route, honest empty state, and no sales-inventory substitution', () => {
    expect(APP_ROUTES.COMPLEX_DETAIL('complex')).toBe('/property/complex/complex');
    expect(APP_ROUTES.OFFPLAN_DETAIL('complex')).toBe('/property/offplan/complex');
    mount();
    expect(screen.getByRole('heading', { name: 'Ocean Place' })).toBeInTheDocument();
    expect(screen.getByText('No published homes match these choices yet.')).toBeInTheDocument();
    expect(screen.getByText('Photos of this complex have not been added yet.')).toBeInTheDocument();
    expect(screen.queryByText('19')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Watch the film' })).not.toBeInTheDocument();
  });
  it('preserves operator scope across Rent/Buy and shows canonical counts and unit links', () => {
    state.rent.data = { properties: [{ id: 'same-unit', management_company_id: 'operator' }], total: 1 };
    state.sale.data = { properties: [{ id: 'same-unit', management_company_id: 'operator' }], total: 1 };
    mount('?managementCompanyId=operator');
    expect(screen.getByRole('link', { name: 'same-unit Actual Operator' })).toHaveAttribute('href', '/property/same-unit');
    fireEvent.click(screen.getByRole('button', { name: 'Buy 1' }));
    expect(screen.getByRole('heading', { name: 'Homes for sale' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'same-unit Actual Operator' })).toHaveLength(1);
    expect(state.units).toHaveBeenCalledWith('complex', 24, { mode: 'buy', managementCompanyId: 'operator' });
  });
  it('renders real media with click-to-play and no autoplay', () => {
    state.project.data.images = ['https://example.com/photo.jpg'];
    state.project.data.video_url = 'https://example.com/tour.mp4';
    const { container } = mount();
    expect(screen.getByRole('heading', { name: 'A closer look' })).toBeInTheDocument();
    expect(container.querySelector('video')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('controls');
    expect(video).not.toHaveAttribute('autoplay');
  });
  it('shows a retry on failed inventory instead of a false empty state', () => {
    state.rent.isError = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load homes.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.rent.refetch).toHaveBeenCalled();
  });
  it('rejects unsafe media and supports stored hosted video', () => {
    expect(complexVideoSource('javascript:alert(1)')).toBeNull();
    expect(complexVideoSource('https://youtu.be/abcdefghijk')).toEqual({ kind: 'embed', url: 'https://www.youtube-nocookie.com/embed/abcdefghijk' });
    expect(complexVideoSource('https://example.com/watch')).toEqual({ kind: 'link', url: 'https://example.com/watch' });
  });
});
