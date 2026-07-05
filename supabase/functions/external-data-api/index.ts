// External Data API — secure proxy for external scripts to read/write myUNO data.
// Auth: Bearer <EXTERNAL_API_TOKEN>. Uses service_role under the hood — token NEVER leaves server.
//
// Usage examples:
//   GET    /external-data-api?table=property_projects&select=id,name_en&limit=10
//   POST   /external-data-api  body: { "table": "property_projects", "rows": [{...}] }
//   PATCH  /external-data-api  body: { "table": "property_projects", "match": {"id":"..."}, "values": {...} }
//   DELETE /external-data-api?table=...&id=...
//
// Allowed tables are whitelisted to prevent abuse.

import { createServiceClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

// Sentinel actor id for external-API mutations in admin_audit_logs (the caller
// is an API token, not an auth user).
const EXTERNAL_API_ACTOR = "00000000-0000-0000-0000-000000000000";

/** Constant-time string comparison to avoid token timing side-channels. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let mismatch = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i++) mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  return mismatch === 0;
}

// Whitelist — add tables you want exposed
const ALLOWED_TABLES = new Set<string>([
  "property_projects",
  "property_developers",
  "properties",
  "crm_companies",
  "crm_contacts",
  "providers",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 1. Auth (constant-time compare against the static token)
  const expected = Deno.env.get("EXTERNAL_API_TOKEN");
  if (!expected) return json({ error: "Server not configured" }, 500);
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || !timingSafeEqual(token, expected)) return json({ error: "Unauthorized" }, 401);

  // 2. Rate limit (per client IP) — this endpoint has service-role reach, so
  // throttle it like any other write surface even though it is token-gated.
  const rl = await withRateLimit(req, "external-data-api", RATE_LIMITS.default, corsHeaders);
  if (rl) return rl;

  // 3. Supabase admin client (shared, version-pinned service client)
  const admin = createServiceClient();

  const url = new URL(req.url);
  const method = req.method;

  try {
    // Parse table from query (GET/DELETE) or body (POST/PATCH)
    let table = url.searchParams.get("table") ?? "";
    let body: Record<string, unknown> = {};
    if (method === "POST" || method === "PATCH") {
      body = await req.json().catch(() => ({}));
      table = (body.table as string) ?? table;
    }
    if (!table) return json({ error: "Missing 'table'" }, 400);
    if (!ALLOWED_TABLES.has(table)) {
      return json({ error: `Table '${table}' not allowed`, allowed: [...ALLOWED_TABLES] }, 403);
    }

    // GET — read
    if (method === "GET") {
      const select = url.searchParams.get("select") ?? "*";
      const limit = Number(url.searchParams.get("limit") ?? "100");
      const offset = Number(url.searchParams.get("offset") ?? "0");
      let q = admin.from(table).select(select, { count: "exact" }).range(offset, offset + limit - 1);

      // Simple ?column=value filters (eq)
      url.searchParams.forEach((v, k) => {
        if (["table", "select", "limit", "offset"].includes(k)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q = (q as any).eq(k, v);
      });

      const { data, error, count } = await q;
      if (error) return json({ error: error.message }, 400);
      return json({ data, count, limit, offset });
    }

    // Best-effort audit trail for every mutation (never blocks the operation).
    const audit = async (action: string, entityId: string | null, data: unknown) => {
      try {
        await admin.from("admin_audit_logs").insert({
          admin_id: EXTERNAL_API_ACTOR,
          action: `external_api.${action}`,
          entity_type: table,
          entity_id: entityId,
          new_data: data as Record<string, unknown>,
          ip_address: req.headers.get("x-forwarded-for") ?? null,
          user_agent: req.headers.get("user-agent") ?? null,
        });
      } catch (e) {
        console.error("[external-data-api] audit log failed:", e);
      }
    };

    // POST — insert (single or array)
    if (method === "POST") {
      const rows = body.rows as Record<string, unknown> | Record<string, unknown>[];
      if (!rows) return json({ error: "Missing 'rows'" }, 400);
      const upsert = body.upsert === true;
      const onConflict = body.on_conflict as string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = admin.from(table);
      q = upsert ? q.upsert(rows, onConflict ? { onConflict } : undefined) : q.insert(rows);
      const { data, error } = await q.select();
      if (error) return json({ error: error.message }, 400);
      await audit(upsert ? "upsert" : "insert", null, { count: Array.isArray(data) ? data.length : 1 });
      return json({ data, inserted: Array.isArray(data) ? data.length : 1 });
    }

    // PATCH — update by primary key only (id). Arbitrary-column matches are
    // rejected so a single call can never mass-update rows by a non-key filter.
    if (method === "PATCH") {
      const match = body.match as Record<string, unknown> | undefined;
      const values = body.values as Record<string, unknown> | undefined;
      if (!match || !values) return json({ error: "Missing 'match' or 'values'" }, 400);
      const matchKeys = Object.keys(match);
      if (matchKeys.length !== 1 || matchKeys[0] !== "id" || !match.id) {
        return json({ error: "PATCH 'match' must be exactly { id: <primary key> }" }, 400);
      }
      const { data, error } = await admin.from(table).update(values).eq("id", match.id).select();
      if (error) return json({ error: error.message }, 400);
      await audit("update", String(match.id), values);
      return json({ data, updated: Array.isArray(data) ? data.length : 0 });
    }

    // DELETE — by primary key (?id=) only. Arbitrary-column filters are rejected
    // to prevent a single leaked token from mass-deleting rows.
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "DELETE requires an 'id' primary-key filter" }, 400);
      const extraFilters = [...url.searchParams.keys()].filter((k) => k !== "table" && k !== "id");
      if (extraFilters.length > 0) {
        return json({ error: "DELETE accepts only the 'id' primary-key filter" }, 400);
      }
      const { error, count } = await admin.from(table).delete().eq("id", id).select("*", { count: "exact" });
      if (error) return json({ error: error.message }, 400);
      await audit("delete", id, { deleted: count });
      return json({ deleted: count });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
