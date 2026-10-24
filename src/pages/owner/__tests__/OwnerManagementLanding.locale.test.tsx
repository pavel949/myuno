import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import OwnerManagementLanding from '../OwnerManagementLanding';

const locale = vi.hoisted(() => ({ value: 'ru', user: null as null | { id: string } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: locale.value }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: locale.user }) }));
vi.mock('@/components/landings/LandingLeadForm', () => ({ LandingLeadForm: () => null }));
vi.mock('@/components/landings/LandingShell', () => ({
  LandingShell: ({ title, children }: { title: Record<string,string>; children: React.ReactNode }) => <main><h1>{title[locale.value]}</h1>{children}</main>,
  LandingChecklist: () => null,
}));
afterEach(cleanup);

describe('owner management language consistency', () => {
  it('uses Russian management labels in the Russian landing', () => {
    locale.value = 'ru';
    render(<MemoryRouter><OwnerManagementLanding /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Обсудим управление вашей недвижимостью');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Уже управляете сами?');
    expect(screen.queryByText(/Full Management/i)).toBeNull();
  });
  it('preserves the English labels when English is selected', () => {
    locale.value = 'en';
    render(<MemoryRouter><OwnerManagementLanding /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Let’s discuss managing your property');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Already managing your property?');
  });
});

function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
it.each([false, true])('preserves management intent through account selection (signed in: %s)', signedIn => {
  locale.value = 'en'; locale.user = signedIn ? { id: 'owner' } : null;
  render(<MemoryRouter><OwnerManagementLanding /><LocationProbe /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Open owner workspace/ }));
  const destination = new URL(screen.getByTestId('location').textContent!, 'https://fixture.test');
  const accountUrl = signedIn ? destination : new URL(destination.searchParams.get('redirect')!, 'https://fixture.test');
  expect(accountUrl.pathname).toBe('/auth/account-type');
  expect(accountUrl.searchParams.get('redirect')).toBe('/mc/full-management');
});
