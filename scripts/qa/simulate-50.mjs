#!/usr/bin/env node
// QA simulation of 50 personas against live DB.
// Usage: node scripts/qa/simulate-50.mjs
// Requires PG* env vars (psql). Outputs docs/audit/qa-latest.md and prints summary.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const q = (sql) => {
  const flat = sql.replace(/\s+/g, ' ').trim();
  return execSync(`psql -At -F '|' -c ${JSON.stringify(flat)}`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('|'));
};

// 1) Pull live state
const SSOT = ['arrive', 'live', 'manage', 'invest', 'legal', 'build'];

const situations = q(`SELECT code, title_en FROM life_situations WHERE is_active=true`).map(
  ([c, en]) => ({ code: c, en })
);

const sitClusterRows = q(`
  SELECT ls.code, g.surface_id
  FROM cluster_life_situations cls
  JOIN life_situations ls ON ls.id = cls.life_situation_id
  JOIN category_groups g ON g.id = cls.cluster_id
  WHERE g.is_active = true
`);
const sitClusters = {};
sitClusterRows.forEach(([code, surface]) => {
  if (!sitClusters[code]) sitClusters[code] = new Set();
  sitClusters[code].add(surface);
});

// Provider supply per surface: providers (mapped via categories) + domain-specific tables
const provRows = q(`
  SELECT g.surface_id, COUNT(DISTINCT p.id)
  FROM providers p
  JOIN categories c ON c.slug = p.business_category
  JOIN category_groups g ON g.id = c.group_id
  WHERE p.is_active = true AND g.is_active = true
  GROUP BY g.surface_id
`);
const activeProv = Object.fromEntries(SSOT.map((s) => [s, 0]));
provRows.forEach(([surface, n]) => {
  activeProv[surface] = Number(n);
});

// Legal and build have their own supply tables — count them in.
const legalCount = Number(q(`SELECT COUNT(*) FROM legal_services WHERE is_active=true`)[0]?.[0] || 0);
const visaCount = Number(q(`SELECT COUNT(*) FROM visa_services WHERE is_active=true`)[0]?.[0] || 0);
const devCount = Number(q(`SELECT COUNT(*) FROM developers WHERE is_active=true`)[0]?.[0] || 0);
activeProv.legal += legalCount + visaCount;
activeProv.build += devCount;

// Category counts per surface (for vendor onboarding readiness)
const catRows = q(`
  SELECT g.surface_id, COUNT(*) FROM categories c
  JOIN category_groups g ON g.id = c.group_id
  WHERE c.is_active = true AND g.is_active = true
  GROUP BY g.surface_id
`);
const catCount = Object.fromEntries(SSOT.map((s) => [s, 0]));
catRows.forEach(([s, n]) => (catCount[s] = Number(n)));

// 2) Personas
const roleSit = {
  tourist: ['planning', 'pre_trip_planning', 'arrival', 'transit', 'tourist', 'leisure', 'nightlife', 'shopping', 'food', 'pre_trip_planning'],
  resident: ['living', 'family', 'resident', 'settling', 'first_time', 'digital_nomad', 'pets', 'pet_owner', 'sports', 'retirement_living'],
  investor: ['investing', 'investor', 'property', 'business', 'investing', 'investor', 'property', 'business'],
  owner: ['property_owner', 'management_company', 'managing', 'property', 'property_owner', 'management_company', 'managing', 'property'],
  developer: ['developer', 'developer', 'developer', 'developer'],
  vendor: ['vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding', 'vendor_onboarding'],
};
const LANGS = ['ru', 'en', 'th'];
const dist = [['tourist', 10], ['resident', 10], ['investor', 8], ['owner', 8], ['developer', 4], ['vendor', 10]];

const personas = [];
let pid = 1;
dist.forEach(([role, n]) => {
  const cands = roleSit[role];
  for (let i = 0; i < n; i++) {
    const lang = LANGS[pid % 3];
    const sitCode = cands[i % cands.length];
    const sit = situations.find((s) => s.code === sitCode);
    personas.push({
      id: `P${String(pid++).padStart(2, '0')}`,
      role,
      lang,
      sitCode,
      sitTitle: sit ? sit.en : '(missing)',
      clusters: sit ? [...(sitClusters[sit.code] || [])] : [],
    });
  }
});

// 3) Score
let rows = `| # | Role | Lang | Situation | DB | Clusters | Providers | Cats | Status |\n|---|---|---|---|---|---|---|---|---|\n`;
const I = { noSit: 0, noCluster: 0, noProviders: 0, nonSSOT: 0, ok: 0 };
const roleAgg = {};

personas.forEach((p) => {
  const exists = p.sitTitle !== '(missing)';
  const provs = p.clusters.reduce((s, c) => s + (activeProv[c] || 0), 0);
  const cats = p.clusters.reduce((s, c) => s + (catCount[c] || 0), 0);
  const nonSSOT = p.clusters.some((c) => !SSOT.includes(c));

  let status;
  if (!exists) { status = '❌ no situation in DB'; I.noSit++; }
  else if (p.clusters.length === 0) { status = '⚠️ orphan situation'; I.noCluster++; }
  else if (nonSSOT) { status = '⚠️ non-SSOT cluster'; I.nonSSOT++; }
  else if (provs === 0) { status = '⚠️ 0 providers'; I.noProviders++; }
  else { status = '✅'; I.ok++; }

  if (!roleAgg[p.role]) roleAgg[p.role] = { ok: 0, bad: 0 };
  if (status === '✅') roleAgg[p.role].ok++; else roleAgg[p.role].bad++;

  rows += `| ${p.id} | ${p.role} | ${p.lang} | \`${p.sitCode}\` | ${exists ? '✓' : '—'} | ${p.clusters.join(', ') || '—'} | ${provs} | ${cats} | ${status} |\n`;
});

const score = Math.round((I.ok / 50) * 100);
const out = `# QA simulation report — auto-generated\n\n**Score:** ${I.ok}/50 (${score}%)  | **Target:** ≥ 45/50 (90%)\n\n## Per-role\n${Object.entries(roleAgg).map(([k, v]) => `- **${k}**: ${v.ok}/${v.ok + v.bad}`).join('\n')}\n\n## Failure breakdown\n- no situation in DB: ${I.noSit}\n- orphan situation: ${I.noCluster}\n- non-SSOT cluster: ${I.nonSSOT}\n- 0 providers: ${I.noProviders}\n\n## Per-SSOT-cluster (live DB)\n${SSOT.map((s) => `- **${s}**: ${activeProv[s]} providers, ${catCount[s]} categories`).join('\n')}\n\n## Matrix\n${rows}\n`;

const outPath = path.resolve('docs/audit/qa-latest.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`\nScore: ${I.ok}/50 (${score}%)`);
console.log('Per-role:', roleAgg);
console.log('Failures:', I);
console.log('Per-cluster providers:', activeProv);
console.log('Per-cluster categories:', catCount);
console.log(`\nReport: ${outPath}`);
