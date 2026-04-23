#!/usr/bin/env node
/**
 * Canon Cleanup Codemod (Phase 5)
 *
 * Rewrites legacy Tailwind palette classes and rounded-* utilities to
 * canonical semantic tokens. Mirrors the runtime mapping defined in
 * src/styles/canon-overrides.css so the visual output stays identical
 * while letting us shrink that override file.
 *
 * Mapping policy (matches canon-overrides.css §2):
 *   emerald|teal|green|lime|mint   →  success / success-bg / success-fg
 *   cyan|sky|blue|indigo           →  primary navy / info-bg
 *   purple|violet|fuchsia          →  primary / brand-navy-100
 *   pink|rose                      →  cat-wedding tones (kept as accent-pink)
 *   amber|orange|yellow            →  accent / accent-foreground / brand-orange-100
 *
 * Steps (≥500) → solid token. Steps (≤200) → tinted surface.
 *
 * Run:  node scripts/canon-cleanup-codemod.mjs [--dry] [--write]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DRY = process.argv.includes("--dry") || !process.argv.includes("--write");

// ─── Color family → semantic group ──────────────────────────────────────────
const FAMILY = {
  emerald: "success", teal: "success", green: "success", lime: "success", mint: "success",
  cyan: "info", sky: "info", blue: "info", indigo: "info",
  purple: "primary", violet: "primary", fuchsia: "primary",
  pink: "wedding", rose: "wedding",
  amber: "accent", orange: "accent", yellow: "accent",
};

// ─── Step intensity buckets ─────────────────────────────────────────────────
const isLight = (n) => n <= 200;
const isStrong = (n) => n >= 500;

// ─── Token map: (group, prop, intensity) → semantic class ───────────────────
function mapToken(prop, family, step) {
  const group = FAMILY[family];
  const n = parseInt(step, 10);

  // Background: light steps → tinted surface, strong steps → solid
  if (prop === "bg") {
    if (isLight(n)) {
      return {
        success: "bg-success/10",
        info: "bg-primary/10",
        primary: "bg-primary/10",
        wedding: "bg-accent/10",
        accent: "bg-accent/10",
      }[group];
    }
    if (isStrong(n)) {
      return {
        success: "bg-success",
        info: "bg-primary",
        primary: "bg-primary",
        wedding: "bg-accent",
        accent: "bg-accent",
      }[group];
    }
    // mid (300/400) → solid token at lower priority
    return {
      success: "bg-success",
      info: "bg-primary",
      primary: "bg-primary",
      wedding: "bg-accent",
      accent: "bg-accent",
    }[group];
  }

  if (prop === "text") {
    if (isLight(n)) return "text-muted-foreground";
    return {
      success: "text-success",
      info: "text-primary",
      primary: "text-primary",
      wedding: "text-accent",
      accent: "text-accent",
    }[group];
  }

  if (prop === "border") {
    return {
      success: "border-success/40",
      info: "border-primary/40",
      primary: "border-primary/40",
      wedding: "border-accent/40",
      accent: "border-accent/40",
    }[group];
  }

  if (prop === "ring") {
    return {
      success: "ring-success",
      info: "ring-primary",
      primary: "ring-primary",
      wedding: "ring-accent",
      accent: "ring-accent",
    }[group];
  }

  if (prop === "fill") {
    return {
      success: "fill-success",
      info: "fill-primary",
      primary: "fill-primary",
      wedding: "fill-accent",
      accent: "fill-accent",
    }[group];
  }

  if (prop === "stroke") {
    return {
      success: "stroke-success",
      info: "stroke-primary",
      primary: "stroke-primary",
      wedding: "stroke-accent",
      accent: "stroke-accent",
    }[group];
  }

  if (prop === "from") {
    return {
      success: "from-success",
      info: "from-primary",
      primary: "from-primary",
      wedding: "from-accent",
      accent: "from-accent",
    }[group];
  }

  if (prop === "to") {
    return {
      success: "to-success",
      info: "to-primary",
      primary: "to-primary",
      wedding: "to-accent",
      accent: "to-accent",
    }[group];
  }

  if (prop === "via") {
    return {
      success: "via-success",
      info: "via-primary",
      primary: "via-primary",
      wedding: "via-accent",
      accent: "via-accent",
    }[group];
  }

  if (prop === "shadow") {
    return {
      success: "shadow-success/20",
      info: "shadow-primary/20",
      primary: "shadow-primary/20",
      wedding: "shadow-accent/20",
      accent: "shadow-accent/20",
    }[group];
  }

  return null;
}

// Match `prop-family-step` (with optional opacity / variant prefix preserved)
const FAMILY_RE = Object.keys(FAMILY).join("|");
const PROPS = "bg|text|border|from|to|via|ring|fill|stroke|shadow";
const STEP = "(?:50|100|200|300|400|500|600|700|800|900|950)";

const COLOR_RE = new RegExp(
  `\\b(${PROPS})-(${FAMILY_RE})-(${STEP})\\b`,
  "g",
);

// rounded-{sm,md,lg,xl,2xl,3xl} → rounded-none (skip rounded-full / rounded-l-full etc.)
const RADII_RE = /\brounded(?:-(?:tl|tr|bl|br|t|b|l|r))?-(?:sm|md|lg|xl|2xl|3xl)\b/g;
const ROUNDED_BASE_RE = /(^|\s|"|'|`)rounded(?=\s|"|'|`|$)/g;

let totalColor = 0;
let totalRadii = 0;
let touched = 0;
const skipped = new Set();

function rewrite(content) {
  let out = content.replace(COLOR_RE, (full, prop, family, step) => {
    const next = mapToken(prop, family, step);
    if (!next) {
      skipped.add(full);
      return full;
    }
    totalColor++;
    return next;
  });

  out = out.replace(RADII_RE, () => {
    totalRadii++;
    return "rounded-none";
  });

  out = out.replace(ROUNDED_BASE_RE, (m, p1) => {
    totalRadii++;
    return `${p1}rounded-none`;
  });

  return out;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip generated
      if (["integrations", "node_modules"].includes(entry.name)) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      // skip the override file itself & content sources
      if (full.includes(path.join("styles", "canon-overrides.css"))) continue;
      const original = fs.readFileSync(full, "utf8");
      const next = rewrite(original);
      if (next !== original) {
        touched++;
        if (!DRY) fs.writeFileSync(full, next);
      }
    }
  }
}

walk(SRC);

console.log(`Mode: ${DRY ? "DRY-RUN (use --write to apply)" : "WRITE"}`);
console.log(`Files changed: ${touched}`);
console.log(`Color classes rewritten: ${totalColor}`);
console.log(`Radii classes rewritten: ${totalRadii}`);
if (skipped.size) {
  console.log(`Skipped (no mapping): ${[...skipped].slice(0, 10).join(", ")}…`);
}
