import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all projects with fazwaz cover images
    const { data: projects, error: fetchError } = await supabase
      .from("property_projects")
      .select("id, name_en, cover_image, images")
      .like("cover_image", "%fazwaz%")
      .eq("is_active", true);

    if (fetchError) throw fetchError;
    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No FazWaz images to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; name: string; status: string; newUrl?: string; error?: string }[] = [];

    for (const project of projects) {
      try {
        // Download from FazWaz with browser-like headers
        const response = await fetch(project.cover_image, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://www.fazwaz.com/",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          // Try alternative: use a smaller size URL
          const altUrl = project.cover_image.replace("2850x1515", "800x450");
          const altResponse = await fetch(altUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "Referer": "https://www.fazwaz.com/",
              "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            },
          });

          if (!altResponse.ok) {
            results.push({
              id: project.id,
              name: project.name_en,
              status: "failed",
              error: `HTTP ${response.status} (also tried alt: ${altResponse.status})`,
            });
            continue;
          }

          // Use alt response
          const blob = await altResponse.blob();
          const ext = getExtension(project.cover_image);
          const filePath = `covers/${project.id}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("project-images")
            .upload(filePath, blob, {
              contentType: blob.type || "image/jpeg",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("project-images")
            .getPublicUrl(filePath);

          // Update project cover_image
          await supabase
            .from("property_projects")
            .update({ cover_image: urlData.publicUrl })
            .eq("id", project.id);

          results.push({
            id: project.id,
            name: project.name_en,
            status: "success_alt",
            newUrl: urlData.publicUrl,
          });
          continue;
        }

        const blob = await response.blob();
        const ext = getExtension(project.cover_image);
        const filePath = `covers/${project.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, blob, {
            contentType: blob.type || "image/jpeg",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(filePath);

        // Update project cover_image
        await supabase
          .from("property_projects")
          .update({ cover_image: urlData.publicUrl })
          .eq("id", project.id);

        results.push({
          id: project.id,
          name: project.name_en,
          status: "success",
          newUrl: urlData.publicUrl,
        });
      } catch (err) {
        results.push({
          id: project.id,
          name: project.name_en,
          status: "error",
          error: String(err),
        });
      }
    }

    const succeeded = results.filter((r) => r.status.startsWith("success")).length;
    const failed = results.filter((r) => !r.status.startsWith("success")).length;

    return new Response(
      JSON.stringify({ total: projects.length, succeeded, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getExtension(url: string): string {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif)/i);
  return match ? match[1].toLowerCase() : "jpg";
}
