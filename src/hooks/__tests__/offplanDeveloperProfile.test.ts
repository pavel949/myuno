import { describe, expect, it, vi } from 'vitest';
import { useOffplanProjects, type OffplanProject } from '../useOffplanProjects';
const state = vi.hoisted(() => ({ embed: null as Record<string, unknown> | null, select: '' }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options }));
vi.mock('../projectCatalogQuery', () => ({
  createProjectCatalogQuery: (select: string) => { state.select = select; return Promise.resolve({ data: [{ id: 'project', name_en: 'Project', name_ru: '', developer_id: 'developer', developer_name: 'Known label', developers: state.embed }], error: null }); },
  applyProjectCatalogFilters: (query: unknown) => query,
  applyProjectCatalogSort: (query: unknown) => query,
}));
describe('offplan public developer embed projection', () => {
  it.each([null, { id: 'developer', is_active: false }, { id: 'developer' }, { id: 'developer', is_active: true }])('keeps identity and label but derives link eligibility from %j', async embed => {
    state.embed = embed;
    const query = useOffplanProjects() as unknown as { queryFn: () => Promise<OffplanProject[]> };
    const [project] = await query.queryFn();
    expect(state.select).toMatch(/developers\s*\(\s*id,\s*is_active,/);
    expect(project).toMatchObject({ projectStatus: null, constructionProgress: null, unitsAvailable: null, unitsSold: null, isClearviewRated: false });
    expect(project.developerId).toBe('developer');
    expect(project.developerName).toBe('Known label');
    expect(project.developerProfileAvailable).toBe(embed?.is_active === true);
  });
});
