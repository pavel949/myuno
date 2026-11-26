import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KnowledgeArticlePage from '../KnowledgeArticlePage';

const query = vi.hoisted(() => vi.fn());
const retry = vi.fn();

vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ getCityName: () => 'Phuket' }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('@/components/knowledge', () => ({ RelatedServicesLinks: () => <a href="/services">Related services</a> }));
vi.mock('@/hooks/useLocationKnowledge', () => ({
  useKnowledgeArticle: (...args: string[]) => query(...args),
  getSectionMeta: () => ({ label: 'Overview' }),
}));

function visitArticle() {
  return render(
    <MemoryRouter
      initialEntries={['/knowledge/overview/getting-around']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/knowledge/:section/:slug" element={<KnowledgeArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('published knowledge article', () => {
  beforeEach(() => {
    query.mockReset();
    retry.mockReset();
  });

  it('links both contents layouts to the authored headings and preserves mixed prose and lists', () => {
    query.mockReturnValue({
      data: {
        title: 'Getting around Phuket',
        summary: 'Local transport guide.',
        updatedAt: '2026-11-20T12:00:00Z',
        content: '## Transfers\r\nPlan your transfer.\r\n- Confirm the pickup point\r\n- Check opening hours\r\n\r\n### Local options\r\nRead about each area.',
      },
    });
    visitArticle();

    expect(query).toHaveBeenCalledWith('overview', 'getting-around');
    expect(screen.getByRole('heading', { name: 'Getting around Phuket', level: 1 })).toBeInTheDocument();
    const authoredSection = screen.getByRole('heading', { name: 'Transfers', level: 2 });
    expect(authoredSection.id).toBe('section-1');
    expect(screen.getAllByText('Transfers', { selector: 'a' }).every(link => link.getAttribute('href') === '#section-1')).toBe(true);
    expect(screen.getByText('Plan your transfer.')).toBeInTheDocument();
    expect(screen.getByText('Confirm the pickup point')).toBeInTheDocument();
    expect(screen.getByText('Nov 20, 2026')).toHaveAttribute('datetime', '2026-11-20T12:00:00.000Z');
    expect(screen.getByRole('link', { name: 'Related services' })).toHaveAttribute('href', '/services');
  });

  it('keeps a failed article read distinct from a missing article and lets the reader retry', () => {
    query.mockReturnValue({ isError: true, refetch: retry });
    visitArticle();

    expect(screen.getByRole('alert')).toHaveTextContent('This article could not be loaded.');
    expect(screen.queryByRole('heading', { name: 'Article not found' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
