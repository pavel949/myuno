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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

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

  // 1. Auth
  const expected = Deno.env.get("EXTERNAL_API_TOKEN");
  if (!expected) return json({ error: "Server not configured" }, 500);
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (token !== expected) return json({ error: "Unauthorized" }, 401);

  // 2. Supabase admin client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
      return json({ data, inserted: Array.isArray(data) ? data.length : 1 });
    }

    // PATCH — update by match
    if (method === "PATCH") {
      const match = body.match as Record<string, unknown> | undefined;
      const values = body.values as Record<string, unknown> | undefined;
      if (!match || !values) return json({ error: "Missing 'match' or 'values'" }, 400);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = admin.from(table).update(values);
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
      const { data, error } = await q.select();
      if (error) return json({ error: error.message }, 400);
      return json({ data, updated: Array.isArray(data) ? data.length : 0 });
    }

    // DELETE — by ?id= (or any single column filter)
    if (method === "DELETE") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = admin.from(table).delete();
      let applied = 0;
      url.searchParams.forEach((v, k) => {
        if (k === "table") return;
        q = q.eq(k, v);
        applied++;
      });
      if (applied === 0) return json({ error: "Refusing DELETE without filters" }, 400);
      const { error, count } = await q.select("*", { count: "exact" });
      if (error) return json({ error: error.message }, 400);
      return json({ deleted: count });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
