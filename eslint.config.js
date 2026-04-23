import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { FORBIDDEN_SYNONYMS } from "./src/content/semantic/forbiddenSynonyms.ts";

// ─────────────────────────────────────────────────────────────────────────────
// M9.7 · Canonical synonyms guard (eslint)
//
// Source of truth for the list: `src/content/semantic/forbiddenSynonyms.ts`
// (which itself mirrors `docs/canonical/10-semantic-core.md` §5 + §14).
//
// We auto-build the regex from that single map so the ESLint rule, the CI
// validator (`scripts/validate-semantic.mjs`) and the docs cannot drift apart.
//
// The rule covers BOTH:
//   - string `Literal` nodes  (e.g. "юнит", 'My UNO')
//   - `TemplateElement` nodes inside template literals (e.g. `\`${x} юнит\``)
//
// Severity:
//   - default scope (warn): canonical-synonym hits across the wider codebase.
//     A full content sweep that drives this to zero is tracked under M9b.
//   - i18n dictionaries (error): src/i18n/{uiStrings,ru,en,th}.ts must already
//     be 100% canonical, so any new violation there blocks the build.
// ─────────────────────────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Compiled case-sensitive — §14 explicitly demands exact casing for brand
// tokens (e.g. canonical `myUNO` vs forbidden `MyUNO`).
const CANONICAL_FORBIDDEN_REGEX = new RegExp(
  `(?:${FORBIDDEN_SYNONYMS.map((r) => escapeRegex(r.forbidden)).join("|")})`,
);

const CANONICAL_FORBIDDEN_MESSAGE =
  "Semantic Core (canonical 10 §5/§14): forbidden synonym. " +
  "Use canonical name from src/content/semantic/forbiddenSynonyms.ts " +
  "(объект, сделка, Chanote, off-plan, escrow, Land Office, ContractAI, ClearView, myUNO).";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 · Canon visual-system regression guards
//
// Source of truth: docs/canonical/05-visual-design-system.md +
// docs/canonical/MIGRATION_TO_CANON_BASELINE.md
//
// Three classes of violations are blocked at lint time so the canonical
// baseline (navy + orange + cream, square corners, no glass) cannot regress:
//   1. Legacy Tailwind palette classes (emerald/teal/cyan/purple/violet/
//      sky/indigo/lime/rose/pink/fuchsia/amber/mint) in className strings.
//   2. backdrop-blur-* utilities (glassmorphism is forbidden by canon §6).
//   3. rounded-{sm,md,lg,xl,2xl,3xl} utilities (canon §5 mandates 0px;
//      rounded-full is allowed for circular avatars/icon chips).
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_PALETTE_REGEX =
  "\\b(?:bg|text|border|from|to|via|ring|divide|placeholder|fill|stroke|shadow|caret|outline|decoration|accent)-(?:emerald|teal|cyan|sky|indigo|purple|violet|fuchsia|pink|rose|lime|mint|amber)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b";

const GLASSMORPHISM_REGEX = "\\bbackdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl))?\\b";

const LEGACY_RADII_REGEX =
  "\\brounded(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![-_a-z0-9])";

const CANON_VISUAL_RULES = [
  {
    selector: `Literal[value=/${LEGACY_PALETTE_REGEX}/]`,
    message:
      "Canon §6: legacy Tailwind palette class is forbidden. Use semantic tokens (bg-primary, text-success, border-accent, etc.) — see docs/canonical/05-visual-design-system.md.",
  },
  {
    selector: `TemplateElement[value.raw=/${LEGACY_PALETTE_REGEX}/]`,
    message:
      "Canon §6: legacy Tailwind palette class in template literal. Use semantic tokens.",
  },
  {
    selector: `Literal[value=/${GLASSMORPHISM_REGEX}/]`,
    message:
      "Canon §6: glassmorphism (backdrop-blur-*) is forbidden. Use solid surfaces with border separators.",
  },
  {
    selector: `TemplateElement[value.raw=/${GLASSMORPHISM_REGEX}/]`,
    message:
      "Canon §6: glassmorphism (backdrop-blur-*) in template literal is forbidden.",
  },
  {
    selector: `Literal[value=/${LEGACY_RADII_REGEX}/]`,
    message:
      "Canon §5: rounded-{sm,md,lg,xl,2xl,3xl} are forbidden — surfaces must be square (0px). Allowed: rounded-full (avatars/icon chips only).",
  },
  {
    selector: `TemplateElement[value.raw=/${LEGACY_RADII_REGEX}/]`,
    message:
      "Canon §5: legacy rounded utility in template literal is forbidden. Use square corners or rounded-full.",
  },
];

const TONE_OF_VOICE_RULES = [
  {
    selector:
      "Literal[value=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
    message:
      "Tone of Voice (canonical 03 §14): forbidden word. Use canonical alternatives (проверенный, выгодный, подходящий, оптимальный).",
  },
  {
    selector:
      "TemplateElement[value.raw=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ые)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
    message:
      "Tone of Voice (canonical 03 §14): forbidden word in template literal.",
  },
];

const CANONICAL_SYNONYM_RULES = [
  {
    selector: `Literal[value=/${CANONICAL_FORBIDDEN_REGEX.source}/]`,
    message: CANONICAL_FORBIDDEN_MESSAGE,
  },
  {
    selector: `TemplateElement[value.raw=/${CANONICAL_FORBIDDEN_REGEX.source}/]`,
    message: `${CANONICAL_FORBIDDEN_MESSAGE} (template literal)`,
  },
];

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      // M7 · Tone of Voice + M9.7 · Canonical synonyms — both at warn for the
      // wider codebase. i18n dictionaries are escalated to `error` below.
      "no-restricted-syntax": ["warn", ...TONE_OF_VOICE_RULES, ...CANONICAL_SYNONYM_RULES],
    },
  },
  // ── M9.7 · Strict canonical guard for i18n dictionaries ──
  // The user-facing string tables MUST stay canonical. Promote violations
  // to errors so any forbidden synonym landing in i18n blocks CI.
  {
    files: ["src/i18n/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...TONE_OF_VOICE_RULES, ...CANONICAL_SYNONYM_RULES],
    },
  },
  // ── Source-of-truth files: opt out of the canonical-synonyms rule ──
  // These files legitimately list forbidden terms as data / regex patterns,
  // so applying the rule to them would create a self-referential lint error.
  {
    files: [
      "src/content/semantic/**",
      "scripts/validate-semantic.mjs",
      "eslint.config.js",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "no-case-declarations": "off",
    },
  },
);
