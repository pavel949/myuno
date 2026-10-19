import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropertyRevisionState } from '@/lib/propertyRevisions';
import { PublishedPropertyRevisionQueue, PublishedPropertyRevisionReview } from './PublishedPropertyRevisionQueue';
const mocks = vi.hoisted(() => ({ review: vi.fn(), read: vi.fn(), list: vi.fn(), toast: vi.fn(), language: 'en', actor: 'admin-a' }));
vi.mock('@/lib/propertyRevisions', () => ({ reviewPropertyRevision: mocks.review, readPropertyRevision: mocks.read, listPendingPropertyRevisions: mocks.list }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.toast } }));
const timestamp = '2026-10-19T06:00:00.123456Z';
const fixture = (version = 'proposal-version-a'): PropertyRevisionState => ({
  property: { id: 'property-a', management_company_id: 'company-a', title_en: 'Published villa', approval_status: 'approved', is_active: true, updated_at: timestamp } as PropertyRevisionState['property'],
  revision: { version, status: 'pending', base: { title_en: 'Published villa', description_en: 'Existing description' }, patch: { title_en: 'Proposed villa', description_en: 'New description' }, created_at: timestamp, updated_at: timestamp }, conflict: false,
});
const wrap = (children: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks(); mocks.language = 'en'; mocks.actor = 'admin-a';
  mocks.list.mockResolvedValue([fixture()]); mocks.read.mockResolvedValue(fixture('proposal-version-b'));
  mocks.review.mockImplementation(async (state, decision) => ({ ...state, revision: { ...state.revision, status: decision === 'approve' ? 'approved' : 'rejected', version: 'review-result' } }));
});
afterEach(cleanup);

describe('persisted revision review', () => {
  it('shows exact before/proposed values and keeps the reviewed version frozen across refreshed props', async () => {
    const initial = fixture(); const onReviewed = vi.fn();
    const rendered = render(<PublishedPropertyRevisionReview initial={initial} onClose={vi.fn()} onReviewed={onReviewed} />);
    expect(screen.getByText('Existing description')).toBeInTheDocument(); expect(screen.getByText('New description')).toBeInTheDocument();
    rendered.rerender(<PublishedPropertyRevisionReview initial={fixture('replacement-version')} onClose={vi.fn()} onReviewed={onReviewed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve this revision' }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(1));
    expect(mocks.review.mock.calls[0][0].revision.version).toBe('proposal-version-a');
    await waitFor(() => expect(onReviewed).toHaveBeenCalledTimes(1));
  });
  it('requires a written return reason and sends it with the exact displayed proposal', async () => {
    render(<PublishedPropertyRevisionReview initial={fixture()} onClose={vi.fn()} onReviewed={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Return for correction' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason for returning changes'), { target: { value: 'Please verify this description' } });
    fireEvent.click(screen.getByRole('button', { name: 'Return for correction' }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledWith(expect.objectContaining({ revision: expect.objectContaining({ version: 'proposal-version-a' }) }), 'reject', 'Please verify this description'));
  });
  it('blocks approval on a canonical conflict but permits returning changes', () => {
    render(<PublishedPropertyRevisionReview initial={{ ...fixture(), conflict: true }} onClose={vi.fn()} onReviewed={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Approve this revision' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Published content changed');
    fireEvent.change(screen.getByLabelText('Reason for returning changes'), { target: { value: 'Please restart from latest content' } });
    expect(screen.getByRole('button', { name: 'Return for correction' })).toBeEnabled();
  });
  it('does not claim success or silently retry after a stale review; requires explicit reload', async () => {
    mocks.review.mockRejectedValueOnce(new Error('revision changed; reload before review'));
    render(<PublishedPropertyRevisionReview initial={fixture()} onClose={vi.fn()} onReviewed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve this revision' }));
    await screen.findByText('revision changed; reload before review');
    expect(screen.getByRole('button', { name: 'Approve this revision' })).toBeDisabled();
    expect(mocks.toast).not.toHaveBeenCalled(); expect(mocks.read).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload proposal' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve this revision' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Approve this revision' }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(2));
    expect(mocks.review.mock.calls[1][0].revision.version).toBe('proposal-version-b');
  });
  it('prevents duplicate reviews and suppresses obsolete completion after unmount', async () => {
    let finish!: (value: PropertyRevisionState) => void;
    mocks.review.mockReturnValue(new Promise<PropertyRevisionState>(resolve => { finish = resolve; }));
    const onReviewed = vi.fn(); const rendered = render(<PublishedPropertyRevisionReview initial={fixture()} onClose={vi.fn()} onReviewed={onReviewed} />);
    const button = screen.getByRole('button', { name: 'Approve this revision' });
    fireEvent.click(button); fireEvent.click(button); expect(mocks.review).toHaveBeenCalledTimes(1);
    rendered.unmount();
    await act(async () => finish({ ...fixture(), revision: { ...fixture().revision!, status: 'approved' } }));
    expect(onReviewed).not.toHaveBeenCalled(); expect(mocks.toast).not.toHaveBeenCalled();
  });
  it.each([
    ['en', 'Approve this revision', 'Reason for returning changes'],
    ['ru', 'Одобрить эту версию', 'Причина возврата изменений'],
    ['th', 'อนุมัติฉบับแก้ไขนี้', 'เหตุผลที่ส่งการแก้ไขกลับ'],
  ])('provides %s review controls and readable persisted values', (language, approve, reason) => {
    mocks.language = language;
    render(<PublishedPropertyRevisionReview initial={fixture()} onClose={vi.fn()} onReviewed={vi.fn()} />);
    expect(screen.getByRole('button', { name: approve })).toBeInTheDocument();
    expect(screen.getByLabelText(reason)).toBeInTheDocument(); expect(screen.getByText('New description')).toBeInTheDocument();
  });
});

describe('admin published revision queue', () => {
  it('opens a persisted proposal from the existing admin property route section', async () => {
    render(wrap(<PublishedPropertyRevisionQueue />));
    fireEvent.click(await screen.findByRole('button', { name: 'Review changes' }));
    expect(screen.getByText('New description')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close review' }));
    expect(screen.queryByText('New description')).not.toBeInTheDocument();
  });
  it('distinguishes unavailable data from an empty queue', async () => {
    mocks.list.mockRejectedValue(new Error('RPC unavailable'));
    render(wrap(<PublishedPropertyRevisionQueue />)); await screen.findByRole('alert');
    expect(screen.queryByText('No pending proposals on this page.')).not.toBeInTheDocument();
  });
  it('does not retain a previously opened private proposal after actor change', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const rendered = render(<QueryClientProvider client={client}><PublishedPropertyRevisionQueue /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Review changes' }));
    expect(screen.getByText('New description')).toBeInTheDocument();
    mocks.actor = 'admin-b'; mocks.list.mockResolvedValue([]);
    rendered.rerender(<QueryClientProvider client={client}><PublishedPropertyRevisionQueue /></QueryClientProvider>);
    expect(screen.queryByText('New description')).not.toBeInTheDocument();
  });
});
