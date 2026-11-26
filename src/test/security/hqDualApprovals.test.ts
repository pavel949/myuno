/**
 * Focused security regressions — Round 4A two-person rule
 * (supabase/migrations/20261125120000_hq_dual_approvals.sql).
 *
 * Static assertions on the migration: these guard against regressions that
 * would let a client forge approvals or publish a ClearView rating alone.
 * They are not a substitute for RLS tests against a live database.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20261125120000_hq_dual_approvals.sql', 'utf8');
const fnBody = (name: string) => {
  const start = sql.indexOf(`FUNCTION public.${name}(`);
  expect(start, `${name} defined`).toBeGreaterThan(-1);
  return sql.slice(start, sql.indexOf('$$;', start));
};

describe('hq_dual_approvals security', () => {
  it('enables RLS and grants no client write path', () => {
    expect(sql).toMatch(/ALTER TABLE public\.hq_dual_approvals ENABLE ROW LEVEL SECURITY/);
    expect(sql).not.toMatch(/ON public\.hq_dual_approvals FOR (INSERT|UPDATE|DELETE|ALL)/);
    expect(sql).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE|ALL)[^;]*hq_dual_approvals/i);
  });

  it('reads are limited to admin and finance', () => {
    const policy = sql.slice(sql.indexOf('CREATE POLICY "HQ approvers read approvals"'));
    expect(policy).toMatch(/FOR SELECT\s+TO authenticated/);
    expect(policy).toMatch(/has_role\(auth\.uid\(\), 'admin'::public\.app_role\)/);
    expect(policy).toMatch(/has_role\(auth\.uid\(\), 'finance'::public\.app_role\)/);
  });

  it.each(['hq_can_approve', 'hq_record_approval', 'hq_publish_clearview_report'])(
    '%s is SECURITY DEFINER with a pinned search_path and no anon/PUBLIC execute',
    (name) => {
      const body = fnBody(name);
      expect(body).toMatch(/SECURITY DEFINER/);
      expect(body).toMatch(/SET search_path = public/);
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${name}\\([^)]*\\) FROM PUBLIC, anon;`));
      expect(sql).not.toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${name}\\([^)]*\\) TO (anon|PUBLIC)`));
    },
  );

  it('approver identity is auth.uid(), never a parameter, and every approval is audited', () => {
    const body = fnBody('hq_record_approval');
    expect(body).toMatch(/v_uid UUID := auth\.uid\(\)/);
    expect(body).toMatch(/IF v_uid IS NULL THEN/);
    expect(body).toMatch(/IF NOT public\.hq_can_approve\(_entity_type\)/);
    expect(body).toMatch(/VALUES \(_entity_type, _entity_id, v_uid,/);
    expect(body).toMatch(/INSERT INTO public\.admin_audit_logs/);
  });

  it('publishing needs two distinct admins whose sign-off postdates the last edit', () => {
    const body = fnBody('hq_publish_clearview_report');
    expect(body).toMatch(/hq_can_approve\('clearview_report'\)/);
    expect(body).toMatch(/count\(DISTINCT a\.approver_id\)/);
    expect(body).toMatch(/a\.created_at >= r\.updated_at/);
    expect(body).toMatch(/IF v_count < 2 THEN/);
    expect(body).toMatch(/INSERT INTO public\.admin_audit_logs/);
  });

  it('a trigger blocks direct publishing; only the RPC sets the transaction-local marker', () => {
    const guard = fnBody('hq_guard_clearview_publish');
    expect(guard).toMatch(/NEW\.is_published IS TRUE/);
    expect(guard).toMatch(/current_setting\('hq\.clearview_publish', true\)/);
    expect(guard).toMatch(/RAISE EXCEPTION/);
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE OF is_published ON public\.due_diligence_reports/);
    expect(fnBody('hq_publish_clearview_report')).toMatch(/set_config\('hq\.clearview_publish', 'on', true\)/);
    expect(sql.match(/set_config\('hq\.clearview_publish'/g)).toHaveLength(1);
  });

  it('the client never publishes by direct table update', () => {
    const hook = readFileSync('src/hooks/useClearViewReview.ts', 'utf8');
    expect(hook).toMatch(/untypedRpc\('hq_publish_clearview_report'/);
    expect(hook).not.toMatch(/is_published:\s*true/);
    const report = readFileSync('src/components/newbuilds/ClearViewReport.tsx', 'utf8');
    expect(report).toMatch(/publish: false/);
    expect(report).not.toMatch(/publish: !report\.is_published/);
    const model = readFileSync('src/lib/clearview/reviewModel.ts', 'utf8');
    expect(model).not.toMatch(/is_published/);
  });
});
