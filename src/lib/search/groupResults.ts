/**
 * Groups global search results by marketplace/type so the search page can
 * show "Label · count" sections with a "See all" link (Design Bible F7).
 * Group order follows the first appearance of each type in the ranked list,
 * so the best-ranked marketplace stays on top.
 */
export interface GroupableResult {
  id: string;
  type: string;
}

export interface ResultGroup<T extends GroupableResult> {
  type: string;
  total: number;
  items: T[];
}

export function groupResultsByType<T extends GroupableResult>(
  results: readonly T[],
  perGroup: number,
): ResultGroup<T>[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const result of results) {
    const bucket = buckets.get(result.type);
    if (bucket) {
      bucket.push(result);
    } else {
      order.push(result.type);
      buckets.set(result.type, [result]);
    }
  }
  const limit = Math.max(1, perGroup);
  return order.map((type) => {
    const all = buckets.get(type) ?? [];
    return { type, total: all.length, items: all.slice(0, limit) };
  });
}
