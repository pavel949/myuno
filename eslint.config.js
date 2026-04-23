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
// Severity is `error` — i18n dictionaries (`src/i18n/uiStrings.ts`,
// `src/i18n/{ru,en,th}.ts`) and any new content must use canonical lexicon.
// ─────────────────────────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Cyrillic terms get \b at boundaries (works because \b respects unicode in JS regex).
// We compile case-sensitive — §14 explicitly demands exact casing for brand
// tokens (e.g. canonical `myUNO` vs forbidden `MyUNO`).
const CANONICAL_FORBIDDEN_REGEX = new RegExp(
  `(?:${FORBIDDEN_SYNONYMS.map((r) => escapeRegex(r.forbidden)).join("|")})`,
);

const CANONICAL_FORBIDDEN_MESSAGE =
  "Semantic Core (canonical 10 §5/§14): forbidden synonym. " +
  "Use canonical name from src/content/semantic/forbiddenSynonyms.ts " +
  "(объект, сделка, Chanote, off-plan, escrow, Land Office, ContractAI, ClearView, myUNO).";

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
      // M7 · Tone of Voice (canonical 03 §14) at warn — full sweep tracked under M9b.
      // M9.7 · Canonical synonyms (canonical 10 §5/§14) at error — list auto-built above.
      "no-restricted-syntax": [
        "error",
        // Tone of Voice (warn-equivalent kept inline; promoted alongside in same rule)
        {
          selector:
            "Literal[value=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message:
            "Tone of Voice (canonical 03 §14): forbidden word. Use canonical alternatives (проверенный, выгодный, подходящий, оптимальный).",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message:
            "Tone of Voice (canonical 03 §14): forbidden word in template literal.",
        },
        // Canonical synonyms — string literals (case-sensitive, auto-built).
        {
          selector: `Literal[value=/${CANONICAL_FORBIDDEN_REGEX.source}/]`,
          message: CANONICAL_FORBIDDEN_MESSAGE,
        },
        // Canonical synonyms — template literal segments (covers `${x} юнит` etc.).
        {
          selector: `TemplateElement[value.raw=/${CANONICAL_FORBIDDEN_REGEX.source}/]`,
          message: `${CANONICAL_FORBIDDEN_MESSAGE} (template literal)`,
        },
      ],
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
