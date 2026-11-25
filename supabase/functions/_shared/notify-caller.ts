/**
 * Resolve who is calling a browser-reachable notification function.
 * See notify-guards.ts for the authorization rules applied to the result.
 */
import { requireServiceCaller } from "./internal-secret.ts";
import { optionalAuth } from "./auth-guard.ts";
import type { NotifyCaller } from "./notify-guards.ts";

export async function resolveNotifyCaller(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<NotifyCaller> {
  if ((await requireServiceCaller(req, corsHeaders)) === null) return { mode: "service" };
  const user = await optionalAuth(req);
  return user ? { mode: "user", userId: user.id } : { mode: "anonymous" };
}
