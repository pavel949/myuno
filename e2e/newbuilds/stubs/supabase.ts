const rows = [
  { id: 'synthetic-unit-1', project_id: 'synthetic-project', unit_code: 'A-101', unit_type: '1br', area_sqm: 52, price: 10000000, currency: 'THB', status: 'available', unit_status: 'available' },
  { id: 'synthetic-unit-2', project_id: 'synthetic-project', unit_code: 'A-102', unit_type: '1br', area_sqm: 52, price: 11000000, currency: 'THB', status: 'available', unit_status: 'reserved' },
  { id: 'synthetic-unit-3', project_id: 'synthetic-project', unit_code: 'A-103', unit_type: 'villa', area_sqm: 150, price: null, currency: 'THB', status: 'available', unit_status: 'sold' },
];
(window as any).__requests = [];
export const supabase = {
  from: (name: string) => { if (name !== 'project_units') throw new Error(`Unexpected table ${name}`); return { select: (fields: string) => { if (fields.includes('*')) throw new Error('Unsafe projection'); return { eq: () => ({ order: async () => ({ data: rows, error: null }) }) }; } }; },
  rpc: async (name: string, args: any) => { if (name !== 'submit_consultation_request') throw new Error('Unexpected RPC'); if ((window as any).__failSave) return { data: null, error: new Error('Synthetic failure') }; (window as any).__requests.push(args.payload); window.dispatchEvent(new Event('synthetic-save')); return { data: 'synthetic-persisted-receipt', error: null }; },
  // Deliberately inert: acceptance tests must never send third-party messages.
  functions: { invoke: async () => ({ data: null, error: null }) },
};
