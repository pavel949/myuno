/** Compensation gate, not atomic assignment. Never start payment on failure. */
export async function verifyInventoryHold(
  lookup: () => Promise<boolean>,
  cancel: () => Promise<boolean>,
): Promise<'held' | 'conflict' | 'compensation_failed'> {
  if (await lookup()) return 'held';
  return await cancel() ? 'conflict' : 'compensation_failed';
}