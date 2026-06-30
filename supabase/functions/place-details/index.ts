// Google Places Details proxy with 30-day cache (per Google Maps Platform ToS §3.2.3).
// POST { place_id?: string, query?: { name, lat, lng } }
// Returns cached Google Places payload or freshly fetches and stores it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_KEY =
  Deno.env.get("GOOGLE_MAPS_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_API") ?? "";

const FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "url",
  "rating",
  "user_ratings_total",
  "price_level",
  "opening_hours",
  "geometry",
  "types",
  "photos",
  "business_status",
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GOOGLE_KEY) {
      return json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const placeId: string | undefined = body.place_id;
    const query = body.query as { name?: string; lat?: number; lng?: number } | undefined;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Resolve place_id (either supplied or find-by-name+location)
    let resolvedId = placeId;
    if (!resolvedId && query?.name && query.lat != null && query.lng != null) {
      const findUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
      findUrl.searchParams.set("input", query.name);
      findUrl.searchParams.set("inputtype", "textquery");
      findUrl.searchParams.set("fields", "place_id");
      findUrl.searchParams.set("locationbias", `point:${query.lat},${query.lng}`);
      findUrl.searchParams.set("key", GOOGLE_KEY);
      const findRes = await fetch(findUrl).then((r) => r.json());
      resolvedId = findRes?.candidates?.[0]?.place_id;
      if (!resolvedId) return json({ error: "place_not_found", findRes }, 404);
    }

    if (!resolvedId) return json({ error: "place_id or query required" }, 400);

    // 2. Cache lookup
    const { data: cached } = await supabase
      .from("google_place_cache")
      .select("payload, expires_at")
      .eq("place_id", resolvedId)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return json({ source: "cache", place: cached.payload });
    }

    // 3. Fresh fetch
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", resolvedId);
    detailsUrl.searchParams.set("fields", FIELDS);
    detailsUrl.searchParams.set("language", "en");
    detailsUrl.searchParams.set("key", GOOGLE_KEY);

    const res = await fetch(detailsUrl).then((r) => r.json());
    if (res.status !== "OK") {
      return json({ error: "google_error", status: res.status, message: res.error_message }, 502);
    }

    const place = res.result;
    const lat = place?.geometry?.location?.lat ?? null;
    const lng = place?.geometry?.location?.lng ?? null;

    await supabase.from("google_place_cache").upsert(
      {
        place_id: resolvedId,
        payload: place,
        lat,
        lng,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
      { onConflict: "place_id" },
    );

    return json({ source: "google", place });
  } catch (err) {
    console.error("[place-details] error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
