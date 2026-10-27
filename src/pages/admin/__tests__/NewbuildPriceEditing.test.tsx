import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminNewbuilds from '../AdminNewbuilds';
import OffplanDetail from '@/pages/property/OffplanDetail';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';
import { HomeNewbuildsPreview } from '@/components/home/HomeDiscoveryPreview';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
const state = vi.hoisted(() => ({ row: {} as Record<string, unknown>, writes: [] as Array<Record<string, unknown>> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: () => 'UNEXPECTED CONVERSION', currency: 'USD' }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'USD' } }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'USD', symbol: '$' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useUserCollections', () => ({ useUserCollections: () => ({ isInCollection: () => false, toggleCollection: vi.fn() }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: null }) }));
vi.mock('@/hooks/useProjectDocuments', () => ({ useProjectDocuments: () => ({ data: [] }), DOCUMENT_CATEGORIES: {} }));
vi.mock('@/hooks/useDevelopmentUnits', () => ({ useDevelopmentUnits: () => ({ data: [] }) }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: () => ({ data: [] }) }));
vi.mock('@/components/leads/UniversalLeadForm', () => ({ UniversalLeadForm: () => <div>Isolated inquiry form</div> }));
vi.mock('@/components/newbuilds/NewbuildProjectDeepTabs', () => ({ NewbuildProjectDeepTabs: () => null }));
vi.mock('@/components/seo', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, SEOHead: ({ jsonLd }: { jsonLd: unknown }) => <script data-testid="structured-data" type="application/ld+json">{JSON.stringify(jsonLd)}</script> };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let single = false, updates: Record<string, unknown> | undefined;
  const query = {
    select: () => query, order: () => query, eq: () => query, in: () => query,
    match: () => query, limit: () => query,
    maybeSingle: () => { single = true; return query; },
    update: (value: Record<string, unknown>) => { updates = value; return query; },
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
      if (updates) { state.writes.push({ ...updates }); state.row = { ...state.row, ...updates }; }
      const data = table === 'property_projects' ? single ? { ...state.row } : [{ ...state.row }] : [];
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    },
  };
  return query;
} } }));
function PublicCard() {
  const { data } = useOffplanProjects();
  return data?.[0] ? <OffplanProjectCard project={data[0]} /> : null;
}
afterEach(cleanup);
describe('existing CMS → canonical public starting price', () => {
  it('saves a THB starting price, refreshes card/detail/home, and respects a cleared price', async () => {
    state.row = { id: 'project', name_en: 'Synthetic price editing fixture', name_ru: 'Изолированный проект', price_from: 8_000_000, price_from_thb: 99_000_000, district: 'Bang Tao', is_active: true, is_approved: true, public_listing_enabled: true, developer_id: null, amenities: [], created_at: '2026-01-01', construction_progress: 65, units_available: 17, project_status: 'completed', completion_date: '2027-01-01', roi_projected: 9 };
    state.writes = [];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/property/offplan/project']}><AdminNewbuilds /><PublicCard /><HomeNewbuildsPreview /><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter></QueryClientProvider>);
    await screen.findByRole('button', { name: 'Edit' });
    await waitFor(() => expect(screen.getAllByText('Цена требует уточнения')).toHaveLength(3));
    expect(screen.queryByText('UNEXPECTED CONVERSION')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByLabelText('Цена от (THB)');
    fireEvent.change(input, { target: { value: '9100000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(state.writes).toEqual([{ price_from: 9_100_000 }]));
    await waitFor(() => expect(screen.getAllByText(/от 9\s100\s000 THB/)).toHaveLength(3));
    expect(screen.getByTestId('structured-data').textContent).not.toContain('offers');
    expect(screen.getByTestId('structured-data').textContent).not.toContain('9100000');
    // The model stores project starting prices in THB, not viewer USD and not
    // a mixed-unit minimum. No source/legacy alias is written by this edit.
    expect(state.row.price_from_thb).toBe(99_000_000);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Цена от (THB)'), { target: { value: '' } });
    expect(screen.getByLabelText('Цена от (THB)')).toHaveValue(null);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(state.writes[state.writes.length - 1]).toEqual({ price_from: null }));
    await waitFor(() => expect(screen.getAllByText('Цена уточняется')).toHaveLength(3));
    expect(screen.queryByText(/99\s000\s000 THB/)).toBeNull();
  });
});
