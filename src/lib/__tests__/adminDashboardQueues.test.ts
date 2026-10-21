import { describe, expect, it } from 'vitest';
import { applyManualPaymentQueue, applyOrderQueue, applyTicketQueue, MANUAL_REVIEW_STATUSES, matchesProviderFilter, orderQueueHref, parseManualPaymentFilter, parseOrderQueue, parseProviderFilter, parseQueuePage, parseTicketStatus } from '../adminDashboardQueues';

type Row = { id: string; status: string; created_at: string; deleted_at: string | null };
class ReadQuery {
  constructor(public rows: Row[]) {}
  is(column: keyof Row, value: null) { this.rows = this.rows.filter(row => row[column] === value); return this; }
  eq(column: keyof Row, value: string) { this.rows = this.rows.filter(row => row[column] === value); return this; }
  lt(column: keyof Row, value: string) { this.rows = this.rows.filter(row => row[column] !== null && row[column]! < value); return this; }
  in(column: keyof Row, values: string[]) { this.rows = this.rows.filter(row => values.includes(row[column]!)); return this; }
}
const cutoff = '2026-10-19T07:00:00.000Z';
const rows: Row[] = [
  { id: 'older-pending', status: 'pending', created_at: '2026-10-18T07:00:00.000Z', deleted_at: null },
  { id: 'at-cutoff', status: 'pending', created_at: cutoff, deleted_at: null },
  { id: 'newer-pending', status: 'pending', created_at: '2026-10-20T07:00:00.000Z', deleted_at: null },
  { id: 'deleted', status: 'pending', created_at: '2026-10-18T07:00:00.000Z', deleted_at: cutoff },
  { id: 'completed', status: 'completed', created_at: '2026-10-18T07:00:00.000Z', deleted_at: null },
];
describe('dashboard queue contract', () => {
  it('pins the same cutoff in the link and count/list predicates without claiming payment state', () => {
    const href = orderQueueHref({ olderThan24h: true, now: new Date('2026-10-20T07:00:00.000Z') });
    const parsed = parseOrderQueue(new URL(href, 'https://fixture.invalid').searchParams);
    expect(href).toContain('tab=bookings');
    expect(parsed).toEqual({status: 'pending', createdBefore: cutoff, search: ''});
    const count = applyOrderQueue(new ReadQuery([...rows]), parsed).rows.length;
    const list = applyOrderQueue(new ReadQuery([...rows]), parsed).rows;
    expect(list.map(row => row.id)).toEqual(['older-pending']);
    expect(count).toBe(list.length);
  });
  it('keeps all pending commercial orders distinct from legacy booking submission states', () => {
    const queue = parseOrderQueue(new URLSearchParams('status=pending'));
    expect(applyOrderQueue(new ReadQuery(rows), queue).rows.map(row => row.id)).toEqual(['older-pending','at-cutoff','newer-pending']);
  });
  it('validates filters and preserves search text as data', () => {
    expect(parseOrderQueue(new URLSearchParams('status=submitted&created_before=not-a-date&q=Bob%27s'))).toEqual({status:'all',createdBefore:null,search:"Bob's"});
    expect(parseOrderQueue(new URLSearchParams('created_before=2026-02-30T00:00:00.000Z')).createdBefore).toBeNull();
    expect(parseManualPaymentFilter(new URLSearchParams('manual_status=pending'))).toBe('all');
    expect(parseProviderFilter(new URLSearchParams('filter=__proto__'))).toBe('all');
    expect(parseTicketStatus(new URLSearchParams('status=active'))).toBe('active');
  });
  it('uses actual manual payment review statuses and no invented pending status', () => {
    const source = ['awaiting_admin','contacted','paid','confirmed','rejected','expired','pending'].map(status => ({...rows[0], id:status, status}));
    const filtered = applyManualPaymentQueue(new ReadQuery(source), 'review').rows;
    expect(filtered.map(row => row.status)).toEqual([...MANUAL_REVIEW_STATUSES]);
  });
  it('opens exactly open and in-progress support tickets', () => {
    const source = ['open','in_progress','waiting_response','closed'].map(status => ({...rows[0],id:status,status}));
    expect(applyTicketQueue(new ReadQuery(source), 'active').rows.map(row=>row.id)).toEqual(['open','in_progress']);
  });
  it('does not treat unknown provider verification or activity as false', () => {
    expect(matchesProviderFilter({is_verified:false},'unverified')).toBe(true);
    expect(matchesProviderFilter({is_verified:null},'unverified')).toBe(false);
    expect(matchesProviderFilter({},'unverified')).toBe(false);
    expect(matchesProviderFilter({is_active:null},'inactive')).toBe(false);
  });
  it('validates independent queue page cursors',()=>{
    expect(parseQueuePage(new URLSearchParams('order_page=2&manual_page=4'),'order_page')).toBe(2);
    expect(parseQueuePage(new URLSearchParams('order_page=-1'),'order_page')).toBe(0);
    expect(parseQueuePage(new URLSearchParams('manual_page=NaN'),'manual_page')).toBe(0);
  });
});
