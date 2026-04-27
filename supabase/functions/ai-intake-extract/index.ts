/**
 * AI Intake Extract Edge Function
 * AUTH_REQUIRED: Admin data extraction tool. Requires authentication.
 *
 * Capabilities:
 *  - Parse text (WhatsApp / brochure / email) into structured property_project data via AI
 *  - Resolve Google Maps short links to lat/lng
 *  - Fetch a Google Drive folder (public link) and import its images into Supabase Storage
 *  - Return enriched payload with photo URLs ready for the form
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const STORAGE_BUCKET = "complex-media";
const MAX_DRIVE_IMAGES = 30;
const DRIVE_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

// ---------- Schemas ----------
const entitySchemas: Record<string, any> = {
  property_project: {
    name: "extract_property_project",
    description:
      "Extract property project / residential complex / villa estate data from sales pitch, brochure, or WhatsApp message",
    parameters: {
      type: "object",
      properties: {
        name_en: { type: "string", description: "Project name in English (e.g. 'Verdana Pool Villa')" },
        name_ru: { type: "string", description: "Project name in Russian (transliterate if no Russian original)" },
        description_en: { type: "string", description: "Marketing description in English (3-6 sentences). Use details about location, lifestyle, unit mix, amenities." },
        description_ru: { type: "string", description: "Marketing description in Russian (3-6 sentences)." },
        complex_type: {
          type: "string",
          enum: ["condo", "villa", "mixed", "townhouse", "apartment", "resort"],
        },
        address: { type: "string", description: "Full address as written" },
        district: { type: "string", description: "Phuket district / sub-district name" },
        lat: { type: "number" },
        lng: { type: "number" },
        developer_name: { type: "string" },
        year_built: { type: "number" },
        total_units: { type: "number" },
        total_buildings: { type: "number" },
        total_floors: { type: "number" },
        starting_price_thb: { type: "number", description: "Convert '12.5 MB' or '12.5 million baht' to 12500000." },
        amenities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "swimming_pool", "kids_pool", "gym", "sauna", "steam_room", "jacuzzi",
              "playground", "garden", "rooftop", "bbq_area", "lobby", "elevator",
              "tennis_court", "yoga_room", "library", "beach_access", "communal_kitchen",
              "golf", "cinema",
            ],
          },
        },
        services: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "24h_reception", "shuttle_to_beach", "concierge", "cleaning_service",
              "laundry", "maintenance", "parcel_locker", "car_wash",
              "shuttle_to_airport", "pool_service",
            ],
          },
        },
        security_features: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "cctv", "gated_community", "24h_security", "key_card_access",
              "intercom", "fire_alarm", "flood_sensors",
            ],
          },
        },
        infrastructure: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "restaurant", "cafe", "minimart", "coworking", "kids_club",
              "spa", "parking_garage", "pharmacy", "atm",
            ],
          },
        },
        juristic_person_name: { type: "string" },
        juristic_phone: { type: "string", description: "Primary phone in international format" },
        juristic_email: { type: "string" },
        video_url: { type: "string", description: "YouTube or video URL" },
        google_maps_url: { type: "string", description: "Any Google Maps URL found in the text (maps.app.goo.gl, goo.gl/maps, google.com/maps)." },
        google_drive_url: { type: "string", description: "Any Google Drive folder or file URL found in the text." },
        unit_types: {
          type: "array",
          items: {
            type: "object",
            properties: {
              bedrooms: { type: "number" },
              bathrooms: { type: "number" },
              land_min_sqm: { type: "number" },
              land_max_sqm: { type: "number" },
              built_up_sqm: { type: "number" },
            },
          },
        },
      },
      required: ["name_en"],
    },
  },
  property: {
    name: "extract_property",
    description: "Extract property listing data",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        title_ru: { type: "string" },
        description: { type: "string" },
        description_ru: { type: "string" },
        property_type: { type: "string" },
        bedrooms: { type: "number" },
        bathrooms: { type: "number" },
        area_sqm: { type: "number" },
        price: { type: "number" },
        currency: { type: "string" },
        address: { type: "string" },
        district: { type: "string" },
        amenities: { type: "array", items: { type: "string" } },
      },
      required: ["title"],
    },
  },
};

// ---------- Utilities ----------

function extractUrls(text: string): string[] {
  if (!text) return [];
  const re = /https?:\/\/[^\s)>\]"']+/gi;
  return Array.from(text.matchAll(re)).map(m => m[0].replace(/[.,;]+$/, ""));
}

function pickFirst<T>(arr: T[], pred: (v: T) => boolean): T | undefined {
  for (const v of arr) if (pred(v)) return v;
  return undefined;
}

/** Extract Drive folder/file id from a URL. Returns { kind, id } or null. */
function parseDriveUrl(url: string): { kind: "folder" | "file"; id: string } | null {
  try {
    const u = new URL(url);
    if (!/drive\.google\.com|docs\.google\.com/i.test(u.hostname)) return null;

    // /drive/folders/<id>
    const folderMatch = u.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) return { kind: "folder", id: folderMatch[1] };

    // /file/d/<id>/...
    const fileMatch = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return { kind: "file", id: fileMatch[1] };

    // ?id=<id>
    const idParam = u.searchParams.get("id");
    if (idParam) return { kind: "file", id: idParam };

    return null;
  } catch {
    return null;
  }
}

/** Resolve a Google Maps short URL by following redirects, then extract coordinates. */
async function resolveMapsCoords(url: string): Promise<{ lat: number; lng: number } | null> {
  try {
    let finalUrl = url;
    // Follow redirects for short links
    if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(url)) {
      try {
        const resp = await fetch(url, { redirect: "follow" });
        finalUrl = resp.url || url;
      } catch (_e) {
        // ignore
      }
    }

    // Patterns: @lat,lng,zoom   or   !3d<lat>!4d<lng>   or   q=lat,lng
    const at = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

    const bang = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (bang) return { lat: parseFloat(bang[1]), lng: parseFloat(bang[2]) };

    const q = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };

    return null;
  } catch (e) {
    console.warn("resolveMapsCoords failed", e);
    return null;
  }
}

/**
 * List image files in a public Google Drive folder via the public Drive v3 API.
 * Works ONLY when the folder is shared "Anyone with the link". Uses the public
 * key endpoint that does not require OAuth for publicly-shared folders.
 */
async function listDriveFolderImages(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  // Public Drive listing without API key works when the folder is publicly shared
  // by scraping the folder HTML page (Drive embeds file metadata in JSON).
  try {
    const html = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`).then(r => r.text());
    // Each file entry has a div with id starting with 'entry-' and data attributes
    const ids = Array.from(html.matchAll(/href="https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g))
      .map(m => m[1]);
    const unique = Array.from(new Set(ids)).slice(0, MAX_DRIVE_IMAGES);
    return unique.map(id => ({ id, name: `${id}.jpg`, mimeType: "image/jpeg" }));
  } catch (e) {
    console.warn("Drive folder list failed", e);
    return [];
  }
}

/** Download a Drive file as bytes (works for publicly-shared images). */
async function downloadDriveFile(fileId: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  // Try direct download endpoint first
  const urls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    `https://lh3.googleusercontent.com/d/${fileId}=s2048`,
  ];
  for (const url of urls) {
    try {
      const resp = await fetch(url, { redirect: "follow" });
      if (!resp.ok) continue;
      const ct = resp.headers.get("content-type") || "image/jpeg";
      // Skip HTML responses (Drive virus-scan interstitials, login pages)
      if (ct.includes("text/html")) continue;
      const bytes = new Uint8Array(await resp.arrayBuffer());
      if (bytes.byteLength < 1024) continue; // junk
      if (bytes.byteLength > DRIVE_IMAGE_MAX_BYTES) continue;
      return { bytes, contentType: ct };
    } catch (_e) {
      // try next
    }
  }
  return null;
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("heif")) return "heif";
  return "jpg";
}

/**
 * Import images from a Google Drive folder/file URL into Supabase Storage.
 * Returns array of public URLs.
 */
async function importDriveImages(
  driveUrl: string,
  supabaseAdmin: any,
  ownerKey: string,
): Promise<{ urls: string[]; tried: number; saved: number }> {
  const parsed = parseDriveUrl(driveUrl);
  if (!parsed) return { urls: [], tried: 0, saved: 0 };

  let fileIds: string[] = [];
  if (parsed.kind === "folder") {
    const items = await listDriveFolderImages(parsed.id);
    fileIds = items.map(i => i.id);
  } else {
    fileIds = [parsed.id];
  }

  const urls: string[] = [];
  let saved = 0;
  for (const fid of fileIds) {
    const dl = await downloadDriveFile(fid);
    if (!dl) continue;
    const ext = extFromMime(dl.contentType);
    const path = `intake/${ownerKey}/${Date.now()}-${fid}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, dl.bytes, { contentType: dl.contentType, upsert: false });
    if (error) {
      console.warn("Storage upload failed", path, error.message);
      continue;
    }
    const { data: pub } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    if (pub?.publicUrl) {
      urls.push(pub.publicUrl);
      saved++;
    }
  }
  return { urls, tried: fileIds.length, saved };
}

// ---------- Main ----------

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rlResponse = await withRateLimit(req, "ai-intake-extract", RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;
  const userId = (authResult as any)?.user?.id || (authResult as any)?.userId || "anon";

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { input, inputType, entityType, language } = await req.json();

    if (!input || !entityType) throw new Error("Missing input or entityType");

    const schema = entitySchemas[entityType];
    if (!schema) throw new Error(`Unknown entity type: ${entityType}`);

    // -------- Step 1: AI extraction from text --------
    const systemPrompt = `You are a data extraction assistant for a property management platform in Thailand (Phuket).
Extract structured data from unstructured text input — WhatsApp messages, sales brochures, developer pitches.

Rules:
1. Extract everything that matches the schema; omit fields you cannot infer.
2. Always populate name_en. Also produce name_ru via Russian transliteration / translation.
3. Convert prices to numeric THB. "12.5 MB", "12.5 million baht", "฿12,500,000" -> 12500000.
4. Normalize amenities/services/security/infrastructure strictly to the enum values.
5. For Phuket addresses extract the local sub-district as district.
6. If Google Maps URL is found, copy the FULL URL into google_maps_url field. Do not invent lat/lng — server will resolve coordinates.
7. If Google Drive URL is found, copy the FULL URL into google_drive_url field — server will fetch images.
8. Generate description_en (3-6 sentences) summarising location, lifestyle, unit mix, amenities — even if pitch is terse, write a natural paragraph from clues.
9. Generate description_ru as Russian translation of description_en.
10. Phone numbers: keep international format with leading +.`;

    const userPrompt = `Extract structured data from this ${inputType === "url" ? "URL content" : "message / brochure text"}:\n\n${input}\n\nExtract all available information matching the ${entityType} schema.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: schema }],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No extraction result from AI");

    const extracted = JSON.parse(toolCall.function.arguments);

    // -------- Step 2: Find URLs in original text (fallback if AI missed them) --------
    const urls = extractUrls(typeof input === "string" ? input : "");

    // Drive
    let driveUrl: string | undefined = extracted.google_drive_url;
    if (!driveUrl) {
      driveUrl = pickFirst(urls, u => /drive\.google\.com|docs\.google\.com/i.test(u));
    }

    // Maps
    let mapsUrl: string | undefined = extracted.google_maps_url;
    if (!mapsUrl) {
      mapsUrl = pickFirst(urls, u => /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[^/]+\/maps/i.test(u));
    }

    // -------- Step 3: Resolve Maps coords --------
    if (mapsUrl && (typeof extracted.lat !== "number" || typeof extracted.lng !== "number")) {
      const coords = await resolveMapsCoords(mapsUrl);
      if (coords) {
        extracted.lat = coords.lat;
        extracted.lng = coords.lng;
        console.log("Resolved Maps coords:", coords);
      }
    }

    // -------- Step 4: Import Drive images into storage --------
    const driveStats: { tried: number; saved: number; error?: string } = { tried: 0, saved: 0 };
    if (driveUrl && SUPABASE_URL && SERVICE_ROLE) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { urls: photoUrls, tried, saved } = await importDriveImages(driveUrl, supabaseAdmin, userId);
        driveStats.tried = tried;
        driveStats.saved = saved;
        if (photoUrls.length > 0) {
          extracted.images = photoUrls;
          extracted.cover_image = photoUrls[0];
        }
      } catch (e: any) {
        console.warn("Drive import failed:", e?.message);
        driveStats.error = e?.message || "drive import failed";
      }
    } else if (driveUrl) {
      driveStats.error = "Storage not configured";
    }

    console.log("AI Intake extracted:", entityType, Object.keys(extracted), "drive:", driveStats);

    return new Response(
      JSON.stringify({
        extracted,
        meta: {
          drive_url: driveUrl || null,
          maps_url: mapsUrl || null,
          drive: driveStats,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("AI Intake error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
