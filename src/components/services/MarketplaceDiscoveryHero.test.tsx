import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MarketplaceDiscoveryHero } from './MarketplaceDiscoveryHero';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
describe('compact marketplace discovery', () => {
  it('keeps experience navigation compact, with no decorative hero delaying real offers', () => {
    const { container } = render(<MemoryRouter><MarketplaceDiscoveryHero kind="experiences" /></MemoryRouter>);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: 'Tours & discoveries' })).toHaveAttribute('href', '/experiences?type=tour');
    expect(screen.getByRole('link', { name: 'Activities & adventures' })).toHaveAttribute('href', '/experiences?type=activity');
    expect(screen.getByRole('link', { name: 'Yachts & sea trips' })).toHaveAttribute('href', '/yachts');
    expect(screen.getByText(/myUNO will confirm/)).toBeInTheDocument();
  });
  it('uses decorative category imagery, without presenting it as live offers or availability', () => {
    const { container } = render(<MemoryRouter><MarketplaceDiscoveryHero kind="services" /></MemoryRouter>);
    expect(container.querySelectorAll('img')).toHaveLength(3);
    container.querySelectorAll('img').forEach(image => expect(image).toHaveAttribute('alt', ''));
    expect(screen.getByRole('link', { name: 'Airport transfer' })).toHaveAttribute('href', '/transport/airport-transfer');
    expect(screen.getByRole('link', { name: 'Airport Fast Track' })).toHaveAttribute('href', '/transport/fast-track');
    expect(screen.getByRole('link', { name: 'Flower delivery' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByText(/Terms are confirmed before ordering/)).toBeInTheDocument();
  });
});
