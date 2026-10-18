import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import TripPlannerPage from './TripPlannerPage';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/trip-planner/TripChecklist', () => ({ TripChecklist: () => null }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/home/HomeDiscoverySearch', () => ({ HomeDiscoverySearch: () => <form aria-label="Rental search" className="home-discovery-search" /> }));
it('retains the compact search scope inside the desktop sidebar layout', () => {
  render(<MemoryRouter><TripPlannerPage /></MemoryRouter>);
  expect(screen.getByRole('form', { name: 'Rental search' }).closest('.journey-primary')).not.toBeNull();
});
