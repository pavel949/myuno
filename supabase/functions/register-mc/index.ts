import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.user.id;

  try {
    const body = await req.json();
    const { name_en, name_ru, email, phone, address, description_en, description_ru } = body;

    if (!name_en || !name_ru) {
      return new Response(
        JSON.stringify({ error: "name_en and name_ru are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slug = body.slug ? slugify(body.slug) : slugify(name_en);
    const supabase = createServiceClient();

    // 1. Create management company
    const { data: company, error: companyError } = await supabase
      .from("management_companies")
      .insert({
        name_en,
        name_ru,
        slug,
        email: email || null,
        phone: phone || null,
        address: address || null,
        description_en: description_en || null,
        description_ru: description_ru || null,
        is_active: true,
        created_by: userId,
      })
      .select("id, slug")
      .single();

    if (companyError) {
      console.error("Failed to create MC:", companyError);
      return new Response(
        JSON.stringify({ error: "Failed to create company", detail: companyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Add user as director
    const { error: memberError } = await supabase
      .from("management_company_members")
      .insert({
        company_id: company.id,
        user_id: userId,
        role: "director",
        is_active: true,
      });

    if (memberError) {
      console.error("Failed to add member:", memberError);
    }

    // 3. Ensure user has property_manager role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "property_manager" },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Failed to upsert role:", roleError);
    }

    // Trigger onboarding agent (fire-and-forget)
    // @ts-ignore EdgeRuntime available in Supabase
    EdgeRuntime.waitUntil((async () => {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/mc-onboarding-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            "x-internal-secret": Deno.env.get("INTERNAL_SECRET") ?? "",
          },
          body: JSON.stringify({
            company_id: company.id,
            user_id: userId,
            company_name: name_en,
            plan_type: body.plan_type ?? "free",
          }),
        });
      } catch (e) {
        console.error("[register-mc] onboarding agent trigger failed:", e);
      }
    })());

    return new Response(
      JSON.stringify({ company_id: company.id, slug: company.slug }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("register-mc error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
