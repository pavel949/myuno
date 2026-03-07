/**
 * LifeOS AI Fix — applies targeted fixes based on AI analyst suggestions
 * AUTH_REQUIRED: Admin-only. Requires `admin` role verified server-side.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FixRequest {
  suggestion: {
    suggestion_type: "coverage" | "mapping" | "hygiene" | "risk";
    affected_life_situation: string | null;
    entity_type: string | null;
    entity_id: string | null;
    entity_title: string | null;
    reason: string;
    impact_level: "LOW" | "MEDIUM" | "HIGH";
    recommended_human_action: string;
    governance_conflict: string | null;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };
  language?: "en" | "ru";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  const userId = authResult.user.id;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { suggestion, language = "en" } = await req.json() as FixRequest;
    const isRu = language === "ru";

    if (!suggestion) {
      return new Response(
        JSON.stringify({ error: "Suggestion is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Block fixing if governance conflict exists
    if (suggestion.governance_conflict) {
      return new Response(
        JSON.stringify({
          success: false,
          error: isRu
            ? `Невозможно применить: конфликт с правилами — ${suggestion.governance_conflict}`
            : `Cannot apply: governance conflict — ${suggestion.governance_conflict}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[LIFEOS-FIX] Type: ${suggestion.suggestion_type}, Entity: ${suggestion.entity_id || 'N/A'}`);

    const actions: string[] = [];
    let success = true;

    // Route fix by suggestion type
    switch (suggestion.suggestion_type) {
      case "coverage": {
        // Coverage gaps → create missing mappings
        if (suggestion.affected_life_situation && suggestion.entity_id && suggestion.entity_type) {
          const { data: situation } = await supabase
            .from("life_situations")
            .select("id")
            .eq("code", suggestion.affected_life_situation)
            .eq("is_active", true)
            .maybeSingle();

          if (situation) {
            // Check if mapping already exists
            const { data: existing } = await supabase
              .from("catalog_life_map")
              .select("id")
              .eq("life_situation_id", situation.id)
              .eq("entity_type", suggestion.entity_type)
              .eq("entity_id", suggestion.entity_id)
              .maybeSingle();

            if (!existing) {
              const { error: insertErr } = await supabase
                .from("catalog_life_map")
                .insert({
                  life_situation_id: situation.id,
                  entity_type: suggestion.entity_type,
                  entity_id: suggestion.entity_id,
                  weight: 50,
                  is_primary: false,
                  added_by: userId,
                });

              if (insertErr) {
                console.error("[LIFEOS-FIX] Insert mapping error:", insertErr);
                success = false;
                actions.push(isRu ? `Ошибка создания маппинга: ${insertErr.message}` : `Failed to create mapping: ${insertErr.message}`);
              } else {
                actions.push(isRu
                  ? `Создан маппинг: ${suggestion.entity_title || suggestion.entity_id} → ${suggestion.affected_life_situation}`
                  : `Created mapping: ${suggestion.entity_title || suggestion.entity_id} → ${suggestion.affected_life_situation}`);
              }
            } else {
              actions.push(isRu ? "Маппинг уже существует" : "Mapping already exists");
            }
          } else {
            success = false;
            actions.push(isRu ? "Ситуация не найдена" : "Life situation not found");
          }
        } else {
          success = false;
          actions.push(isRu
            ? "Недостаточно данных для создания маппинга (нужны: ситуация, тип, ID)"
            : "Insufficient data to create mapping (need: situation, type, ID)");
        }
        break;
      }

      case "mapping": {
        // Mapping suggestions → adjust weights or add mappings
        if (suggestion.entity_id && suggestion.affected_life_situation) {
          const { data: situation } = await supabase
            .from("life_situations")
            .select("id")
            .eq("code", suggestion.affected_life_situation)
            .eq("is_active", true)
            .maybeSingle();

          if (situation) {
            const { data: existing } = await supabase
              .from("catalog_life_map")
              .select("id, weight, is_primary")
              .eq("life_situation_id", situation.id)
              .eq("entity_id", suggestion.entity_id)
              .maybeSingle();

            if (existing) {
              // Adjust weight based on recommended action keywords
              const action = suggestion.recommended_human_action.toLowerCase();
              let newWeight = existing.weight;
              let newPrimary = existing.is_primary;

              if (action.includes("increase") || action.includes("увелич") || action.includes("повыс")) {
                newWeight = Math.min((existing.weight || 50) + 10, 85);
              } else if (action.includes("decrease") || action.includes("уменьш") || action.includes("сниз")) {
                newWeight = Math.max((existing.weight || 50) - 10, 30);
              }
              if (action.includes("primary") || action.includes("основн")) {
                newPrimary = true;
              }

              const { error: updateErr } = await supabase
                .from("catalog_life_map")
                .update({ weight: newWeight, is_primary: newPrimary })
                .eq("id", existing.id);

              if (updateErr) {
                success = false;
                actions.push(isRu ? `Ошибка обновления: ${updateErr.message}` : `Update failed: ${updateErr.message}`);
              } else {
                actions.push(isRu
                  ? `Обновлён вес маппинга: ${existing.weight} → ${newWeight}`
                  : `Updated mapping weight: ${existing.weight} → ${newWeight}`);
              }
            } else {
              // Create new mapping as secondary
              const { error: insertErr } = await supabase
                .from("catalog_life_map")
                .insert({
                  life_situation_id: situation.id,
                  entity_type: suggestion.entity_type || "experience",
                  entity_id: suggestion.entity_id,
                  weight: 50,
                  is_primary: false,
                  added_by: userId,
                });

              if (insertErr) {
                success = false;
                actions.push(isRu ? `Ошибка: ${insertErr.message}` : `Error: ${insertErr.message}`);
              } else {
                actions.push(isRu
                  ? `Создан новый маппинг (вес 50, вторичный)`
                  : `Created new mapping (weight 50, secondary)`);
              }
            }
          } else {
            success = false;
            actions.push(isRu ? "Ситуация не найдена" : "Situation not found");
          }
        } else {
          success = false;
          actions.push(isRu
            ? "Недостаточно данных для корректировки маппинга"
            : "Insufficient data for mapping adjustment");
        }
        break;
      }

      case "hygiene": {
        // Catalog hygiene → deactivate duplicates or flag missing data
        if (suggestion.entity_id && suggestion.entity_type) {
          const action = suggestion.recommended_human_action.toLowerCase();
          const isDeactivate = action.includes("deactivat") || action.includes("удали") || action.includes("деактив") || action.includes("duplicate") || action.includes("дублик");

          if (isDeactivate) {
            const table = getTableForEntityType(suggestion.entity_type);
            if (table) {
              const { error: updateErr } = await supabase
                .from(table)
                .update({ is_active: false })
                .eq("id", suggestion.entity_id);

              if (updateErr) {
                success = false;
                actions.push(isRu ? `Ошибка деактивации: ${updateErr.message}` : `Deactivation error: ${updateErr.message}`);
              } else {
                actions.push(isRu
                  ? `Деактивирован: ${suggestion.entity_title || suggestion.entity_id}`
                  : `Deactivated: ${suggestion.entity_title || suggestion.entity_id}`);
              }
            } else {
              success = false;
              actions.push(isRu ? `Неизвестный тип сущности: ${suggestion.entity_type}` : `Unknown entity type: ${suggestion.entity_type}`);
            }
          } else {
            // Flag for review — just log it
            actions.push(isRu
              ? `Помечено для ручной проверки: ${suggestion.entity_title || suggestion.entity_id}`
              : `Flagged for manual review: ${suggestion.entity_title || suggestion.entity_id}`);
          }
        } else {
          success = false;
          actions.push(isRu
            ? "Недостаточно данных для гигиены каталога"
            : "Insufficient data for catalog hygiene fix");
        }
        break;
      }

      case "risk": {
        // Provider risks → can't auto-fix, just acknowledge
        actions.push(isRu
          ? "Риски провайдеров требуют ручной работы. Рекомендация сохранена в журнал."
          : "Provider risks require manual intervention. Recommendation logged.");
        break;
      }
    }

    // Log to admin audit
    await supabase.from("admin_audit_logs").insert({
      admin_id: userId,
      action: `lifeos_ai_fix_${suggestion.suggestion_type}`,
      entity_type: suggestion.entity_type || "lifeos",
      entity_id: suggestion.entity_id,
      new_data: { suggestion, actions, success },
    });

    console.log(`[LIFEOS-FIX] Done. Success: ${success}, Actions: ${actions.length}`);

    return new Response(
      JSON.stringify({ success, actions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[LIFEOS-FIX] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getTableForEntityType(entityType: string): string | null {
  const map: Record<string, string> = {
    experience: "experiences",
    property: "properties",
    vehicle: "vehicles",
    service: "services",
    bouquet: "bouquets",
    yacht: "yachts",
    education: "education_providers",
  };
  return map[entityType] || null;
}
