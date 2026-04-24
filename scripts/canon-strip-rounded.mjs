#!/usr/bin/env node
/**
 * canon-strip-rounded.mjs
 *
 * Phase 6 (canon §5 — square corners only).
 *
 * Rewrites residual non-canonical rounded utilities in `src/**` to
 * `rounded-none`:
 *
 *  - Tailwind size suffixes:        rounded-{md|lg|xl|2xl|3xl}
 *    + directional variants         rounded-[tblr]-{...}, rounded-{tl|tr|bl|br}-{...}
 *  - Arbitrary px/rem/em values:    rounded-[6px], rounded-[14px], rounded-[1rem]
 *    + directional variants
 *  - Legacy CSS-var aliases:        rounded-[var(--radius-md)], rounded-[var(--radius-lg)]
 *    + their compact form           rounded-[var(--card-radius)]
 *
 * KEPT (canon §5):
 *  - rounded-none, rounded-sm  (allowed for mini-badges)
 *  - rounded-full              (avatars, status dots, pill toggles)
 *  - rounded-[var(--radius-full)] / rounded-[9999px]
 *
 * Mirrors `canon-strip-glassmorphism.mjs`. Idempotent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");

const SIZES = "(?:md|lg|xl|2xl|3xl)";

// 1. Tailwind size keywords (base + directional).
const SIZE_PATTERNS = [
  new RegExp(`\\brounded-${SIZES}\\b`, "g"),
  new RegExp(`\\brounded-[tblr]-${SIZES}\\b`, "g"),
  new RegExp(`\\brounded-(?:tl|tr|bl|br)-${SIZES}\\b`, "g"),
];

// 2. Arbitrary px/rem/em values — anything except exactly 0 / 9999px / radius-full.
//    rounded-[14px], rounded-[1.5rem], rounded-tl-[6px], etc.
const ARBITRARY_PATTERNS = [
  /\brounded-\[(?!0(?:px|rem|em)?\]|9999px\]|var\(--radius-full\)\]|var\(--radius-none\)\])[^\]]+\]/g,
  /\brounded-[tblr]-\[(?!0(?:px|rem|em)?\]|9999px\]|var\(--radius-full\)\]|var\(--radius-none\)\])[^\]]+\]/g,
  /\brounded-(?:tl|tr|bl|br)-\[(?!0(?:px|rem|em)?\]|9999px\]|var\(--radius-full\)\]|var\(--radius-none\)\])[^\]]+\]/g,
];

let touched = 0;
let removed = 0;

function rewrite(content) {
  let next = content;
  for (const re of SIZE_PATTERNS) {
    next = next.replace(re, () => {
      removed++;
      return "rounded-none";
    });
  }
  for (const re of ARBITRARY_PATTERNS) {
    next = next.replace(re, () => {
      removed++;
      return "rounded-none";
    });
  }
  // Collapse "rounded-none rounded-none" duplicates.
  next = next.replace(/\b(rounded-none)(\s+rounded-none)+\b/g, "rounded-none");
  return next;
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
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
console.log(`Non-canonical rounded utilities replaced: ${removed}`);
