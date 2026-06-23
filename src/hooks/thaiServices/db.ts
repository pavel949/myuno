/**
 * Supabase boundary helper for the Thai Business Layer.
 *
 * The `thai_*` tables are not yet in the auto-generated `types.ts` (regenerate
 * via Supabase MCP once the migration is applied to prod). Until then we query
 * through an untyped client cast at this single boundary, and cast results back
 * to the hand-written interfaces in `src/types/thaiBusiness.ts` in the hooks.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Untyped view of the client so `.from()` accepts the not-yet-generated tables.
const untyped = supabase as unknown as SupabaseClient;

export function thaiTable(name: string) {
  return untyped.from(name);
}

export { supabase };
