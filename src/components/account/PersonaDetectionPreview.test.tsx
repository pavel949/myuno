/**
 * Smoke test for PersonaDetectionPreview (M5 H.3).
 * Covers loading, empty, and filled render branches + CTA target.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaDetectionPreview } from './PersonaDetectionPreview';

vi.mock('@/hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => true,
}));

const profileMock = vi.fn();
vi.mock('@/hooks/useCanonicalProfile', () => ({
  useCanonicalProfile: () => profileMock(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const renderWith = () =>
  render(
    <MemoryRouter>
      <PersonaDetectionPreview />
    </MemoryRouter>,
  );

describe('PersonaDetectionPreview', () => {
  beforeEach(() => profileMock.mockReset());

  it('renders loading skeleton', () => {
    profileMock.mockReturnValue({ profile: null, isLoading: true });
    const { container } = renderWith();
    // Skeleton blocks use the shimmer animation utility class
    expect(container.querySelectorAll('.before\\:animate-shimmer').length).toBe(3);
    expect(screen.queryByText(/Your profile signals/i)).not.toBeInTheDocument();
  });

  it('renders empty state with primary CTA → /start/v2?return=/account', () => {
    profileMock.mockReturnValue({ profile: null, isLoading: false });
    renderWith();
    expect(screen.getByText(/Your profile signals/i)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /Set up in 30 seconds/i });
    expect(cta).toHaveAttribute('href', '/start/v2?return=%2Faccount');
  });

  it('renders filled state with persona/clusters and refine CTA', () => {
    profileMock.mockReturnValue({
      profile: {
        lifecycleStage: 'living_here',
        detectedPersona: 'Resident',
        activeClusters: ['live', 'manage'],
      },
      isLoading: false,
    });
    renderWith();
    expect(screen.getByText('Resident')).toBeInTheDocument();
    const refine = screen.getByRole('link', { name: /Refine answers/i });
    expect(refine).toHaveAttribute('href', '/start/v2?return=%2Faccount');
  });
});
