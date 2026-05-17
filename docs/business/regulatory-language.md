# Regulatory Language — myUNO Real Estate Surface

> Pragmatic product-language standard for myUNO public copy.
> **Not legal advice.** When in doubt, ask Pavel or counsel.
>
> Version: 1.0 · Last updated: 2026-05-17 · Owner: Pavel

---

## 1. Why this document exists

myUNO is a commission-first real-estate lead engine: a public portal, a
closed buyer club, and deal rooms. We are **not** running a securities
business, a pooled investment scheme, or a public fundraising vehicle.

Public-facing copy that *sounds* like a securities offering creates
regulatory exposure even when the underlying business is plain
brokerage / marketing. This document defines the words we use and the
words we do not.

It applies to: page titles, hero copy, CTA labels, marketing emails,
landing pages, push notifications, AI agent system prompts, anything a
non-logged-in visitor or unverified user can see.

It does **not** apply to: private internal docs, CRM notes, code
comments, type names, route names, database column names, or anything
behind authenticated developer / partner surfaces — those can keep
operational terminology (e.g. `raise_capital`, `deal_intent`,
`capital_range`) because no public reader sees them.

---

## 2. Hard rules

1. **No promises of return.** Never imply guaranteed, expected, or
   targeted yield, IRR, ROI, or capital appreciation on public copy.
2. **No fundraising language.** Public copy never describes myUNO as
   raising money from the public, pooling investor funds, or operating
   any kind of fund.
3. **No "securities-shaped" framing.** Avoid words that mirror a
   prospectus: *offering*, *subscription*, *issuance*, *units*,
   *shares*, *investors will receive*, *yield to investor*.
4. **Historical / comparable data is allowed, with disclaimer.** We may
   show rental yields, sale comps, or historical performance of
   comparable units when the data exists and is clearly labelled as
   historical, with a "not a guarantee of future performance, not
   financial advice" note nearby.
5. **Buyer club ≠ syndicate.** The closed buyer club is a marketing
   channel for off-plan and resale listings. It is not a co-investment
   vehicle, not a syndicate, not a fund.
6. **Internal slugs may keep operational names.** The `/invest/*`
   routes, `deal_intent='raise_capital'`, and similar identifiers stay
   as-is to avoid breaking routes, types, and the Supabase schema.
   Public copy on those pages is what changes.

---

## 3. Forbidden → Canonical (EN)

| Forbidden | Canonical |
|---|---|
| Investment opportunity | Featured listing · Off-plan project · Deal room |
| Investment product | Listing · Project profile |
| Pitch / Pitch your project | Submit your project · Developer project submission |
| Pitch deck | Project profile |
| Raise funding · Raise capital (public CTA) | List your project with myUNO · Developer project submission |
| Expected returns · Expected yield · Targeted returns | Historical rental yield from comparable units (with disclaimer) |
| Guaranteed return · Guaranteed yield | (never used) |
| Investor returns · ROI promised | Comparable rental performance (with disclaimer) |
| Investors will receive… | Buyers receive… · Owners receive… |
| Securities · Offering · Subscription | (never used on public surfaces) |
| Fund · Fundraise · Capital call | (never used on public surfaces) |
| Investor (when implying capital-markets participation) | Buyer · Buyer club member · Owner |

*Investor* may stay where it describes a buyer persona who is purchasing
real estate directly (e.g. "investors and second-home buyers") — it
becomes risky only when paired with returns / yield / fund language.

---

## 4. Forbidden → Canonical (RU)

| Forbidden | Canonical |
|---|---|
| Инвестиционная возможность | Объект каталога · Off-plan проект · Deal room |
| Питч / Питч проекта | Подать проект · Заявка девелопера |
| Привлечь инвестиции (как публичный CTA) | Разместить проект на myUNO · Заявка девелопера |
| Ожидаемая доходность · Целевая доходность | Историческая доходность сопоставимых объектов (с дисклеймером) |
| Гарантированная доходность | (никогда не используем) |
| Инвесторы получат… · Доход инвестора | Покупатели получают… · Владельцы получают… |
| Ценные бумаги · Размещение · Подписка | (никогда не используем на публичных страницах) |
| Фонд · Сбор средств · Капитал-колл | (никогда не используем на публичных страницах) |
| Инвестор (когда подразумевается участие на рынке капитала) | Покупатель · Член buyer club · Владелец |

---

## 5. Disclaimer text (use near any yield / ROI / capital-related public block)

**EN (short):**
> Historical and comparable data only. Not financial advice and not a
> guarantee of future performance. myUNO is a real-estate marketplace,
> not an investment adviser.

**RU (short):**
> Только историческая статистика и сопоставимые объекты. Это не
> финансовый совет и не обещание будущих результатов. myUNO —
> площадка по недвижимости, а не инвестиционный консультант.

The full DisclaimerNote component (`src/components/legal/DisclaimerNote.tsx`)
renders these strings.

---

## 6. Examples — rewrites we have shipped

| Before | After |
|---|---|
| "Investment Opportunity in Phuket" | "Featured Phuket listing" |
| "Pitch your project" | "Submit your project" |
| "Raise Funding" (public CTA) | "List your project with myUNO" |
| "Expected returns 8–12%" | "Comparable units have shown 6–9% gross rental yield over 2022–2024. Past performance is not indicative of future returns." |
| "Анонимизированная инвестиционная возможность" | "Анонимизированный листинг проекта" |

---

## 7. Enforcement

- Lightweight CI check via `scripts/validate-semantic.mjs` —
  `FORBIDDEN_SYNONYMS` in `src/content/semantic/forbiddenSynonyms.ts`
  carries the regulatory entries flagged at *warning* severity on
  public content surfaces (landings, i18n, knowledge, services, for,
  guides, clearview, landing).
- ESLint surfaces the same patterns inline for `.ts/.tsx` files via
  the existing `no-restricted-syntax` mirror in `eslint.config.js`.
- Reviewers: when reviewing user-facing copy, search the page for the
  forbidden EN/RU terms in §3–§4 before approving.

---

## 8. What this document does **not** cover

- AML / KYC requirements for actual money flows (handled in Stripe +
  Supabase flows, separate review).
- Real-estate licensing (Thai DBD / Phuket Land Office) — separate
  workstream, owned by Pavel.
- Tax language ("tax advice") — covered separately by the Tax Advisor
  agent's system prompt in `docs/canonical/08-ai-prompts-library.md`.
- Internal CRM, deal-room, and ops console copy — those surfaces are
  authenticated and intentionally use operational terms.
