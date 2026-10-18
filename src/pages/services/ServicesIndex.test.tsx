import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import ServicesIndex from './ServicesIndex';
import { serviceCatalogueReturnTo } from '@/lib/services/serviceNavigation';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePersonaFilter', () => ({ usePersonaFilter: () => ({ applyFilter: (rows: unknown[]) => rows }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children, onSearchChange, searchValue }: { children: ReactNode; onSearchChange: (s: string) => void; searchValue: string }) => <><input aria-label="Search services" value={searchValue} onChange={e => onSearchChange(e.target.value)} />{children}</> }));
vi.mock('@/components/services/MarketplaceServiceGrid', () => ({ MarketplaceServiceGrid: () => <div>Providers</div> }));
vi.mock('@/components/services', () => ({ ServiceFunctionCard: ({ fn, onClick, catalogue }: { fn: { name: string }; onClick: () => void; catalogue?: boolean }) => <button data-catalogue={catalogue} onClick={onClick}>{fn.name}</button> }));
function Location() { const l = useLocation(); return <output data-testid="location">{l.pathname}{l.search}</output>; }
function mount(path = '/discover/services', embedded = false) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/discover/services" element={<ServicesIndex embedded={embedded} />} />
    <Route path="/services/order/:id" element={<div>Request details</div>} />
  </Routes><Location /></MemoryRouter>);
}
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});
describe('simplified service discovery', () => {
  it('renders each request once without gateway or repeated popular blocks', () => {
    mount();
    expect(screen.getAllByText('AC Cleaning')).toHaveLength(1);
    expect(screen.getByText('AC Cleaning')).toHaveAttribute('data-catalogue', 'true');
    expect(screen.queryByText('Popular Services')).toBeNull();
    expect(screen.queryByText('Guided help')).toBeNull();
  });
  it('keeps the same catalogue and filters when embedded in My Services', () => {
    mount('/discover/services?category=ac&q=cleaning', true);
    expect(screen.getByRole('searchbox')).toHaveValue('cleaning');
    expect(screen.getByRole('combobox')).toHaveTextContent('Air Conditioning');
    expect(screen.getByText('AC Cleaning')).toHaveAttribute('data-catalogue', 'true');
    expect(screen.getByText(/Prices are estimates/)).toBeVisible();
  });
  it('uses the themed category menu with keyboard selection and URL state', () => {
    mount();
    const trigger = screen.getByRole('combobox', { name: 'Request category' });
    expect(trigger.tagName).toBe('BUTTON');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(screen.getByRole('option', { name: 'Air Conditioning' }));
    expect(trigger).toHaveTextContent('Air Conditioning');
    expect(screen.getByTestId('location')).toHaveTextContent('/discover/services?category=ac');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('restores combined category and query filters from URL', () => {
    mount('/discover/services?category=ac&q=cleaning');
    expect(screen.getByRole('combobox', { name: 'Request category' })).toHaveTextContent('Air Conditioning');
    expect(screen.getByRole('textbox')).toHaveValue('cleaning');
    expect(screen.getByText('AC Cleaning')).toBeInTheDocument();
    expect(screen.queryByText('AC Installation')).toBeNull();
    fireEvent.click(screen.getByText('AC Cleaning'));
    expect(screen.getByTestId('location').textContent).toContain('returnTo=%2Fdiscover%2Fservices%3Fcategory%3Dac%26q%3Dcleaning');
  });
  it('keeps unsupported categories empty rather than substituting a different trade', () => {
    mount('/discover/services?category=photography&ref=test');
    expect(screen.getByText('No services found')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear search and category'));
    expect(screen.getByTestId('location')).toHaveTextContent('/discover/services?ref=test');
    expect(screen.getByText('AC Cleaning')).toBeInTheDocument();
  });
  it('supports equivalent legacy category names and keeps unrelated URL context', () => {
    mount('/discover/services?type=ac-repair&ref=test');
    expect(screen.getByRole('combobox', { name: 'Request category' })).toHaveTextContent('Air Conditioning');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'repair' } });
    expect(screen.getByTestId('location')).toHaveTextContent('ref=test&q=repair');
  });
  it.each(['/services?category=ac', '/discover/services?q=cleaning'])('accepts catalogue return %s', path => {
    expect(serviceCatalogueReturnTo(path)).toBe(path);
  });
  it.each([null, '//evil.test', 'https://evil.test', '/services/order/123', '/discover/services#outside'])('rejects unsafe or non-catalogue return %s', path => {
    expect(serviceCatalogueReturnTo(path)).toBe('/discover/services');
  });
});
