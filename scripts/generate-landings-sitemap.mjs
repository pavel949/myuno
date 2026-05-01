#!/usr/bin/env node
/**
 * Wave 4 — generate `public/sitemap-landings.xml` from canonical landing
 * configs (personas + clusters + areas + persona×area combos).
 *
 * Run: node scripts/generate-landings-sitemap.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Cheap parse — no TS runtime; extract slug arrays via regex.
function extractStringArray(file, exportName) {
  const src = readFileSync(file, 'utf8');
  const re = new RegExp(`export const ${exportName}[^=]*=\\s*([\\s\\S]*?);`, 'm');
  const m = src.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]);
}

function extractAreaPersonaMap() {
  const src = readFileSync(join(ROOT, 'src/content/landings/areaLandings.ts'), 'utf8');
  // Match e.g. `'bang-tao': { personas: ['hnw', 'families'], ...`
  const re = /'([a-z0-9-]+)':\s*\{\s*personas:\s*\[([^\]]*)\]/g;
  const out = {};
  let m;
  while ((m = re.exec(src)) !== null) {
    out[m[1]] = [...m[2].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]);
  }
  return out;
}

function collectLivePersonas() {
  const out = [];
  const dir = join(ROOT, 'src/content/landings/personas');
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts')) continue;
    const src = readFileSync(join(dir, file), 'utf8');
    if (!src.includes("status: 'live'")) continue;
    const m = src.match(/slug:\s*'([a-z0-9-]+)'/);
    if (m) out.push(m[1]);
  }
  return out;
}

function collectLiveClusters() {
  const src = readFileSync(join(ROOT, 'src/content/landings/clusterLandings.ts'), 'utf8');
  // Match each cluster object with status:'live' and slug
  const out = [];
  const re = /slug:\s*'([a-z0-9-]+)'[^}]*?status:\s*'live'|status:\s*'live'[^}]*?slug:\s*'([a-z0-9-]+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push(m[1] || m[2]);
  }
  return [...new Set(out)];
}

const livePersonas = collectLivePersonas();
const clusterSlugs = collectLiveClusters();

const areaPersonaMap = extractAreaPersonaMap();
const areaSlugs = Object.keys(areaPersonaMap);

const today = new Date().toISOString().slice(0, 10);
const ORIGIN = 'https://myuno.app';

function urlEntry(path, priority = '0.7', changefreq = 'weekly') {
  return `  <url><loc>${ORIGIN}${path}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>` +
    `<xhtml:link rel="alternate" hreflang="ru" href="${ORIGIN}${path}?lang=ru"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${path}?lang=en"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${path}"/>` +
    `</url>`;
}

const lines = [];
lines.push('<?xml version="1.0" encoding="UTF-8"?>');
lines.push('<!--');
lines.push('  Wave 4 — auto-generated sitemap for landings (personas, clusters, areas,');
lines.push('  persona×area long-tail combos). Regenerate via:');
lines.push('    node scripts/generate-landings-sitemap.mjs');
lines.push('-->');
lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
lines.push('        xmlns:xhtml="http://www.w3.org/1999/xhtml">');
lines.push('');
lines.push(`  <!-- ===== Persona landings (${livePersonas.length}) ===== -->`);
for (const slug of livePersonas) lines.push(urlEntry(`/for/${slug}`, '0.8'));
lines.push('');
lines.push(`  <!-- ===== Cluster landings (${clusterSlugs.length}) ===== -->`);
for (const slug of clusterSlugs) lines.push(urlEntry(`/cluster/${slug}`, '0.8'));
lines.push('');
lines.push(`  <!-- ===== Area landings (${areaSlugs.length}) ===== -->`);
for (const slug of areaSlugs) lines.push(urlEntry(`/area/${slug}`, '0.7'));
lines.push('');

// Persona × area combos
let comboCount = 0;
const comboLines = [];
for (const [areaSlug, personas] of Object.entries(areaPersonaMap)) {
  for (const personaSlug of personas) {
    if (!livePersonas.includes(personaSlug)) continue;
    comboLines.push(urlEntry(`/for/${personaSlug}/in/${areaSlug}`, '0.6'));
    comboCount++;
  }
}
lines.push(`  <!-- ===== Persona × Area long-tail (${comboCount}) ===== -->`);
lines.push(...comboLines);
lines.push('');
lines.push('</urlset>');

writeFileSync(join(ROOT, 'public/sitemap-landings.xml'), lines.join('\n') + '\n');
console.log(
  `✓ sitemap-landings.xml: ${livePersonas.length} personas, ${clusterSlugs.length} clusters, ${areaSlugs.length} areas, ${comboCount} combos`,
);
