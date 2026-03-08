import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWN_SECRETS = [
  { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", description: "Payment processing", url: "https://dashboard.stripe.com/apikeys", managedBy: "manual" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", description: "Webhook signature verification", url: "https://dashboard.stripe.com/webhooks", managedBy: "manual" },
  { key: "RESEND_API_KEY", label: "Resend API Key", description: "Email notifications", url: "https://resend.com/api-keys", managedBy: "manual" },
  { key: "MAPBOX_PUBLIC_TOKEN", label: "Mapbox Public Token", description: "Map rendering (Mapbox)", url: "https://account.mapbox.com/access-tokens", managedBy: "manual" },
  { key: "LOVABLE_API_KEY", label: "Lovable API Key", description: "AI features", url: "", managedBy: "system" },
  { key: "FIRECRAWL_API_KEY", label: "Firecrawl API Key", description: "Web scraping", url: "https://firecrawl.dev", managedBy: "connector" },
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", description: "Telegram bot integration", url: "https://t.me/BotFather", managedBy: "manual" },
  { key: "GOOGLE_MAPS_API_KEY", label: "Google Maps API Key", description: "Google Maps (Places, Geocoding)", url: "https://console.cloud.google.com/apis/credentials", managedBy: "manual" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;

    // Verify admin role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: authResult.user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secrets = KNOWN_SECRETS.map((s) => ({
      ...s,
      configured: !!Deno.env.get(s.key),
    }));

    // Also fetch system_config values
    const { data: configs } = await supabase
      .from("system_config")
      .select("key, value, description, updated_at");

    return new Response(
      JSON.stringify({ secrets, configs: configs || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
