import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseRules } from '../HouseRules';
import { PROPERTY_PUBLIC_DETAIL_COLUMNS, usePropertyWithRentalTerms } from '@/hooks/useProperties';

const mocks = vi.hoisted(() => ({ read: vi.fn(), from: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/publicPropertyCatalog', () => ({ selectPropertyCatalogFirst: mocks.read }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const cases = [
  [true, 'Child-friendly'],
  [false, 'Not child-friendly'],
  [null, 'Child policy not specified'],
  [undefined, 'Child policy not specified'],
] as const;

describe('public child policy', () => {
  it.each(cases)('preserves %s through public detail mapping and rendering', async (friendly, label) => {
    mocks.read.mockResolvedValue({
      id: 'synthetic', project_id: null, children_friendly: friendly,
      has_crib: true, has_high_chair: false,
      description_en: 'Family apartment with a crib',
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => usePropertyWithRentalTerms('synthetic'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const terms = result.current.data!.rentalTerms!;
    expect(terms.children_friendly).toBe(friendly);
    expect(terms.has_crib).toBe(true);
    expect(terms.has_high_chair).toBe(false);
    expect(mocks.read).toHaveBeenCalledWith('synthetic', PROPERTY_PUBLIC_DETAIL_COLUMNS);
    expect(mocks.from).not.toHaveBeenCalled();
    render(<HouseRules children={{ friendly: terms.children_friendly, hasCrib: terms.has_crib, hasHighChair: terms.has_high_chair }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    if (friendly !== false) expect(screen.queryByText('Not child-friendly')).not.toBeInTheDocument();
    if (friendly === true) expect(screen.getByText('Crib')).toBeInTheDocument();
    // Free-text marketing and amenities must never override a structured policy.
    if (friendly !== true) expect(screen.queryByText('Child-friendly')).not.toBeInTheDocument();
    client.clear();
  });

  it('does not invent a child policy when the section is absent', () => {
    render(<HouseRules />);
    expect(screen.queryByText('Not child-friendly')).not.toBeInTheDocument();
    expect(screen.queryByText('Child-friendly')).not.toBeInTheDocument();
  });
});
