import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Offline only. Never opens a database, accepts credentials or executes SQL.
const root = new URL('../../', import.meta.url);
const forward = [
  'docs/convergence/mc-authoring-activation/public-property-catalog-readonly.candidate.sql',
  'docs/convergence/employee-property-publication/employee-task-capability.candidate.sql',
  'docs/convergence/employee-property-publication/employee-operational-membership.candidate.sql',
  'docs/convergence/employee-property-publication/checked-publication.candidate.sql',
  'docs/convergence/employee-complex-publication/checked-complex-publication.candidate.sql',
];
const rollback = [
  'docs/hardening/rollback/employee_complex_publication.candidate.sql',
  'docs/hardening/rollback/employee_property_publication.candidate.sql',
];

export function buildActivation(kind = 'forward') {
  if (!['forward', 'rollback'].includes(kind)) throw new Error('Expected forward or rollback');
  const bodies = (kind === 'forward' ? forward : rollback).map(path => {
    const source = readFileSync(new URL(path, root), 'utf8');
    if ((source.match(/^BEGIN;\s*$/gm) || []).length !== 1 ||
        (source.match(/^COMMIT;\s*$/gm) || []).length !== 1) {
      throw new Error(`Unexpected transaction envelope: ${path}`);
    }
    let body = source.replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '').trim();
    if (path.includes('checked-complex-publication')) {
      // Retain historical policy objects while disabling their broad permissive
      // paths. The new checked policies and restrictive ceiling govern access.
      for (const [before, after] of [
        ['DROP POLICY "Public can view active complexes" ON public.property_complexes;',
          'ALTER POLICY "Public can view active complexes" ON public.property_complexes TO authenticated USING(false);'],
        ['DROP POLICY "MC members can manage company complexes" ON public.property_complexes;',
          'ALTER POLICY "MC members can manage company complexes" ON public.property_complexes TO authenticated USING(false) WITH CHECK(false);'],
      ]) {
        if (!body.includes(before)) throw new Error(`Complex policy contract drift: ${before}`);
        body = body.replace(before, after);
      }
    }
    if (kind === 'rollback' && path.endsWith('employee_property_publication.candidate.sql')) {
      // Permission delegation is not part of this activation. Its independently
      // governed policies must not be removed by this tranche's rollback.
      for (const name of ['read', 'insert', 'update']) {
        const statement = `DROP POLICY IF EXISTS platform_admin_${name}_authoring_permissions ON public.team_member_permissions;`;
        if (!body.includes(statement)) throw new Error(`Delegation rollback contract drift: ${name}`);
        body = body.replace(statement, '');
      }
    }
    return `-- Source: ${path}\n-- SHA256: ${createHash('sha256').update(source).digest('hex')}\n` + body;
  });
  return `-- REVIEW CANDIDATE. NO-GO until per-action production approval.\n` +
    `-- Generated offline; one atomic transaction; no permission/member seeds.\n` +
    `BEGIN;\nSET LOCAL lock_timeout = '5s';\nSET LOCAL statement_timeout = '60s';\n` +
    bodies.join('\n\n') + '\nCOMMIT;\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kind, target] = process.argv.slice(2);
  if (!target) throw new Error('Usage: node scripts/db/build-mc-authoring-activation.mjs forward|rollback OUTPUT.sql');
  writeFileSync(target, buildActivation(kind), { flag: 'wx' });
}
