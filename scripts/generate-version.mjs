#!/usr/bin/env node
/**
 * Writes public/version.json at build time so /version.json always reflects
 * the deployed bundle. Source of truth: package.json "version".
 *
 * Consumed by:
 *  - src/components/pwa/VersionWatcher.tsx (polls /version.json)
 *  - src/lib/appVersion.ts (compares APP_VERSION to remote)
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;
const buildTime = new Date().toISOString();
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_REF ||
  process.env.GITHUB_SHA ||
  null;

const payload = { version, buildTime, ...(commit ? { commit } : {}) };

const outDir = resolve(root, 'public');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'version.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');

console.log(`[generate-version] wrote ${outPath} → v${version} @ ${buildTime}`);
