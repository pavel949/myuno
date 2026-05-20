/**
 * Playwright globalTeardown — removes all e2e-seeded rows + orders by marker.
 */
import { getServiceClient } from './serviceClient';

export default async function globalTeardown() {
  if (process.env.E2E_SEED_SKIPPED === '1') return;
  const runId = process.env.E2E_RUN_ID;
  if (!runId) return;
  const supabase = getServiceClient();

  // Orders created during this run
  const ordersDel = await supabase
    .from('orders')
    .delete()
    .eq('metadata->>e2e_run_id', runId);
  if (ordersDel.error) console.warn(`[teardown] orders: ${ordersDel.error.message}`);

  // Service requests (non-bookable verticals)
  const reqDel = await supabase
    .from('service_requests')
    .delete()
    .eq('metadata->>e2e_run_id', runId);
  if (reqDel.error) console.warn(`[teardown] service_requests: ${reqDel.error.message}`);

  // Listings / properties / events
  for (const table of ['listings', 'properties', 'events'] as const) {
    const r = await supabase.from(table).delete().eq('metadata->>e2e_run_id', runId);
    if (r.error) console.warn(`[teardown] ${table}: ${r.error.message}`);
  }

  console.log(`[e2e] Teardown complete for run_id=${runId}`);
}
