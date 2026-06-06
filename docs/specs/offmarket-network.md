# Spec — Off‑Market Property Network ("The Circle")

> Status: **DRAFT for review** · Owner: Pavel · Author: Claude · Created: 2026-06-06
> Branch: `claude/offmarket-property-network-jb7qz`
> Gate: must pass the PROJECT.md 5‑test (§2) before any build. Feature‑flagged until GA.

---

## 0 · TL;DR

A **closed, invitation‑only network** where vetted professionals — wealth managers,
family offices, and selected brokers — privately circulate off‑market property
(pocket listings, pre‑market resale, discreet developer inventory) to a curated set
of qualified buyers.

The product is **trust and deal flow**, not engagement. Its defining feature is
**verified anonymity**: a member can transact under a pseudonymous network identity
while the platform holds (and, on a verified deal, can selectively reveal) their real,
KYC'd identity. Members get reach to counterparties they can't access elsewhere, plus a
**provable attribution + commission‑split record** so introductions can't be
circumvented.

This sits inside myUNO's **Invest** cluster as a feature‑flagged surface
(`feature_flag:offmarket_network`). It reuses existing CRM, resale, agent‑deal, and
WhatsApp lead infrastructure — **no greenfield rebuild**.

---

## 1 · Why this, why now

myUNO already runs the demand and supply sides of Phuket property in fragments:
`resale_properties` (with channel‑gating + assignment flags), `agent_deals` (co‑agent
commission splits), `crm_contacts` (agent/partner roles, HNW tier, KYC fields), and an
inbound‑WhatsApp → `consultation_requests` → admin‑notify lead loop. What's missing is
the **closed, trusted layer** that lets professionals share their *best, non‑public*
inventory without losing control of it.

Ignatev Estate / Pavel is the natural first node: existing off‑market inventory, an
existing HNW buyer pipeline, and the credibility to vet the first cohort. The network's
value is curation — so we start curated and stay curated for a long time.

---

## 2 · The 5‑test (PROJECT.md gate)

Fill in with Pavel before build. Draft answers:

| Test | Draft answer |
|---|---|
| **1. Does it serve foreigners managing life on Phuket?** | Indirectly — it serves the professionals (wealth managers / family offices / brokers) who serve HNW foreign buyers & sellers. Supply side of the Invest cluster. |
| **2. Does it deepen an existing vertical or fragment focus?** | Deepens DEALS/Invest. Risk: it's a B2B/pro surface bolted onto a B2C app — must stay walled off behind auth + flag so it doesn't dilute the consumer experience. |
| **3. Is there a monetisation path?** | Yes — membership/access fee, success fee on closed deals, or commission‑split clearing fee. To decide (§12). |
| **4. Can it reuse existing infra?** | Strongly yes (§7). ~70% of plumbing exists. |
| **5. Does it raise trust/quality of the platform, or risk it?** | Both. Off‑market + anonymity = legal/AML/privacy exposure. Trust layer (§8) is the moat *and* the liability. Legal review is a hard gate. |

> **Open decision:** confirm this passes the 5‑test before Phase 1. If Test 2 fails
> (too far from the consumer mission), consider running it as a sibling product rather
> than inside the main app shell.

---

## 3 · Personas & roles

All members are `crm_contacts` with a network‑specific role tier. Three member archetypes:

1. **Originator** — holds inventory (broker with a pocket listing, family office
   quietly offloading, developer with discreet allocation). Wants discreet reach to
   qualified buyers + guaranteed split.
2. **Placer** — holds buyers/capital (wealth manager, family office, buyer's broker).
   Wants curated access to inventory their client can't find on the open market.
3. **Curator (you / desk)** — vets members, moderates listings, brokers intros where
   needed, adjudicates attribution disputes. Initially Pavel + desk; the trust engine.

A single member is frequently **both** Originator and Placer. The role is per‑listing
and per‑intro, not a fixed account type.

**Non‑member roles already in code:** reuse `crm_roles: ['agent','partner']`; add
`network_member` as a tier with sub‑states (see §8 vetting state machine).

---

## 4 · Core concepts / glossary

- **The Circle** — working name for the network surface. (Naming TBD — see open questions.)
- **Network identity (handle)** — a pseudonymous persona (e.g. *"Mercury — Family Office, SG"*)
  shown to other members. Backed by, but decoupled from, the real KYC'd `crm_contact`.
- **Off‑market listing** — a property record that exists in DB but is **never** published
  to the public marketplace; visible only to authenticated, vetted members, often gated
  further (teaser → full reveal after NDA accept).
- **Teaser vs Reveal** — listings have a *teaser layer* (district, type, indicative price
  band, headline ROI — no address, no identifying photos) and a *reveal layer* (address,
  full docs, owner contact) unlocked only after the member accepts terms and is logged.
- **Intro** — a recorded expression of interest connecting a Placer (+ their buyer) to an
  Originator's listing. The atomic unit of attribution.
- **Split agreement** — the commission‑split terms attached to an intro/deal
  (reuses/extends `agent_deals`).
- **Reveal event** — an audited unlock of identity or address, with actor + timestamp +
  reason (the audit‑marker rule from ARCHITECTURE_V2 §13.6 applies).

---

## 5 · The anonymity model (the hard part — design first)

Anonymity here is **pseudonymity with escrowed real identity**, not true anonymity. True
anonymity is incompatible with AML/KYC and with enforceable commission splits. The design
goal: *a member can browse, list, and signal interest without exposing who they are —
until a verified, mutual, logged step requires it.*

### 5.1 Layers of identity

| Layer | Who sees it | Contents |
|---|---|---|
| **L0 — Public** | nobody in‑network sees real PII by default | nothing |
| **L1 — Handle** | all members | pseudonym, role badge(s), coarse region, vetted‑tier badge, reputation signals (deals closed count, on‑platform tenure) — **no name, no firm, no contact** |
| **L2 — Selective reveal** | a specific counterparty, after a mutual unlock on a specific listing/intro | real name, firm, contact channel — scoped to that deal only |
| **L3 — Curator/escrow** | curator + compliance only | full KYC record, real identity, AML status. Always held; never auto‑exposed. |

### 5.2 Rules

1. **Identity is escrowed, never destroyed.** Every member is fully KYC'd at L3 at
   onboarding (reuse `partner_applications` license/tax‑id capture). Anonymity is a
   *display* property, not an *absence of record*.
2. **Reveal is mutual, scoped, and logged.** L2 reveal requires both sides to opt in for a
   specific listing/intro, and writes an immutable `reveal_event` (actor, target, scope,
   timestamp). No silent or one‑way reveal.
3. **Curator can always de‑anonymise at L3** for compliance, dispute resolution, or legal
   request — and that action is itself audited.
4. **Anti‑correlation hygiene.** Teaser listings must be scrubbed of re‑identifying
   signal (exact address, distinctive photos, exact price, agent watermark). A listing so
   unique it identifies its owner can't be meaningfully anonymous — flag at moderation.
5. **One human, one L3 record, many handles allowed?** → **Open question.** Multiple
   handles per person enables abuse (sockpuppet reputation, split‑dodging). Recommend:
   **one handle per KYC identity** at launch; revisit.

### 5.3 What anonymity does NOT cover

- It does **not** exempt anyone from AML/source‑of‑funds on an actual transaction.
- It does **not** survive a closed deal — settlement requires L2 between the principals.
- It is **not** a shield from the curator. Members must accept this in terms at onboarding.

> This section is the single most important design artifact. Build nothing until the
> reveal state machine and the audit model here are signed off (incl. by legal).

---

## 6 · Visibility & listing lifecycle

```
Draft → Submitted → (Moderation) → Live(Teaser) → Reveal‑unlocked(per member)
   → Under‑intro → In‑deal → Closed / Withdrawn / Expired
```

- **Teaser → Reveal** gate: member accepts per‑listing NDA/terms → `reveal_event` logged
  → reveal layer unlocked for that member only.
- **Visibility scoping** (reuse `inventory_listings.published_on_channels`): public
  marketplace channel is **never** in the array; a new `network` channel gates to
  authenticated vetted members. Optionally finer: region‑ or tier‑scoped audiences.
- **Expiry & freshness.** Off‑market inventory goes stale fast; listings auto‑expire and
  must be re‑attested by the originator (keeps the circle's inventory trustworthy).
- **Withdrawal.** Originator can pull a listing; existing reveal_events and intros persist
  (attribution survives withdrawal — anti‑circumvention).

---

## 7 · Reuse map (do NOT build greenfield)

| Capability | Existing asset | Action |
|---|---|---|
| Member records, roles, KYC tier | `crm_contacts` (roles, HNW tier, KYC, relationship_tier A/B/C) | Extend with `network_member` tier + handle link |
| Onboarding / vetting application | `partner_applications` (license, tax_id, status) | Reuse as application intake; add network vetting states |
| Prospecting & AI scoring of candidates | `vendor_prospects` pattern (AI score, engagement, convert) | Reuse pattern to source/score candidate professionals |
| Off‑market listings | `resale_properties` (`is_assignment`, `price_negotiable`, channel‑gating), `inventory_listings` (`exclusive`, `published_on_channels`), `investment_deals` (`*_private`/`*_public` split) | Reuse `published_on_channels` for network‑only visibility; reuse private/public field split for teaser/reveal |
| Intro / deal / commission split | `agent_deals` (agent↔contact↔property, co‑agent splits, commission) | Extend as the attribution + split ledger |
| Inquiry / intro intake | `consultation_requests` + inbound‑WhatsApp webhook | Reuse for buyer‑interest intros & curator notify |
| Outreach tracking | `capital_outreach` / Capital CRM pipeline (stages lead→…→closed) | Reuse pipeline + outreach templates for member comms |
| Messaging | UltraMSG WhatsApp send/receive, Telegram admin alerts | Reuse; route through handle‑masked relay (see §9) |
| Feature gating | `featureFlags.ts` + `system_settings` `feature_flag:*` | New `offmarket_network` flag, default OFF |
| Audit markers | ledger/audit‑marker convention (ARCHITECTURE_V2 §13.6) | Apply to every reveal_event & money‑moving screen |

### New tables likely required (minimal)

- `network_members` — links `crm_contact_id` ↔ `handle`, vetting state, tier, badges,
  reputation counters. (Could be columns on `crm_contacts` instead — decide at data‑model
  review; a separate table keeps the B2C contact schema clean.)
- `network_reveal_events` — immutable audit log of L2/L3 reveals (actor, target, scope,
  reason, ts).
- `network_intros` — Placer + buyer ref → listing → originator, with state + split link.
  (May fold into an extended `agent_deals`.)

Everything else extends existing tables. **Resist adding more.**

---

## 8 · Trust & vetting layer (the moat)

### 8.1 Member state machine

```
Invited → Applied → Under‑review → KYC‑verified → Active
   → Suspended / Revoked   (curator actions, all audited)
```

- **Invite‑only.** No open signup. Invites issued by curator or (later) vouched by an
  existing member (capped, reputation‑weighted).
- **KYC at L3** mandatory before Active (license, firm, tax id, sanctions/PEP screen).
- **Conduct terms** accepted at onboarding: no circumvention, no leaking teasers outside
  the circle, accept curator de‑anonymisation rights, accept split‑honoring obligation.

### 8.2 Anti‑circumvention (why pros will actually share)

The core fear: *"I share my listing/buyer, you cut me out of the deal."* Mitigations:

1. **Immutable intro record** — provable "Handle A introduced Buyer X to Listing Y at
   time T". Survives listing withdrawal and handle changes.
2. **Split agreement attached before reveal** — terms locked at intro time, not
   negotiated after the buyer is known.
3. **Tail period** — if the same buyer/listing pair transacts within N months, the
   recorded split stands (contractual, enforced by terms + the record).
4. **Reputation consequences** — circumvention → suspension/revocation + reputation mark
   visible to the circle. In a curated network, reputation is the enforcement.

### 8.3 Reputation signals (L1, privacy‑safe)

Deals closed (count, not value), tenure, response rate, dispute flags. **No leaderboards,
no vanity feeds** — signals exist to support trust decisions, nothing more.

---

## 9 · Communication (handle‑masked)

Members contact each other **through the platform**, addressed by handle. Two options:

- **A — On‑platform thread** (preferred): messages stored, addressed by handle; real
  identity/contact only surfaced at L2 reveal. Cleanest for audit + anti‑circumvention.
- **B — Masked relay** over existing WhatsApp infra: platform relays between two parties
  without exposing numbers until reveal. Reuses UltraMSG but adds relay complexity.

Recommend **A for MVP** (auditable, simpler privacy story); evaluate B later for reach.

---

## 10 · AI integration (canonical prompts library §08)

- **Teaser scrubber** — AI checks a submitted listing for re‑identifying signal before it
  goes Live (address leakage, distinctive photos, watermark). Moderation assist, not
  auto‑publish.
- **Match/routing** — surface listings to the handles most likely to have a matching
  buyer (reuse role/budget/district signals already in `crm_contacts`). User‑confirmed
  intros only — **never auto‑execute an intro or money move** (ARCHITECTURE_V2 §13.5).
- **Dispute summarisation** — assemble the intro/reveal timeline for curator
  adjudication.

All agent prompts go in `docs/canonical/08-ai-prompts-library.md`.

---

## 11 · Placement & architecture compliance

Per ARCHITECTURE_V2 §13 hard rules:

- **No new top‑level route.** Mount under the **Invest** cluster, e.g.
  `/invest/circle/*` (or under `/operate/*` for the curator desk). Confirm with OVERVIEW.md
  decision tree at design‑model review.
- **No new shell.** Use `MiniAppLayout` (member surface) and the existing Operate shell
  (curator desk).
- **No hardcoded hex.** Tokens only (`src/styles/tokens.css`). Civic‑infra aesthetic; this
  surface should feel restrained and authoritative, not "exclusive‑club flashy."
- **No cross‑cluster imports.** Shared L4 primitives / L3 services only.
- **Audit marker on every reveal & money‑moving screen** (reveal id + actor + ts).
- **Feature‑flagged** (`feature_flag:offmarket_network`) until GA.

---

## 12 · Monetisation (decide before Phase 2)

Options, not mutually exclusive:

1. **Membership/access fee** (annual) — pays for curation; aligns with "access is the
   value." Reuse Stripe subscription rails (`stays_subscription` pattern).
2. **Success fee** on closed deals brokered through the network.
3. **Split‑clearing fee** — platform takes a small cut for holding/enforcing the
   attribution record.

> **Open decision.** A pure access fee is simplest and least legally entangled (you're
> selling curated access, not brokering). Success/clearing fees may implicate brokerage
> licensing — **legal gate.**

---

## 13 · Phased roadmap

**Phase 0 — Concierge validation (no new code).**
Run the circle by hand: curator‑moderated WhatsApp/email group, you broker intros, you
track attribution in a spreadsheet. Prove: (a) pros will share off‑market inventory, (b)
they value curated buyer reach, (c) they'll accept the anti‑circumvention terms. *Kill
criterion: if pros won't share even when you broker, stop.*

**Phase 1 — MVP on existing rails (flagged, curated cohort ≤20).**
- `network_members` + handle/anonymity (L1/L2/L3 + reveal_events).
- Off‑market listing teaser/reveal on `resale_properties`/`inventory_listings` channel‑gating.
- Intro + split record (extend `agent_deals`).
- On‑platform handle‑masked messaging (option A).
- Curator desk in Operate shell: vetting, moderation, dispute view.
- Audit markers everywhere reveals happen.

**Phase 2 — Trust & scale.**
Reputation signals, vouching invites, tail‑period enforcement, AI teaser‑scrubber +
match routing, monetisation rails, expiry/re‑attestation automation.

**Phase 3 — GA / de‑flag** after QA on anonymity edge cases, AML sign‑off, and dispute
flow battle‑testing.

---

## 14 · Risks & non‑goals

**Risks**
- **Legal/regulatory** — brokerage licensing, AML/KYC, data privacy on real people's
  sales. *Hard gate: legal review before Phase 1.*
- **Anonymity ↔ accountability tension** — get the reveal state machine wrong and you
  either leak identities or can't enforce splits. §5 is sign‑off‑first.
- **Cold start** — curation is slow by design; don't "fix" it by opening up (kills the
  trust premium).
- **B2C/B2B bleed** — a pro surface inside a consumer app; keep it fully walled behind
  auth + flag.

**Non‑goals (explicitly out)**
- A social network / feed / engagement product.
- Public listings or any SEO surface (the value is *not* being public).
- Open signup or growth‑hacking the member count.
- Auto‑executed intros or money moves.

---

## 15 · Open questions for Pavel (need answers before data‑model review)

1. **5‑test Test 2** — is a B2B pro surface inside the consumer app acceptable, or should
   The Circle be a sibling product?
2. **Monetisation** — access fee vs success/clearing fee? (drives legal scope)
3. **One handle per identity, or multiple?** (recommend one)
4. **Messaging** — on‑platform only (A) or masked WhatsApp relay (B) for MVP?
5. **Geography** — Phuket‑only at launch, or Thailand/SEA‑wide inventory?
6. **Curator capacity** — who staffs vetting + dispute adjudication at Phase 1 volume?
7. **Naming** — "The Circle" is a placeholder; align with ECOSYSTEM_NAMING.md.

---

*Next step after sign‑off: a data‑model review producing the exact migration set
(`network_members`, `network_reveal_events`, `network_intros` or `agent_deals`
extension) and the reveal/vetting state machines as enums.*
