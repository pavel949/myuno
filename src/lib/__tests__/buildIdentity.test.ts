import { describe, expect, it } from 'vitest';
import { resolveBuildCommit, resolveBuildBranch } from '../../../scripts/build-identity.mjs';

describe('verified build identity', () => {
  it('prioritizes valid hosting SHA and normalizes it', () => {
    expect(resolveBuildCommit({ VERCEL_GIT_COMMIT_SHA: 'A'.repeat(40), GITHUB_SHA: 'b'.repeat(40) }, () => 'c'.repeat(40))).toBe('a'.repeat(40));
  });
  it('uses actual checkout SHA when provider metadata is absent', () => {
    expect(resolveBuildCommit({}, () => 'D'.repeat(40) + '\n')).toBe('d'.repeat(40));
  });
  it('does not fabricate unknown identity', () => {
    expect(resolveBuildCommit({ GITHUB_SHA: 'invalid' }, () => { throw new Error('no git'); })).toBeNull();
    expect(resolveBuildBranch({}, () => '')).toBeNull();
  });
  it('preserves verified branch identity instead of forcing main', () => {
    expect(resolveBuildBranch({ VERCEL_GIT_COMMIT_REF: 'main' }, () => 'review')).toBe('main');
    expect(resolveBuildBranch({}, () => 'review/cleanup\n')).toBe('review/cleanup');
  });
});