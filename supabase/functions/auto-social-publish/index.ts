import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentHour = now.getUTCHours() + 7; // Thailand UTC+7
    const currentTime = `${String(currentHour % 24).padStart(2, "0")}:00:00`;

    // Find approved posts scheduled for now or past due
    const { data: readyPosts } = await supabase
      .from("social_content_calendar")
      .select("*")
      .eq("status", "approved")
      .lte("scheduled_date", today)
      .lte("scheduled_time", currentTime)
      .order("scheduled_date")
      .order("scheduled_time")
      .limit(5);

    const results = { published: 0, failed: 0, skipped: 0 };

    for (const post of readyPosts || []) {
      try {
        // Publish via the telegram function
        const { data, error } = await supabase.functions.invoke("publish-telegram-post", {
          body: {
            content: post.content,
            image_url: post.image_url,
            post_id: post.id,
          },
        });

        if (error) {
          results.failed++;
          await supabase
            .from("social_content_calendar")
            .update({ status: "failed" })
            .eq("id", post.id);
        } else {
          results.published++;
        }
      } catch {
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, checked_at: now.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("auto-social-publish error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
