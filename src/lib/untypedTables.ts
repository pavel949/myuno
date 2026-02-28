/**
 * @module untypedTables
 * @description Type-safe wrappers for tables not yet in generated Supabase types.
 * 
 * These tables exist in the database but are missing from types.ts
 * (likely added via migrations after last type generation).
 * This wrapper isolates all `as any` casts to one place.
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Query builder for tables missing from generated types.
 * Use sparingly — prefer adding tables to types.ts via schema sync.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(table: string) {
  return (supabase as any).from(table);
}

export const untypedTables = {
  aiDecisionsLog: () => untypedFrom('ai_decisions_log'),
  socialPosts: () => untypedFrom('social_posts'),
  socialContentCalendar: () => untypedFrom('social_content_calendar'),
  ownerProspects: () => untypedFrom('owner_prospects'),
} as const;
