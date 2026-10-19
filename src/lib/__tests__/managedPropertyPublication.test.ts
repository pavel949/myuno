import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MANAGED_PROPERTY_DRAFT_FIELDS, MANAGED_PROPERTY_PRICING_FIELDS, MANAGED_PROPERTY_BOOKING_FIELDS } from '../managedPropertyDraftFields';

const candidate = () => readFileSync('docs/convergence/employee-property-publication/checked-publication.candidate.sql', 'utf8');

describe('managed publication source contract (not database execution)', () => {
  it('has a unique allowlist composed only of existing canonical property fields', () => {
    expect(new Set(MANAGED_PROPERTY_DRAFT_FIELDS).size).toBe(MANAGED_PROPERTY_DRAFT_FIELDS.length);
    const types = readFileSync('src/integrations/supabase/types.ts', 'utf8');
    const row = types.slice(types.indexOf('      properties: {')).split('        Insert: {')[0];
    for (const field of MANAGED_PROPERTY_DRAFT_FIELDS) expect(row).toMatch(new RegExp(`\\n          ${field}:`));
  });
  it.each(['id', 'content_author_user_id', 'owner_id', 'provider_id', 'management_company_id', 'managed_by', 'managed_by_org_id', 'owner_contact_id', 'approval_status', 'is_active', 'approved_at', 'approved_by', 'reviewed_at', 'reviewed_by', 'rejection_reason', 'ownership_verification_status', 'purchase_price', 'mortgage_amount', 'lock_code', 'ical_token', 'created_at', 'updated_at', 'deleted_at', 'is_verified', 'is_featured', 'rating', 'review_count'])('does not treat %s as draft content', (field) => {
    expect(MANAGED_PROPERTY_DRAFT_FIELDS).not.toContain(field);
  });
  it('keeps the database allowlist identical to the frontend contract', () => {
    const list = candidate().match(/-- BEGIN DRAFT FIELD ALLOWLIST\s*SELECT ARRAY\[([\s\S]*?)\]::text\[\]/)?.[1];
    expect(list).toBeDefined();
    expect([...list!.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1])).toEqual(MANAGED_PROPERTY_DRAFT_FIELDS);
  });
  it.each([['PRICING',MANAGED_PROPERTY_PRICING_FIELDS],['BOOKING',MANAGED_PROPERTY_BOOKING_FIELDS]] as const)('keeps %s capability subsets identical to SQL and inside the draft allowlist', (kind,fields) => {
    const list=candidate().match(new RegExp(`-- BEGIN ${kind} FIELD ALLOWLIST\\s*SELECT ARRAY\\[([\\s\\S]*?)\\]::text\\[\\]`))?.[1];
    expect(list).toBeDefined();
    expect([...list!.matchAll(/'([a-z0-9_]+)'/g)].map(m=>m[1])).toEqual(fields);
    for(const field of fields) expect(MANAGED_PROPERTY_DRAFT_FIELDS).toContain(field);
  });
  it('has no RLS-disable, role creation, assignment seed, migration-journal or grant expansion', () => {
    const sql = candidate();
    expect(sql).not.toMatch(/DISABLE ROW LEVEL SECURITY|CREATE ROLE|ALTER ROLE|GRANT (?:ALL|INSERT|UPDATE|DELETE).*ON.*properties/i);
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).not.toMatch(/INSERT INTO public\.property_manager_assignments|CREATE POLICY[^;]*ON public\.properties\b/);
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('IS DISTINCT FROM p_expected_updated_at');
  });
  it('projects only catalogue and bounded review fields, never an author base-table policy', () => {
    expect(candidate()).toContain('ADD COLUMN content_author_user_id uuid');
    expect(candidate()).toContain("'id','management_company_id','approval_status','is_active','created_at','updated_at','rejection_reason'");
    expect(candidate()).toContain("public.actor_can_author_managed_property(p_property_id,'edit')");
    expect(candidate()).toContain('public.assert_managed_property_draft_change(original,proposed)');
    expect(candidate()).toContain('FROM PUBLIC,anon,authenticated');
  });
  it.each(['checked-publication','platform-admin-authoring-delegation','employee-task-capability','employee-operational-membership'])('wraps every statement of %s in one transaction', name => {
    const sql=readFileSync(`docs/convergence/employee-property-publication/${name}.candidate.sql`,'utf8').replace(/^--.*$/gm,'').trim();
    expect(sql.startsWith('BEGIN;')).toBe(true);
    expect(sql.endsWith('COMMIT;')).toBe(true);
  });
  it('contains the finite operational tables with restrictive action checks and no new permissive policy', () => {
    const sql=readFileSync('docs/convergence/employee-property-publication/employee-operational-membership.candidate.sql','utf8');
    expect(sql.match(/AS RESTRICTIVE FOR/g)).toHaveLength(20);
    expect(sql).not.toMatch(/AS PERMISSIVE|FOR ALL|actor_can_author_managed_property/);
    expect(sql).toContain("company,'properties',p_action");
  });
  it('reserves only the new audit action names and requires cutover for the new platform-admin delegation path', () => {
    expect(candidate()).toContain("action NOT IN ('managed_property_draft_created','managed_property_publication_changed')");
    const sql=readFileSync('docs/convergence/employee-property-publication/platform-admin-authoring-delegation.candidate.sql','utf8');
    expect(sql).toContain('c.operating_spaces_enforced IS TRUE');
  });
  it('rechecks the same object-bound notification gate after persisted readback', () => {
    const edge = readFileSync('supabase/functions/notify-admin-property-submission/index.ts', 'utf8');
    expect(edge.match(/authorizeRpc\(actor, 'actor_can_notify_property_submission'/g)).toHaveLength(2);
    expect(edge).not.toContain('property.owner_id !== auth.user.id');
  });
});
