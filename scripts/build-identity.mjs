import { execFileSync } from 'node:child_process';

export function resolveBuildCommit(env = process.env, gitRead = () => execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] })) {
  for (const value of [env.VERCEL_GIT_COMMIT_SHA, env.COMMIT_REF, env.GITHUB_SHA]) {
    if (/^[0-9a-f]{40}$/i.test(value || '')) return value;
  }
  try {
    const value = gitRead().trim();
    if (/^[0-9a-f]{40}$/i.test(value)) return value;
  } catch { /* Snapshot builds without git remain explicitly unknown. */ }
  return null;
}
