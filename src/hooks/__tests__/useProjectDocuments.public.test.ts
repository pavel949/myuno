import { beforeEach, expect, it, vi } from 'vitest';
import { useProjectDocuments } from '../useProjectDocuments';

const read = vi.hoisted(() => ({ filters: [] as [string, unknown][], columns: '', execute: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      expect(table).toBe('project_documents');
      const q = {
        select(columns: string) { read.columns = columns; return q; },
        eq(column: string, value: unknown) { read.filters.push([column, value]); return q; },
        order() { return q; },
        then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
          read.execute();
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return q;
    },
  },
}));

type Options = { enabled: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown[]> };
beforeEach(() => { read.filters.length = 0; read.columns = ''; read.execute.mockClear(); });

it('requests only current public fields by canonical project and uses an independent cache key', async () => {
  const query = useProjectDocuments('project-a', { publicOnly: true }) as unknown as Options;
  expect(query.enabled).toBe(true);
  await expect(query.queryFn()).resolves.toEqual([]);
  expect(read.filters).toEqual([['visibility', 'public'], ['project_id', 'project-a'], ['is_current', true]]);
  expect(read.columns).toBe('id, project_id, category, title, file_url, visibility, version, is_current');
  const adminQuery = useProjectDocuments('project-a', { onlyCurrent: false }) as unknown as Options;
  expect(adminQuery.queryKey).not.toEqual(query.queryKey);
});

it('keeps unpublished files out of guest reads without changing existing admin archive reads', async () => {
  const dormant = useProjectDocuments(undefined, { publicOnly: true }) as unknown as Options;
  expect(dormant.enabled).toBe(false);
  await expect(dormant.queryFn()).resolves.toEqual([]);
  expect(read.execute).not.toHaveBeenCalled();
  const adminQuery = useProjectDocuments('project-b', { onlyCurrent: false }) as unknown as Options;
  await adminQuery.queryFn();
  expect(read.filters).toEqual([['project_id', 'project-b']]);
  expect(read.columns).toBe('*');
});
