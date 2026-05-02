// Deno.serve used (native edge runtime)
// nb-process-saved-searches: daily digest of newly matched off-plan projects per saved search.
// Triggered by pg_cron daily.

import { createServiceClient } from "../_shared/supabase.ts";
import { Resend } from "npm:resend@2.0.0";
import {
  AlertRecipient,
  ProjectInfo,
  renderSavedSearchDigestEmail,
  renderSavedSearchDigestWhatsApp,
  sendAndLog,
} from "../_shared/nb-alerts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  notify_email: boolean;
  notify_whatsapp: boolean;
  frequency: string;
  last_seen_project_ids: string[] | null;
  last_notified_at: string | null;
  is_active: boolean;
}

/** Apply OffplanUiFilterState-like filters to a query against property_projects. */
function applyFilters(query: any, filters: Record<string, any>) {
  if (!filters) return query;
  // Simple subset of filters that can be applied server-side
  if (filters.fZone && typeof filters.fZone === "string") {
    query = query.eq("district", filters.fZone);
  }
  if (filters.fDev && typeof filters.fDev === "string") {
    query = query.eq("developer_id", filters.fDev);
  }
  if (filters.fSeg && typeof filters.fSeg === "string") {
    query = query.eq("offplan_catalog->>seg", filters.fSeg);
  }
  if (filters.fBeach && typeof filters.fBeach === "string") {
    query = query.eq("offplan_catalog->>beach", filters.fBeach);
  }
  if (filters.fRec && typeof filters.fRec === "string") {
    query = query.eq("offplan_catalog->>rec", filters.fRec);
  }
  if (filters.fOwn && typeof filters.fOwn === "string") {
    query = query.eq("offplan_catalog->>own", filters.fOwn);
  }
  if (filters.fMgmt && typeof filters.fMgmt === "string") {
    query = query.eq("offplan_catalog->>mgmt", filters.fMgmt);
  }
  if (filters.fFocus && typeof filters.fFocus === "string") {
    query = query.eq("offplan_catalog->>focus", filters.fFocus);
  }
  if (filters.fYear && /^\d{4}$/.test(String(filters.fYear))) {
    query = query.gte("completion_date", `${filters.fYear}-01-01`).lte("completion_date", `${filters.fYear}-12-31`);
  }
  return query;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resend = resendKey ? new Resend(resendKey) : null;

  // Feature flag
  const { data: flag } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "feature_flag:newbuild_alerts")
    .maybeSingle();
  const enabled = flag?.value === true || flag?.value === "true";
  if (!enabled) return json({ skipped: "feature_disabled" });

  const { data: searches } = await supabase
    .from("nb_saved_searches")
    .select("*")
    .eq("is_active", true)
    .limit(500);
  if (!searches || searches.length === 0) return json({ ok: true, processed: 0 });

  const userIds = Array.from(new Set(searches.map((s: SavedSearch) => s.user_id)));
  const { data: prefs } = await supabase.from("nb_alert_preferences").select("*").in("user_id", userIds);
  const prefMap = new Map<string, any>();
  (prefs || []).forEach((p) => prefMap.set(p.user_id, p));

  const { data: profiles } = await supabase.from("profiles").select("id, email, language").in("id", userIds);
  const profileMap = new Map<string, any>();
  (profiles || []).forEach((p) => profileMap.set(p.id, p));

  let totalSent = 0;

  for (const search of searches as SavedSearch[]) {
    let q = supabase
      .from("property_projects")
      .select("id, name_en, name_ru, slug, district, cover_image, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    q = applyFilters(q, search.filters || {});
    const { data: matched, error: mErr } = await q;
    if (mErr) {
      console.error("[saved-searches] query error", mErr, "search", search.id);
      continue;
    }
    if (!matched || matched.length === 0) continue;

    const seen = new Set(search.last_seen_project_ids || []);
    const fresh = matched.filter((p) => !seen.has(p.id));
    if (fresh.length === 0) continue;

    const pref = prefMap.get(search.user_id);
    const profile = profileMap.get(search.user_id);
    const recipient: AlertRecipient = {
      user_id: search.user_id,
      email: pref?.email || profile?.email || null,
      whatsapp_phone: pref?.whatsapp_phone || null,
      channel_email: search.notify_email,
      channel_whatsapp: search.notify_whatsapp && !!pref?.whatsapp_opt_in_at,
      quiet_hours_start: pref?.quiet_hours_start ?? null,
      quiet_hours_end: pref?.quiet_hours_end ?? null,
      locale: (pref?.locale || profile?.language || "ru") === "en" ? "en" : "ru",
    };

    const projectInfos: ProjectInfo[] = fresh.map((p) => ({
      id: p.id,
      name_en: p.name_en,
      name_ru: p.name_ru,
      slug: p.slug,
      district: p.district,
      cover_image: p.cover_image,
    }));

    // Use a date-stamped synthetic ref so the unique-log index allows daily digests.
    // Build deterministic UUID v4-shape from search.id + YYYY-MM-DD.
    const today = new Date().toISOString().slice(0, 10);
    const refId = await synthRefId(`${search.id}-${today}`);

    const r = await sendAndLog({
      supabase,
      resend,
      recipient,
      alert_type: "saved_search_match",
      ref_id: refId,
      project_id: null,
      email: renderSavedSearchDigestEmail({ searchName: search.name, projects: projectInfos, lang: recipient.locale }),
      whatsapp: renderSavedSearchDigestWhatsApp({ searchName: search.name, projects: projectInfos, lang: recipient.locale }),
    });

    // Update last_seen + last_notified, even if email/wa skipped — to avoid repeat next day on same set
    const newSeen = Array.from(new Set([...(search.last_seen_project_ids || []), ...matched.map((m) => m.id)])).slice(-200);
    await supabase
      .from("nb_saved_searches")
      .update({ last_seen_project_ids: newSeen, last_notified_at: new Date().toISOString() })
      .eq("id", search.id);

    if (r.email || r.whatsapp) {
      totalSent++;
      // Bump dedupe ref_id to allow next-day digest (insert a fresh row then delete old? no — uniqueness is per (user, ref_id, channel))
      // Since ref_id = search.id is constant, idempotency_log will block 2nd send. Workaround: delete previous saved_search_match row for this search before next cron via UPDATE log timestamps. Simpler: include date in ref by switching to date-stamped synthetic uuid.
    }
  }

  return json({ ok: true, sent: totalSent, total: searches.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
