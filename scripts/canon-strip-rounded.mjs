#!/usr/bin/env node
/**
 * canon-strip-rounded.mjs
 *
 * Phase 6 (canon §5 — square corners only).
 *
 * Replaces residual `rounded-{md|lg|xl|2xl|3xl}` and their directional
 * variants (`rounded-t-lg`, `rounded-bl-xl`, etc.) with `rounded-none`
 * inside `src/**`. Keeps `rounded-sm` (allowed for mini-badges, canon §5)
 * and `rounded-full` (avatars, status dots, switch handles).
 *
 * Mirrors the approach of `canon-strip-glassmorphism.mjs`: scans .ts/.tsx
 * files, rewrites class strings in place, prints stats.
 *
 * After this pass, `src/styles/canon-overrides.css` becomes a true safety
 * net rather than load-bearing CSS — the source code is canon-clean.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");

// Match the size suffixes we want to flatten. Excludes `sm` and `full`.
const SIZES = "(?:md|lg|xl|2xl|3xl)";
// All directional + base patterns.
const PATTERNS = [
  new RegExp(`\\brounded-${SIZES}\\b`, "g"),
  new RegExp(`\\brounded-[tblr]-${SIZES}\\b`, "g"),
  new RegExp(`\\brounded-(?:tl|tr|bl|br)-${SIZES}\\b`, "g"),
];

let touched = 0;
let removed = 0;

function rewrite(content) {
  let next = content;
  for (const re of PATTERNS) {
    next = next.replace(re, () => {
      removed++;
      return "rounded-none";
    });
  }
  // Collapse accidental "rounded-none rounded-none" duplicates.
  next = next.replace(/\b(rounded-none)(\s+rounded-none)+\b/g, "rounded-none");
  return next;
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip auto-generated and vendor dirs.
      if (["integrations", "node_modules"].includes(e.name)) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const orig = fs.readFileSync(full, "utf8");
      const next = rewrite(orig);
      if (next !== orig) {
        fs.writeFileSync(full, next);
        touched++;
      }
    }
  }
}

walk(SRC);
console.log(`Files touched: ${touched}`);
console.log(`rounded-{md|lg|xl|2xl|3xl} tokens replaced: ${removed}`);
