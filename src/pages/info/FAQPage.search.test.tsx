import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FAQPage from './FAQPage';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));

describe('FAQPage help-centre search', () => {
  it('shows category shortcuts, filters answers and offers a reset on no match', () => {
    render(<MemoryRouter><FAQPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { level: 1, name: 'Help centre' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Categories' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search answers'), { target: { value: 'zzqqxx-no-such-term' } });
    expect(screen.getByText('No answer for this yet')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Categories' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('navigation', { name: 'Categories' })).toBeInTheDocument();
  });
});
