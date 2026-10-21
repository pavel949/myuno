import viteSource from '../../../vite.config.ts?raw';
import mainSource from '../../main.tsx?raw';
import { describe, expect, it, vi } from 'vitest';
import { deploymentMetadataPlugin } from '../../../scripts/vite-deployment-metadata';

function metadata(env: Record<string, string | undefined>) {
  const plugin = deploymentMetadataPlugin('3.55.5', env, '2026-10-19T00:00:00.000Z');
  const configHook = plugin.config;
  const config = Reflect.apply(typeof configHook === 'function' ? configHook : configHook!.handler, {}, []);
  const emitFile = vi.fn();
  const generateHook = plugin.generateBundle;
  Reflect.apply(typeof generateHook === 'function' ? generateHook : generateHook!.handler, { emitFile }, []);
  return { config, asset: emitFile.mock.calls[0][0] };
}

describe('single build identity', () => {
  it('emits exactly the bundled timestamp/commit without relying on prebuild', () => {
    const { config, asset } = metadata({ GITHUB_SHA: 'A'.repeat(40) });
    const data = JSON.parse(asset.source);
    expect(asset.fileName).toBe('version.json');
    expect(data).toEqual({ version: '3.55.5', buildTime: '2026-10-19T00:00:00.000Z', commit: 'a'.repeat(40) });
    expect(JSON.parse(config.define.__BUILD_TIMESTAMP__)).toBe(data.buildTime);
    expect(JSON.parse(config.define.__BUILD_COMMIT__)).toBe(data.commit);
  });
  it('uses build time with no fabricated commit if hosting metadata is missing or invalid', () => {
    const { config, asset } = metadata({ VERCEL_GIT_COMMIT_SHA: 'not-a-sha' });
    expect(JSON.parse(asset.source)).not.toHaveProperty('commit');
    expect(JSON.parse(config.define.__BUILD_COMMIT__)).toBe('');
  });
  it('skips invalid provider metadata and accepts a valid fallback', () => {
    expect(JSON.parse(metadata({ VERCEL_GIT_COMMIT_SHA: 'bad', COMMIT_REF: 'b'.repeat(40) }).asset.source).commit).toBe('b'.repeat(40));
  });
  it('wires identity emission and disables the PWA library automatic page reload in the entrypoints', () => {
    expect(viteSource).toContain('deploymentMetadataPlugin(version)');
    expect(mainSource).toMatch(/onNeedReload:\s*requestUpdateCheck/);
  });
});
