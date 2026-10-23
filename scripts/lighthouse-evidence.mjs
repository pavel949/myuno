#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://www.myuno.app';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// Preserve error audits: a missing score is not the same as a zero-item diagnostic.
export function reportErrors(report) {
  const errors = [];
  if (report.runtimeError) errors.push(`runtime: ${report.runtimeError.code || 'unknown'}`);
  for (const key of CATEGORIES) {
    if (!Number.isFinite(report.categories?.[key]?.score)) errors.push(`missing category score: ${key}`);
  }
  for (const [key, audit] of Object.entries(report.audits || {})) {
    if (audit.scoreDisplayMode === 'error' || audit.errorMessage) errors.push(`audit error: ${key}`);
  }
  return errors;
}

export function publicIdentity(value) {
  return {
    version: typeof value?.version === 'string' ? value.version : null,
    buildTime: typeof value?.buildTime === 'string' ? value.buildTime : null,
    deployedCommit: /^[0-9a-f]{40}$/i.test(value?.commit || '') ? value.commit : null,
  };
}

async function observeIdentity() {
  const observation = { observedAt: new Date().toISOString(), origin: ORIGIN };
  try {
    const response = await fetch(`${ORIGIN}/version.json`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    observation.versionHttpStatus = response.status;
    observation.versionResponseUrl = response.url;
    if (response.ok && new URL(response.url).origin === ORIGIN) {
      Object.assign(observation, publicIdentity(await response.json()));
    }
  } catch (error) {
    observation.versionError = error instanceof Error ? error.message : String(error);
  }
  try {
    const response = await fetch(`${ORIGIN}/`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    observation.documentHttpStatus = response.status;
    if (response.ok && new URL(response.url).origin === ORIGIN) {
      const html = await response.text();
      observation.documentSha256 = createHash('sha256').update(html).digest('hex');
      observation.scriptAssets = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1]);
    }
  } catch (error) {
    observation.documentError = error instanceof Error ? error.message : String(error);
  }
  return observation;
}

export async function main(phase, directory = '.lighthouseci') {
  if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
  await mkdir(directory, { recursive: true });
  const evidence = {
    phase,
    runnerSourceCommit: process.env.GITHUB_SHA || null,
    // This SHA identifies the workflow, never the production frontend.
    identity: await observeIdentity(),
    reports: [],
  };
  if (phase === 'after') {
    const files = (await readdir(directory)).filter(file => /^lhr-.*\.json$/.test(file));
    for (const file of files) {
      const report = JSON.parse(await readFile(resolve(directory, file), 'utf8'));
      evidence.reports.push({ file, requestedUrl: report.requestedUrl, finalUrl: report.finalUrl,
        lighthouseVersion: report.lighthouseVersion, fetchTime: report.fetchTime,
        scores: Object.fromEntries(CATEGORIES.map(key => [key, report.categories?.[key]?.score ?? null])),
        errors: reportErrors(report) });
    }
  }
  await writeFile(resolve(directory, `production-identity-${phase}.json`), JSON.stringify(evidence, null, 2) + '\n');
  console.log(`Workflow source: ${evidence.runnerSourceCommit || 'unknown'}; observed deployed commit: ${evidence.identity.deployedCommit || 'UNVERIFIED'}`);
  if (phase === 'after' && (!evidence.reports.length || evidence.reports.some(report => report.errors.length))) {
    throw new Error('Lighthouse reports missing or contain runtime/audit errors; inspect retained evidence');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
