import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Wrench } from 'lucide-react';
import ArriveClusterPage from '@/pages/arrive/ArriveClusterPage';
import LegalClusterPage from '@/pages/legal/LegalClusterPage';
import { APP_ROUTES } from '@/lib/config/routes';
import { groupCatalogDestinations } from '@/lib/services/catalogServiceGroups';
import { GroupedServiceDestinations } from './GroupedServiceDestinations';

let language: 'en' | 'ru' | 'th' = 'en';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/uno/CalmClusterHero', () => ({ CalmClusterHero: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/navigation/ClusterBreadcrumb', () => ({ ClusterBreadcrumb: () => null }));
vi.mock('@/components/navigation/ExploreMoreRail', () => ({ ExploreMoreRail: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
beforeEach(() => { language = 'en'; });
const mount = (page: ReactNode) => render(<MemoryRouter>{page}</MemoryRouter>);
const hrefs = () => screen.getAllByRole('link').map(link => link.getAttribute('href')).sort();

describe('mounted thematic service grouping', () => {
  it('preserves all visiting destinations under canonical categories and arrival stages', () => {
    mount(<ArriveClusterPage />);
    expect(screen.getByRole('heading', { name: 'Before You Come' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Day of Arrival' })).toBeVisible();
    expect(hrefs()).toEqual([
      APP_ROUTES.PROPERTY_RENT_SHORT, APP_ROUTES.TRANSPORT, APP_ROUTES.YACHTS,
      APP_ROUTES.EXPERIENCES, APP_ROUTES.EVENTS, APP_ROUTES.RESTAURANTS,
      APP_ROUTES.AIRPORT_TRANSFER, APP_ROUTES.FAST_TRACK, APP_ROUTES.SIM_START, APP_ROUTES.EXCHANGE,
    ].sort());
    const tours = screen.getByRole('region', { name: 'Tourism & Activities' });
    expect(within(tours).getByRole('link', { name: /Yacht Charter/ })).toBeVisible();
    expect(within(tours).queryByRole('link', { name: /Restaurants/ })).toBeNull();
  });
  it('preserves the relocation scenario, stages and every existing alternative route', () => {
    mount(<ArriveClusterPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Moving (6+ mo)' }));
    expect(screen.getByRole('heading', { name: 'Before the move' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'First weeks' })).toBeVisible();
    expect(hrefs()).toEqual([
      APP_ROUTES.VISA_COMPARE, APP_ROUTES.RELOCATION_GUIDES, APP_ROUTES.RELOCATE,
      `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`, APP_ROUTES.EDUCATION, APP_ROUTES.MEDICAL,
      APP_ROUTES.AIRPORT_TRANSFER, APP_ROUTES.SIM_START, APP_ROUTES.BANKING,
      APP_ROUTES.RELOCATION_MY_PLAN, APP_ROUTES.RELOCATION_AREAS,
    ].sort());
    expect(screen.getAllByRole('region', { name: 'Other services and guides' }).length).toBeGreaterThan(0);
  });
  it('keeps the five legal destinations and separates finance from legal help', () => {
    mount(<LegalClusterPage />);
    expect(hrefs()).toEqual([APP_ROUTES.VISA_IMMIGRATION, APP_ROUTES.TAX_NAV, APP_ROUTES.CONTRACT_ANALYSIS, APP_ROUTES.INSURANCE, APP_ROUTES.LEGAL].sort());
    const finance = screen.getByRole('region', { name: 'Finance' });
    expect(within(finance).getByRole('link', { name: /TaxNav/ })).toBeVisible();
    expect(within(finance).queryByRole('link', { name: /ContractAI/ })).toBeNull();
  });
  it('uses canonical localized category labels and preserves informational status', () => {
    language = 'ru';
    mount(<GroupedServiceDestinations clusterId="legal" idPrefix="fixture" apps={[{
      serviceId: 'tax', path: APP_ROUTES.TAX_NAV, label: 'Tax', labelRu: 'Налоги', desc: 'Existing scope', descRu: 'Существующая информация', fallbackIcon: Wrench, statusOverride: 'info',
    }]} />);
    expect(screen.getByRole('region', { name: 'Финансы и налоги' })).toBeVisible();
    expect(screen.getByText('Информация')).toBeVisible();
    expect(screen.queryByText('Для специалистов')).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute('href', APP_ROUTES.TAX_NAV);
  });
  it('does not infer a category for unknown IDs or lose distinct destination variants', () => {
    const first = { serviceId: 'unknown', path: '/services?category=one' };
    const variant = { serviceId: 'unknown', path: '/services?category=two' };
    expect(groupCatalogDestinations([first, first, variant])).toEqual([{ id: 'other', category: null, items: [first, variant] }]);
  });
});
