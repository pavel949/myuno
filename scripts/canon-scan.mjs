#!/usr/bin/env node
/**
 * canon-scan.mjs
 *
 * Read-only scanner that reports remaining non-canonical visual utilities
 * across `src/**`. Does NOT modify files.
 *
 * Checks (per canon §5, §6, §8.1):
 *   1. rounded-{md|lg|xl|2xl|3xl} (any directional variant)            — forbidden
 *   2. rounded-[Npx] / rounded-[Nrem] arbitrary values                 — forbidden
 *   3. rounded-[var(--radius-{md|lg|sm-or-anything-not-full-or-none})] — forbidden
 *   4. hover:-translate-y-*  /  hover:translate-y-* (negative)         — soft-UI, forbidden
 *   5. active:scale-*  /  hover:scale-*  /  group-active:scale-*       — soft-UI, forbidden
 *   6. triggerRipple( imports outside button.tsx                       — material effect, forbidden
 *   7. backdrop-blur-*                                                  — glassmorphism, forbidden (canon §6)
 *
 * Output: grouped report `/mnt/documents/canon-scan-report.md` with
 * per-page summary + JSON for machines.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");
const OUT_MD = "/mnt/documents/canon-scan-report.md";
const OUT_JSON = "/mnt/documents/canon-scan-report.json";

const SIZES = "(?:md|lg|xl|2xl|3xl)";

const CHECKS = [
  {
    id: "rounded-size",
    label: "rounded-{md|lg|xl|2xl|3xl} (canon §5)",
    re: new RegExp(
      `\\brounded(?:-(?:[tblr]|tl|tr|bl|br))?-${SIZES}\\b`,
      "g"
    ),
  },
  {
    id: "rounded-arbitrary-px",
    label: "rounded-[Npx|Nrem|Nem] arbitrary value (canon §5)",
    // exclude the legitimate ones: 0, 9999px, var(--radius-full), var(--radius-none)
    re: /\brounded(?:-(?:[tblr]|tl|tr|bl|br))?-\[(?!0(?:px|rem|em)?\]|9999px\]|var\(--radius-full\)\]|var\(--radius-none\)\])[^\]]+\]/g,
  },
  {
    id: "translate-soft-ui",
    label: "hover/active translate-y (soft-UI, not in canon)",
    re: /\b(?:hover|active|focus|group-hover|group-active):-?translate-[xy]-[\w.\[\]/-]+/g,
  },
  {
    id: "scale-soft-ui",
    label: "hover/active scale (soft-UI, not in canon)",
    re: /\b(?:hover|active|focus|group-hover|group-active):scale-[\w.\[\]/-]+/g,
  },
  {
    id: "ripple",
    label: "triggerRipple usage (material effect, canon forbids)",
    // skip the hook source itself & button.tsx — but button.tsx no longer uses it.
    re: /\btriggerRipple\s*\(/g,
    skip: (rel) => rel.endsWith("hooks/useRipple.ts") || rel.endsWith("hooks/useRipple.tsx"),
  },
  {
    id: "backdrop-blur",
    label: "backdrop-blur (glassmorphism, canon §6)",
    re: /\bbackdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl))?\b/g,
  },
];

/** Group findings by "page bucket" — the first meaningful directory under src/. */
function bucketFor(rel) {
  // rel like "components/home/HeroIntro.tsx" or "pages/property/PropertyDetail.tsx"
  const parts = rel.split(path.sep);
  if (parts[0] === "pages") {
    // pages/property/... -> "pages/property"; pages/Index.tsx -> "pages/_root"
    return parts.length >= 3 ? `pages/${parts[1]}` : "pages/_root";
  }
  if (parts[0] === "components") {
    return parts.length >= 3 ? `components/${parts[1]}` : "components/_root";
  }
  if (parts[0] === "hooks") return "hooks";
  if (parts[0] === "contexts") return "contexts";
  if (parts[0] === "lib") return "lib";
  if (parts[0] === "design-system") return "design-system";
  if (parts[0] === "styles") return "styles";
  return parts[0];
}

const findings = []; // {file, bucket, checkId, line, snippet, match}

function scanFile(absPath, rel) {
  const text = fs.readFileSync(absPath, "utf8");
  const lines = text.split("\n");
  for (const check of CHECKS) {
    if (check.skip && check.skip(rel)) continue;
    let m;
    // Reset regex
    check.re.lastIndex = 0;
    while ((m = check.re.exec(text)) !== null) {
      // find line number
      const before = text.slice(0, m.index);
      const lineNum = before.split("\n").length;
      const snippet = lines[lineNum - 1].trim();
      findings.push({
        file: rel.replaceAll(path.sep, "/"),
        bucket: bucketFor(rel).replaceAll(path.sep, "/"),
        checkId: check.id,
        line: lineNum,
        match: m[0],
        snippet: snippet.length > 200 ? snippet.slice(0, 200) + "…" : snippet,
      });
    }
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["integrations", "node_modules"].includes(e.name)) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const rel = path.relative(SRC, full);
      scanFile(full, rel);
    }
  }
}

walk(SRC);

// ────────── aggregate ──────────
const byBucket = {};
const byCheck = {};
const byFile = {};
for (const f of findings) {
  byBucket[f.bucket] ??= { total: 0, byCheck: {} };
  byBucket[f.bucket].total++;
  byBucket[f.bucket].byCheck[f.checkId] = (byBucket[f.bucket].byCheck[f.checkId] || 0) + 1;

  byCheck[f.checkId] = (byCheck[f.checkId] || 0) + 1;
  byFile[f.file] = (byFile[f.file] || 0) + 1;
}

// ────────── markdown report ──────────
const lines = [];
lines.push("# Canon Scan Report");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Source: \`src/**\` against \`docs/canonical/05-visual-design-system.md\` §5, §6, §8.1`);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- **Total findings:** ${findings.length}`);
lines.push(`- **Files affected:** ${Object.keys(byFile).length}`);
lines.push(`- **Page buckets affected:** ${Object.keys(byBucket).length}`);
lines.push("");
lines.push("### By rule");
lines.push("");
lines.push("| Rule | Count |");
lines.push("|---|---:|");
for (const c of CHECKS) {
  lines.push(`| ${c.label} | ${byCheck[c.id] || 0} |`);
}
lines.push("");

lines.push("### Top 20 worst files");
lines.push("");
lines.push("| File | Findings |");
lines.push("|---|---:|");
const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [f, n] of topFiles) {
  lines.push(`| \`${f}\` | ${n} |`);
}
lines.push("");

lines.push("## By page / cluster");
lines.push("");
const sortedBuckets = Object.entries(byBucket).sort((a, b) => b[1].total - a[1].total);

for (const [bucket, data] of sortedBuckets) {
  lines.push(`### \`${bucket}\` — ${data.total} finding${data.total === 1 ? "" : "s"}`);
  lines.push("");
  // Per-rule counts
  const ruleCounts = Object.entries(data.byCheck)
    .map(([id, n]) => {
      const def = CHECKS.find((c) => c.id === id);
      return `- ${def ? def.label : id}: **${n}**`;
    })
    .sort();
  for (const rc of ruleCounts) lines.push(rc);
  lines.push("");

  // List individual findings, grouped by file (cap at 30 per bucket to keep readable)
  const bucketFindings = findings.filter((f) => f.bucket === bucket);
  const fileGroups = {};
  for (const f of bucketFindings) (fileGroups[f.file] ??= []).push(f);

  for (const [file, fs_] of Object.entries(fileGroups)) {
    lines.push(`<details><summary><code>${file}</code> — ${fs_.length}</summary>`);
    lines.push("");
    for (const f of fs_.slice(0, 30)) {
      lines.push(`- L${f.line} · \`${f.match}\`  → ${f.checkId}`);
    }
    if (fs_.length > 30) lines.push(`- … and ${fs_.length - 30} more`);
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }
}

fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, lines.join("\n"));
fs.writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totals: {
        findings: findings.length,
        files: Object.keys(byFile).length,
        buckets: Object.keys(byBucket).length,
      },
      byCheck,
      byBucket,
      byFile,
      findings,
    },
    null,
    2
  )
);

// ────────── stdout summary ──────────
console.log(`Total findings:        ${findings.length}`);
console.log(`Files affected:        ${Object.keys(byFile).length}`);
console.log(`Page buckets affected: ${Object.keys(byBucket).length}`);
console.log("");
console.log("By rule:");
for (const c of CHECKS) {
  console.log(`  ${(byCheck[c.id] || 0).toString().padStart(5)} · ${c.label}`);
}
console.log("");
console.log("Top buckets:");
for (const [b, d] of sortedBuckets.slice(0, 10)) {
  console.log(`  ${d.total.toString().padStart(5)} · ${b}`);
}
console.log("");
console.log(`Markdown report: ${OUT_MD}`);
console.log(`JSON report:     ${OUT_JSON}`);
