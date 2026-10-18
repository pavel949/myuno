import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OwnerManagementLanding from '../OwnerManagementLanding';

const locale = vi.hoisted(() => ({ value: 'ru' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: locale.value }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
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
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Полное управление — ваша вилла или квартира в надёжных руках');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Что входит в полное управление');
    expect(screen.queryByText(/Full Management/i)).toBeNull();
  });
  it('preserves the English labels when English is selected', () => {
    locale.value = 'en';
    render(<MemoryRouter><OwnerManagementLanding /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Full Management — your villa or condo in safe hands');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('What full management includes');
  });
});
