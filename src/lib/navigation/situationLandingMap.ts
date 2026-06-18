/**
 * Situation → marketing landing overrides.
 *
 * By default `/discover/:code` opens `SituationDetailPage` — a catalog view
 * listing services mapped to the life situation via `resolve_life_os_context`
 * RPC. For a few persona-like situations (developer, MC operator, service
 * vendor) the right destination is a **marketing landing**, not the catalog.
 *
 * Keep this map small and explicit. Adding a key here changes the click
 * target for *every* surface that renders situation links (NavigatorPageV3
 * "For you" list, NavigatorClusterSection rows, SituationCard, related
 * situations on SituationDetailPage).
 */
import { APP_ROUTES } from '@/lib/config/routes';

export const SITUATION_LANDING_OVERRIDES: Record<string, string> = {
  developer: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,        // /for-developers
  management_company: APP_ROUTES.FOR_MANAGEMENT_COMPANIES, // /for-management-companies
  vendor_onboarding: APP_ROUTES.VENDOR_JOIN,               // /vendor/join
};

/** Resolve the destination URL for a life-situation click. */
export function resolveSituationHref(code: string): string {
  return SITUATION_LANDING_OVERRIDES[code] ?? `/discover/${code}`;
}
