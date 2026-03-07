import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get bouquet ID from request (optional - process single or all)
    const { bouquetId } = await req.json().catch(() => ({}));

    // Fetch bouquets to process
    let query = supabase
      .from("bouquets")
      .select("id, name_ru, image")
      .eq("is_active", true)
      .not("image", "is", null);

    if (bouquetId) {
      query = query.eq("id", bouquetId);
    }

    const { data: bouquets, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!bouquets || bouquets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No bouquets to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ id: string; name: string; status: string; newUrl?: string }> = [];

    for (const bouquet of bouquets) {
      try {
        console.log(`Processing: ${bouquet.name_ru} (${bouquet.id})`);

        // Check if already processed (stored in our bucket)
        if (bouquet.image?.includes("bouquet-images")) {
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: "already_processed" });
          continue;
        }

        // Call Lovable AI to remove background
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Remove the background from this flower bouquet image completely. Make the background pure white (#FFFFFF). Keep only the flowers/bouquet with no background objects, shadows on the floor, or surrounding elements. The result should be a clean product photo on a pure white background.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: bouquet.image },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${bouquet.id}: ${errText}`);
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: `ai_error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: "no_image_in_response" });
          continue;
        }

        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
        if (!base64Match) {
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: "invalid_base64" });
          continue;
        }

        const mimeType = base64Match[1];
        const base64Data = base64Match[2];

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to storage
        const fileName = `${bouquet.id}.${mimeType === "jpeg" || mimeType === "jpg" ? "jpg" : mimeType}`;
        const { error: uploadError } = await supabase.storage
          .from("bouquet-images")
          .upload(fileName, bytes, {
            contentType: `image/${mimeType}`,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${bouquet.id}:`, uploadError);
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: `upload_error: ${uploadError.message}` });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("bouquet-images")
          .getPublicUrl(fileName);

        const newUrl = publicUrlData.publicUrl;

        // Update bouquet record
        const { error: updateError } = await supabase
          .from("bouquets")
          .update({ image: newUrl })
          .eq("id", bouquet.id);

        if (updateError) {
          results.push({ id: bouquet.id, name: bouquet.name_ru, status: `db_update_error: ${updateError.message}` });
          continue;
        }

        results.push({ id: bouquet.id, name: bouquet.name_ru, status: "success", newUrl });
        console.log(`✅ Done: ${bouquet.name_ru}`);

        // Small delay between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Error processing ${bouquet.id}:`, err);
        results.push({ id: bouquet.id, name: bouquet.name_ru, status: `error: ${String(err)}` });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
