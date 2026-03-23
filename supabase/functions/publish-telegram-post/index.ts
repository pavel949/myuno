import { createServiceClient } from "../_shared/supabase.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    const { content, image_url, channel_id, post_id } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetChannel = channel_id || Deno.env.get("TELEGRAM_CHANNEL_ID") || "";
    if (!targetChannel) {
      throw new Error("No channel_id provided and TELEGRAM_CHANNEL_ID not configured");
    }

    const supabase = createServiceClient();
    let telegramMessageId: string | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      let result;

      if (image_url) {
        // Send photo with caption
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        const response = await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChannel,
            photo: image_url,
            caption: content,
            parse_mode: "HTML",
          }),
        });
        result = await response.json();
      } else {
        // Send text message
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChannel,
            text: content,
            parse_mode: "HTML",
            disable_web_page_preview: false,
          }),
        });
        result = await response.json();
      }

      if (result.ok) {
        telegramMessageId = String(result.result.message_id);
        success = true;
      } else {
        errorMessage = result.description || "Telegram API error";
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    // Log to social_posts
    const { data: postRecord } = await supabase.from("social_posts").insert({
      platform: "telegram",
      channel_id: targetChannel,
      message_id: telegramMessageId,
      content,
      image_url,
      post_type: post_id ? "scheduled" : "manual",
      status: success ? "published" : "failed",
      published_at: success ? new Date().toISOString() : null,
      error_message: errorMessage,
    }).select("id").single();

    // Update content calendar entry if post_id provided
    if (post_id && postRecord) {
      await supabase
        .from("social_content_calendar")
        .update({
          status: success ? "published" : "failed",
          post_id: postRecord.id,
        })
        .eq("id", post_id);
    }

    // Log AI decision
    await supabase.from("ai_decisions_log").insert({
      agent_slug: "content-planner",
      decision_type: "social_publish",
      entity_type: "social_post",
      entity_id: postRecord?.id,
      output_data: { telegram_message_id: telegramMessageId, channel: targetChannel },
      status: success ? "success" : "error",
      error_message: errorMessage,
    });

    return new Response(
      JSON.stringify({
        success,
        message_id: telegramMessageId,
        post_id: postRecord?.id,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("publish-telegram-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
