// Import Phuket POIs from OpenStreetMap via Overpass API into public.phuket_osm_pois
// Run on-demand (POST) or via cron weekly. Idempotent: UPSERT on (osm_type, osm_id).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Phuket bbox: south, west, north, east
const PHUKET_BBOX = "7.70,98.20,8.20,98.55";

// Map OSM tags -> our category taxonomy
function categorize(tags: Record<string, string>): {
  category: string;
  subcategory: string | null;
} | null {
  const t = tags;
  if (t.amenity === "pharmacy") return { category: "pharmacy", subcategory: null };
  if (t.amenity === "hospital" || t.healthcare === "hospital")
    return { category: "clinic", subcategory: "hospital" };
  if (t.amenity === "clinic" || t.amenity === "doctors" || t.healthcare)
    return { category: "clinic", subcategory: t.healthcare ?? "clinic" };
  if (t.amenity === "veterinary") return { category: "vet", subcategory: null };
  if (t.amenity === "restaurant" || t.amenity === "cafe" || t.amenity === "fast_food" || t.amenity === "bar" || t.amenity === "pub" || t.amenity === "food_court" || t.amenity === "ice_cream")
    return { category: "restaurant", subcategory: t.amenity };
  if (t.amenity === "atm" || t.amenity === "bank")
    return { category: "finance", subcategory: t.amenity };
  if (t.amenity === "fuel") return { category: "fuel", subcategory: null };
  if (t.amenity === "school" || t.amenity === "kindergarten" || t.amenity === "college" || t.amenity === "university")
    return { category: "education", subcategory: t.amenity };
  if (t.amenity === "place_of_worship") return { category: "worship", subcategory: t.religion ?? null };
  if (t.amenity === "police" || t.amenity === "fire_station")
    return { category: "civic", subcategory: t.amenity };
  if (t.amenity === "post_office" || t.amenity === "townhall" || t.amenity === "embassy" || t.amenity === "courthouse" || t.amenity === "community_centre")
    return { category: "civic", subcategory: t.amenity };
  if (t.amenity === "spa" || t.shop === "massage" || t.leisure === "spa" || t.shop === "beauty")
    return { category: "spa", subcategory: t.amenity ?? t.leisure ?? t.shop };
  if (t.shop === "hairdresser" || t.shop === "tattoo" || t.shop === "nails")
    return { category: "beauty", subcategory: t.shop };
  if (t.tourism === "hotel" || t.tourism === "hostel" || t.tourism === "guest_house" || t.tourism === "apartment" || t.tourism === "resort" || t.tourism === "motel" || t.tourism === "chalet")
    return { category: "hotel", subcategory: t.tourism };
  if (t.tourism === "attraction" || t.tourism === "viewpoint" || t.tourism === "museum" || t.tourism === "gallery" || t.tourism === "zoo" || t.tourism === "theme_park" || t.tourism === "aquarium")
    return { category: "attraction", subcategory: t.tourism };
  if (t.tourism === "information")
    return { category: "civic", subcategory: "tourist_info" };
  if (t.leisure === "marina" || t.waterway === "dock")
    return { category: "marina", subcategory: null };
  if (t.leisure === "fitness_centre" || t.leisure === "sports_centre" || t.leisure === "swimming_pool" || t.leisure === "pitch")
    return { category: "fitness", subcategory: t.leisure };
  if (t.leisure === "beach_resort" || t.natural === "beach")
    return { category: "beach", subcategory: null };
  if (t.leisure === "park" || t.leisure === "garden" || t.leisure === "nature_reserve")
    return { category: "park", subcategory: t.leisure };
  if (t.amenity === "events_venue" || t.amenity === "conference_centre" || t.amenity === "theatre" || t.amenity === "cinema" || t.amenity === "nightclub")
    return { category: "venue", subcategory: t.amenity };
  if (t.office === "coworking" || t.amenity === "coworking_space")
    return { category: "coworking", subcategory: null };
  if (t.office)
    return { category: "office", subcategory: t.office };
  if (t.shop === "supermarket" || t.shop === "convenience" || t.shop === "mall" || t.shop === "department_store")
    return { category: "shop", subcategory: t.shop };
  if (t.shop === "florist") return { category: "flowers", subcategory: null };
  if (t.craft) return { category: "service", subcategory: t.craft };
  if (t.shop) return { category: "shop", subcategory: t.shop };
  if (t.public_transport || t.amenity === "bus_station" || t.aeroway === "aerodrome" || t.amenity === "ferry_terminal")
    return { category: "transport", subcategory: t.public_transport ?? t.amenity ?? t.aeroway });
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Overpass QL: pull every interesting POI in Phuket bbox
    const query = `
[out:json][timeout:180];
(
  node["amenity"](${PHUKET_BBOX});
  node["tourism"](${PHUKET_BBOX});
  node["shop"](${PHUKET_BBOX});
  node["leisure"](${PHUKET_BBOX});
  node["healthcare"](${PHUKET_BBOX});
  node["natural"="beach"](${PHUKET_BBOX});
  node["public_transport"](${PHUKET_BBOX});
  node["aeroway"="aerodrome"](${PHUKET_BBOX});
);
out body;
`;

    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
    ];

    let data: any = null;
    let lastErr = "";
    for (const url of endpoints) {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "myUNO/1.0 (https://myuno.app)" },
          body: "data=" + encodeURIComponent(query),
        });
        if (!r.ok) {
          lastErr = `${url} -> ${r.status}`;
          continue;
        }
        data = await r.json();
        break;
      } catch (e) {
        lastErr = `${url} -> ${(e as Error).message}`;
      }
    }
    if (!data) throw new Error(`All Overpass endpoints failed: ${lastErr}`);

    const elements: any[] = data.elements ?? [];
    const rows: any[] = [];
    for (const el of elements) {
      if (el.type !== "node" || el.lat == null || el.lon == null) continue;
      const tags = (el.tags ?? {}) as Record<string, string>;
      const cat = categorize(tags);
      if (!cat) continue;
      rows.push({
        osm_type: "node",
        osm_id: el.id,
        category: cat.category,
        subcategory: cat.subcategory,
        name_en: tags["name:en"] ?? tags["name"] ?? null,
        name_th: tags["name:th"] ?? null,
        name_ru: tags["name:ru"] ?? null,
        lat: el.lat,
        lng: el.lon,
        tags,
        source: "overpass",
      });
    }

    // Upsert in batches of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("phuket_osm_pois")
        .upsert(batch, { onConflict: "osm_type,osm_id" });
      if (error) throw new Error(`Upsert batch ${i}: ${error.message}`);
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        fetched: elements.length,
        kept: rows.length,
        upserted: inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("import-phuket-osm error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
