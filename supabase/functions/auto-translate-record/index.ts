// Auto-translate a record's fields into ru/en/th and save into the record's i18n jsonb column.
// Body: { table: 'listings'|'providers'|'marketplace_products'|'services', id: uuid, source_lang: 'ru'|'en'|'th', fields: Record<string,string> }
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TABLES = new Set(["listings", "providers", "marketplace_products", "services", "bouquets"]);
const LANGS = ["ru", "en", "th"] as const;
type Lang = typeof LANGS[number];

const langNames: Record<Lang, string> = {
  ru: "Russian",
  en: "English",
  th: "Thai",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { table, id, source_lang, fields } = await req.json();
    if (!ALLOWED_TABLES.has(table)) {
      return new Response(JSON.stringify({ error: "invalid table" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!id || !source_lang || !LANGS.includes(source_lang) || !fields || typeof fields !== "object") {
      return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const entries = Object.entries(fields).filter(([_, v]) => typeof v === "string" && v.trim());
    if (entries.length === 0) {
      return new Response(JSON.stringify({ ok: true, i18n: { [source_lang]: {} } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const targets = LANGS.filter((l) => l !== source_lang);

    // Build i18n object starting with source
    const i18n: Record<string, Record<string, string>> = {
      [source_lang]: Object.fromEntries(entries),
    };

    // Translate to each target language in parallel
    await Promise.all(
      targets.map(async (target) => {
        const prompt = `Translate the following JSON values from ${langNames[source_lang as Lang]} to ${langNames[target]}.
Respond ONLY with a JSON object using the same keys. Preserve formatting and newlines. Keep brand names untranslated.

Input:
${JSON.stringify(Object.fromEntries(entries), null, 2)}`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a precise translator for a real-estate and lifestyle marketplace in Thailand. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[auto-translate-record] ${target} failed`, res.status, errText);
          if (res.status === 429) throw new Error("rate_limited");
          if (res.status === 402) throw new Error("credits_exhausted");
          throw new Error(`AI gateway ${res.status}`);
        }

        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? "{}";
        try {
          i18n[target] = JSON.parse(content);
        } catch {
          i18n[target] = {};
        }
      })
    );

    // Persist merged i18n. Read-modify-write to preserve previous translations.
    const { data: existing, error: readErr } = await supabase
      .from(table)
      .select("i18n")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;

    const merged = {
      ...(existing?.i18n ?? {}),
      ...i18n,
      _source_lang: source_lang,
      _auto_translated: targets,
      _translated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from(table)
      .update({ i18n: merged })
      .eq("id", id);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ ok: true, i18n: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = message === "rate_limited" ? 429 : message === "credits_exhausted" ? 402 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
