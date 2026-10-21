import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { listPendingPropertyRevisions, parsePropertyRevisionState, propertyRevisionEditingRow, readPropertyRevision, reviewPropertyRevision, savePropertyRevision } from '../propertyRevisions';
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/untypedTables', () => ({ untypedRpc: mocks.rpc }));
const version = '00000000-0000-4000-8000-000000000001';
const nextVersion = '00000000-0000-4000-8000-000000000002';
const now = '2026-10-19T06:00:00.123456Z';
const next = '2026-10-19T06:00:00.123457Z';
const fixture = () => ({ property: { id: 'property-a', management_company_id: 'company-a', updated_at: now,
  approval_status: 'approved', is_active: true, title_en: 'Live title', owner_id: 'private-owner', lock_code: 'private' },
  revision: { version, status: 'pending', base: { title_en: 'Live title' }, patch: { title_en: 'Proposed title' }, created_at: now, updated_at: now }, conflict: false });
beforeEach(() => vi.clearAllMocks());
describe('published property revision wire contract', () => {
  it('keeps published metadata and proposed content separate while excluding private response fields', () => {
    const state = parsePropertyRevisionState(fixture(), 'property-a', 'company-a');
    expect(state.property.title_en).toBe('Live title');
    expect(propertyRevisionEditingRow(state)).toMatchObject({ title_en: 'Proposed title', approval_status: 'approved', is_active: true });
    expect(state.property).not.toHaveProperty('lock_code');
    expect(state.property).not.toHaveProperty('owner_id');
  });
  it('uses the canonical property after approval instead of resurrecting an old proposed value', () => {
    const data = fixture(); data.revision.status = 'approved'; data.property.title_en = 'Later owner title';
    expect(propertyRevisionEditingRow(parsePropertyRevisionState(data)).title_en).toBe('Later owner title');
  });
  it.each(['id', 'management_company_id', 'is_active', 'approval_status', 'lock_code', 'publication_revision'])('rejects %s injected into proposal content', key => {
    const data = fixture(); (data.revision.patch as Record<string, unknown>)[key] = 'forged';
    expect(() => parsePropertyRevisionState(data)).toThrow(/unsupported/);
  });
  it('rejects wrong property or company and missing conflict evidence', () => {
    expect(() => parsePropertyRevisionState(fixture(), 'other')).toThrow(/match/);
    expect(() => parsePropertyRevisionState(fixture(), undefined, 'other')).toThrow(/match/);
    expect(() => parsePropertyRevisionState({ ...fixture(), conflict: undefined })).toThrow(/match/);
  });
  it('does not fall back to direct property reads if the checked RPC is unavailable', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } });
    await expect(readPropertyRevision('property-a')).rejects.toThrow('RPC unavailable');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('passes exact opaque timestamp and proposal identity when saving; strips protected form fields', async () => {
    const data = fixture(); data.property.updated_at = next; data.revision.version = nextVersion; data.revision.status = 'draft';
    mocks.rpc.mockResolvedValue({ data, error: null });
    await savePropertyRevision({ propertyId: 'property-a', companyId: 'company-a', expectedUpdatedAt: now, expectedRevision: version,
      patch: { title_en: 'Proposed title', is_active: false, approval_status: 'draft' } });
    expect(mocks.rpc).toHaveBeenCalledWith('save_managed_property_revision_checked', {
      p_property_id: 'property-a', p_expected_updated_at: now, p_expected_revision: version,
      p_patch: { title_en: 'Proposed title' }, p_submit: false, p_restart: false,
    });
  });
  it.each(['wrong-status', 'same-version', 'same-time', 'conflict'])('does not report an unconfirmed %s save as success', async issue => {
    const data = fixture(); data.property.updated_at = next; data.revision.version = nextVersion; data.revision.status = 'draft';
    if (issue === 'wrong-status') data.revision.status = 'approved';
    if (issue === 'same-version') data.revision.version = version;
    if (issue === 'same-time') data.property.updated_at = now;
    if (issue === 'conflict') data.conflict = true;
    mocks.rpc.mockResolvedValue({ data, error: null });
    await expect(savePropertyRevision({ propertyId: 'property-a', companyId: 'company-a', expectedUpdatedAt: now, expectedRevision: version, patch: {} })).rejects.toThrow(/not confirmed/);
  });
  it('requires explicit restart to discard a conflicted proposal', async () => {
    const data = fixture(); data.property.updated_at = next; data.revision.version = nextVersion; data.revision.status = 'draft';
    mocks.rpc.mockResolvedValue({ data, error: null });
    await savePropertyRevision({ propertyId: 'property-a', companyId: 'company-a', expectedUpdatedAt: now, expectedRevision: version, patch: {}, restart: true });
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({ p_restart: true, p_patch: {} });
  });
  it('reviews only the displayed exact version and validates the resulting published status', async () => {
    const data = fixture(); data.property.updated_at = next; data.revision.version = nextVersion; data.revision.status = 'approved';
    mocks.rpc.mockResolvedValue({ data, error: null });
    await reviewPropertyRevision(parsePropertyRevisionState(fixture()), 'approve');
    expect(mocks.rpc).toHaveBeenCalledWith('review_managed_property_revision_checked', {
      p_property_id: 'property-a', p_expected_updated_at: now, p_expected_revision: version, p_decision: 'approve', p_reason: null,
    });
  });
  it('requires a rejection reason and blocks conflicted approval before dispatch', async () => {
    const state = parsePropertyRevisionState(fixture());
    await expect(reviewPropertyRevision(state, 'reject', '  ')).rejects.toThrow(/reason/);
    await expect(reviewPropertyRevision({ ...state, conflict: true }, 'approve')).rejects.toThrow(/changed/);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('propagates stale review failure without automatic retry or fallback', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'revision changed; reload before review' } });
    await expect(reviewPropertyRevision(parsePropertyRevisionState(fixture()), 'approve')).rejects.toThrow(/changed/);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('accepts only pending entries in a bounded checked review queue', async () => {
    mocks.rpc.mockResolvedValue({ data: [fixture()], error: null });
    expect(await listPendingPropertyRevisions(50)).toHaveLength(1);
    expect(mocks.rpc).toHaveBeenCalledWith('list_managed_property_revisions_checked', { p_limit: 50, p_offset: 50 });
    const data = fixture(); data.revision.status = 'draft'; mocks.rpc.mockResolvedValue({ data: [data], error: null });
    await expect(listPendingPropertyRevisions()).rejects.toThrow(/unexpected status/);
  });
});

describe('source-only revision safeguards', () => {
  const sql = readFileSync('docs/convergence/employee-property-revisions/published-revisions.candidate.sql', 'utf8');
  it('uses one canonical envelope and no assignment, new table or public SELECT policy', () => {
    expect(sql).toContain('ALTER TABLE public.properties ADD COLUMN publication_revision jsonb');
    expect(sql).not.toMatch(/CREATE TABLE|INSERT INTO public\.property_manager_assignments|FOR SELECT/i);
  });
  it('pins fingerprint serialization, locks and compares both row and proposal versions', () => {
    expect(sql).toContain("SET TimeZone='UTC'");
    expect(sql).toContain("has_column_privilege('anon','public.properties','publication_revision','SELECT')");
    expect(sql).toContain("roles=ARRAY['anon']::name[]");
    expect(sql.match(/FOR UPDATE/g)).toHaveLength(2);
    expect(sql.match(/IS DISTINCT FROM p_expected_updated_at/g)).toHaveLength(2);
    expect(sql.match(/IS DISTINCT FROM p_expected_revision/g)).toHaveLength(2);
    expect(sql.match(/saved.publication_revision IS DISTINCT FROM revision/g)).toHaveLength(2);
  });
  it('preserves public state and retains restrictive rollback protection', () => {
    expect(sql).not.toMatch(/UPDATE public\.properties[^;]+(?:is_active\s*=\s*false|approval_status\s*=\s*'draft')/i);
    const rollback = readFileSync('docs/hardening/rollback/employee_property_revisions.candidate.sql', 'utf8');
    expect(rollback).toContain('REVOKE EXECUTE');
    expect(rollback).not.toMatch(/DROP |DELETE |GRANT /);
  });
  it('keeps all source public property views explicit and excludes revision data', () => {
    for (const path of ['drizzle/migrations/0000_expose_price_period_in_public_property_view.sql', 'drizzle/migrations/0026_public_catalog_projection_extension.sql']) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toContain('publication_revision');
      expect(source).not.toMatch(/SELECT\s+(?:p\.)?\*/i);
    }
    const privateBoundary = readFileSync('drizzle/migrations/0027_close_authenticated_private_property_reads.sql', 'utf8');
    expect(privateBoundary).toContain('ALTER POLICY public_view_active ON public.properties TO anon');
    const grants = readFileSync('supabase/migrations/20260617014005_8e5dcca0-3200-483d-8696-75b5fba15fa7.sql', 'utf8');
    expect(grants).toContain('REVOKE SELECT ON public.properties FROM anon');
  });

});
