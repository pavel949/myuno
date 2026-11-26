import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLocationKnowledge from '../AdminLocationKnowledge';

const list = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test-admin' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCities', () => ({ useCities: () => ({ cities: [{ id: 'phuket', name_en: 'Phuket' }] }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const query = {
        select: () => query,
        order: () => query,
        eq: () => query,
        then: (resolve: (result: unknown) => void, reject: (error: unknown) => void) => list().then(resolve, reject),
      };
      return query;
    },
  },
}));

const articles = [
  {
    id: 'airport',
    city_id: 'phuket',
    section: 'overview',
    title_en: 'Airport guide',
    title_ru: 'Аэропорт',
    content_en: 'Recorded English content.',
    content_ru: '',
    slug: 'airport-guide',
    is_published: true,
    updated_at: '2026-11-20T00:00:00Z',
  },
  {
    id: 'ferry',
    city_id: 'phuket',
    section: 'overview',
    title_en: 'Ferry guide',
    title_ru: 'Паром',
    content_en: 'Recorded English content.',
    content_ru: 'Сохранённый текст.',
    slug: 'ferry-guide',
    is_published: false,
    updated_at: '2026-11-21T00:00:00Z',
  },
];

function renderKnowledge() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminLocationKnowledge />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('location knowledge publishing workspace', () => {
  beforeEach(() => list.mockReset());

  it('applies article search and publication filters to rows within the same section', async () => {
    list.mockResolvedValue({ data: articles, error: null });
    renderKnowledge();

    await screen.findByText('Airport guide');
    expect(screen.getByText('RU Content missing')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), { target: { value: 'ferry' } });

    expect(screen.queryByText('Airport guide')).not.toBeInTheDocument();
    expect(screen.getByText('Ferry guide')).toBeInTheDocument();
    expect(screen.getByText('RU Content saved')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Published 1' }));
    expect(screen.getByText('No articles match these filters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('Airport guide')).toBeInTheDocument();
  });

  it('shows a failed read and recovers the real list on retry', async () => {
    list.mockResolvedValueOnce({ data: null, error: new Error('Article list unavailable') });
    list.mockResolvedValue({ data: articles.slice(0, 1), error: null });
    renderKnowledge();

    expect(await screen.findByRole('alert')).toHaveTextContent('Articles could not be loaded.');
    expect(screen.queryByText('No articles in this selection.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Airport guide')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
