/**
 * Supabase boundary helper for the Currency Exchange Layer.
 *
 * `exchangers` (and the `currency_rates` reference table read here) are queried
 * through an untyped client cast at this single boundary, then cast back to the
 * hand-written interfaces in `src/types/exchange.ts`. This mirrors the Thai
 * Business Layer pattern (`src/hooks/thaiServices/db.ts`) and keeps us from
 * hand-editing the auto-generated `types.ts`.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const untyped = supabase as unknown as SupabaseClient;

export function exchangeTable(name: string) {
  return untyped.from(name);
}

export { supabase };
