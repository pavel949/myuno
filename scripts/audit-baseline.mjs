#!/usr/bin/env node
/**
 * Cleanup baseline auditor.
 * Re-measures all frontend metrics tracked in docs/audits/baseline-2026-04.md.
 *
 * Usage:
 *   node scripts/audit-baseline.mjs              # prints markdown to stdout
 *   node scripts/audit-baseline.mjs --json       # prints JSON to stdout
 *   node scripts/audit-baseline.mjs --write      # writes docs/audits/baseline-YYYY-MM-DD.{md,json}
 *
 * Used by .github/workflows/cleanup-metrics.yml as a regression guard.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const args = new Set(process.argv.slice(2));
const wantJson = args.has('--json');
const wantWrite = args.has('--write');

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function count(cmd) {
  const out = sh(cmd);
  if (!out) return 0;
  const n = parseInt(out, 10);
  return Number.isFinite(n) ? n : 0;
}

function rgCount(pattern, glob = '-g "*.ts" -g "*.tsx"') {
  return count(`rg ${glob} "${pattern}" src 2>/dev/null | wc -l`);
}

function findCount(pattern) {
  return count(`find src -type f \\( ${pattern} \\) | wc -l`);
}

function loc(dir) {
  return count(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec cat {} + 2>/dev/null | wc -l`);
}

function topLargestFiles(n = 10) {
  const out = sh(`find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -printf '%s %p\\n' | sort -rn | head -${n}`);
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [size, ...rest] = line.split(' ');
      return { sizeBytes: parseInt(size, 10), file: rest.join(' ') };
    });
}

function dirSize(dir) {
  const out = sh(`du -sb ${dir} 2>/dev/null | cut -f1`);
  return parseInt(out || '0', 10);
}

const metrics = {
  timestamp: new Date().toISOString(),
  branch: sh('git rev-parse --abbrev-ref HEAD 2>/dev/null') || 'unknown',
  frontend: {
    files_total: findCount('-name "*.ts" -o -name "*.tsx"'),
    pages: count(`find src/pages -type f \\( -name "*.tsx" -o -name "*.ts" \\) | wc -l`),
    components: count(`find src/components -type f -name "*.tsx" | wc -l`),
    hooks: count(`find src/hooks -type f -name "*.ts*" | wc -l`),
    contexts: count(`ls src/contexts 2>/dev/null | wc -l`),
    loc_src: loc('src'),
    routes_definitions: rgCount('<Route\\\\s'),
    hardcoded_navigate: rgCount("navigate\\\\(['\\\"]/"),
    any_usage: rgCount(': any\\\\b|<any>|as any\\\\b'),
    console_log: rgCount('console\\\\.log'),
    todo_fixme: rgCount('TODO|FIXME|XXX|HACK'),
    legacy_named_files: findCount('-iname "*old*" -o -iname "*v1*" -o -iname "*legacy*" -o -iname "*backup*" -o -iname "*deprecated*"'),
    provider_mentions_app_tsx: count(`rg "Provider" src/App.tsx 2>/dev/null | wc -l`),
  },
  backend: {
    edge_functions: count(`find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l`),
    sql_migrations: count(`find supabase/migrations -type f -name "*.sql" | wc -l`),
  },
  tests: {
    test_files: count(`find . -path ./node_modules -prune -o -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\) -print | wc -l`),
  },
  artifacts: {
    node_modules_bytes: dirSize('node_modules'),
    dist_bytes: (() => {
      try {
        statSync('dist');
        return dirSize('dist');
      } catch {
        return null;
      }
    })(),
  },
  top_largest_files: topLargestFiles(10),
};

function fmtBytes(b) {
  if (b == null) return 'n/a';
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b > 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function toMarkdown(m) {
  const f = m.frontend;
  const b = m.backend;
  const t = m.tests;
  const lines = [
    `# Audit snapshot — ${m.timestamp}`,
    ``,
    `Branch: \`${m.branch}\``,
    ``,
    `## Frontend`,
    `| Metric | Value |`,
    `|---|---|`,
    `| Files (.ts/.tsx) | ${f.files_total} |`,
    `| LOC | ${f.loc_src} |`,
    `| Pages | ${f.pages} |`,
    `| Components | ${f.components} |`,
    `| Hooks | ${f.hooks} |`,
    `| Contexts | ${f.contexts} |`,
    `| Provider mentions in App.tsx | ${f.provider_mentions_app_tsx} |`,
    `| <Route> definitions | ${f.routes_definitions} |`,
    `| Hardcoded navigate('/') | ${f.hardcoded_navigate} |`,
    `| any usages | ${f.any_usage} |`,
    `| console.log | ${f.console_log} |`,
    `| TODO/FIXME | ${f.todo_fixme} |`,
    `| Legacy-named files | ${f.legacy_named_files} |`,
    ``,
    `## Backend`,
    `| Metric | Value |`,
    `|---|---|`,
    `| Edge functions | ${b.edge_functions} |`,
    `| SQL migrations | ${b.sql_migrations} |`,
    ``,
    `## Tests`,
    `| Metric | Value |`,
    `|---|---|`,
    `| Test files | ${t.test_files} |`,
    ``,
    `## Artifacts`,
    `- node_modules: ${fmtBytes(m.artifacts.node_modules_bytes)}`,
    `- dist: ${fmtBytes(m.artifacts.dist_bytes)}`,
    ``,
    `## Top 10 largest source files`,
    `| Size | File |`,
    `|---|---|`,
    ...m.top_largest_files.map((r) => `| ${fmtBytes(r.sizeBytes)} | \`${r.file}\` |`),
  ];
  return lines.join('\n');
}

if (wantWrite) {
  mkdirSync('docs/audits', { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(`docs/audits/baseline-${date}.md`, toMarkdown(metrics));
  writeFileSync(`docs/audits/baseline-${date}.json`, JSON.stringify(metrics, null, 2));
  console.log(`Wrote docs/audits/baseline-${date}.{md,json}`);
} else if (wantJson) {
  console.log(JSON.stringify(metrics, null, 2));
} else {
  console.log(toMarkdown(metrics));
}
