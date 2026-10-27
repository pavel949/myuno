import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
const mock = vi.hoisted(() => ({ language: 'en', reset: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mock.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { resetPasswordForEmail: mock.reset } } }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/uno/BrandWordmark', () => ({ BrandWordmark: () => null }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mock.language = 'en'; });
const show = () => render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
describe('recovery presentation without auth side effects', () => {
  it.each(['en', 'ru', 'th'])('keeps a labelled email and canonical cancel destination in %s', (language) => {
    mock.language = language; show();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth');
    expect(mock.reset).not.toHaveBeenCalled();
  });
  it('associates invalid-email feedback with the field before any request', () => {
    show();
    const email = screen.getByRole('textbox', { name: 'Email' });
    fireEvent.change(email, { target: { value: 'invalid' } });
    fireEvent.submit(email.closest('form')!);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Invalid email address');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
    expect(mock.reset).not.toHaveBeenCalled();
  });
});
