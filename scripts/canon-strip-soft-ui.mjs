#!/usr/bin/env node
/**
 * canon-strip-soft-ui.mjs
 *
 * Phase 7 (canon §8.1, §1.1 — «информация важнее украшения»).
 *
 * Removes soft-UI / Material-style decorative effects from `src/**`:
 *
 *   1. hover/active/focus/group-*:translate-y-*  (карточка «приподнимается»)
 *   2. hover/active/focus/group-*:scale-*         (карточка/кнопка пульсирует)
 *   3. triggerRipple(...) call sites + their `@/hooks/useRipple` imports
 *      — кроме самого `src/hooks/useRipple.ts` (хук остаётся в проекте,
 *      просто никто его больше не вызывает).
 *
 * NOT TOUCHED:
 *   - `transition-*` utilities (canon allows simple colour transitions)
 *   - `animate-*` keyframes (fade-in / accordion-down — это анимации
 *     появления контента, разрешённые tailwind.config)
 *   - non-interactive `scale-*` без префикса (например, `scale-95` в
 *     иконках или `aspect-square scale-x-[-1]` для зеркал)
 *   - `transform-*`, `origin-*` — пусть остаются для CSS-анимаций
 *
 * Idempotent. Mirrors `canon-strip-rounded.mjs` and
 * `canon-strip-glassmorphism.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src");
const RIPPLE_HOOK = path.join(SRC, "hooks", "useRipple.ts");

const PREFIXES = "(?:hover|active|focus|focus-visible|group-hover|group-active|group-focus|peer-hover|peer-focus)";

const CLASS_PATTERNS = [
  // hover:-translate-y-1, group-active:translate-y-0.5, hover:translate-x-[2px], etc.
  {
    id: "translate",
    re: new RegExp(`\\b${PREFIXES}:-?translate-[xy]-[\\w.\\[\\]/-]+\\s?`, "g"),
  },
  // hover:scale-105, active:scale-[0.97], group-hover:scale-x-110, etc.
  {
    id: "scale",
    re: new RegExp(`\\b${PREFIXES}:scale(?:-[xy])?-[\\w.\\[\\]/-]+\\s?`, "g"),
  },
];

let touched = 0;
const stats = { translate: 0, scale: 0, rippleCalls: 0, rippleImports: 0 };

function stripClasses(content) {
  let next = content;
  for (const p of CLASS_PATTERNS) {
    next = next.replace(p.re, () => {
      stats[p.id]++;
      return "";
    });
  }
  // Collapse double spaces inside class strings ("foo  bar" -> "foo bar").
  next = next.replace(/(["'`])([^"'`\n]*?)\1/g, (m, q, body) => {
    if (!/\s{2,}/.test(body)) return m;
    return q + body.replace(/\s{2,}/g, " ").replace(/\s+(["'`])/g, "$1") + q;
  });
  return next;
}

function stripRipple(content, rel) {
  // Don't touch the hook source itself.
  if (rel === path.relative(SRC, RIPPLE_HOOK)) return content;

  let next = content;

  // 1. Remove standalone `triggerRipple(e);` lines.
  next = next.replace(/^[^\S\n]*triggerRipple\s*\([^)]*\)\s*;?\s*\n/gm, () => {
    stats.rippleCalls++;
    return "";
  });

  // 2. Remove inline calls inside arrow handlers: `(e) => { triggerRipple(e); foo(); }`
  //    → leave `(e) => { foo(); }` (statement form already handled above; this
  //    catches single-statement bodies like `onClick={(e) => triggerRipple(e)}`).
  next = next.replace(
    /triggerRipple\s*\([^)]*\)\s*;?\s*/g,
    () => {
      stats.rippleCalls++;
      return "";
    }
  );

  // 3. Remove the import line if no more references remain.
  if (!/\btriggerRipple\b/.test(next)) {
    next = next.replace(
      /^import\s+\{\s*triggerRipple\s*\}\s+from\s+['"]@\/hooks\/useRipple['"]\s*;?\s*\n/gm,
      () => {
        stats.rippleImports++;
        return "";
      }
    );
    // Also handle cases where triggerRipple was part of a multi-import:
    next = next.replace(
      /^(import\s+\{\s*)([^}]*?)\btriggerRipple\b\s*,?\s*([^}]*\}\s+from\s+['"]@\/hooks\/useRipple['"]\s*;?\s*)$/gm,
      (m, head, before, tail) => {
        stats.rippleImports++;
        const cleaned = (before + tail).replace(/,\s*,/g, ",").replace(/\{\s*,/g, "{").replace(/,\s*\}/g, "}");
        return head.trimEnd() + " " + cleaned.trimStart();
      }
    );
  }

  // 4. Tidy: collapse triple+ blank lines created by removals.
  next = next.replace(/\n{3,}/g, "\n\n");

  return next;
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["integrations", "node_modules"].includes(e.name)) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const rel = path.relative(SRC, full);
      const orig = fs.readFileSync(full, "utf8");
      let next = stripClasses(orig);
      next = stripRipple(next, rel);
      if (next !== orig) {
        fs.writeFileSync(full, next);
        touched++;
      }
    }
  }
}

walk(SRC);

console.log(`Files touched:        ${touched}`);
console.log(`hover/active translate-y removed: ${stats.translate}`);
console.log(`hover/active scale removed:        ${stats.scale}`);
console.log(`triggerRipple() calls removed:     ${stats.rippleCalls}`);
console.log(`useRipple imports removed:         ${stats.rippleImports}`);
