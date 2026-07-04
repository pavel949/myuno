/**
 * Shared Authorization Helpers for Edge Functions
 *
 * Consolidates the role / membership checks that were previously copy-pasted
 * (with idiom drift) across the AI and management-company functions. Builds on
 * the existing `requireAuth` (auth-guard.ts) and `requireInternalSecret`
 * (internal-secret.ts) primitives — this module only adds the authorization
 * layer (who counts as staff, is the caller a company member, etc.).
 */

import { createServiceClient, type SupabaseClient } from "./supabase.ts";
import { requireAuth } from "./auth-guard.ts";
import { requireInternalSecret } from "./internal-secret.ts";

/** Canonical platform staff roles (full set). */
export const STAFF_ROLES = ["admin", "uno_team", "staff"] as const;

/** Platform admin roles — used for IDOR/admin bypass on scoped endpoints. */
export const PLATFORM_ADMIN_ROLES = ["admin", "uno_team"] as const;

/** Return a 403 Forbidden JSON response. */
export function forbidden(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Forbidden" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/** Fetch the caller's role names from `user_roles`. */
export async function fetchUserRoles(
  client: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await client.from("user_roles").select("role").eq("user_id", userId);
  return (data || []).map((r: { role: string }) => r.role);
}

/** True if `roles` contains at least one of `allowed`. */
export function hasAnyRole(roles: string[], allowed: readonly string[]): boolean {
  return roles.some((r) => allowed.includes(r));
}

/** Resolved caller identity for a dual-mode (cron OR user) endpoint. */
export type InternalOrUser =
  | { mode: "internal" }
  | { mode: "user"; userId: string; email: string | null };

/**
 * Dual-mode gate: allow the request if it carries the internal secret /
 * service-role JWT (cron), otherwise require an authenticated user. Does NOT
 * check roles — callers derive authorization from the returned `userId` (used
 * by resource-ownership endpoints). Returns a Response to short-circuit.
 */
export async function requireInternalOrUser(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<InternalOrUser | Response> {
  // `requireInternalSecret` returns null when the caller is trusted internal;
  // any Response means "not internal" — fall through to user auth (matching the
  // previous inline behaviour, which ignored the internal-secret failure body).
  if (requireInternalSecret(req, corsHeaders) === null) {
    return { mode: "internal" };
  }
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;
  return { mode: "user", userId: auth.user.id, email: auth.user.email ?? null };
}

/**
 * Dual-mode gate for staff-only endpoints: internal secret (cron) OR an
 * authenticated user holding one of `allowedRoles`. Returns the resolved mode
 * or a Response (401/403).
 */
export async function requireInternalOrStaff(
  req: Request,
  corsHeaders: Record<string, string>,
  allowedRoles: readonly string[] = STAFF_ROLES
): Promise<InternalOrUser | Response> {
  const result = await requireInternalOrUser(req, corsHeaders);
  if (result instanceof Response || result.mode === "internal") return result;

  const roles = await fetchUserRoles(createServiceClient(), result.userId);
  if (!hasAnyRole(roles, allowedRoles)) return forbidden(corsHeaders);
  return result;
}

/**
 * IDOR guard for management-company-scoped endpoints. Passes (returns null) if
 * the caller holds an admin role, or is an active member of `companyId`
 * (optionally restricted to `memberRoles`). Returns a 403 Response otherwise.
 */
export async function requireCompanyMember(
  client: SupabaseClient,
  userId: string,
  companyId: string,
  corsHeaders: Record<string, string>,
  opts?: { adminRoles?: readonly string[]; memberRoles?: readonly string[] }
): Promise<Response | null> {
  const roles = await fetchUserRoles(client, userId);
  if (hasAnyRole(roles, opts?.adminRoles ?? PLATFORM_ADMIN_ROLES)) return null;

  const { data: member } = await client
    .from("management_company_members")
    .select("user_id, role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) return forbidden(corsHeaders);
  if (opts?.memberRoles && !opts.memberRoles.includes((member as { role: string }).role)) {
    return forbidden(corsHeaders);
  }
  return null;
}
