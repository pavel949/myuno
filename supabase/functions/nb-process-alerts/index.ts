// Deno.serve used (native edge runtime)
// nb-process-alerts: shipment of WhatsApp/Email alerts for new units & construction
// progress updates in projects users have favourited (favorites.item_type='newbuild_project').
// Triggered by pg_cron every 15 min.

import { createServiceClient } from "../_shared/supabase.ts";
import { Resend } from "npm:resend@2.0.0";
import {
  AlertRecipient,
  ProjectInfo,
  UnitInfo,
  renderNewUnitsEmail,
  renderNewUnitsWhatsApp,
  renderProgressEmail,
  renderProgressWhatsApp,
  sendAndLog,
} from "../_shared/nb-alerts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (!enabled) {
    return json({ skipped: "feature_disabled" });
  }

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // last 30 min

  // 1) NEW UNITS
  const { data: newUnits, error: unitsErr } = await supabase
    .from("project_units")
    .select("id, project_id, unit_code, unit_type, bedrooms, area_sqm, price, currency, status, unit_status, created_at, updated_at")
    .or(`created_at.gte.${since},updated_at.gte.${since}`)
    .in("unit_status", ["available", "Available"])
    .limit(500);
  if (unitsErr) console.error("[nb-process-alerts] units fetch error", unitsErr);

  // Group units by project
  const unitsByProject = new Map<string, UnitInfo[]>();
  for (const u of newUnits || []) {
    const arr = unitsByProject.get(u.project_id) || [];
    arr.push({
      unit_id: u.id,
      unit_code: u.unit_code,
      unit_type: u.unit_type,
      bedrooms: u.bedrooms,
      area_sqm: u.area_sqm,
      price: u.price,
      currency: u.currency,
    });
    unitsByProject.set(u.project_id, arr);
  }

  // 2) PROGRESS UPDATES
  const { data: updates } = await supabase
    .from("nb_project_updates")
    .select("id, project_id, title, content, progress_at_time, published_at")
    .gte("published_at", since)
    .limit(200);

  // Collect project ids
  const projectIds = new Set<string>();
  unitsByProject.forEach((_, k) => projectIds.add(k));
  for (const u of updates || []) projectIds.add(u.project_id);

  if (projectIds.size === 0) return json({ ok: true, processed: 0 });

  // Fetch project meta
  const { data: projects } = await supabase
    .from("property_projects")
    .select("id, name_en, name_ru, slug, district, cover_image")
    .in("id", Array.from(projectIds));
  const projectMap = new Map<string, ProjectInfo>();
  (projects || []).forEach((p) => projectMap.set(p.id, p as ProjectInfo));

  // Fetch favorites for these projects (item_type variants seen in code)
  const { data: favs } = await supabase
    .from("favorites")
    .select("user_id, item_id, item_type")
    .in("item_id", Array.from(projectIds))
    .in("item_type", ["newbuild_project", "newbuilds_project", "property_project"]);

  if (!favs || favs.length === 0) return json({ ok: true, processed: 0, reason: "no_favorites" });

  // Fetch recipient prefs (+ fallback email from auth.users via profiles)
  const userIds = Array.from(new Set(favs.map((f) => f.user_id)));
  const { data: prefs } = await supabase
    .from("nb_alert_preferences")
    .select("*")
    .in("user_id", userIds);
  const prefMap = new Map<string, any>();
  (prefs || []).forEach((p) => prefMap.set(p.user_id, p));

  // Backfill email from profiles if pref missing
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, language")
    .in("id", userIds);
  const profileMap = new Map<string, any>();
  (profiles || []).forEach((p) => profileMap.set(p.id, p));

  let sent = 0;
  for (const fav of favs) {
    const project = projectMap.get(fav.item_id);
    if (!project) continue;

    const pref = prefMap.get(fav.user_id);
    const profile = profileMap.get(fav.user_id);
    const recipient: AlertRecipient = {
      user_id: fav.user_id,
      email: pref?.email || profile?.email || null,
      whatsapp_phone: pref?.whatsapp_phone || null,
      channel_email: pref ? !!pref.channel_email : true, // default email on
      channel_whatsapp: pref ? !!pref.channel_whatsapp && !!pref.whatsapp_opt_in_at : false,
      quiet_hours_start: pref?.quiet_hours_start ?? null,
      quiet_hours_end: pref?.quiet_hours_end ?? null,
      locale: (pref?.locale || profile?.language || "ru") === "en" ? "en" : "ru",
    };

    // NEW UNITS for this project
    const units = unitsByProject.get(project.id);
    if (units && units.length > 0 && (pref ? pref.notify_new_units : true)) {
      // ref_id = first unit id (digest); dedupe per (user, project, batch) acceptable
      // For finer granularity we could iterate, but digest is more user-friendly.
      const refId = units[0].unit_id;
      const r = await sendAndLog({
        supabase,
        resend,
        recipient,
        alert_type: "new_unit",
        ref_id: refId,
        project_id: project.id,
        email: renderNewUnitsEmail({ project, units, lang: recipient.locale }),
        whatsapp: renderNewUnitsWhatsApp({ project, units, lang: recipient.locale }),
      });
      if (r.email || r.whatsapp) sent++;
    }

    // PROGRESS UPDATES
    const projUpdates = (updates || []).filter((u) => u.project_id === project.id);
    if (projUpdates.length > 0 && (pref ? pref.notify_progress_updates : true)) {
      for (const upd of projUpdates) {
        const r = await sendAndLog({
          supabase,
          resend,
          recipient,
          alert_type: "progress",
          ref_id: upd.id,
          project_id: project.id,
          email: renderProgressEmail({ project, update: upd, lang: recipient.locale }),
          whatsapp: renderProgressWhatsApp({ project, update: upd, lang: recipient.locale }),
        });
        if (r.email || r.whatsapp) sent++;
      }
    }
  }

  return json({ ok: true, sent, recipients: userIds.length, units: newUnits?.length || 0, updates: updates?.length || 0 });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
