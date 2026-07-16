/**
 * Lead Machine · A1 — promotion bridge.
 *
 * Discovery/scoring writes `vendor_prospects`; the outreach sender
 * (`vendor-outreach-agent`) reads `crm_contacts (contact_type='vendor')` scoped
 * to the house management company. Nothing connected them. `promoteVendorProspect`
 * is that connective tissue: it upserts a house-scoped vendor `crm_contacts` row
 * and links it back on the prospect. It NEVER grants a role — activation still
 * flows through the partner_applications moderation queue.
 */

import { type SupabaseClient } from "./supabase.ts";

export interface PromotableProspect {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  category: string | null;
  crm_contact_id?: string | null;
}

export interface PromotionResult {
  contactId: string;
  created: boolean;
  skipped?: "already_promoted" | "no_house_company" | "no_contact_point";
}

/** Resolve the house MC id (the platform's own book of vendor contacts). */
async function getHouseCompanyId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("management_companies")
    .select("id")
    .eq("slug", "myuno-house")
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Promote one vendor prospect into a house-scoped crm_contacts vendor row.
 * Idempotent: re-running returns the existing contact. Dedups by email/phone
 * within the house company.
 */
export async function promoteVendorProspect(
  supabase: SupabaseClient,
  prospect: PromotableProspect,
): Promise<PromotionResult> {
  if (prospect.crm_contact_id) {
    return { contactId: prospect.crm_contact_id, created: false, skipped: "already_promoted" };
  }

  const email = prospect.email?.trim().toLowerCase() || null;
  const phone = (prospect.phone || prospect.whatsapp || "").trim() || null;
  if (!email && !phone) {
    return { contactId: "", created: false, skipped: "no_contact_point" };
  }

  const houseCompanyId = await getHouseCompanyId(supabase);
  if (!houseCompanyId) {
    return { contactId: "", created: false, skipped: "no_house_company" };
  }

  // Dedup within the house book by email or phone.
  let existingId: string | null = null;
  const ors: string[] = [];
  if (email) ors.push(`email.eq.${email}`);
  if (phone) ors.push(`phone.eq.${phone}`);
  const { data: existing } = await supabase
    .from("crm_contacts")
    .select("id, outreach_status")
    .eq("company_id", houseCompanyId)
    .or(ors.join(","))
    .limit(1)
    .maybeSingle();
  existingId = (existing?.id as string | undefined) ?? null;

  let contactId = existingId;
  let created = false;

  if (existingId) {
    // Make sure an existing row is a vendor and eligible for outreach.
    const patch: Record<string, unknown> = { contact_type: "vendor" };
    if (!existing?.outreach_status) patch.outreach_status = "not_contacted";
    await supabase.from("crm_contacts").update(patch).eq("id", existingId);
  } else {
    const { data: inserted, error } = await supabase
      .from("crm_contacts")
      .insert({
        company_id: houseCompanyId,
        contact_type: "vendor",
        first_name: prospect.contact_name || prospect.business_name || "",
        last_name: "",
        company_name: prospect.business_name,
        email,
        phone,
        category: prospect.category,
        source: "discovery",
        outreach_status: "not_contacted",
        lifecycle_stage: "lead",
      })
      .select("id")
      .single();
    if (error || !inserted?.id) {
      throw error ?? new Error("Failed to create crm_contacts row");
    }
    contactId = inserted.id as string;
    created = true;
  }

  // Link back so re-runs are no-ops and the admin UI can show "promoted".
  await supabase
    .from("vendor_prospects")
    .update({ crm_contact_id: contactId, promoted_at: new Date().toISOString() })
    .eq("id", prospect.id);

  return { contactId: contactId as string, created };
}
