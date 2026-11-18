const groups = [
  { id: 'arrival', slug: 'arrive', name_en: 'Arrival', name_ru: 'Приезд', surface_id: 'arrive', is_surface: true, sort_order: 1, is_active: true },
  { id: 'law', slug: 'legal', name_en: 'Money and documents', name_ru: 'Деньги и документы', surface_id: 'legal', is_surface: true, sort_order: 2, is_active: true },
];
const base = { status: 'available', is_active: true, color: null, icon: null, jtbd_clusters: [], persona_codes: [], sort_order: 1 };
const categories = [
  { ...base, id: 'transport', slug: 'cat-transport', name_en: 'Transport', name_ru: 'Транспорт', parent_id: null, group_id: 'arrival', app_path: null },
  { ...base, id: 'finance', slug: 'cat-finance', name_en: 'Finance', name_ru: 'Финансы', parent_id: null, group_id: 'law', app_path: null },
  { ...base, id: 'exchange', slug: 'exchange', name_en: 'Currency rates', name_ru: 'Курсы валют', parent_id: 'transport', group_id: 'arrival', app_path: '/exchange' },
];
export const supabase = { from(table: string) {
  let patch: Record<string, unknown> | null = null;
  let id: string | null = null;
  const chain = {
    select: () => chain, order: () => chain,
    eq: (key: string, value: string) => { if (key === 'id') id = value; return chain; },
    update: (value: Record<string, unknown>) => { patch = value; return chain; },
    single: async () => { const row = categories.find(row => row.id === id); if (!row) return { error: new Error('Unknown fixture row'), data: null }; Object.assign(row, patch); return { data: { id: row.id }, error: null }; },
    then: (resolve: (value: unknown) => void) => resolve({ data: structuredClone(table === 'category_groups' ? groups : table === 'categories' ? categories : []), error: null }),
  }; return chain;
} };
