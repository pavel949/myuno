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
    expect(sql.match(/AS RESTRICTIVE FOR/g)).toHaveLength(16);
    expect(sql).not.toMatch(/AS PERMISSIVE|FOR ALL|actor_can_author_managed_property/);
    expect(sql).toContain("company,'properties',p_action");
  });
  it('targets exactly the surviving tables and never restores the source-dropped meters domain', () => {
    const dropped=readFileSync('supabase/migrations/20260419023055_eaf755ab-bdb3-4aea-a340-19543b31a835.sql','utf8');
    expect(dropped).toMatch(/DROP TABLE IF EXISTS public\.property_meters\s+CASCADE;/);
    const forward=readFileSync('docs/convergence/employee-property-publication/employee-operational-membership.candidate.sql','utf8');
    const targets=[...forward.matchAll(/CREATE POLICY \w+ ON public\.(\w+)/g)].map(match=>match[1]);
    expect(targets.sort()).toEqual(['inventory_inspections','owner_portal_settings','portal_messages','property_documents'].flatMap(table=>Array(4).fill(table)));
    for(const path of [
      'docs/convergence/employee-property-publication/employee-operational-membership.candidate.sql',
      'docs/hardening/rollback/employee_property_publication.candidate.sql',
      'src/lib/__tests__/fixtures/managed-property-publication-base.sql',
    ]) {
      const sql=readFileSync(path,'utf8').replace(/^--.*$/gm,'');
      expect(sql).not.toMatch(/\bproperty_meters\b/i);
    }
  });
  it('models every legacy publisher target without inventing missing canonical owner-view fields', () => {
    const source=readFileSync('supabase/migrations/20260122090230_e71787be-8a4c-4a8c-aba1-52358bf0803a.sql','utf8');
    const publisher=source.slice(0,source.indexOf('-- Function to handle auto-publish'));
    const viewSource=readFileSync('supabase/migrations/20260228013925_c84e0fbe-3bce-42ae-85be-05cfdf40ad3d.sql','utf8');
    const fields=viewSource.match(/SELECT([\s\S]*?)FROM properties;/)![1].split(',').map(field=>field.trim().split(/\s+AS\s+/i));
    const base=readFileSync('src/lib/__tests__/fixtures/managed-property-publication-base.sql','utf8').replace(/^\s*--.*$/gm,'');
    const baseFields=base.match(/CREATE TABLE public\.properties\(([\s\S]*?)\n\);/)![1].split(',').map(field=>field.trim().match(/^\w+/)![0]);
    const fixtureColumns=new Set([...baseFields,...fields.map(([column])=>column)]);
    const inserts=publisher.match(/INSERT INTO properties\s*\(([\s\S]*?)\) VALUES/)![1].split(',').map(field=>field.trim());
    const update=publisher.match(/UPDATE properties SET([\s\S]*?)WHERE id = existing_property_id/)![1];
    const updates=[...update.matchAll(/^\s*(\w+)\s*=/gm)].map(match=>match[1]);
    const canonical=readFileSync('src/integrations/supabase/types.ts','utf8').split('      properties: {')[1].split('        Insert: {')[0];
    for(const column of new Set([...inserts,...updates])) {
      expect(fixtureColumns.has(column),`Missing publisher fixture target: ${column}`).toBe(true);
      expect(canonical).toMatch(new RegExp(`\\n          ${column}:`));
    }
    // The read-only 2026-10-19 metadata confirms properties.amenities is text[],
    // while the exact source/live owner view omits it. Do not manufacture a bypass.
    expect(base).toMatch(/\bamenities text\[\]/);
    const viewFields=new Set(fields.map(parts=>parts.at(-1)!));
    const referenced=[...new Set([...publisher.matchAll(/\bop\.(\w+)/g)].map(match=>match[1]))];
    expect(referenced.filter(column=>!viewFields.has(column))).toEqual(['amenities']);
  });
  it('binds fixture revision strings as text before the server timestamp cast', () => {
    for(const suite of ['managedPropertyPublication','managedComplexPublication']) {
      const source=readFileSync(`src/lib/__tests__/${suite}.postgres.test.ts`,'utf8');
      expect(source).not.toMatch(/\$\{[^}]+\}::timestamptz/);
      expect(source).toMatch(/\$\{[^}]+\}::text::timestamptz/);
    }
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
