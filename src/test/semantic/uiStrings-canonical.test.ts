/**
 * Runtime guard: every string in `src/i18n/uiStrings.ts` (RU + EN) must use
 * canonical lexicon from `src/content/semantic/forbiddenSynonyms.ts`.
 *
 * Why a runtime test on top of the ESLint rule (M9.7):
 *   1. ESLint scans source literals — it can't see strings composed at
 *      module-load time (template concatenation, spread merges from helpers).
 *      This test imports the actual exported object and walks every leaf.
 *   2. ESLint warnings can be silenced with `// eslint-disable-next-line` —
 *      this test cannot. Runtime truth wins.
 *   3. Future i18n additions (e.g. spreading from a remote config) will be
 *      caught the moment a forbidden term enters the live dictionary.
 *
 * Backs canonical 10 §5/§14 (Semantic Core forbidden synonyms map).
 */
import { describe, it, expect } from "vitest";
import { uiStrings } from "@/i18n/uiStrings";
import { FORBIDDEN_SYNONYMS } from "@/content/semantic/forbiddenSynonyms";

type Bilingual = { ru: string; en: string };

/** Walks the uiStrings tree and returns every leaf with its dotted path. */
function flatten(
  node: unknown,
  prefix: string[] = [],
): Array<{ path: string; value: Bilingual }> {
  if (
    node !== null &&
    typeof node === "object" &&
    "ru" in node &&
    "en" in node &&
    typeof (node as Bilingual).ru === "string" &&
    typeof (node as Bilingual).en === "string"
  ) {
    return [{ path: prefix.join("."), value: node as Bilingual }];
  }
  if (node !== null && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, [...prefix, k]),
    );
  }
  return [];
}

const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-sensitive boundary match (mirrors `validate-semantic.mjs`). */
function makePattern(forbidden: string): RegExp {
  return new RegExp(
    `(?:^|[^а-яёa-zа-яё0-9_])${escapeRegex(forbidden)}(?:[^а-яёa-zа-яё0-9_]|$)`,
  );
}

/** Should the rule apply to the given (path, language, text)? */
function ruleApplies(
  rule: (typeof FORBIDDEN_SYNONYMS)[number],
  language: "ru" | "en",
  text: string,
): boolean {
  if (rule.contexts.includes("all")) return true;
  // i18n is user-facing commercial copy — `commercial` rules apply unconditionally here.
  if (rule.contexts.includes("commercial")) return true;
  if (rule.contexts.includes("ru") && language === "ru") return true;
  if (
    rule.contexts.includes("en") &&
    language === "en" &&
    !/[\u0400-\u04FF]/.test(text)
  ) {
    return true;
  }
  return false;
}

describe("uiStrings — canonical lexicon (M9.7 runtime guard)", () => {
  const leaves = flatten(uiStrings);

  it("contains at least one bilingual entry (sanity)", () => {
    expect(leaves.length).toBeGreaterThan(0);
  });

  it.each(leaves)(
    "$path · uses canonical RU + EN lexicon (no forbidden synonyms)",
    ({ path, value }) => {
      const failures: string[] = [];

      for (const language of ["ru", "en"] as const) {
        const text = value[language];
        for (const rule of FORBIDDEN_SYNONYMS) {
          if (!ruleApplies(rule, language, text)) continue;
          if (makePattern(rule.forbidden).test(text)) {
            failures.push(
              `[${language}] "${text}" contains forbidden "${rule.forbidden}" — use "${rule.canonical}" (${rule.source})`,
            );
          }
        }
      }

      if (failures.length > 0) {
        throw new Error(
          `uiStrings.${path} violates canonical lexicon:\n  ${failures.join("\n  ")}`,
        );
      }
    },
  );

  it("every entry has both RU and EN (no missing translations)", () => {
    for (const { path, value } of leaves) {
      expect(value.ru, `uiStrings.${path}.ru must be a non-empty string`).toMatch(/\S/);
      expect(value.en, `uiStrings.${path}.en must be a non-empty string`).toMatch(/\S/);
    }
  });
});
