import { describe, expect, it } from 'vitest';
import { assertAdminRows } from './assertAdminRows';
const invalidRows: Array<Array<{ id: string; project_id: string }> | null> = [
  null, [], [{ id: 'one', project_id: 'project' }],
  [{ id: 'one', project_id: 'wrong' }, { id: 'two', project_id: 'project' }],
  [{ id: 'one', project_id: 'project' }, { id: 'other', project_id: 'project' }],
];
describe('bulk authoring confirmation', () => {
  it.each(invalidRows.map(rows => ({ rows })))('rejects missing, partial or inconsistent writes: %o', ({ rows }) => {
    expect(() => assertAdminRows(rows, ['one', 'two'], row => row.project_id === 'project')).toThrow('Not all selected');
  });
  it('accepts all reviewed rows independent of server ordering', () => {
    expect(() => assertAdminRows([{ id: 'two', active: true }, { id: 'one', active: true }], ['one', 'two'], row => row.active)).not.toThrow();
  });
});
