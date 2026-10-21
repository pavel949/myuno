import type { Plugin } from 'vite';

/** One build-time identity for both the bundled client and its public metadata. */
export function deploymentMetadataPlugin(
  version: string,
  env: Record<string, string | undefined> = process.env,
  buildTime = new Date().toISOString(),
): Plugin {
  const commit = [env.VERCEL_GIT_COMMIT_SHA, env.COMMIT_REF, env.GITHUB_SHA]
    .find(value => value && /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(value))?.toLowerCase();
  const metadata = { version, buildTime, ...(commit ? { commit } : {}) };
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
