import type { createServiceClient } from "./supabase.ts";

const SENDABLE_STATUSES = new Set(["not_contacted", "contacted", "follow_up_1", "follow_up_2"]);

/** Recheck canonical contact state immediately before generation or delivery.
 * Unknown/error/missing scope or suppression evidence is never permission to send.
 */
export async function vendorOutreachEligible(
  client: ReturnType<typeof createServiceClient>,
  contactId: string,
  companyId: string,
  channel: "email" | "whatsapp",
  destination: string,
): Promise<boolean> {
  if (!contactId || !companyId) return false;
  try {
    const { data, error } = await client.from("crm_contacts")
      .select("outreach_status,email,phone")
      .eq("id", contactId).eq("company_id", companyId).eq("contact_type", "vendor")
      .maybeSingle();
    if (error || !data || !SENDABLE_STATUSES.has(data.outreach_status)) return false;
    if (channel === "whatsapp") return typeof data.phone === "string" && !!data.phone.trim() && data.phone.trim() === destination.trim();
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!email || email !== destination.trim().toLowerCase()) return false;
    const suppression = await client.from("suppressed_emails")
      .select("email").eq("email", email).maybeSingle();
    return !suppression.error && suppression.data === null;
  } catch {
    return false;
  }
}
