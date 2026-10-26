import { MANAGED_PROPERTY_DRAFT_FIELDS, MANAGED_PROPERTY_PRICING_FIELDS, MANAGED_PROPERTY_BOOKING_FIELDS } from '@/lib/managedPropertyDraftFields';
import { supabase } from '@/integrations/supabase/client';
import { untypedRpc } from '@/lib/untypedTables';
import type { OwnerProperty } from '@/types/property';
import type { BoundCompanyAccessOperation } from '@/lib/companyAccessOperation';

async function propertyRpc(name: string, args: Record<string, unknown>, operation?: BoundCompanyAccessOperation) {
  operation?.assertCurrent();
  const result = operation ? await operation.client.rpc(name, args) : await untypedRpc(name, args);
  operation?.assertCurrent();
  return result;
}

function assertCompany(companyId: string | undefined, operation?: BoundCompanyAccessOperation) {
  operation?.assertCurrent();
  if (operation && companyId && operation.companyId !== companyId) throw new Error('Property operation belongs to a different company');
}

/** A known inactive shell can be resumed; never create another record on retry. */
export class PropertyDraftSaveError extends Error {
  constructor(public propertyId: string, cause: unknown, public expectedUpdatedAt?: string) {
    super(`Property ${propertyId} was created, but saving its details was not confirmed. Resume this draft rather than creating another. ${cause instanceof Error ? cause.message : ''}`);
    this.name = 'PropertyDraftSaveError';
  }
}

export interface PropertyCreationScope { companyId: string; spaces: Array<{ id: string; name_en: string; name_ru: string }> }

export async function resolveManagedPropertyCreation(operation: BoundCompanyAccessOperation, requestId: string, spaceId: string): Promise<OwnerProperty | null> {
  assertCompany(operation.companyId, operation);
  const { data, error } = await propertyRpc('resolve_managed_property_creation_checked', {
    p_company_id: operation.companyId, p_operating_space_id: spaceId, p_request_id: requestId,
  }, operation);
  if (error) throw new Error(error.message);
  return data === null ? null : managedDraftRow(data, undefined, operation.companyId);
}

export async function readPropertyCreationScope(companyId: string, signal: AbortSignal, operation?: BoundCompanyAccessOperation): Promise<PropertyCreationScope> {
  assertCompany(companyId, operation);
  signal.throwIfAborted();
  const { data, error } = await propertyRpc('list_managed_property_authoring_spaces_checked', { p_company_id: companyId }, operation);
  signal.throwIfAborted();
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || data.some(row => !row || typeof row.id !== 'string' || typeof row.name_en !== 'string' || typeof row.name_ru !== 'string')) throw new Error('Property Operating Spaces could not be verified');
  return { companyId, spaces: data };
}

export function propertyCreationSpace(scope: PropertyCreationScope, selectedSpaceId?: string | null): string {
  const ids = scope.spaces.map(space => space.id);
  if (selectedSpaceId && ids.includes(selectedSpaceId)) return selectedSpaceId;
  if (selectedSpaceId) throw new Error('This Operating Space is no longer authorized');
  if (ids.length === 1) return ids[0];
  throw new Error(ids.length ? 'Select an Operating Space before saving' : 'No Operating Space is assigned. Contact your administrator.');
}

function managedDraftRow(data: unknown, propertyId?: string, companyId?: string): OwnerProperty {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Draft response was not confirmed');
  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.management_company_id !== 'string' || typeof row.updated_at !== 'string' || typeof row.approval_status !== 'string' || typeof row.is_active !== 'boolean' || (propertyId && row.id !== propertyId) || (companyId && row.management_company_id !== companyId)) throw new Error('Draft response does not match this property workspace');
  const fields = new Set<string>([...MANAGED_PROPERTY_DRAFT_FIELDS, 'id', 'management_company_id', 'approval_status', 'is_active', 'created_at', 'updated_at', 'rejection_reason']);
  return Object.fromEntries(Object.entries(row).filter(([key]) => fields.has(key))) as unknown as OwnerProperty;
}

export async function readManagedPropertyDraft(propertyId: string, companyId?: string, operation?: BoundCompanyAccessOperation): Promise<OwnerProperty> {
  assertCompany(companyId, operation);
  const { data, error } = await propertyRpc('read_managed_property_draft_checked', { p_property_id: propertyId }, operation);
  if (error) throw new Error(error.message);
  return managedDraftRow(data, propertyId, companyId ?? operation?.companyId);
}

export async function listManagedPropertyDrafts(companyId: string, offset = 0, limit = 50, operation?: BoundCompanyAccessOperation): Promise<OwnerProperty[]> {
  assertCompany(companyId, operation);
  const { data, error } = await propertyRpc('list_managed_property_drafts_checked', { p_company_id: companyId, p_limit: limit, p_offset: offset }, operation);
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Draft list was not confirmed');
  return data.map(row => managedDraftRow(row, undefined, companyId));
}

export async function saveManagedPropertyDraft(args: {
  propertyId: string; companyId: string; expectedUpdatedAt: string; patch: Record<string, unknown>; submit?: boolean;
  operation?: BoundCompanyAccessOperation;
}): Promise<OwnerProperty> {
  assertCompany(args.companyId, args.operation);
  const { data, error } = await propertyRpc('save_managed_property_draft_checked', {
    p_property_id: args.propertyId,
    p_expected_updated_at: args.expectedUpdatedAt,
    p_patch: propertyAuthoringPatch(args.patch),
    p_submit: args.submit === true,
  }, args.operation);
  if (error) throw new Error(error.message);
  // Save returns its safe canonical projection in the same transaction. No
  // broad properties read or manager assignment is needed to edit content.
  const saved = managedDraftRow(data, args.propertyId, args.companyId);
  if (saved.is_active || saved.approval_status !== (args.submit ? 'pending' : 'draft')) throw new Error('The expected draft or review transition was not confirmed. Reload before retrying.');
  return saved;
}

export async function createManagedPropertyDraft(args: {
  companyId: string; operatingSpaceId?: string | null; patch: Record<string, unknown>;
  requestId?: string | ((spaceId: string) => string | Promise<string>); operation?: BoundCompanyAccessOperation;
}): Promise<OwnerProperty> {
  assertCompany(args.companyId, args.operation);
  if (args.requestId && !args.operation) throw new Error('Verified account operation required for retry-safe creation');
  // Revalidate at action time. Query cache and selected Space are never authority.
  const scope = await readPropertyCreationScope(args.companyId, new AbortController().signal, args.operation);
  const spaceId = propertyCreationSpace(scope, args.operatingSpaceId);
  if (args.requestId) {
    const requestId = typeof args.requestId === 'function' ? await args.requestId(spaceId) : args.requestId;
    const { data, error } = await propertyRpc('create_managed_property_idempotent_checked', {
      p_company_id: args.companyId, p_operating_space_id: spaceId, p_request_id: requestId,
      p_patch: propertyAuthoringPatch(args.patch),
    }, args.operation);
    if (error) throw new Error(error.message);
    const result = managedDraftRow(data, undefined, args.companyId);
    if (result.is_active || result.approval_status !== 'draft') throw new Error('Creation request already resolved to a noneditable property. Reopen it from the property list.');
    return result;
  }
  const { data: propertyId, error } = await propertyRpc('create_managed_property_checked', {
    p_company_id: args.companyId, p_operating_space_id: spaceId,
    p_title_en: args.patch.title_en, p_title_ru: args.patch.title_ru,
    p_property_type: args.patch.property_type || 'apartment', p_listing_type: args.patch.listing_type || 'rent',
  }, args.operation);
  if (error) throw new Error(error.message);
  if (typeof propertyId !== 'string' || !propertyId) throw new Error('Property creation was not confirmed. Check the property list before retrying.');
  let shellVersion: string | undefined;
  try {
    const shell = await readManagedPropertyDraft(propertyId, args.companyId, args.operation);
    shellVersion = shell.updated_at;
    return await saveManagedPropertyDraft({ propertyId, companyId: args.companyId, expectedUpdatedAt: shell.updated_at, patch: args.patch, operation: args.operation });
  } catch (error) {
    throw new PropertyDraftSaveError(propertyId, error, shellVersion);
  }
}

/** Review state and authority fields are RPC inputs, never editable form fields. */
export function propertyAuthoringPatch(data: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set<string>(MANAGED_PROPERTY_DRAFT_FIELDS);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

export interface PropertyAuthoringCapabilities { pricing: boolean; bookings: boolean }

/** UI affordances only; the RPC independently checks stored action grants. */
export function editablePropertyAuthoringPatch(data: Record<string, unknown>, capabilities: PropertyAuthoringCapabilities) {
  const pricing = new Set<string>(MANAGED_PROPERTY_PRICING_FIELDS);
  const bookings = new Set<string>(MANAGED_PROPERTY_BOOKING_FIELDS);
  return Object.fromEntries(Object.entries(propertyAuthoringPatch(data)).filter(([key]) =>
    (capabilities.pricing || !pricing.has(key)) && (capabilities.bookings || !bookings.has(key))));
}

/** Compare normalized form payloads, not DB values to UI defaults. */
export function propertyAuthoringDelta(next: Record<string, unknown>, previous: Record<string, unknown>) {
  const current = propertyAuthoringPatch(next);
  const baseline = propertyAuthoringPatch(previous);
  return Object.fromEntries([...new Set([...Object.keys(current), ...Object.keys(baseline)])]
    .filter(key => JSON.stringify(current[key]) !== JSON.stringify(baseline[key]))
    .map(key => [key, current[key] === undefined ? null : current[key]]));
}

/** Existing provider authority is an exact stored ID relation, never a persona. */
export async function isIndependentPropertyProvider(providerId: string | null | undefined, userId: string): Promise<boolean> {
  if (!providerId) return false;
  if (providerId === userId) return true;
  const { data, error } = await supabase.from('providers').select('id').eq('id', providerId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Exact independent rights precede the employee workflow; never query all company rows. */
export async function readIndependentPropertyForAuthoring(propertyId: string, userId: string, isAdmin: boolean): Promise<OwnerProperty | null> {
  let ownerQuery = supabase.from('properties').select('*').eq('id', propertyId);
  if (!isAdmin) ownerQuery = ownerQuery.eq('owner_id', userId);
  const owned = await ownerQuery.maybeSingle();
  if (owned.error) throw owned.error;
  if (owned.data) return owned.data as unknown as OwnerProperty;
  const providers = await supabase.from('providers').select('id').eq('user_id', userId);
  if (providers.error) throw providers.error;
  const ids = [...new Set([userId, ...(providers.data || []).map(provider => provider.id)])];
  const property = await supabase.from('properties').select('*').eq('id', propertyId).in('provider_id', ids).maybeSingle();
  if (property.error) throw property.error;
  return property.data as unknown as OwnerProperty | null;
}
