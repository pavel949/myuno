import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import FAQPage from '../FAQPage';

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

afterEach(cleanup);

describe('help centre search', () => {
  it('opens a common search and links to the existing support page', () => {
    render(<MemoryRouter><FAQPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /^Refund$/ }));
    expect(screen.getByRole('searchbox', { name: 'Search help' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Answers found: 1');
    fireEvent.click(screen.getByRole('button', { name: 'How do I request a refund?' }));
    expect(screen.getByText(/check its cancellation policy/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Contact Support' })).toHaveAttribute('href', '/support');
  });

  it('can clear a search with no matches and return to the topic directory', () => {
    render(<MemoryRouter><FAQPage /></MemoryRouter>);

    const search = screen.getByRole('searchbox', { name: 'Search help' });
    expect(screen.getByRole('navigation', { name: 'Browse by topic' })).toBeVisible();
    fireEvent.change(search, { target: { value: 'NoSuchHelpTopic' } });
    expect(screen.getByText('No answers match your search.')).toBeVisible();
    expect(screen.queryByRole('navigation', { name: 'Browse by topic' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveFocus();
    expect(search).toHaveValue('');
    expect(screen.getByRole('navigation', { name: 'Browse by topic' })).toBeVisible();
  });
});
