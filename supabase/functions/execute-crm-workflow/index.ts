/**
 * execute-crm-workflow
 * Receives CRM trigger events and executes matching workflow actions.
 * Called internally (e.g. from DB triggers or other edge functions).
 */
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TriggerPayload {
  trigger_type: string; // e.g. 'deal_created', 'deal_stage_changed', 'contact_created'
  company_id: string;
  entity_id: string;
  entity_type: string; // 'deal' | 'contact'
  metadata?: Record<string, any>; // e.g. { stage_from, stage_to }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TriggerPayload = await req.json();
    const { trigger_type, company_id, entity_id, entity_type, metadata } = payload;

    if (!trigger_type || !company_id || !entity_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: trigger_type, company_id, entity_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createServiceClient();
    const results = { matched: 0, executed: 0, errors: 0 };

    // 1. Find active workflows matching this trigger
    const { data: workflows, error: wfError } = await supabase
      .from("crm_workflows")
      .select("*")
      .eq("company_id", company_id)
      .eq("trigger_type", trigger_type)
      .eq("is_active", true);

    if (wfError) {
      console.error("[EXECUTE-CRM-WORKFLOW] Fetch workflows error:", wfError);
      throw wfError;
    }

    if (!workflows || workflows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No matching workflows", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    results.matched = workflows.length;
    console.log(`[EXECUTE-CRM-WORKFLOW] Found ${workflows.length} workflows for trigger '${trigger_type}'`);

    // 2. For each workflow, fetch and execute actions
    for (const wf of workflows) {
      // Check trigger_config conditions if any
      if (wf.trigger_config && Object.keys(wf.trigger_config).length > 0) {
        if (!matchesTriggerConfig(wf.trigger_config, metadata)) {
          console.log(`[EXECUTE-CRM-WORKFLOW] Workflow ${wf.id} trigger config did not match, skipping`);
          continue;
        }
      }

      const { data: actions, error: actError } = await supabase
        .from("crm_workflow_actions")
        .select("*")
        .eq("workflow_id", wf.id)
        .order("action_order");

      if (actError) {
        console.error(`[EXECUTE-CRM-WORKFLOW] Fetch actions for ${wf.id}:`, actError);
        results.errors++;
        continue;
      }

      // Execute each action sequentially
      for (const action of (actions || [])) {
        try {
          await executeAction(supabase, action, {
            entity_id,
            entity_type,
            company_id,
            trigger_type,
            metadata: metadata || {},
            workflow_id: wf.id,
            created_by: wf.created_by,
          });
          results.executed++;
        } catch (err) {
          console.error(`[EXECUTE-CRM-WORKFLOW] Action ${action.id} error:`, err);
          results.errors++;
        }
      }

      // Log workflow execution
      await supabase.from("crm_activities").insert({
        company_id,
        contact_id: entity_type === "contact" ? entity_id : null,
        deal_id: entity_type === "deal" ? entity_id : null,
        activity_type: "workflow_executed",
        description: `Workflow "${wf.name}" triggered by ${trigger_type}`,
        performed_by: wf.created_by,
      }).then(({ error }) => {
        if (error) console.warn("[EXECUTE-CRM-WORKFLOW] Activity log error:", error);
      });
    }

    console.log(`[EXECUTE-CRM-WORKFLOW] Done:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[EXECUTE-CRM-WORKFLOW] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/** Resolve contact_id and to_email for send_email action */
async function resolveEmailRecipient(
  supabase: any,
  context: { entity_id: string; entity_type: string; company_id: string }
): Promise<{ to_email?: string; contact_id?: string; deal_id?: string | null; company_id?: string }> {
  if (context.entity_type === "contact") {
    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, email")
      .eq("id", context.entity_id)
      .single();
    return contact?.email
      ? { to_email: contact.email, contact_id: contact.id, deal_id: null, company_id: context.company_id }
      : {};
  }
  if (context.entity_type === "deal") {
    const { data: deal } = await supabase
      .from("agent_deals")
      .select("id, contact_id, client_email")
      .eq("id", context.entity_id)
      .single();
    if (!deal) return {};
    const email = deal.client_email;
    if (email) return { to_email: email, contact_id: deal.contact_id, deal_id: deal.id, company_id: context.company_id };
    if (deal.contact_id) {
      const { data: contact } = await supabase
        .from("crm_contacts")
        .select("id, email")
        .eq("id", deal.contact_id)
        .single();
      return contact?.email
        ? { to_email: contact.email, contact_id: contact.id, deal_id: deal.id, company_id: context.company_id }
        : {};
    }
  }
  return {};
}

/** Check if trigger metadata matches workflow trigger_config conditions */
function matchesTriggerConfig(config: Record<string, any>, metadata?: Record<string, any>): boolean {
  if (!metadata) return false;
  // Support stage_to filter: { stage_to: "closed_won" }
  if (config.stage_to && metadata.stage_to !== config.stage_to) return false;
  // Support stage_from filter
  if (config.stage_from && metadata.stage_from !== config.stage_from) return false;
  // Support deal_type filter
  if (config.deal_type && metadata.deal_type !== config.deal_type) return false;
  return true;
}

/** Execute a single workflow action */
async function executeAction(
  supabase: any,
  action: any,
  context: {
    entity_id: string;
    entity_type: string;
    company_id: string;
    trigger_type: string;
    metadata: Record<string, any>;
    workflow_id: string;
    created_by: string;
  }
) {
  const config = action.action_config || {};

  // If action has a delay, we just log it (real delay would need a scheduler)
  if (action.delay_minutes > 0) {
    console.log(`[EXECUTE-CRM-WORKFLOW] Action ${action.id} has ${action.delay_minutes}min delay — executing immediately (scheduler TODO)`);
  }

  switch (action.action_type) {
    case "create_task": {
      await supabase.from("crm_tasks").insert({
        company_id: context.company_id,
        contact_id: context.entity_type === "contact" ? context.entity_id : null,
        deal_id: context.entity_type === "deal" ? context.entity_id : null,
        title: config.task_title || `Auto-task from workflow`,
        description: config.task_description || null,
        assigned_to: config.assigned_to || context.created_by,
        due_date: config.due_days
          ? new Date(Date.now() + config.due_days * 86400000).toISOString()
          : null,
        priority: config.priority || "medium",
        status: "pending",
        created_by: context.created_by,
      });
      console.log(`[EXECUTE-CRM-WORKFLOW] Created task for ${context.entity_type} ${context.entity_id}`);
      break;
    }

    case "update_field": {
      const table = context.entity_type === "deal" ? "agent_deals" : "crm_contacts";
      const updates: Record<string, any> = {};
      if (config.field_name && config.field_value !== undefined) {
        updates[config.field_name] = config.field_value;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from(table).update(updates).eq("id", context.entity_id);
        console.log(`[EXECUTE-CRM-WORKFLOW] Updated ${config.field_name} on ${table}`);
      }
      break;
    }

    case "send_notification": {
      // Insert into a notifications mechanism (using crm_activities as log)
      await supabase.from("crm_activities").insert({
        company_id: context.company_id,
        contact_id: context.entity_type === "contact" ? context.entity_id : null,
        deal_id: context.entity_type === "deal" ? context.entity_id : null,
        activity_type: "notification",
        description: config.message || `Workflow notification: ${context.trigger_type}`,
        performed_by: context.created_by,
      });
      console.log(`[EXECUTE-CRM-WORKFLOW] Sent notification`);
      break;
    }

    case "send_email": {
      if (!config.subject && !config.body && !config.template_id) break;
      const { to_email, contact_id, deal_id, company_id } = await resolveEmailRecipient(supabase, context);
      if (!to_email || !contact_id) {
        console.warn(`[EXECUTE-CRM-WORKFLOW] No email recipient for ${context.entity_type} ${context.entity_id}, skipping send_email`);
        break;
      }
      const bodyHtml = config.body ? `<p>${String(config.body).replace(/\n/g, "</p><p>")}</p>` : "<p>Automated CRM email</p>";
      await supabase.functions.invoke("send-crm-email", {
        body: {
          workflow_send: true,
          company_id: company_id || context.company_id,
          contact_id,
          deal_id: context.entity_type === "deal" ? context.entity_id : null,
          to_email,
          subject: config.subject || "Automated CRM email",
          body_html: bodyHtml,
          sent_by: context.created_by,
        },
        headers: {
          "X-Internal-Secret": Deno.env.get("INTERNAL_SECRET") || "",
        },
      });
      console.log(`[EXECUTE-CRM-WORKFLOW] Sent email to ${to_email}`);
      break;
    }

    case "assign_owner": {
      if (config.owner_id) {
        const table = context.entity_type === "deal" ? "agent_deals" : "crm_contacts";
        const field = context.entity_type === "deal" ? "agent_id" : "created_by";
        await supabase.from(table).update({ [field]: config.owner_id }).eq("id", context.entity_id);
        console.log(`[EXECUTE-CRM-WORKFLOW] Assigned owner ${config.owner_id}`);
      }
      break;
    }

    case "webhook": {
      if (config.url) {
        const resp = await fetch(config.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trigger: context.trigger_type,
            entity_id: context.entity_id,
            entity_type: context.entity_type,
            metadata: context.metadata,
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(8000),
        });
        console.log(`[EXECUTE-CRM-WORKFLOW] Webhook ${config.url} -> ${resp.status}`);
        await resp.text(); // consume body
      }
      break;
    }

    default:
      console.log(`[EXECUTE-CRM-WORKFLOW] Unknown action type: ${action.action_type}`);
  }
}
