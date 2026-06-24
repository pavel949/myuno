import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

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

    const baseSlug = body.slug ? slugify(body.slug) : slugify(name_en);
    const supabase = createServiceClient();

    // 1. Create management company. `slug` is unique, so retry with a numeric
    // suffix on collision (e.g. two companies with the same English name)
    // instead of failing the registration outright.
    let company: { id: string; slug: string } | null = null;
    let companyError: { code?: string; message: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const { data, error } = await supabase
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

      if (!error) {
        company = data;
        companyError = null;
        break;
      }
      companyError = error;
      // 23505 = unique_violation → try the next suffix; otherwise stop.
      if (error.code !== "23505") break;
    }

    if (!company) {
      console.error("Failed to create MC:", companyError);
      return new Response(
        JSON.stringify({ error: "Failed to create company", detail: companyError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Add user as director. MCGuard gates the whole MC workspace on this
    // membership row, so a failure here MUST be fatal — otherwise the client
    // gets a company_id, sets it active, then MCGuard finds no membership and
    // loops back to onboarding, leaving an orphan company. Roll back + 500.
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
      await supabase.from("management_companies").delete().eq("id", company.id);
      return new Response(
        JSON.stringify({ error: "Failed to add director", detail: memberError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Ensure user has property_manager role. Required for OwnerGuard-gated
    // screens; treat failure as fatal and roll back so the write stays atomic.
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "property_manager" },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Failed to upsert role:", roleError);
      await supabase.from("management_company_members").delete().eq("company_id", company.id).eq("user_id", userId);
      await supabase.from("management_companies").delete().eq("id", company.id);
      return new Response(
        JSON.stringify({ error: "Failed to grant role", detail: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
