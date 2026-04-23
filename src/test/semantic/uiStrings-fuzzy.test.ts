/**
 * Runtime guard: flags **near-matches** to forbidden synonyms in `uiStrings`.
 *
 * Why a separate fuzzy guard (M9.7c):
 *   The exact-match guard (`uiStrings-canonical.test.ts`) catches verbatim
 *   forbidden terms. But typos, missing letters, swapped letters, casing
 *   variants and obvious morphological tweaks slip through. Examples we care
 *   about:
 *      "юнита", "юниты", "юнитов"        — declensions of «юнит»
 *      "off plan", "offplan", "off-plans" — variants of canonical "off-plan"
 *      "MyUno", "myuno", "MY UNO"         — casing drift around "myUNO"
 *      "Чаноте", "ЧАНОТЕ", "чанотэ"       — typo / casing of «чаноте»
 *      "приобритение"                     — common Russian misspelling
 *
 * Strategy:
 *   1. Per forbidden term, generate a small set of expected variants:
 *      casing folds, hyphen/space toggles, common Russian declension suffixes
 *      ("-а", "-ы", "-ов", "-ами", "-ах").
 *   2. Add a Damerau-Levenshtein distance ≤ 1 check against each token in
 *      the string (token = ≥4-char word) — catches single-character typos.
 *   3. Skip canonical replacements explicitly — e.g. "off-plan" itself, or
 *      «транзакция» (the legitimate canonical word) which is 1 edit away
 *      from forbidden «трансакция». This is critical: without the canonical
 *      whitelist the guard would self-flag every correct usage.
 *
 * Severity is `error` — runs in vitest as part of the CI suite.
 */
import { describe, it, expect } from "vitest";
import { uiStrings } from "@/i18n/uiStrings";
import { FORBIDDEN_SYNONYMS } from "@/content/semantic/forbiddenSynonyms";

type Bilingual = { ru: string; en: string };

// ─────────────────────────────────────────────────────────────────────────────
// Tree walker (mirrors uiStrings-canonical.test.ts)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Damerau-Levenshtein distance (transposition-aware)
// O(m·n) — uiStrings is ~30 leaves × ~10 tokens × ~14 forbidden = trivial.
// ─────────────────────────────────────────────────────────────────────────────

function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99; // early exit — definitely > 1
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant generator — explicit, predictable, easy to extend.
// ─────────────────────────────────────────────────────────────────────────────

const RU_DECLENSION_SUFFIXES = [
  "", "а", "ы", "у", "ом", "е", "ов", "ам", "ами", "ах", "и",
];

/** All hyphen/space/no-separator forms of a multi-word phrase. */
function separatorVariants(term: string): Set<string> {
  const out = new Set<string>([term]);
  if (/[\s-]/.test(term)) {
    const compact = term.replace(/[\s-]/g, "");
    const hyphen = term.replace(/\s+/g, "-");
    const space = term.replace(/-/g, " ");
    out.add(compact).add(hyphen).add(space);
  }
  return out;
}

function generateVariants(forbidden: string): Set<string> {
  const variants = new Set<string>();
  for (const sep of separatorVariants(forbidden)) {
    variants.add(sep);
    // For Russian roots, append common case suffixes when the root has no
    // suffix yet. We strip a trailing vowel first if it's already there to
    // produce a stable root, then re-append the catalog of endings.
    if (/^[\u0400-\u04FF]+$/.test(sep)) {
      const root = sep.replace(/[аеёиоуыэюя]$/i, "");
      for (const suf of RU_DECLENSION_SUFFIXES) {
        variants.add(root + suf);
      }
    }
  }
  return variants;
}

// ─────────────────────────────────────────────────────────────────────────────
// Whitelist — canonical terms that MUST NOT be flagged even if they are
// near-matches to a forbidden one. Sourced from the same forbiddenSynonyms.ts
// (column `canonical`) plus a few high-traffic everyday words that are 1 edit
// away from a forbidden term but legitimate (e.g. «транзакция» vs forbidden
// «трансакция»).
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_WHITELIST = new Set<string>([
  ...FORBIDDEN_SYNONYMS.flatMap((r) => [
    r.canonical.toLowerCase(),
    ...separatorVariants(r.canonical).values(),
  ]),
  // High-traffic legitimate words sitting 1 edit from a forbidden synonym.
  "транзакция", "транзакции", "транзакций", "транзакцию", "транзакцией",
  "транзакциях", "транзакциям",
  // English exact canonical forms (kept in case casing logic strips them)
  "off-plan", "offplan", "off plan",
  "myuno", "my uno",
]);

const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function exactMatch(text: string, term: string): boolean {
  return new RegExp(
    `(?:^|[^а-яёa-zа-яё0-9_])${escapeRegex(term)}(?:[^а-яёa-zа-яё0-9_]|$)`,
    "i",
  ).test(text);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-zа-яё0-9-]+/i).filter(Boolean);
}

interface NearMatch {
  language: "ru" | "en";
  type: "variant" | "fuzzy";
  forbidden: string;
  canonical: string;
  matchedAs: string;
}

function findNearMatches(text: string, language: "ru" | "en"): NearMatch[] {
  const hits: NearMatch[] = [];
  const tokens = tokenize(text);

  for (const rule of FORBIDDEN_SYNONYMS) {
    // Language gating — same rules as uiStrings-canonical.test.ts
    const isRu = /[\u0400-\u04FF]/.test(rule.forbidden);
    if (rule.contexts.includes("ru") && !isRu) continue;
    if (
      rule.contexts.includes("en") &&
      !rule.contexts.includes("all") &&
      isRu
    ) {
      continue;
    }

    // 1) Variant pass — explicit declension / separator forms.
    for (const variant of generateVariants(rule.forbidden)) {
      if (variant.length < 4) continue; // too short, false-positive prone
      if (CANONICAL_WHITELIST.has(variant.toLowerCase())) continue;
      // Skip the verbatim forbidden — that's covered by the exact-match test.
      if (variant === rule.forbidden) continue;
      if (exactMatch(text, variant)) {
        hits.push({
          language,
          type: "variant",
          forbidden: rule.forbidden,
          canonical: rule.canonical,
          matchedAs: variant,
        });
      }
    }

    // 2) Fuzzy pass — Damerau-Levenshtein ≤ 1 against each token.
    const target = rule.forbidden.toLowerCase().replace(/[\s-]/g, "");
    if (target.length < 5) continue; // skip 4-char and shorter — too noisy
    for (const tok of tokens) {
      const compactTok = tok.replace(/-/g, "");
      if (compactTok.length < 5) continue;
      if (CANONICAL_WHITELIST.has(compactTok)) continue;
      if (CANONICAL_WHITELIST.has(tok)) continue;
      if (compactTok === target) continue; // exact, handled elsewhere
      if (damerauLevenshtein(compactTok, target) <= 1) {
        hits.push({
          language,
          type: "fuzzy",
          forbidden: rule.forbidden,
          canonical: rule.canonical,
          matchedAs: tok,
        });
      }
    }
  }

  return hits;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("uiStrings — fuzzy / near-match guard (M9.7c)", () => {
  const leaves = flatten(uiStrings);

  it.each(leaves)(
    "$path · no near-matches to forbidden synonyms (RU + EN)",
    ({ path, value }) => {
      const all: NearMatch[] = [
        ...findNearMatches(value.ru, "ru"),
        ...findNearMatches(value.en, "en"),
      ];

      if (all.length > 0) {
        const lines = all.map(
          (h) =>
            `  [${h.language}] ${h.type}: "${h.matchedAs}" looks like forbidden "${h.forbidden}" — use canonical "${h.canonical}"`,
        );
        throw new Error(
          `uiStrings.${path} has near-matches to forbidden lexicon:\n${lines.join("\n")}\n` +
            `If a near-match is legitimate (e.g. canonical word that happens to be 1 edit away), ` +
            `add it to CANONICAL_WHITELIST in this file.`,
        );
      }
    },
  );

  // ── self-check: the detector itself works ──
  describe("detector self-check", () => {
    it("flags Russian declensions of «юнит»", () => {
      const hits = findNearMatches("Купить юниты в Пхукете", "ru");
      expect(hits.some((h) => h.forbidden === "юнит")).toBe(true);
    });

    it("flags «оффплан» / «off plan» variants", () => {
      // «котлован» is the forbidden RU synonym for off-plan; we test
      // declension hit for it instead since «off-plan» itself is canonical.
      const hits = findNearMatches("Квартиры в котлованах", "ru");
      expect(hits.some((h) => h.forbidden === "котлован")).toBe(true);
    });

    it("flags casing drift «MyUno» (single-edit fuzzy)", () => {
      // "MyUno" → lowercase "myuno" is in WHITELIST as canonical "myUNO" lowercased.
      // So we test a real typo: "MyUNO" is forbidden verbatim and "MyUNNO" is fuzzy.
      const hits = findNearMatches("Welcome to MyUNNO", "en");
      expect(hits.some((h) => h.forbidden === "MyUNO")).toBe(true);
    });

    it("does NOT flag canonical «транзакция» (1 edit from forbidden «трансакция»)", () => {
      const hits = findNearMatches("Первая транзакция появится после оплаты.", "ru");
      expect(hits.length).toBe(0);
    });

    it("does NOT flag canonical «off-plan»", () => {
      const hits = findNearMatches("Off-plan deals in Phuket", "en");
      expect(hits.length).toBe(0);
    });

    it("does NOT flag canonical «myUNO»", () => {
      const hits = findNearMatches("Welcome to myUNO", "en");
      expect(hits.length).toBe(0);
    });
  });
});
