#!/usr/bin/env node
/**
 * scripts/validate-semantic.mjs
 *
 * Vite/React adaptation of `10-semantic-core.md §15 validate-semantic.ts`.
 * Replaces Next.js `app/page.tsx` convention with our `src/pages/**` and
 * `src/content/landings/*.ts` declarative configs.
 *
 * Run:
 *   npm run validate:semantic
 *   npm run validate:semantic -- --verbose
 *
 * Exit code:
 *   0 — no errors (warnings allowed)
 *   1 — at least one error
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 160;

const verbose = process.argv.includes('--verbose');
const violations = [];

function pushViolation(rule, severity, file, message) {
  violations.push({ rule, severity, file, message });
}

// ────────────────────────────────────────────────────────────────────
// Load FORBIDDEN_SYNONYMS from canonical TS module via simple regex parse
// (we don't want to bundle ts-node just for this script).
// ────────────────────────────────────────────────────────────────────

function loadForbiddenSynonyms() {
  const path = resolve(ROOT, 'src/content/semantic/forbiddenSynonyms.ts');
  const src = readFileSync(path, 'utf-8');
  const re = /\{\s*forbidden:\s*'([^']+)',\s*canonical:\s*'([^']+)',\s*contexts:\s*\[([^\]]+)\]/g;
  const list = [];
  let m;
  while ((m = re.exec(src))) {
    const contexts = m[3].split(',').map((c) => c.replace(/[\s']/g, '')).filter(Boolean);
    list.push({ forbidden: m[1], canonical: m[2], contexts });
  }
  return list;
}

const SYNONYMS = loadForbiddenSynonyms();

// ────────────────────────────────────────────────────────────────────
// Landings audit (`src/content/landings/*.ts`)
// ────────────────────────────────────────────────────────────────────

function auditLandingFile(file, kind /* persona | cluster */) {
  if (!existsSync(file)) return;
  const src = readFileSync(file, 'utf-8');

  // Heuristic block parsing — split by top-level `const FOO_NAME: PersonaLanding = {`
  const blockRe = new RegExp(
    `const\\s+([A-Z][A-Z0-9_]*):\\s*(?:Persona|Cluster)Landing\\s*=\\s*{([\\s\\S]*?)\\n};`,
    'g',
  );
  let m;
  while ((m = blockRe.exec(src))) {
    const [, name, body] = m;
    const slugMatch = body.match(/slug:\s*'([^']+)'/);
    const statusMatch = body.match(/status:\s*'(live|draft)'/);
    const slug = slugMatch ? slugMatch[1] : '?';
    const status = statusMatch ? statusMatch[1] : '?';

    if (status !== 'live') continue;

    // SEO block presence
    const hasSeo = /seo:\s*{/.test(body);
    if (!hasSeo) {
      pushViolation('landings-seo-required', 'error', file, `${kind} ${name} (slug=${slug}) missing seo block`);
      continue;
    }

    // Title / description per language
    const titleRu = body.match(/metaTitle:\s*{[^}]*ru:\s*'([^']+)'/);
    const titleEn = body.match(/metaTitle:\s*{[^}]*en:\s*'([^']+)'/);
    const descRu = body.match(/metaDescription:\s*{[^}]*ru:\s*'([^']+)'/);
    const descEn = body.match(/metaDescription:\s*{[^}]*en:\s*'([^']+)'/);

    [['title.ru', titleRu, MAX_TITLE], ['title.en', titleEn, MAX_TITLE],
     ['description.ru', descRu, MAX_DESCRIPTION], ['description.en', descEn, MAX_DESCRIPTION]]
      .forEach(([label, match, max]) => {
        if (!match) {
          pushViolation('meta-missing', 'error', file, `${kind} ${name}: ${label} not found`);
          return;
        }
        const value = match[1];
        if (value.length > max) {
          pushViolation(`${label.split('.')[0]}-too-long`, 'warning', file,
            `${kind} ${name}.${label}: ${value.length}>${max} chars`);
        }
      });

    // canonicalPath hygiene
    const canonical = body.match(/canonicalPath:\s*'([^']+)'/);
    if (!canonical) {
      pushViolation('canonical-missing', 'error', file, `${kind} ${name}: canonicalPath missing`);
    } else {
      const path = canonical[1];
      if (!path.startsWith('/')) pushViolation('canonical-path', 'error', file, `${kind} ${name}: canonical "${path}" must start with /`);
      if (path.length > 1 && path.endsWith('/')) pushViolation('canonical-path', 'error', file, `${kind} ${name}: canonical "${path}" has trailing slash`);
      if (/[\u0400-\u04FF]/.test(path)) pushViolation('canonical-path', 'error', file, `${kind} ${name}: canonical "${path}" contains Cyrillic`);
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 4) pushViolation('canonical-depth', 'warning', file, `${kind} ${name}: canonical depth ${segments.length} > 4`);
    }

    // FAQ minimum
    const faqMatch = body.match(/faq:\s*\[([\s\S]*?)\n\s*\],?\n\s*primaryCta/);
    if (faqMatch) {
      const faqCount = (faqMatch[1].match(/\{\s*q:/g) || []).length;
      if (faqCount < 4) {
        pushViolation('landings-faq-min', 'warning', file, `${kind} ${name}: FAQ has ${faqCount} entries (<4)`);
      }
    }

    // hreflang must contain ru and en
    const hreflangCount = (body.match(/lang:\s*'(ru|en)'/g) || []).length;
    if (hreflangCount < 2) {
      pushViolation('hreflang-required', 'error', file, `${kind} ${name}: hreflang must include both ru and en`);
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Forbidden synonyms scan (lightweight — only files in commercial dirs)
// ────────────────────────────────────────────────────────────────────

const COMMERCIAL_RE = /\/(landings|content\/landings|content\/semantic|guides|for|services|clearview|landing|knowledge)\//;

function scanFileForSynonyms(file) {
  if (!existsSync(file)) return;
  const isCommercial = COMMERCIAL_RE.test(file);
  const src = readFileSync(file, 'utf-8');
  const hasCyrillic = /[\u0400-\u04FF]/.test(src);
  for (const rule of SYNONYMS) {
    if (rule.contexts.includes('all')) {
      // any context
    } else if (rule.contexts.includes('commercial') && !isCommercial) {
      continue;
    } else if (rule.contexts.includes('ru') && !hasCyrillic) {
      continue;
    } else if (rule.contexts.includes('en') && hasCyrillic && !rule.contexts.includes('ru')) {
      continue;
    }
    const pattern = new RegExp(
      `(?:^|[^а-яёa-zа-яё0-9_])${escapeRegex(rule.forbidden)}(?:[^а-яёa-zа-яё0-9_]|$)`,
      'i',
    );
    if (pattern.test(src)) {
      pushViolation('forbidden-synonym', 'warning', file,
        `Found "${rule.forbidden}" → use "${rule.canonical}"`);
    }
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ────────────────────────────────────────────────────────────────────
// Pillar coverage (sitemap-pillars.xml must contain all PILLAR_PAGES)
// ────────────────────────────────────────────────────────────────────

function loadPillarSlugs() {
  const path = resolve(ROOT, 'src/content/semantic/pillarPages.ts');
  if (!existsSync(path)) return [];
  const src = readFileSync(path, 'utf-8');
  const re = /slug:\s*'(\/[^']+)'/g;
  const slugs = [];
  let m;
  while ((m = re.exec(src))) slugs.push(m[1]);
  return slugs;
}

function checkPillarSitemapCoverage() {
  const sitemap = resolve(ROOT, 'public/sitemap-pillars.xml');
  if (!existsSync(sitemap)) {
    pushViolation('pillar-sitemap-missing', 'error', sitemap, 'public/sitemap-pillars.xml not found');
    return;
  }
  const xml = readFileSync(sitemap, 'utf-8');
  const slugs = loadPillarSlugs();
  for (const slug of slugs) {
    if (!xml.includes(slug)) {
      pushViolation('pillar-sitemap-coverage', 'warning', sitemap, `Pillar ${slug} not in sitemap-pillars.xml`);
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────────────

function listFiles(globPattern) {
  // Use git ls-files to avoid pulling glob package (no npm dep added).
  try {
    const out = execSync(`git ls-files ${globPattern}`, { cwd: ROOT, encoding: 'utf-8' });
    return out.trim().split('\n').filter(Boolean).map((p) => resolve(ROOT, p));
  } catch {
    return [];
  }
}

console.log('[validate-semantic] §15 — auditing landings, synonyms, pillars…\n');

auditLandingFile(resolve(ROOT, 'src/content/landings/personaLandings.ts'), 'persona');
auditLandingFile(resolve(ROOT, 'src/content/landings/clusterLandings.ts'), 'cluster');

const semanticFiles = listFiles('src/content/landings/*.ts');
const pillarTsFiles = listFiles('src/content/semantic/*.ts');
for (const f of [...semanticFiles, ...pillarTsFiles]) scanFileForSynonyms(f);

checkPillarSitemapCoverage();

// ────────────────────────────────────────────────────────────────────
// Report
// ────────────────────────────────────────────────────────────────────

const errors = violations.filter((v) => v.severity === 'error');
const warnings = violations.filter((v) => v.severity === 'warning');

console.log(`\n=== Semantic Core Validation ===`);
console.log(`Errors:   ${errors.length}`);
console.log(`Warnings: ${warnings.length}\n`);

const byRule = new Map();
for (const v of violations) {
  if (!byRule.has(v.rule)) byRule.set(v.rule, []);
  byRule.get(v.rule).push(v);
}

const sortedRules = Array.from(byRule.entries()).sort((a, b) => a[0].localeCompare(b[0]));

for (const [rule, vs] of sortedRules) {
  const sev = vs[0].severity === 'error' ? 'ERROR' : 'WARN ';
  console.log(`[${sev}] ${rule} (${vs.length})`);
  const limit = verbose ? vs.length : Math.min(vs.length, 5);
  for (const v of vs.slice(0, limit)) {
    console.log(`   ${relative(ROOT, v.file)}`);
    console.log(`     ${v.message}`);
  }
  if (!verbose && vs.length > 5) {
    console.log(`   … ещё ${vs.length - 5} (--verbose для полного списка)`);
  }
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ Semantic Core validation passed. 0 violations.');
}

process.exit(errors.length > 0 ? 1 : 0);
