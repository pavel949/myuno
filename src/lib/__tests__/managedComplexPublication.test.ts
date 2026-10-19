import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MANAGED_COMPLEX_DRAFT_FIELDS } from '../managedComplexDraftFields';

const path = 'docs/convergence/employee-complex-publication/checked-complex-publication.candidate.sql';
const sql = readFileSync(path, 'utf8');

describe('managed complex publication source contract (not PostgreSQL execution)', () => {
  it('extends the canonical complex table without a parallel domain or migration journal', () => {
    expect(sql).toContain('ALTER TABLE public.property_complexes');
    expect(sql).not.toMatch(/CREATE TABLE|ALTER TABLE public\.properties\b|ALTER TABLE public\.property_projects\b|INSERT INTO public\.(?:property_manager_assignments|team_member_permissions|operating_space_properties)/i);
    expect(sql).not.toMatch(/DISABLE ROW LEVEL SECURITY|CREATE ROLE|ALTER ROLE|GRANT (?:ALL|INSERT|UPDATE|DELETE).*ON.*property_complexes/i);
  });
  it('matches the exact 20 existing canonical content fields in frontend and SQL', () => {
    expect(MANAGED_COMPLEX_DRAFT_FIELDS).toHaveLength(20);
    expect(new Set(MANAGED_COMPLEX_DRAFT_FIELDS).size).toBe(20);
    const values = sql.match(/-- BEGIN DRAFT FIELD ALLOWLIST\s*SELECT ARRAY\[([\s\S]*?)\]::text\[\]/)?.[1];
    expect([...values!.matchAll(/'([a-z_]+)'/g)].map(match => match[1])).toEqual(MANAGED_COMPLEX_DRAFT_FIELDS);
    const types = readFileSync('src/integrations/supabase/types.ts', 'utf8');
    const row = types.slice(types.indexOf('      property_complexes: {')).split('        Insert: {')[0];
    for (const field of MANAGED_COMPLEX_DRAFT_FIELDS) expect(row).toMatch(new RegExp(`\\n          ${field}:`));
  });
  it.each(['owner_id','content_author_user_id','management_company_id','authoring_space_id','approval_status','is_active','reviewed_by','reviewed_at','approved_by','approved_at','rejection_reason','cam_fee_per_sqm','cam_includes','juristic_person_name','juristic_phone','juristic_email','id','created_at','updated_at'])('never treats %s as editable catalogue content', field => {
    expect(MANAGED_COMPLEX_DRAFT_FIELDS).not.toContain(field);
  });
  it('leaves legacy status NULL and checks owner-null contract without a backfill', () => {
    expect(sql).toContain('ADD COLUMN approval_status text,');
    expect(sql).not.toMatch(/ADD COLUMN approval_status text (?:DEFAULT|NOT NULL)|UPDATE public\.property_complexes SET approval_status='approved'/);
    expect(sql).toContain('ALTER COLUMN owner_id DROP NOT NULL');
    expect(sql).toContain('ADD CONSTRAINT complex_governed_authoring_contract CHECK ((');
    expect(sql).toContain(') IS TRUE);');
    expect(sql).toContain('REFERENCES public.operating_spaces(id,management_company_id) ON DELETE RESTRICT');
  });
  it('requires current author/company/Space/action without widening property authority', () => {
    expect(sql).toContain('c.is_active IS TRUE');
    expect(sql).toContain('sm.operating_space_id=s.id AND sm.is_active IS TRUE');
    expect(sql).toContain("'properties','view'");
    expect(sql).toContain("c.content_author_user_id=auth.uid() OR public.actor_has_platform_admin()");
    expect(sql).not.toMatch(/CREATE POLICY[^;]*ON public\.properties\b/);
    expect(sql).not.toContain("role IN ('admin','uno_team')");
  });
  it('contains the old MC FOR ALL escape and retains verified independent paths', () => {
    expect(sql).toContain('DROP POLICY "MC members can manage company complexes"');
    expect(sql).toContain("public.actor_can_operate_property(p.id,co.id,'properties',p_action) IS NOT TRUE");
    expect(sql).toContain("public.actor_is_operating_company_overseer(co.id)");
    expect(sql).toContain('OLD.owner_id=auth.uid() OR public.actor_has_platform_admin()');
    expect(sql).not.toContain('DROP POLICY "Owner can manage complexes"');
  });
  it('uses safe projections and only approved or legacy active public rows', () => {
    expect(sql).toContain('DROP POLICY "Public can view active complexes"');
    const view = sql.split('CREATE VIEW public.public_complex_catalog')[1].split(';')[0];
    expect(view).toContain("is_active IS TRUE AND (approval_status IS NULL OR approval_status='approved')");
    expect(view).not.toMatch(/owner_id|content_author_user_id|reviewed_by|cam_fee|juristic|management_company_id|authoring_space_id|rejection_reason/);
    expect(sql).toContain("'id','management_company_id','authoring_space_id','approval_status','is_active','created_at','updated_at','rejection_reason'");
  });
  it('checks exact CAS under locks and freezes pending/live content', () => {
    expect(sql.match(/FOR UPDATE;/g)).toHaveLength(2);
    expect(sql.match(/IS DISTINCT FROM p_expected_updated_at/g)).toHaveLength(2);
    expect(sql).toContain("pending and published complex content is frozen");
    expect(sql).toContain("OLD.updated_at+interval '1 microsecond'");
    expect(sql).toContain('to_jsonb(saved)');
    expect(sql).toContain('governed complex content and review require checked RPCs');
  });
  it('parenthesizes CASE operands inside PL/pgSQL IF conditions', () => {
    // PL/pgSQL reads IF expressions until a top-level THEN. Without parentheses,
    // CASE's THEN terminates that expression early (CI: syntax error at end of input).
    const functions = ['create_managed_complex_checked', 'save_managed_complex_draft_checked', 'review_managed_complex_submission_checked'];
    for (const name of functions) {
      const body = sql.split(`CREATE FUNCTION public.${name}(`)[1].split('$$;')[0];
      expect(body).toMatch(/saved\.approval_status IS DISTINCT FROM \(CASE WHEN [^\n]+ END\)/);
      expect(body).not.toMatch(/IS DISTINCT FROM CASE\b/);
    }
  });
  it('provides atomic creation with content and no invented owner', () => {
    const create = sql.split('CREATE FUNCTION public.create_managed_complex_checked')[1].split('CREATE FUNCTION public.save_managed_complex_draft_checked')[0];
    expect(create).toContain('p_patch jsonb,p_submit boolean DEFAULT false');
    expect(create).toContain('SELECT %s,NULL,$2,$3,$4,$5,false');
    expect(create).toContain('RETURN public.managed_complex_draft_projection(saved)');
    expect(create).toContain('PERFORM public.assert_managed_complex_content(saved)');
  });
  it('reserves audit event names and fails closed on rollback', () => {
    expect(sql).toContain("WITH CHECK(action<>'managed_complex_reviewed')");
    expect(sql).toContain("USING(action<>'managed_complex_reviewed')");
    expect(sql).toContain('INSERT INTO public.admin_audit_logs(admin_id,action,entity_type,entity_id,old_data,new_data)');
    expect(sql).not.toContain('security_audit_log');
    const rollback = readFileSync('docs/hardening/rollback/employee_complex_publication.candidate.sql', 'utf8');
    expect(rollback).toContain('REVOKE EXECUTE');
    expect(rollback).not.toMatch(/DROP (?:TABLE|COLUMN|POLICY|TRIGGER)|GRANT/);
  });
  it.each([path,'docs/hardening/rollback/employee_complex_publication.candidate.sql'])('keeps %s transaction wrapped outside active journals', filename => {
    const content = readFileSync(filename, 'utf8').replace(/^--.*$/gm,'').trim();
    expect(content.startsWith('BEGIN;')).toBe(true);
    expect(content.endsWith('COMMIT;')).toBe(true);
  });
});
