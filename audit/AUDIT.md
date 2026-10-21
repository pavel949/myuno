# myUNO — Production Audit & Forward Requirements

> Read-only audit. No code, migrations, or data were modified. Prepared 2026-07-05 on branch `claude/myuno-production-audit-odkdsa`.
> Every finding separates **evidence** (file:line) from **judgement**. Where evidence is absent it is stated as such; nothing is invented.
> Ranked ruthlessly by impact on **Tier 2** (property sales + PM mandates) and **Tier 3** (owner deal mandates / financing / land), and on relieving the founder bottleneck.

---

## 1. Executive Summary

myUNO is a genuinely large, real application (~521k LOC, 576 pages, 1,022 components, 198 edge functions, 793 migrations, 523 tables) — not a facade. The **operator-side property-management engine is the strongest asset**: real Supabase-backed owner financials, statements, payouts (with Thai WHT/VAT), occupancy/ADR/RevPAR, and a monthly-statement cron. It is demo-ready for the 39-villa pitch. Security has recently been hardened deliberately (three dedicated hardening migrations closed real PII/privilege holes), and Russian localization is genuinely first-class (RU is the base language).

But the platform **does not yet do the one thing the whole strategy hinges on: convert the funnel into buyers.** A purpose-built buyer-intent scoring engine exists — with an on-strategy event catalog and a "ready → WhatsApp Pavel" alert — yet **nothing fires it** (zero callers), and it sits on the agent-CRM side, disconnected from the consumer behavioral data actually being collected. There is no unified relationship spine: consumer identity (`profiles`) and the multi-role CRM (`crm_contacts`) are two tables joined only optionally. The information architecture flattens property/invest into co-equal service tiles with no service→purchase funnel. The consumer concierge is a single-founder WhatsApp funnel — the exact high-season bottleneck — even though round-robin dispatch logic already exists elsewhere in the code. Payments' only automated rail is Stripe card, which fails for Russia-issued cards; the working path is manual and admin-mediated. Tier-3 deal infrastructure is further along than expected (a full `capital_*` CRM + an `investment_deals` funnel) but is **not confidential**: its wall is a client-side, self-assignable-persona guard, private deal data is protected only by a blanket admin policy, and there is no per-deal isolation, NDA, or data-room. Engineering health is "AI-breadth": strict TypeScript off, 761 institutionalized `any`, ~2% test coverage with the money path untested, and schema fragmentation (3 parallel pipelines, 7+ contact tables).

**Overall judgement:** the back-office is ready; the *conversion machine* and the *relationship spine* — the actual sources of Tier-2/3 revenue — are the missing middle. The highest-leverage work is connective tissue, not new features.

---

## 2. Prioritized Issues

Severity key: **CRITICAL** (revenue/data-loss/exposure) · **HIGH** · **MEDIUM** · **LOW**. Effort: **S** (≤2d) · **M** (~1–2wk) · **L** (multi-week).

---

### P1 — Buyer-intent scoring engine is built but wired to nothing
**Severity: HIGH · Effort: M**

**Evidence.** A deterministic intent engine exists with an event catalog that reads straight from the strategy: `read_3_articles_buying` (+15), `investment_calculator` (+20), `contract_uploaded` (+20), `concierge_question_fet` (+25, FET/ownership question), `duediligence_run` (+30), `property_viewed_3x` (+35, "immediate alert to Pavel"); tiers `cold/warm/hot/ready≥86` — `supabase/migrations/20260425043837_*.sql`. The `ready`-tier WhatsApp-to-admin alert is fully built — `supabase/functions/score-lead/index.ts:120-160`. The client hook to fire events exists — `src/hooks/useLeadsFactory.ts:166-194`. **But `useApplyLeadScoreEvent` has zero callers** anywhere in `src`; the only occurrence of any event key is the string `'investment_calculator'` used as a form `request_type`, not wired to the engine — `src/pages/invest/InvestmentCalculatorPage.tsx:84`. Behavioral telemetry *is* collected (`user_sessions`, `page_views` with `time_on_page`, `user_events`; `trackViewItem/Favorite/Search/Booking`) — `src/hooks/useUserTracking.ts:139-225` — but no function reads it to emit score events; `property_viewed_3x` is never computed.

**Why it matters to the objective.** This is the #1 gap. The entire Tier-2 thesis is "identify the funnel customer who is ready to buy property." The mechanism to do it was designed and left unplugged. Repeat/lengthening stays, 3× property views, DD runs, FET questions, calculator use, saved searches — all captured, none scored.

**Proposed solution.** (1) A scheduled edge function (or DB trigger) that translates already-collected `user_events`/`page_views` + favorites/saved-searches into `apply_lead_score_event` calls; (2) fire `useApplyLeadScoreEvent` from the calculator, DD, contract-upload, and concierge-FET touchpoints; (3) confirm the `ready→WhatsApp Pavel` alert path end-to-end. Both endpoints already exist — this is connective tissue.

---

### P2 — No unified CRM relationship spine across the three tiers
**Severity: HIGH · Effort: M**

**Evidence.** The data model *can* carry multi-role relationships: `crm_contacts.crm_roles text[]` with `CRM_ROLES = [owner, tenant, investor, prospect, partner, agent, tourist, resident, developer, buyer, other]` — `src/types/contact.ts:6-19`; migration `20260415140000_crm_contacts_crm_roles_array.sql:11`; plus `segment[]`, `hnw_tier`, `lead_score`, `relationship_tier`, `linked_user_id` — `src/types/contact.ts:154-235`. **But** `crm_contacts` is `company_id`-scoped (agent CRM), and `getOrCreateContact` is called **only from admin/agent surfaces** (`HotelManagementLeadSheet`, `VendorProspectDetail`, `submit-web-form`, `whatsapp-incoming-webhook`, `bulk-import`, `gmail-sync`) — `src/hooks/useCrmContacts.ts:243-273`. Consumer lead/concierge/booking flows never create or link a `crm_contact`. Consumer identity lives separately on `profiles.roles_stack` + `primary_role`. Schema-level fragmentation compounds it: parallel contact stores `crm_contacts` / `contact_identities` / `capital_contacts` / `buyers` / `owner_prospects` / `vendor_prospects`, with reconciliation views `v_unified_contacts` / `v_unified_pipeline` already papering over the split.

**Why it matters.** The crown asset is *owner trust as a graph*. Without one relationship record that auto-accumulates a person's cross-tier history and can be tagged buyer / owner-mandate-giver / investor-with-capital / land-seller, Tier-3 matching ("who has capital for this project") has nothing to run on, and a tourist who becomes a buyer is never recognized as the same person.

**Proposed solution.** Choose **one** canonical contact table (recommend `crm_contacts`, which already has the role model) and one pipeline; auto-create/link a contact via `linked_user_id` for every consumer on signup and on first lead/booking; retire the `v_unified_*` band-aids over time. Resolve `owner_properties` vs `property_owners` duplication first.

---

### P3 — Consumer concierge bottlenecks on one founder; dispatch logic exists but is unwired
**Severity: HIGH · Effort: S–M**

**Evidence.** Consumer concierge submits to `submit-help-request`, which inserts a `help_requests` row and **notifies a single admin WhatsApp + admin emails** — `supabase/functions/submit-help-request/index.ts:114-167` — with an explicit code comment that it does not route ("we only persist help_requests + alert admins; dashboard converts to CRM tasks manually", lines 146-148). `VipConcierge.tsx` opens one WhatsApp link on every CTA — `src/pages/VipConcierge.tsx:200,242,276`. **Round-robin assignment already exists** but only in the agent web-form widget: reads `crm_assignment_rules`, picks `assignees[(last_assigned_index+1) % n]`, updates the pointer — `supabase/functions/submit-web-form/index.ts:101-134`.

**Why it matters.** The brief names the founder as the high-season bottleneck, and the scoring catalog flags concierge FET questions as the *highest-intent* buyer signal — so the bottleneck sits on the most valuable touchpoint. Relief is largely reuse, not new build.

**Proposed solution.** Wire the existing `crm_assignment_rules` round-robin into `submit-help-request`; add a lightweight status/assignee queue on `help_requests` (new → assigned → in_progress → done) with supplier/staff routing by category. Keep the WhatsApp alert but to the assignee, not only the founder.

---

### P4 — Information architecture flattens property/invest into co-equal service tiles; no service→purchase funnel
**Severity: HIGH · Effort: M**

**Evidence.** `src/lib/appRegistry.ts` is a flat `Record` of ~59 co-equal `AppEntry` objects; `property` sits in `groupId:'home'` alongside `cleaning`, `babysitter`, `pets`, `flowers` (`:73-86`) with no tier/weight field. The default guest home surfaces `ROLE_VISIBLE_CLUSTERS = ['arrive','live','legal']` — **property and invest are not on the default guest home** — `src/pages/Index.tsx:37-45`; the "all apps" door frames everything as "14 clusters · 69 services" (`:110-111`). Cross-sell runs the *wrong* way for the objective: `src/lib/crossSellConfig.ts` drives service→service recommendations, and the only property↔service link shows owners a "buy myUNO services" promo — `OwnerPortalPropertyView.tsx:177-188`. No structural funnel routes a service/tourist user toward a property purchase or PM mandate.

**Why it matters.** "Property is the destination, services are the funnel" is the core Tier-2 positioning. The IA states the opposite: a flat grid where a flower tile and a multimillion-baht property are peers, and the buyer journey has no on-ramp.

**Proposed solution.** Add a tier/weight to the registry and elevate property/invest as destinations in nav and home rails; build a forward cross-sell path (buyer-signal → property CTA) that reuses the P1 intent tiers. Pair with P1/P2 so an identified "warm/hot" user is actively surfaced a property path.

---

### P5 — Tier-3 deal module is not confidential: client-side wall, no per-deal isolation, ungated documents
**Severity: HIGH (CRITICAL once real deals load) · Effort: L**

**Evidence.** `/capital` (13 pages, full CRM: pipeline, deals, campaigns, outreach) is gated only by `InvestorGuard` — a **client-side** guard that grants access if the runtime persona stack merely *includes* `investor` — `src/components/auth/InvestorGuard.tsx:38-52`. `capital_*` tables are RLS-scoped `auth.uid() = user_id` (a private per-operator CRM) — `supabase/migrations/20260414120000_capital_crm.sql:40-47`. The public-facing deal funnel `investment_deals` has a good private/public column split and an `anonymized→published` stage flow, but private fields + `documents_urls jsonb` are protected only by a **blanket `has_role('admin')`** policy — `supabase/migrations/20260419010809_*.sql:130-151`; there is **no per-deal, per-investor row isolation**. Grep across migrations for `nda`, `data_room`/`dataroom`, `deal_access_grants`, `exclusivity` returns **no real schema** — only marketing copy in `MandateLanding.tsx` (its own header says "minimal stub … invite-only access will be in M11", lines 1-8) and NDA *strings* in `CapitalAdvisoryLanding.tsx` / `InvestmentBusinessDetail.tsx`. Buyer KYC exists (`devmod-buyer-kyc` → `buyers`, passport OCR) but is **not connected** to deal access.

**Why it matters.** Tier 3 is bespoke, high-confidentiality, built on owner trust. A client-side guard is bypassable (it only redirects the UI), the `investor` persona appears self-selectable in onboarding, and confidential documents are a bare URL array with no NDA/access-grant gating. Mixing this into the consumer app at low isolation is exactly the security + reputational risk the brief warns against.

**Proposed solution.** See §3 (full proposal). Minimum: move access enforcement to RLS keyed on a `deal_access_grants` table; isolate confidential documents in a dedicated bucket gated by grant + KYC + signed NDA; never rely on a client persona for confidentiality.

---

### P6 — Payments: the only automated rail fails for the target (Russian) audience
**Severity: HIGH · Effort: S (UI steer) / M (PSP integration)**

**Evidence.** Stripe is the sole online rail (22 `create-*-checkout` functions; `payment_method_types = ['card','promptpay']` THB else `['card']` — `create-checkout/index.ts:114-123`). Russia-issued Visa/MC decline internationally, so the prominent "card" CTA is effectively dead for the core audience. The working RU path is entirely manual/admin-mediated: `rub_manual` ("manager sends СБП / RU-card details"), bank transfer, crypto/USDT, WhatsApp — `src/components/property/PaymentMethodPicker.tsx:30-67` — settled by an **admin-only** `confirm-manual-payment` recording `amount_rub_actual` and writing ledger entries. "МИР"/"СБП" in the wallet UI are cosmetic labels; **no YooKassa/Tinkoff/Sberbank/CloudPayments SDK exists** anywhere.

**Why it matters.** Every Russian payment needs a human on myUNO's side — another founder-adjacent bottleneck — and the default UI silently fails the exact demographic. It caps self-serve conversion at Tier 1→2.

**Proposed solution.** Short term: detect RU locale/card BIN and steer to `rub_manual` first, demote the card CTA. Medium term: integrate a Russian PSP (YooKassa/CloudPayments) for genuine self-serve SBP/MIR, or a compliant USDT flow.

---

### P7 — Owner-client portal (the 39-villa sales artifact) is the thinnest surface
**Severity: MEDIUM · Effort: S**

**Evidence.** Two owner surfaces exist: the operator cockpit `/mc → OwnerDashboard.tsx` (579 lines, ~30 real widgets) and the **client** portal `/my-property → owner-portal/` (4 pages, read-only) — `src/lib/navConfig.ts:88-93` vs `:128-133`. The client portal is real Supabase-backed (`OwnerPortalDashboard.tsx:26-55`, `OwnerStatementsInbox` real sign/reject), but the per-villa **Maintenance tab is a hardcoded "Coming in next update" stub** — `OwnerPortalPropertyView.tsx:152-157` — and the portal lands on a plain property list, not a revenue/occupancy KPI hero. (`mc/finance/OwnerPayoutsPage.tsx:59` "New payout run" button also has no handler.)

**Why it matters.** The brief names a polished owner dashboard as the tool to close the 39-villa mandate. The *operator* dashboards are demo-strong; the artifact the owner actually sees is the thin one.

**Proposed solution.** Add a revenue/occupancy KPI hero to the portal landing; fill the Maintenance tab from the existing `property_maintenance_schedules`/`property_service_requests` data (already modeled); wire the payout-run button.

---

### P8 — Security: hardening cannot be confirmed against prod; over-broad service-role API; permissive PII policies
**Severity: HIGH (verification) / MEDIUM (each item) · Effort: S–M**

**Evidence.** The two critical hardening migrations wrap every `DROP POLICY`/`ALTER` in `EXCEPTION WHEN OTHERS THEN RAISE NOTICE` — `20260624120000_*.sql:130-137,165-208` — and `20260624140000_*.sql:23-29` drops five name variants of the old `profiles` SELECT policy because names "drifted." If a live policy name didn't match, the drop silently skips and the old permissive policy stays (RLS is permissive-OR). Prod (`kakkwibljrjsawxgnupk`) is Lovable-managed and unreachable from here, so this can't be confirmed. `supabase/config.toml:1` points at the **mirror** `erfwtoavipwjqmylpizt`, not prod — so any local CLI check gives false assurance. `external-data-api` uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS), `Access-Control-Allow-Origin: *`, GET/POST/PATCH/DELETE over `crm_contacts`/`crm_companies`/`providers`/`properties` behind a **single static `EXTERNAL_API_TOKEN`** — `supabase/functions/external-data-api/index.ts:1-52`. `contact_identities` / `contact_identity_links` carry `TO authenticated USING (true)` — `20260424045317_*.sql:287` (claimed superseded by `20260624140000:180-190`, subject to the same verification gap). Dual role model (`profiles.user_type` vs `user_roles`) allowed self-escalation until a trigger fix on `20260629160000`. Weak CSP: `connect-src *`, `frame-ancestors *`, `unsafe-inline/eval` — `vite.config.ts:88`. **Positives:** `has_role` is the correct SECURITY-DEFINER pattern (`20260108232401_*.sql:28-41`); no `service_role` key in `src/`; financial RPCs locked (`process_payout` admin-guarded, `record_ledger_entries` service-role-only — `20260624120000`).

**Why it matters.** A CRM/property/deal app leaking PII is existential to owner trust. The gate that closed the leaks can't be verified from source, and the highest-blast-radius surface (`external-data-api`) is one leaked static token from full CRM read/write.

**Proposed solution.** Run one live check against prod: `SELECT schemaname,tablename,policyname,qual FROM pg_policies WHERE qual='true' OR qual IS NULL;` and confirm no permissive duplicates on `profiles`, `contact_identities`, `pipeline_stage_history`, `founder_daily_brief`, `reconciliation_alerts`. Rotate `EXTERNAL_API_TOKEN` to scoped/short-lived, drop DELETE, tighten CORS, add rate limiting. Fix `config.toml` project ref. Migrate `user_type`-based gates to `user_roles`.

---

### P9 — Schema fragmentation will make any new module "pipeline #4"
**Severity: MEDIUM–HIGH · Effort: L**

**Evidence.** 523 tables. **Three parallel deal/pipeline systems**: `crm_pipelines`, `agent_deals`/`deal_pipeline_stages`, `investment_deals`/`capital_pipeline`. **7+ parallel contact stores** (listed in P2). Redundant `owner_properties` **and** `property_owners`. `v_unified_contacts` / `v_unified_pipeline` are union-view band-aids someone already added on hitting this wall. (Source: `src/integrations/supabase/types.ts` table enumeration.)

**Why it matters.** The buyer-CRM (P1/P2), dispatch (P3), and deal module (P5/§3) all need to bind to *a* pipeline and *a* contact table. Without picking a canonical one first, each addition deepens the fragmentation and the `v_unified_*` views keep multiplying.

**Proposed solution.** Before building, declare the canonical contact table + pipeline (recommend `crm_contacts` + one pipeline); write an ADR; migrate incrementally behind the unified views; resolve the `owner_properties`/`property_owners` duplication.

---

### P10 — Money-flow code is effectively untested and TypeScript strictness is off
**Severity: MEDIUM · Effort: L**

**Evidence.** 50 unit/component test files for 2,428 source files (~2%); 17 Playwright specs. Tests skew to taxonomy/IA/content guards, not behavior; **no unit tests cover checkout/payment/ledger** — the exact area patched by the last two audit-fix PRs (#23), which shipped without regression tests. `tsconfig.app.json`: `strict:false`, `noImplicitAny:false`, `strictNullChecks:false` — contradicting CLAUDE.md §5. CI baseline `BASELINE_ANY: 761` (`.github/workflows/cleanup-metrics.yml:81`) is a ratchet that enshrines 761 `any` as the floor. 83 sites destructure `data` while discarding `error` (silent-failure candidates).

**Why it matters.** The money screens are what close mandates (Tier 2/3). They have the least type-safety and the least test protection, and null/shape bugs are exactly what strict-off hides.

**Proposed solution.** Add regression tests to the checkout→ledger→payout path first; begin a `strictNullChecks` migration file-by-file; sweep the 83 error-discarding destructures in money/booking flows.

---

### P11 — Dead-code and builder-junk sprawl
**Severity: LOW–MEDIUM · Effort: S**

**Evidence.** knip: 49 unused files (dead `src/components/home/*`, `src/lib/mcp/*`, `spine*`, duplicate persona maps) + 8 unused deps. Three home-page generations (`Index.tsx` + `IndexV2.tsx` + inline `IndexLegacy`, V2 admin-flag-only — `Index.tsx:157`); 7+ onboarding entry points; 26 dead `_archive` edge functions still shipped; 3.5 MB `archive/` + `tmp/`/`mnt/`/`.lovable` planning artifacts tracked in git. Giant files past the repo's own 800-line rule (`AnimatedRoutes.tsx` 863 lines/456 routes; `owner/ContactDetail.tsx` 78 KB).

**Why it matters.** Not dangerous, but it inflates every grep, refactor, and build — and the connective-tissue work above touches routing, CRM, and home surfaces where the dead generations live.

**Proposed solution.** Delete the knip-identified files, `_archive` functions, and `archive/`/`tmp/` from git; collapse home-page generations; split the giant registries.

---

## 3. Deal & Mandate Module Proposal (Tier 3)

### (1) What exists today
Not a confidential mandate module, but real bones: **`investment_deals`** (`20260419010809_*.sql`) with a private/public column split (`submitter_*`, `title_private`, `documents_urls jsonb` vs `teaser_public`, `location_display`), `deal_intent` enum (`raise_capital/find_buyer/find_partner/business_sale/…`), an IB-style `deal_pipeline_status` (`submitted→under_review→anonymized→published→interest_received→matched→term_sheet→closed→dead`), a public-safe view `v_investment_deals_public`, and a trigger fanning submissions into `crm_contacts` + `agent_deals`. A full **`capital_*` operator CRM** (13 `/capital` pages, `capital_pipeline/contacts/projects/campaigns/outreach`) RLS-scoped `auth.uid()=user_id`. **`agent_deals`** company-scoped CRM pipeline with commission/exclusivity-adjacent fields. **Buyer KYC** (`devmod-buyer-kyc` → `buyers`, passport OCR, `kyc-documents` private bucket scoped by `auth.uid()` folder). A **document-visibility primitive** already exists: `project_documents.visibility ∈ {public, kyc, private}` with per-project-folder storage RLS — `supabase/migrations/20260705040349_*.sql`. **Absent:** any `deal_mandates`, `nda`/e-sign, `deal_access_grants`, per-deal/per-investor row isolation, or confidential data-room gating. `MandateLanding.tsx` self-describes as a stub; NDA/data-room are copy strings only. The `/capital` wall is client-side (P5).

### (2) Proposed data model (new, isolated tables — build on `investment_deals` as the spine)
- **`deal_mandates`** — `id, contact_id → crm_contacts, deal_id → investment_deals, mandate_type (financing | land_sale | equity | jv), exclusivity bool, exclusivity_start/end, commission_terms jsonb, timeline jsonb, deadlines jsonb, status, signed_document_id, created_by`.
- **`deal_access_grants`** — `id, deal_id, contact_id (or user_id), scope (teaser | kyc | full_dataroom), granted_by, granted_at, expires_at, nda_signature_id, kyc_status`. **This table, not a client guard, is the confidentiality boundary** — every RLS policy on confidential deal data and documents references it.
- **`deal_ndas`** — `id, deal_id, contact_id, template_id, status (sent | viewed | signed | declined), signed_at, signature_data, audit jsonb`. (Reuse the existing signature infrastructure — `signature_request_signers` already backs owner statements.)
- **`deal_documents`** — reuse the `project_documents` pattern: `deal_id, title, visibility (teaser | kyc | dataroom), file_path` in a dedicated **private `deal-dataroom` bucket**, storage RLS gated on a matching `deal_access_grants` row (not on a bare URL).
- **`deal_document_access_log`** — append-only `who/what/when/ip` for full audit trail (regulatory requirement).
- **`investor_profiles`** — extend/link `crm_contacts` with `investment_capacity_usd, mandate_appetite (land/financing/equity), kyc_status, accreditation, jurisdiction` for matching.
- **`deal_activities`** — stage changes, reminders, teaser sends, owner status updates (audit + the "ping when a deal stalls" source).

### (3) Proposed module & access architecture — separate, private, connected
- **Separate app section**, not a consumer route: a distinct `/deals` (or hardened `/capital`) workspace with its own layout — reuse `CapitalLayout` but **replace `InvestorGuard` with server-enforced authorization**.
- **RLS is the wall, not the client.** Every confidential table (`deal_mandates`, `deal_documents`, private `investment_deals` columns) enforced by policies keyed on `deal_access_grants` + `has_role('capital_team'|'admin')` — the `investor` *persona* must never grant confidentiality. Confidential documents live in a dedicated bucket with grant-based storage RLS (the `project_documents.visibility` + folder-RLS pattern already proves the shape).
- **Connected to the shared CRM spine (P2).** `deal_mandates.contact_id` and investor matching both point at the single canonical `crm_contacts` — same trust graph, extended roles (`land_seller`, `mandate_giver`, `investor`) — so a trusted owner flows Tier 1→2→3 as one relationship.
- **No consumer exposure.** Public sees only `v_investment_deals_public` teasers; the data room is unreachable without a signed NDA + KYC + explicit grant.

### (4) Automation feature list, ranked by value
1. **Mandate intake & registry** (terms, exclusivity, commission, deadlines) — the system of record; unblocks everything. **High.**
2. **NDA + KYC-gated data room** (access-grant-driven documents + full audit log) — the confidentiality product itself; also the compliance backbone. **High.**
3. **Deal pipeline stages + stall reminders** (ping owner/operator when a deal sits N days) — directly sustains momentum; `investment_deals` already has the stage enum. **High.**
4. **Auto-generated teaser / one-pager** from a mandate record (the `title_private`→`teaser_public` split already exists) — scales the founder. **Medium–High.**
5. **Investor matching from the CRM** ("who buys land in this range / has capital for this project") — needs `investor_profiles` + the unified spine. AI-assisted ranking, human-confirmed. **Medium.**
6. **Owner status updates** (automated stage/interest digests to the mandate-giver) — sustains trust, low effort once activities exist. **Medium.**

> Automate scaffolding only — never relationships or judgement. Matching *suggests*; a human introduces. Money moves stay user-confirmed with audit markers (per CLAUDE.md hard rules).

### (5) Compliance checklist the build must satisfy
- [ ] **Legal counsel sign-off before the module touches a single real deal.** The tool must not imply it substitutes for legal/financial advice.
- [ ] **Securities / financial-promotion risk:** raising financing may be a regulated activity in Thailand *and* in investors' home jurisdictions. Gate financing mandates behind counsel-approved disclaimers; restrict who can view "raise_capital" deals; log every disclosure.
- [ ] **Thai foreign land-ownership:** foreigners generally cannot hold freehold land — model leasehold / Thai-company / BOI structures explicitly in `mandate_type` and teaser copy; never imply freehold to a foreign buyer.
- [ ] **Investor KYC** required before any `full_dataroom` grant (wire the existing `devmod-buyer-kyc`/`kyc-documents` pipeline to `deal_access_grants`).
- [ ] **NDA before disclosure:** signed `deal_ndas` row required for `kyc`/`dataroom` scope.
- [ ] **Full audit trail:** append-only access + document-view logs (`deal_document_access_log`).
- [ ] **Mandate documentation:** signed `deal_mandates` with exclusivity/commission retained.
- [ ] **Data residency / retention** policy for confidential documents; deletion honored on mandate close.
- [ ] **Confidentiality isolation verified by RLS test** (extend the existing `mc-hard-suite/rls-isolation` test pattern to deal tables).

---

## 4. Quick Wins vs Structural Work

### Quick wins (days, high leverage, low risk)
- **Run the live `pg_policies` prod check** (P8) — one query resolves the biggest unknown in the audit.
- **Fix `config.toml` project ref** to prod (P8) so tooling stops targeting the mirror.
- **Rotate/scope `EXTERNAL_API_TOKEN`, drop DELETE, tighten CORS** (P8).
- **RU payment steer:** demote the card CTA, surface `rub_manual` first for RU locale (P6, S half).
- **Owner-client portal polish:** KPI hero on landing + fill Maintenance tab from existing data + wire payout-run button (P7).
- **Delete dead code / builder junk** (knip 49 files, `_archive` functions, `archive/`+`tmp/`) (P11).
- **Wire round-robin dispatch** from `submit-web-form` into `submit-help-request` (P3, first half).

### Structural work (weeks, foundational)
- **Buyer-signal wiring:** behavioral-events → `apply_lead_score_event`; fire from key touchpoints; confirm ready-alert (P1).
- **Unify the CRM spine:** pick canonical contact + pipeline; auto-create/link `crm_contacts` for every consumer; retire `v_unified_*` band-aids (P2, P9).
- **Re-architect Tier-3 confidentiality:** `deal_access_grants`-driven RLS, NDA/KYC-gated data room, dedicated bucket; replace client guard (P5, §3).
- **IA realignment:** tier/weight the registry, elevate property/invest, build the service→purchase funnel (P4).
- **Money-path tests + `strictNullChecks` migration** (P10).
- **Russian PSP integration** for self-serve payments (P6, M half).

---

## 5. Recommended Action Sequence

**First (this week — verify & de-risk, mostly quick wins).**
1. Live `pg_policies` prod check + fix `config.toml` + rotate/scope `external-data-api` (P8). This is data-protection and it's cheap. *An unverified PII policy outranks everything below.*
2. Wire the buyer-signal engine (P1) — the single highest-ROI change; the machine is built, only unplugged.
3. Owner-client portal polish (P7) — the 39-villa mandate is a live, dated opportunity.

**Second (next — the spine and the bottleneck).**
4. Declare the canonical contact/pipeline and start unifying the CRM spine (P2/P9) — prerequisite for both buyer-CRM and Tier-3 matching.
5. Wire concierge dispatch (P3) — relieves the founder bottleneck before high season.
6. IA realignment + forward funnel (P4), consuming the now-live intent tiers.
7. RU payment steer now; PSP integration scoped (P6).

**Third (structural, after sign-off — the crown).**
8. Build the Tier-3 deal/mandate module per §3, **with legal counsel engaged before it touches a real deal** (P5). Do this *after* the CRM spine exists so it binds to the canonical contact table, not a new fragment.
9. Money-path tests + `strictNullChecks` migration (P10); dead-code deletion alongside (P11).

**Explicitly defer.**
- Full `strict:true` TypeScript conversion beyond `strictNullChecks` — high churn, low near-term revenue impact.
- Off-Lovable migration (see companion portability finding): **mostly ready but not turnkey** — blocked on confirming direct DB/`auth.users` export rights from Lovable and rewriting 48 AI edge functions off the Lovable gateway. Verify export rights now (an email), but sequence the migration *after* the revenue work above. Do **not** start it reactively.
- Deep vertical build-out of low-signal service verticals — prune before deepening; they are funnel, not objective.

---

*End of audit. No implementation performed. Awaiting sign-off before any code changes.*
