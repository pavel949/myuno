import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const language = vi.hoisted(() => ({ current: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: language.current }),
}));
vi.mock('@/components/nav/ConsumerHeader', () => ({ ConsumerHeader: ({ headerActions }: { headerActions?: ReactNode }) => <>{headerActions}</> }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/legal/LegalEntityInfo', () => ({ LegalCopyright: () => null }));
vi.mock('@/components/concierge/ConciergeHelpSheet', () => ({ ConciergeHelpSheet: () => null }));
vi.mock('@/components/home/HomeSearchEntry', () => ({ HomeSearchEntry: () => null, HomePlanLinks: () => null }));
vi.mock('@/components/home/HomePopulatedProjects', () => ({ HomePopulatedProjects: () => null }));
vi.mock('@/components/home/HomeCatalogGalleries', () => ({ HomeLocationGallery: () => null, HomeExperienceGallery: () => null, HomeServiceGallery: () => null }));
vi.mock('@/components/home/HomeDiscoveryPreview', () => ({ HomeHousingPreview: () => null, HomeNewbuildsPreview: () => null }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: () => ({ data: [], isLoading: false, isError: false }) }));

// Navigation composition is covered by Landing.anonymous-home.test.tsx.
vi.mock('@/components/nav/BottomBar', () => ({ BottomBar: () => null }));

import Landing from '../Landing';

afterEach(cleanup);
describe('static public hero', () => {
  it.each(['en', 'ru', 'th'])('keeps %s hero photography still without a forced animation control', locale => {
    language.current = locale;
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    const image = container.querySelector('.home-hero-image')!;
    fireEvent.load(image);
    expect(image).not.toHaveClass('is-motion-enabled', 'is-paused');
    expect(screen.queryByRole('button', { name: /Pause motion|Resume motion/ })).toBeNull();
  });
});
