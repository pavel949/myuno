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
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      // M7 · Tone of Voice (canonical 03 §14) + M9 · Canonical synonyms (canonical 10 §5/§14).
      // Both at warn — full sweep tracked under M9b.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ные)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message: "Tone of Voice (canonical 03 §14): forbidden word. Use canonical alternatives (проверенный, выгодный, подходящий, оптимальный).",
        },
        {
          selector: "TemplateElement[value.raw=/\\b(лучш(ий|ая|ие|ее)|уникальн(ый|ая|ое|ые)|революцион(ный|ная|ное|ые)|revolutionary|только сегодня|не упустите|hurry up|don't miss out|Упс\\b|Oops\\b)\\b/i]",
          message: "Tone of Voice (canonical 03 §14): forbidden word in template literal.",
        },
        {
          selector: "Literal[value=/\\b(юнит|чаноте|котлован|КонтрактAI|ДоговорAI|Клиарвью|КлирВью|MyUNO|My UNO|MYUNO)\\b/]",
          message: "Semantic Core (canonical 10 §5/§14): forbidden synonym. Use canonical name (объект, Chanote, off-plan, ContractAI, ClearView, myUNO).",
        },
        {
          selector: "TemplateElement[value.raw=/\\b(юнит|чаноте|котлован|КонтрактAI|ДоговорAI|Клиарвью|КлирВью|MyUNO|My UNO|MYUNO)\\b/]",
          message: "Semantic Core (canonical 10 §5/§14): forbidden synonym in template literal.",
        },
      ],
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
