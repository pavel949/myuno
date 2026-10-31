/** An RLS-filtered bulk write may succeed for only part of the selection. */
export function assertAdminRows<T extends { id: string }>(rows: T[] | null, ids: Iterable<string>, matches: (row: T) => boolean): void {
  const expected = new Set(ids);
  const actual = new Set(rows?.map(row => row.id));
  if (expected.size === 0 || actual.size !== expected.size || rows?.length !== expected.size
    || [...expected].some(id => !actual.has(id)) || !rows.every(matches)) {
    throw new Error('Not all selected changes were confirmed. Some rows may have changed; reload and review before retrying.');
  }
}
