/**
 * Canonical real-estate model — inventory vs operations vs transaction parties.
 * Inventory: Developer → Project → Unit inventory → Listing (public catalog).
 * Operations: Owner (properties.owner_id), ManagementCompany (management_company_id), Juristic/CAM on project.
 * Transaction: Buyer, Tenant, Investor, Lead — bound to orders/bookings/deals, not to the inventory tree.
 */

/** Nodes in the static catalog / ownership graph */
export type InventoryChainRole = 'developer' | 'project' | 'unit' | 'listing';

/** Shared lifecycle enum for property_projects.project_status */
export type ProjectLifecycleStatus = 'offplan' | 'under_construction' | 'completed';

/** Who operates the asset (exploitation / legal / PM) */
export type OperationsRole = 'owner' | 'management_company' | 'juristic';

/** Parties in a deal or booking (time-bound) */
export type TransactionPartyRole = 'buyer' | 'tenant' | 'investor' | 'lead' | 'agent';

/**
 * Moderated public catalog rows — properties, listings, and other tables using approval_status.
 * Single string across the app for RLS/query filters.
 */
export const PUBLIC_CATALOG_APPROVAL_STATUS = 'approved' as const;

/** @deprecated Use PUBLIC_CATALOG_APPROVAL_STATUS */
export const PUBLIC_PROPERTY_APPROVAL_STATUS = PUBLIC_CATALOG_APPROVAL_STATUS;

export function isPublicListingApproved(approvalStatus: string | null | undefined): boolean {
  return approvalStatus === PUBLIC_CATALOG_APPROVAL_STATUS;
}
