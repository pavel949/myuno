import { expect } from 'vitest';
// Independent PostgREST quoted-value/LIKE interpreter for a synthetic transport.
// It rejects leftover grammar rather than stripping punctuation like the old mocks.
export function matchesLiteralOr(filter: string, row: Record<string, unknown>) {
  const conditions = [...filter.matchAll(/([a-z_]+)\.(ilike|imatch)\.("(?:[^"\\]|\\.)*")/g)];
  expect(conditions.map(match => match[0]).join(',')).toBe(filter);
  return conditions.some(([, column, operator, quoted]) => {
    const value = JSON.parse(quoted) as string;
    if (operator === 'imatch') return new RegExp(value, 'iu').test(String(row[column] ?? ''));
    let expression = '';
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      if (char === '\\') expression += value[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      else if (char === '%') expression += '.*';
      else if (char === '_') expression += '.';
      else expression += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`^${expression}$`, 'isu').test(String(row[column] ?? ''));
  });
}

