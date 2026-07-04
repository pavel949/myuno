// Google Places Details proxy with 30-day cache (per Google Maps Platform ToS §3.2.3).
// POST { place_id?: string, query?: { name, lat, lng } }
// Returns cached Google Places payload or freshly fetches and stores it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function getGatewayHeaders(extra?: Record<string, string>) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_API");

  if (!lovableKey || !googleMapsKey) {
    throw new Error("Google Maps connector credentials are not configured");
  }

  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": googleMapsKey,
    ...extra,
  };
}

const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "rating",
  "userRatingCount",
  "priceLevel",
  "regularOpeningHours",
  "location",
  "types",
  "photos",
  "businessStatus",
].join(",");

function toLegacyPlace(place: Record<string, unknown>) {
  const location = place.location as { latitude?: number; longitude?: number } | undefined;
  const displayName = place.displayName as { text?: string } | undefined;
  const photos = Array.isArray(place.photos) ? place.photos as Array<Record<string, unknown>> : [];

  return {
    place_id: place.id,
    name: displayName?.text ?? place.id,
    formatted_address: place.formattedAddress,
    formatted_phone_number: place.nationalPhoneNumber,
    international_phone_number: place.internationalPhoneNumber,
    website: place.websiteUri ?? place.website,
    url: place.googleMapsUri,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: place.priceLevel,
    opening_hours: place.regularOpeningHours,
    geometry: location ? { location: { lat: location.latitude, lng: location.longitude } } : undefined,
    types: place.types,
    photos: photos.map((photo) => ({
      ...photo,
      photo_reference: photo.name,
    })),
    business_status: place.businessStatus,
    _places_new: place,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const rl = await withRateLimit(req, 'place-details', RATE_LIMITS.publicRead, corsHeaders);
    if (rl) return rl;

    const body = await req.json().catch(() => ({}));
    const placeId: string | undefined = body.place_id;
    const query = body.query as { name?: string; lat?: number; lng?: number } | undefined;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Resolve place_id (either supplied or find-by-name+location)
    let resolvedId = placeId;
    if (!resolvedId && query?.name && query.lat != null && query.lng != null) {
      const findRes = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
        method: "POST",
        headers: getGatewayHeaders({
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "places.id",
        }),
        body: JSON.stringify({
          textQuery: query.name,
          locationBias: {
            circle: {
              center: { latitude: query.lat, longitude: query.lng },
              radius: 1000,
            },
          },
          maxResultCount: 1,
        }),
      });
      const findJson = await findRes.json().catch(() => ({}));
      resolvedId = findJson?.places?.[0]?.id;
      if (!resolvedId) return json({ error: "place_not_found", findRes: findJson }, 404);
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
    const detailsRes = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(resolvedId)}?languageCode=en`, {
      headers: getGatewayHeaders({ "X-Goog-FieldMask": FIELDS }),
    });
    const detailsJson = await detailsRes.json().catch(() => ({}));
    if (!detailsRes.ok) {
      return json({ error: "google_error", status: detailsRes.status, message: detailsJson?.error?.message }, 502);
    }

    const place = toLegacyPlace(detailsJson);
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
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
