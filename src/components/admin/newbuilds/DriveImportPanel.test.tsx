import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveImportPanel } from './DriveImportPanel';

const { from, invoke, actor } = vi.hoisted(() => ({
  from: vi.fn(), invoke: vi.fn(), actor: { id: 'synthetic-admin' as string | null },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from, functions: { invoke } },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: actor.id ? { id: actor.id } : null }),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));

const project = 'synthetic-project';
const legacyReceipt = {
  id: 'synthetic-receipt',
  created_at: '2026-11-21T05:00:00Z',
  status: 'completed',
  review_status: 'pending',
  files_processed: 3,
  files_total: 4,
  files_failed: 1,
  files_skipped: 0,
};

function read(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  };
  return query;
}

function view(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return <QueryClientProvider client={client}><DriveImportPanel projectId={project} /></QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  actor.id = 'synthetic-admin';
});

describe('Drive history containment', () => {
  it('reads only project-scoped receipt metadata and warns without triggering or publishing a legacy candidate', async () => {
    const jobs = read([{
      ...legacyReceipt, ai_extracted_units: [{ status: 'available', unit_code: 'private-candidate' }],
      error_log: ['private-error'],
    }]);
    const sources = read([{ watch_enabled: true, drive_url: 'private-source' }]);
    from.mockImplementation((table: string) => {
      if (table === 'drive_import_jobs') return jobs;
      if (table === 'project_drive_sources') return sources;
      throw new Error('Unexpected database table');
    });
    render(view());

    const history = await screen.findByRole('list', { name: 'Последние записи импорта' });
    expect(within(history).getByText('Ожидало проверки')).toBeInTheDocument();
    expect(within(history).getByText('synthetic-receipt')).toBeInTheDocument();
    expect(await screen.findByText(/источник с настройкой автоимпорта/)).toBeInTheDocument();
    expect(screen.queryByText(/private-|available/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
    expect(jobs.select).toHaveBeenCalledWith('id, created_at, status, review_status, files_processed, files_total, files_failed, files_skipped');
    expect(jobs.eq).toHaveBeenCalledWith('project_id', project);
    expect(jobs.limit).toHaveBeenCalledWith(5);
    expect(sources.select).toHaveBeenCalledWith('watch_enabled');
    expect(sources.eq.mock.calls).toEqual([['project_id', project], ['watch_enabled', true]]);
    expect(sources.limit).toHaveBeenCalledWith(1);
  });

  it('separates read failure from empty history and retries only reads', async () => {
    from.mockImplementation(() => read(null, new Error('private-backend-detail')));
    render(view());
    expect(await screen.findByText('Не удалось проверить настройки автоимпорта.')).toBeInTheDocument();
    const failures = await screen.findAllByRole('alert');
    expect(failures).toHaveLength(2);
    expect(screen.queryByText('Нет доступных записей импорта.')).not.toBeInTheDocument();
    expect(screen.queryByText(/private-backend-detail/)).not.toBeInTheDocument();
    within(failures[0]).getByRole('button', { name: 'Повторить' }).click();
    expect(from.mock.calls.filter(([table]) => table === 'project_drive_sources').length).toBeGreaterThan(1);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('does not reuse previous account history or fetch while logged out', async () => {
    from.mockImplementation((table: string) => read(table === 'drive_import_jobs' ? [legacyReceipt] : []));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const screenView = render(view(client));
    expect(await screen.findByText('synthetic-receipt')).toBeInTheDocument();
    actor.id = null;
    from.mockClear();
    screenView.rerender(view(client));
    expect(screen.queryByText('synthetic-receipt')).not.toBeInTheDocument();
    expect(from).not.toHaveBeenCalled();
  });
});
