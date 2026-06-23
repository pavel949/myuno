/**
 * Supabase boundary helper for the Thai Business Layer.
 *
 * The `thai_*` tables are not yet in the auto-generated `types.ts` (regenerate
 * via Supabase MCP once the migration is applied to prod). Until then we cast at
 * this single boundary so the rest of the feature stays strongly typed against
 * the hand-written interfaces in `src/types/thaiBusiness.ts`.
 */
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function thaiTable(name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(name);
}

export { supabase };
