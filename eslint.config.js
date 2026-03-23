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
      "no-console": "off",
    },
  },
  // Phase B: discourage raw console in hooks + lib (use @/lib/logger)
  {
    files: ["src/hooks/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/logger.ts",
      "src/lib/errorHandler.ts",
      "src/lib/finance/__test_run__.ts",
    ],
    rules: {
      "no-console": "warn",
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
