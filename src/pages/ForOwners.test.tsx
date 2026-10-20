import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ForOwnersPage from './ForOwners';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/referral/OwnerReferralCard', () => ({ OwnerReferralCard: () => <div>Referral</div> }));
vi.mock('react-helmet-async', () => ({ Helmet: () => null }));

afterEach(cleanup);

it.each(['en', 'ru', 'th'])('preserves both owner journeys and comparison anchors in %s', language => {
  state.language = language;
  const { container } = render(<MemoryRouter><ForOwnersPage /></MemoryRouter>);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const paths = container.querySelector('#paths');
  expect(paths).not.toBeNull();
  expect(paths).toHaveClass('scroll-mt-[calc(var(--consumer-header-height,0px)+1rem)]');
  expect(paths).not.toHaveClass('scroll-mt-24');
  expect(container.querySelectorAll('a[href="#paths"]')).toHaveLength(2);
  const cards = paths!.querySelectorAll('article');
  expect(cards).toHaveLength(2);
  expect(cards[0].querySelector('a')).toHaveAttribute('href', '/owner/management-landing');
  expect(cards[1].querySelector('a')).toHaveAttribute('href', '/mc/onboarding');
  expect(cards[0]).toHaveTextContent('70 / 30');
  expect(cards[1]).toHaveTextContent('$25');
  expect(container.querySelector('a[href="/mc/onboarding?plan=starter"]')).not.toBeNull();
  expect(container.querySelector('a[href="/mc/onboarding?plan=pro"]')).not.toBeNull();
});
