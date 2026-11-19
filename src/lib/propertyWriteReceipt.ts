type PropertyWriteResponse = {
  data: ReadonlyArray<{ id: string }> | null;
  error: { message: string } | null;
};

export type PropertyWriteReceipt =
  | { kind: 'complete' | 'partial' | 'none'; confirmed: number; requested: number }
  | { kind: 'unknown'; confirmed: 0; requested: number };

export async function confirmPropertyWrite(
  ids: readonly string[],
  write: (ids: string[]) => PromiseLike<PropertyWriteResponse>,
): Promise<PropertyWriteReceipt> {
  const requested = [...new Set(ids.filter(Boolean))];
  if (requested.length === 0) return { kind: 'none', confirmed: 0, requested: 0 };

  try {
    const { data, error } = await write(requested);
    const unknown = { kind: 'unknown', confirmed: 0, requested: requested.length } as const;
    if (error || !Array.isArray(data)) return unknown;

    const actual = new Set(data.map(row => row.id));
    const allowed = new Set(requested);
    if (actual.size !== data.length || [...actual].some(id => !allowed.has(id))) return unknown;

    return {
      kind: actual.size === requested.length ? 'complete' : actual.size === 0 ? 'none' : 'partial',
      confirmed: actual.size,
      requested: requested.length,
    };
  } catch {
    // An interrupted response cannot establish whether the server committed.
    return { kind: 'unknown', confirmed: 0, requested: requested.length };
  }
}
