import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { adminLiteralSearchOr } from './adminLiteralSearch';

import { matchesLiteralOr } from '@/test/literalPostgrestFixture';

describe('literal queue search transport', () => {
  it.each([
    ['fixture@example.invalid', 'fixture@exampleinvalid'],
    ["O'Reilly", 'OReilly'],
    ['tax_id', 'taxXid'],
    ['100%', '1000'],
    ['a,b).or(id.gt.0', 'unrelated'],
    ['Quote:"back\\slash', 'Quotebackslash'],
    ['a*b', 'aZZb'],
  ])('preserves %s and rejects its nonliteral decoy through the actual client URL', async (term, decoy) => {
    const rows = [{id: 'literal', contact_email: term}, {id: 'decoy', contact_email: decoy}];
    let called = false;
    const client = createClient('https://synthetic.invalid', 'synthetic-key', {auth: {persistSession: false, autoRefreshToken: false, storageKey: `literal-search-${encodeURIComponent(term)}`}, global: {fetch: async input => {
      called = true;
      const url = new URL(String(input));
      const filter = url.searchParams.get('or')!;
      expect(filter.startsWith('(') && filter.endsWith(')')).toBe(true);
      const selected = rows.filter(row => matchesLiteralOr(filter.slice(1, -1), row));
      return new Response(JSON.stringify(selected), {status: 200, headers: {'Content-Type': 'application/json', 'Content-Range': `0-${selected.length-1}/${selected.length}`}});
    }}});
    const {data, count, error} = await client.from('partner_applications').select('*', {count: 'exact'}).or(adminLiteralSearchOr('applications', term)!).range(0, 49);
    expect(error).toBeNull(); expect(called).toBe(true);
    expect(data?.map(row => row.id)).toEqual(['literal']); expect(count).toBe(1);
  });
});
