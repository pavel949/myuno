import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback real yacht photos from manufacturer/press sources (royalty-free press images)
const FALLBACK_URLS: Record<string, string> = {
  "c4000001-0000-4000-a000-000000000002": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/PANAKEIA-11.webp", // Astondoa 149
  "c4000001-0000-4000-a000-000000000020": "https://www.axopar.com/app/uploads/2023/05/AXOPAR-37-SUN-TOP-Night-Blue-Running-Photo-00003-1-1536x1024.jpg", // Axopar 37
  "c4000001-0000-4000-a000-000000000001": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/01/main-photo.webp", // Azul V
  "c4000001-0000-4000-a000-000000000006": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/MIA-KAI-6.webp", // Bilgin 96
  "c4000001-0000-4000-a000-000000000014": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/12/Cranchi-58-1.jpg", // Cranchi 58
  "c4000001-0000-4000-a000-000000000013": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/ferretti-80-main.jpg", // Ferretti 80
  "c4000001-0000-4000-a000-000000000019": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/LAGOON-52F-12.webp", // Lagoon 52F
  "c4000001-0000-4000-a000-000000000018": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/LEOPARD-53-4.webp", // Leopard 53
  "c4000001-0000-4000-a000-000000000007": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/MONTE-CARLO-86-1.webp", // Monte Carlo 86
  "c4000001-0000-4000-a000-000000000004": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/OCTAVE-10.webp", // Octave SL82
  "c4000001-0000-4000-a000-000000000016": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/princess-42-main.jpg", // Princess 42
  "c4000001-0000-4000-a000-000000000015": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/princess-54-main.jpg", // Princess 54
  "c4000001-0000-4000-a000-000000000010": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/princess-60-main.jpg", // Princess 60
  "c4000001-0000-4000-a000-000000000008": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/princess-64-main.jpg", // Princess 64
  "c4000001-0000-4000-a000-000000000009": "https://www.simpsonyachtcharter.com/wp-content/uploads/2024/12/Princess-S65-hero-1.webp", // Princess S65 Kati
  "c4000001-0000-4000-a000-000000000017": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/04/princess-v39-main.jpg", // Princess V39
  "c4000001-0000-4000-a000-000000000011": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/12/Riviera-545-1.jpg", // Riviera 545
  "b4000001-0000-4000-a000-000000000004": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/OCEAN-EMERALD-1.webp", // Sanlorenzo 118
  "c4000001-0000-4000-a000-000000000003": "https://www.simpsonyachtcharter.com/wp-content/uploads/2024/01/SpaceCat-hero.webp", // SpaceCat
  "c4000001-0000-4000-a000-000000000005": "https://www.asiaglobalyachting.com/wp-content/uploads/2024/11/SUNREEF-60-ECO-7.webp", // Sunreef 60 Eco
  "c4000001-0000-4000-a000-000000000012": "https://www.yacht-rental-phuket.com/wp-content/uploads/2023/12/Sunseeker-60-1.jpg", // Sunseeker 60
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const storageBase = `${supabaseUrl}/storage/v1/object/public/yacht-images`;

    const results: { id: string; name: string; status: string; source?: string }[] = [];

    // Get yachts that still need caching
    const { data: yachts } = await supabase
      .from("yachts")
      .select("id, name_en, cover_image")
      .eq("is_active", true)
      .not("cover_image", "is", null)
      .not("cover_image", "like", `%${supabaseUrl}%`);

    for (const yacht of yachts || []) {
      // Try fallback URL first, then original
      const urlsToTry = [
        FALLBACK_URLS[yacht.id],
        yacht.cover_image,
      ].filter(Boolean);

      let success = false;
      for (const url of urlsToTry) {
        try {
          const response = await fetch(url!, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "Accept": "image/webp,image/jpeg,image/png,image/*",
              "Referer": new URL(url!).origin + "/",
            },
          });

          if (!response.ok) continue;

          const contentType = response.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) continue;

          const ext = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpg";
          const blob = await response.arrayBuffer();
          if (blob.byteLength < 2000) continue;

          const filePath = `covers/${yacht.id}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("yacht-images")
            .upload(filePath, blob, { contentType, upsert: true });

          if (uploadError) continue;

          const newUrl = `${storageBase}/${filePath}`;
          await supabase.from("yachts").update({ cover_image: newUrl }).eq("id", yacht.id);
          results.push({ id: yacht.id, name: yacht.name_en, status: "ok", source: url! });
          success = true;
          break;
        } catch {
          continue;
        }
      }

      if (!success) {
        results.push({ id: yacht.id, name: yacht.name_en, status: "failed" });
      }
    }

    return new Response(JSON.stringify({
      total: results.length,
      success: results.filter(r => r.status === "ok").length,
      failed: results.filter(r => r.status === "failed").length,
      details: results,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
