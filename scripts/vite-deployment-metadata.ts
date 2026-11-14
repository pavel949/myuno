import type { Plugin } from 'vite';
import { resolveBuildCommit, resolveBuildBranch } from './build-identity.mjs';

/** One build-time identity for both the bundled client and its public metadata. */
export function deploymentMetadataPlugin(
  version: string,
  env: Record<string, string | undefined> = process.env,
  buildTime = new Date().toISOString(),
  gitCommitRead?: () => string,
  gitBranchRead?: () => string,
): Plugin {
  const commit = resolveBuildCommit(env, gitCommitRead);
  const branch = resolveBuildBranch(env, gitBranchRead);
  const metadata = { version, buildTime, ...(commit ? { commit } : {}), ...(branch ? { branch } : {}) };
  return {
    name: 'myuno-deployment-metadata',
    config() {
      return { define: {
        __BUILD_TIMESTAMP__: JSON.stringify(buildTime),
        __BUILD_COMMIT__: JSON.stringify(commit ?? ''),
      } };
    },
    generateBundle() {
      // Emission also covers direct `vite build` / build:dev without npm prebuild.
      // It replaces the legacy public/version.json copy in the output only.
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(metadata, null, 2) + '\n' });
    },
  };
}
