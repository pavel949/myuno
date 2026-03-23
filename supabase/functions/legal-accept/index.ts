/**
 * Edge Function: legal-accept
 * Securely records legal document acceptance with IP capture.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Parse body
    const body = await req.json();
    const { acceptances, acceptance_source = "app_init" } = body as {
      acceptances: Array<{ doc_id: string }>;
      acceptance_source?: string;
    };

    if (!acceptances?.length) {
      return new Response(JSON.stringify({ error: "No acceptances provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent = req.headers.get("user-agent") || null;

    // Service client for inserting (bypasses RLS for IP capture)
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Validate all doc_ids are active
    const docIds = acceptances.map((a) => a.doc_id);
    const { data: docs, error: docsError } = await adminClient
      .from("legal_documents")
      .select("id, doc_key, version, content_hash, is_active")
      .in("id", docIds);

    if (docsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch documents" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inactiveDocs = docs?.filter((d) => !d.is_active) || [];
    if (inactiveDocs.length > 0) {
      return new Response(
        JSON.stringify({ error: "Cannot accept inactive documents", inactive: inactiveDocs.map((d) => d.id) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's company_id if they are MC member
    const { data: membership } = await adminClient
      .from("management_company_members")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const companyId = membership?.company_id || null;

    // Build insert rows
    const rows = (docs || []).map((doc) => ({
      user_id: userId,
      company_id: companyId,
      doc_id: doc.id,
      doc_key: doc.doc_key,
      version: doc.version,
      content_hash: doc.content_hash,
      ip_address: ip,
      user_agent: userAgent,
      acceptance_source,
    }));

    // Upsert (unique on user_id, doc_key, version)
    const { error: insertError } = await adminClient
      .from("legal_acceptances")
      .upsert(rows, { onConflict: "user_id,doc_key,version" });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record acceptance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, accepted: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
