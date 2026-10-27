import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthValuePanel } from '../AuthValuePanel';
const mock = vi.hoisted(() => ({ count: 0 }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key === 'auth.value.bullets.1' ? '{{count}}+ services under one account' : key }) }));
vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ categories: [], clusters: [] }) }));
vi.mock('@/lib/catalog/catalogMetrics', () => ({ getTotalEligibleServicesForAudience: () => mock.count }));
afterEach(cleanup);
describe('auth catalogue evidence', () => {
  it('omits the count when the canonical catalogue is empty', () => {
    mock.count = 0; render(<MemoryRouter><AuthValuePanel /></MemoryRouter>);
    expect(screen.queryByText(/services under one account/)).not.toBeInTheDocument();
    expect(screen.queryByText('auth.social.users')).not.toBeInTheDocument();
    expect(screen.queryByText('auth.value.bullets.3')).not.toBeInTheDocument();
  });
  it('uses the actual eligible count without an invented minimum', () => {
    mock.count = 7; render(<MemoryRouter><AuthValuePanel /></MemoryRouter>);
    expect(screen.getByText('7+ services under one account')).toBeInTheDocument();
    expect(screen.queryByText('50+ services under one account')).not.toBeInTheDocument();
  });
});
