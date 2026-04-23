#!/usr/bin/env node
/**
 * Strip residual `backdrop-blur(-*)` utilities from src/**.
 *
 * Phase 5 follow-up. The runtime override in canon-overrides.css already
 * neutralises glassmorphism visually, but ESLint flags 208 occurrences as
 * canon §6 violations. This script removes the token from className strings
 * (and template literals) so the lint warning count drops to ~0.
 *
 * Removes the matched class together with one neighbouring whitespace, then
 * collapses doubled spaces. Skips if the match is the only token in the
 * string (rare; replaces with empty string).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");

const TOKEN = /\s?\bbackdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl))?\b\s?/g;

let touched = 0;
let removed = 0;

function rewrite(content) {
  return content.replace(TOKEN, (match) => {
    removed++;
    // preserve a single space if both sides had whitespace, else nothing
    const leadSpace = /^\s/.test(match);
    const trailSpace = /\s$/.test(match);
    return leadSpace && trailSpace ? " " : "";
  });
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
console.log(`backdrop-blur tokens removed: ${removed}`);
