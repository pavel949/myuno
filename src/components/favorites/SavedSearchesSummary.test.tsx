import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedSearchesSummary } from './SavedSearchesSummary';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const listState: { data?: unknown[]; isLoading: boolean; isError: boolean; refetch: () => void } = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};
vi.mock('@/hooks/useNbSavedSearches', () => ({ useNbSavedSearches: () => ({ list: listState }) }));

const renderSummary = () => render(<MemoryRouter><SavedSearchesSummary /></MemoryRouter>);

describe('SavedSearchesSummary', () => {
  beforeEach(() => {
    listState.data = [];
    listState.isLoading = false;
    listState.isError = false;
  });

  it('explains how to save a search when there are none', () => {
    renderSummary();
    expect(screen.getByText(/Save a search in the off-plan catalogue/)).toBeInTheDocument();
  });

  it('lists saved searches with their alert channel', () => {
    listState.data = [
      { id: '1', name: 'Bang Tao 2BR', notify_email: true, notify_whatsapp: true, frequency: 'daily', is_active: true },
      { id: '2', name: 'Rawai land', notify_email: false, notify_whatsapp: false, frequency: 'weekly', is_active: false },
    ];
    renderSummary();
    expect(screen.getByText('Bang Tao 2BR')).toBeInTheDocument();
    expect(screen.getByText('Email · WhatsApp · daily')).toBeInTheDocument();
    expect(screen.getByText('Alerts off')).toBeInTheDocument();
  });

  it('shows a retry on error instead of an empty list', () => {
    listState.isError = true;
    renderSummary();
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load your saved searches.");
  });
});
