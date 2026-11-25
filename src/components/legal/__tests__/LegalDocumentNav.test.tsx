import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LegalDocumentNav } from '../LegalDocumentNav';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

describe('LegalDocumentNav', () => {
  it('marks the current document and shows only the facts it was given', () => {
    render(
      <MemoryRouter>
        <LegalDocumentNav current="/privacy" version="2.0" updatedEn="January 2026" updatedRu="Январь 2026" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Terms' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('omits version and date when the page does not state them', () => {
    render(
      <MemoryRouter>
        <LegalDocumentNav current="/partner-agreement" />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated')).not.toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
  });
});
