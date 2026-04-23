import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

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
      // New code: avoid explicit any; legacy any to be replaced incrementally (P1-T1).
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer @/lib/logger in new code (no-op in production). no-console off to avoid mass warnings until migration.
      "no-console": "off",
      // M7 · Track A — Tone of Voice guard. Forbidden words from canonical doc 03 §14.
      // Level: warn — CI surfaces violations without blocking legacy builds; raise to "error"
      // after sweep of email/WhatsApp templates (M7b).
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message: "Tone of Voice (canonical 03 §14): forbidden word. Rephrase using uiStrings or canonical alternatives (проверенный, выгодный, подходящий, оптимальный).",
        },
        {
          selector: "TemplateElement[value.raw=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message: "Tone of Voice (canonical 03 §14): forbidden word in template literal. Rephrase using canonical alternatives.",
        },
      ],
    },
  },
  // E2E: Playwright fixtures use callback named "use" (not React); allow lexical declarations in case blocks
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "no-case-declarations": "off",
    },
  },
);
