import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomeHeroChoices } from './HomeHeroChoices';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

describe('HomeHeroChoices', () => {
  it('offers direct intent routes before broad discovery', () => {
    render(<MemoryRouter><HomeHeroChoices /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /Rent a home/i })).toHaveAttribute('href', '/property/search?mode=rent');
    expect(screen.getByRole('link', { name: /Buy property/i })).toHaveAttribute('href', '/property/search?mode=buy');
    expect(screen.getByRole('link', { name: /Find a service/i })).toHaveAttribute('href', '/discover/services');
    expect(screen.getByRole('link', { name: /Not sure what you need/i })).toHaveAttribute('href', '/discover');
  });
});
