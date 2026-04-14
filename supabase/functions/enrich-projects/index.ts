// Deno.serve used (native edge runtime)
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard: require X-Internal-Secret header
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { projectId, mode = "single" } = await req.json();

    // Fetch projects to enrich
    let query = supabase
      .from("property_projects")
      .select("id, name_en, name_ru, description_en, description_ru, district, developer_name, amenities, price_from, price_to, project_status, completion_date, construction_progress")
      .eq("is_active", true);

    if (mode === "single" && projectId) {
      query = query.eq("id", projectId);
    } else {
      // Batch mode: get projects missing key data
      query = query.or("description_en.is.null,amenities.is.null,muuno_score.is.null");
    }

    const { data: projects, error: fetchError } = await query.limit(10);
    if (fetchError) throw fetchError;
    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ message: "No projects need enrichment", enriched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const project of projects) {
      try {
        const prompt = `You are a real estate data analyst for Phuket, Thailand property market.
Enrich this property project with missing data. Return ONLY the fields that need filling.

Project: "${project.name_en}"
Current data:
- District: ${project.district || "unknown"}
- Developer: ${project.developer_name || "unknown"}
- Description EN: ${project.description_en ? "EXISTS" : "MISSING"}
- Description RU: ${project.description_ru ? "EXISTS" : "MISSING"}
- Amenities: ${project.amenities?.length ? JSON.stringify(project.amenities) : "MISSING"}
- Price from: ${project.price_from || "unknown"} THB
- Status: ${project.project_status || "unknown"}
- Completion: ${project.completion_date || "unknown"}

Instructions:
1. If district is generic "Phuket", determine the actual district (Bang Tao, Rawai, Patong, Kamala, Laguna, Chalong, Kata, Karon, Cherng Talay, Nai Harn, Surin, Mai Khao, etc.)
2. Generate a compelling 2-3 sentence description in English and Russian if missing
3. Suggest amenities from: pool, gym, security, parking, garden, kids_playground, concierge, spa, restaurant, coworking, rooftop_bar, tennis_court, bbq_area, sauna, yoga_room, beach_access
4. Calculate a muuno_score (1-10) based on: location quality, developer reputation, amenities, price-to-value ratio, investment potential`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a Phuket real estate data enrichment assistant." },
              { role: "user", content: prompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "enrich_project",
                description: "Provide enriched data for a property project",
                parameters: {
                  type: "object",
                  properties: {
                    description_en: { type: "string", description: "English description, 2-3 compelling sentences" },
                    description_ru: { type: "string", description: "Russian description, 2-3 compelling sentences" },
                    district: { type: "string", description: "Specific Phuket district name" },
                    amenities: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of amenity tags"
                    },
                    muuno_score: { type: "number", description: "Quality score 1-10" },
                    risk_level: { type: "string", enum: ["low", "medium", "high"], description: "Investment risk level" },
                  },
                  required: ["description_en", "description_ru", "district", "amenities", "muuno_score"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "enrich_project" } },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn("Rate limited, stopping batch");
            break;
          }
          console.error(`AI error for ${project.name_en}:`, response.status);
          continue;
        }

        const aiData = await response.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          console.error(`No tool call for ${project.name_en}`);
          continue;
        }

        const enriched = JSON.parse(toolCall.function.arguments);

        // Build update object — only update missing fields
        const update: Record<string, any> = {};
        if (!project.description_en && enriched.description_en) update.description_en = enriched.description_en;
        if (!project.description_ru && enriched.description_ru) update.description_ru = enriched.description_ru;
        if (project.district === "Phuket" && enriched.district && enriched.district !== "Phuket") update.district = enriched.district;
        if (!project.amenities?.length && enriched.amenities?.length) update.amenities = enriched.amenities;
        if (enriched.muuno_score) update.muuno_score = Math.min(10, Math.max(1, Math.round(enriched.muuno_score)));
        if (enriched.risk_level) update.risk_level = enriched.risk_level;

        if (Object.keys(update).length > 0) {
          const { error: updateError } = await supabase
            .from("property_projects")
            .update(update)
            .eq("id", project.id);

          if (updateError) {
            console.error(`Update failed for ${project.name_en}:`, updateError);
          } else {
            results.push({ id: project.id, name: project.name_en, fieldsUpdated: Object.keys(update) });
          }
        }

        // Small delay between API calls to avoid rate limits
        if (projects.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`Error enriching ${project.name_en}:`, err);
      }
    }

    console.log(`Enriched ${results.length}/${projects.length} projects`);

    return new Response(
      JSON.stringify({ enriched: results.length, total: projects.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Enrich error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
