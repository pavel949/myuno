import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HomePopulatedProjects } from './HomePopulatedProjects';
import { GUEST_PROJECT_COLUMNS, usePublicPropertyProjects } from '@/hooks/usePropertyProjects';
import type { Property } from '@/hooks/useProperties';
const fixture = vi.hoisted(() => ({ calls: [] as unknown[][], rows: [] as { id: string; name_en: string; name_ru: string; is_active: boolean }[] }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { throw new Error('Production access forbidden'); } } }));
vi.mock('@/hooks/projectCatalogQuery', () => ({
 createProjectCatalogQuery: (columns: string) => {
  fixture.calls.push(['select', columns]); let rows = [...fixture.rows];
  const query = {
   eq: (key: string, value: unknown) => { fixture.calls.push(['eq', key, value]); rows = rows.filter(row => row[key as keyof typeof row] === value); return query; },
   in: (key: string, ids: string[]) => { fixture.calls.push(['in', key, ids]); rows = rows.filter(row => ids.includes(row.id)); return query; },
   order: () => { rows.sort((a,b) => a.name_en.localeCompare(b.name_en)); return query; },
   limit: async (limit: number) => { fixture.calls.push(['limit', limit]); return { data: rows.slice(0,limit), error: null }; },
  }; return query;
 }, applyProjectCatalogFilters: vi.fn(), applyProjectCatalogSort: vi.fn(),
}));
let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
beforeEach(() => { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); fixture.calls=[]; fixture.rows=Array.from({length:15},(_,i)=>({id:'project-'+i,name_en:i===14?'Z Linked community':'A community '+i,name_ru:'',is_active:true})); });
afterEach(() => { cleanup(); client.clear(); });
it('loads a linked community beyond the first twelve names through one public ID-filtered query', async () => {
 render(<HomePopulatedProjects homes={[{id:'home',project_id:'project-14'} as Property]} />, { wrapper });
 expect(await screen.findByRole('link', { name: 'Z Linked community' })).toHaveAttribute('href', '/property/complex/project-14?mode=rent');
 expect(fixture.calls.filter(c=>c[0]==='select')).toEqual([['select',GUEST_PROJECT_COLUMNS]]);
 expect(fixture.calls).toContainEqual(['eq','is_active',true]);
 expect(fixture.calls).toContainEqual(['in','id',['project-14']]);
 expect(fixture.calls).toContainEqual(['limit',3]);
});
it('does not turn an empty home-project selection into a global catalog read, even on refetch', async () => {
 const { result } = renderHook(() => usePublicPropertyProjects(3, undefined, []), { wrapper });
 await result.current.refetch();
 expect(fixture.calls).toEqual([]);
});
it('binds the query cache to normalized project IDs rather than a global alphabetical prefix', async () => {
 const { result, rerender } = renderHook(({ids}) => usePublicPropertyProjects(3, undefined, ids), { initialProps:{ids:['project-14','project-14']}, wrapper });
 await waitFor(()=>expect(result.current.data?.[0]?.id).toBe('project-14'));
 rerender({ids:['project-13']});
 await waitFor(()=>expect(result.current.data?.[0]?.id).toBe('project-13'));
 expect(fixture.calls.filter(c=>c[0]==='in')).toEqual([['in','id',['project-14']],['in','id',['project-13']]]);
});
