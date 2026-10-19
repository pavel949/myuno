import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('approved employee production UI activation', () => {
  it('tracks only the approved non-secret build flag', () => {
    const entries = readFileSync('.env.production', 'utf8').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    expect(entries).toEqual(['VITE_TEAM_MEMBER_ACCESS_ENABLED=true']);
  });
  it('is loaded by the production build without changing backend configuration', () => {
    const value = execFileSync(process.execPath, ['--input-type=module', '-e', "import { loadEnv } from 'vite'; process.stdout.write(loadEnv('production', process.cwd(), 'VITE_TEAM_MEMBER_ACCESS_').VITE_TEAM_MEMBER_ACCESS_ENABLED || '');"], { encoding: 'utf8' });
    expect(value).toBe('true');
  });
  it('retains independent server and company authorization gates', () => {
    expect(readFileSync('supabase/functions/invite-team-member/index.ts', 'utf8')).toContain("Deno.env.get('TEAM_MEMBER_INVITES_ENABLED') === 'true'");
    expect(readFileSync('src/components/owner/team/CompanyAccessPanel.tsx', 'utf8')).toContain('spacesEnforced');
  });
});
