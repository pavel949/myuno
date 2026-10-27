/** Isolated public-catalog adapter only. Never imports credentials or makes network calls. */
export function createSyntheticPropertyCatalog(priceCases = false) {
  const control = { failPage: null as number | null };
  const calls: { table: string; operations: [string, unknown, unknown?][]; signal?: AbortSignal }[] = [];
  const rows = Array.from({ length: 47 }, (_, i) => ({
    id: `synthetic-home-${String(i).padStart(3, '0')}`, title_en: `Synthetic ${i === 35 ? 'Needle' : 'Home'} ${i}`, title_ru: `Тестовый ${i === 35 ? 'Needle' : 'объект'} ${i}`,
    listing_type: i % 3 === 0 ? 'sale' : 'rent', price_period: i % 3 === 1 ? 'month' : 'night',
    is_active: true, approval_status: 'approved', property_type: i % 2 ? 'villa' : 'condo', district: i % 2 ? 'layan' : 'rawai',
    price: 2500 + i, sale_price: i % 3 === 0 ? 9000000 + i : null, sale_currency: 'THB', currency: 'THB', bedrooms: 2, bathrooms: 2, max_guests: 4,
    images: ['/synthetic-property.svg'], cover_image: '/synthetic-property.svg', created_at: '2026-10-20', updated_at: '2026-10-20', lat: 7.9, lng: 98.3,
  }));
  if (priceCases) {
    Object.assign(rows[0], { price: 1, sale_price: 3000000 });
    Object.assign(rows[3], { price: 99999, sale_price: 1000000 });
    Object.assign(rows[12], { price: null, sale_price: null });
    Object.assign(rows[6], { listing_type: 'rent', listing_modes: ['rent', 'sale'], is_for_sale: true, price: 1, sale_price: 2000000 });
  }
  const hidden = [{ ...rows[0], id: 'synthetic-draft', approval_status: 'draft' }, { ...rows[0], id: 'synthetic-inactive', is_active: false }];
  const supabase = { from(table: string) {
    if (table !== 'public_property_catalog') throw Error('Non-public source forbidden in fixture');
    const call: typeof calls[number] = { table, operations: [] }; calls.push(call);
    const chain = {
      select(columns: string) { call.operations.push(['select', columns]); return chain; },
      eq(key: string, value: unknown) { call.operations.push(['eq', key, value]); return chain; },
      gte(key: string, value: number) { call.operations.push(['gte', key, value]); return chain; },
      in(key: string, value: unknown) { call.operations.push(['in', key, value]); return chain; },
      or(value: string) { call.operations.push(['or', value]); return chain; },
      order(key: string, value: unknown) { call.operations.push(['order', key, value]); return chain; },
      range(from: number, to: number) { call.operations.push(['range', from, to]); return chain; },
      abortSignal(signal: AbortSignal) { call.signal = signal; return chain; },
      then(resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) {
        return new Promise((done, fail) => {
          const query = String(call.operations.find(([op]) => op === 'or')?.[1] || '');
          const timer = setTimeout(() => {
            const pageRange = call.operations.find(([op]) => op === 'range');
            if (query.includes('Failure') || (control.failPage !== null && Number(pageRange?.[1]) === control.failPage)) { done({ data: null, error: { message: 'Synthetic read error' } }); return; }
            let data = [...rows, ...hidden].filter(row => row.is_active && row.approval_status === 'approved');
            for (const [op, key, value] of call.operations) {
              if (op === 'eq') data = data.filter(row => (row as Record<string, unknown>)[String(key)] === value);
              if (op === 'gte') data = data.filter(row => Number((row as Record<string, unknown>)[String(key)]) >= Number(value));
              if (op === 'in') data = data.filter(row => (value as unknown[]).includes((row as Record<string, unknown>)[String(key)]));
              if (op === 'or' && String(key).includes('title_en.ilike')) { const text = String(key).match(/ilike\.%(.*?)%/)?.[1]?.toLowerCase() || ''; data = data.filter(row => `${row.title_en} ${row.title_ru}`.toLowerCase().includes(text)); }
              if (op === 'or' && String(key).startsWith('listing_type.eq.rent')) data = data.filter(row => row.listing_type === 'rent');
              if (op === 'or' && String(key).startsWith('tenancy_modes')) data = data.filter(row => String(key).includes(row.price_period === 'month' ? '{medium}' : '{short}'));
            }
            const range = call.operations.find(([op]) => op === 'range');
            done({ data: range ? data.slice(Number(range[1]), Number(range[2]) + 1) : data, error: null });
          }, query.includes('Slow') ? 200 : 5);
          call.signal?.addEventListener('abort', () => { clearTimeout(timer); fail(new DOMException('Aborted', 'AbortError')); }, { once: true });
        }).then(resolve, reject);
      },
    };
    return chain;
  } };
  return { supabase, calls, rows, control };
}
