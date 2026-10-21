# Lovable build prompt — Off-Market Property Network ("The Circle")

> Paste the **MASTER PROMPT** below into Lovable (myUNO project). It builds the Phase-1
> MVP as a single feature-flagged module. Then run the **FOLLOW-UP PROMPTS** one at a
> time for Phase-2 pieces. Source of truth: `docs/specs/offmarket-network.md`.
>
> ⚠️ Lovable is connected to the **production** Supabase (`kakkwibljrjsawxgnupk`). The
> prompt is deliberately scoped to additive, RLS-locked, feature-flagged changes so it
> cannot affect the live consumer app.

---

## MASTER PROMPT (copy everything between the lines)

---

**Context.** You are extending the existing myUNO superapp (React 18 + TypeScript + Vite +
Tailwind 3.4 + shadcn/ui + Supabase). Build a new, self-contained, **feature-flagged**
module: an invitation-only off-market property network for vetted professionals (wealth
managers, family offices, brokers), codename **"The Circle"**. Do NOT modify or break any
existing consumer feature. All work is additive.

**Hard guardrails — follow every one:**
- Gate the entire module behind a feature flag `feature_flag:offmarket_network` in the
  `system_settings` table (default OFF). Read it via the existing feature-flag hook; if
  the project has `useFeatureFlags`, use it, otherwise create a `useFeatureFlag('offmarket_network')`
  hook that reads `system_settings`. Hide all routes/nav when OFF.
- Use the existing Supabase client at `src/integrations/supabase/client.ts`. Never create
  a new client instance. Never hardcode keys.
- **Schema changes must be additive only.** Create new tables prefixed `network_`. Do not
  alter or drop existing tables. Every new table MUST have Row Level Security enabled with
  explicit policies (defined below). No table is ever world-readable.
- Use design tokens only (`src/styles/tokens.css`): `bg-background`, `text-foreground`,
  `bg-primary`, `text-accent`, `bg-card`, `border-border`. No hardcoded hex. Sharp corners
  (`--radius: 0`). Aesthetic: calm, authoritative, civic-infrastructure — NOT a flashy
  "exclusive club". Fonts: Source Serif 4 (headings), Geist (body), IBM Plex Mono (numbers).
- Mobile-first (375px). On mobile use shadcn `Sheet` (bottom), not `Dialog`. Min touch
  target 44×44.
- Bilingual: every user-facing string in both Russian and English via the existing i18n
  system.
- Wrap every Supabase call in try/catch with a toast on error and a skeleton/spinner
  loading state.
- Mount routes under the Invest cluster: `/invest/circle/*`. Reuse the existing app
  layout/shell — do not invent a new shell.
- Any screen that reveals identity or moves money must render an audit marker
  (event id + actor + timestamp).

---

### 1 · Data model (create these Supabase tables + RLS)

Create an enum `network_member_state`: `invited | applied | under_review | kyc_verified | active | suspended | revoked`.
Create an enum `network_listing_state`: `draft | submitted | moderation | live | under_intro | in_deal | closed | withdrawn | expired`.
Create an enum `network_intro_state`: `proposed | accepted | declined | in_deal | closed_won | closed_lost`.
Create an enum `network_reveal_scope`: `identity | address | both`.

**`network_members`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid` (FK to auth.users, nullable until claimed)
- `crm_contact_id uuid` nullable (link to existing `crm_contacts` if present)
- `handle text unique not null` — pseudonym shown to other members (e.g. "Mercury")
- `role_badges text[]` — subset of {originator, placer, curator}
- `region text` — coarse, e.g. "Phuket", "Singapore"
- `state network_member_state not null default 'invited'`
- `tier text default 'standard'`
- `deals_closed int default 0`, `joined_at timestamptz default now()`
- `real_name text`, `firm text`, `license_no text`, `tax_id text`, `kyc_notes text` — **L3 escrow fields, curator-only**
- `is_test boolean default false`
- `created_at`, `updated_at` timestamptz

**`network_listings`**
- `id uuid pk`, `originator_member_id uuid not null` (FK network_members)
- `state network_listing_state not null default 'draft'`
- Teaser layer (visible to all active members): `teaser_title text`, `district text`,
  `property_type text`, `price_band text`, `headline_roi text`, `bedrooms int`, `teaser_summary text`
- Reveal layer (visible only after a reveal_event for this listing+member): `exact_address text`,
  `exact_price numeric`, `owner_contact text`, `documents_url text`, `full_description text`
- `is_assignment boolean default false`, `expires_at timestamptz`
- `is_test boolean default false`, `created_at`, `updated_at`

**`network_reveal_events`** (immutable audit log — insert only)
- `id uuid pk`, `listing_id uuid not null`, `revealer_member_id uuid not null`,
  `viewer_member_id uuid not null`, `scope network_reveal_scope not null`,
  `reason text`, `created_at timestamptz default now()`

**`network_intros`**
- `id uuid pk`, `listing_id uuid not null`, `placer_member_id uuid not null`,
  `originator_member_id uuid not null`, `buyer_ref text` (anonymous buyer label),
  `state network_intro_state not null default 'proposed'`,
  `split_terms text` (e.g. "50/50"), `notes text`,
  `is_test boolean default false`, `created_at`, `updated_at`

**`network_messages`** (handle-masked on-platform messaging)
- `id uuid pk`, `thread_key text not null` (deterministic pair key),
  `sender_member_id uuid not null`, `recipient_member_id uuid not null`,
  `listing_id uuid nullable`, `body text not null`, `created_at timestamptz default now()`

**RLS policies (critical — get these exact):**
- Helper: a SQL function `current_network_member()` returning the `network_members.id`
  for `auth.uid()` where `state = 'active'`.
- `network_members`: an active member can `select` **only L1 columns** of other members
  (id, handle, role_badges, region, state, tier, deals_closed, joined_at). Implement L1
  exposure via a `SECURITY DEFINER` view `network_members_public` (excludes real_name,
  firm, license_no, tax_id, kyc_notes) and grant select on the view; restrict base-table
  select to own row + curator. A member can update **only their own** non-L3 fields.
- Curator (a member whose `role_badges` contains 'curator') can select/update all rows
  including L3 fields.
- `network_listings`: active members can select teaser columns of `state='live'` listings
  via a `network_listings_teaser` view (excludes reveal-layer columns). Reveal-layer
  columns selectable only when a `network_reveal_events` row exists for
  (listing_id, viewer = current member). Originator can CRUD own listings. Curator full access.
- `network_reveal_events`: insert allowed by an active member for themselves as viewer;
  select own + curator; **no update/delete** (immutable).
- `network_intros`: select/insert/update where current member is placer or originator;
  curator full access.
- `network_messages`: select/insert where current member is sender or recipient.

---

### 2 · Routes & screens (under `/invest/circle`, all gated by the flag)

1. **`/invest/circle`** — Member home. If not a member → "Invitation required" gate with
   an "Apply / Enter invite code" CTA. If member → dashboard: my listings, my intros,
   unread messages, reputation card (handle, badges, deals_closed).
2. **`/invest/circle/inventory`** — Teaser feed of `live` listings (cards: district, type,
   price band, headline ROI, bedrooms — NO address/photos that identify). Filters by
   district/type/price band. Each card → detail.
3. **`/invest/circle/inventory/:id`** — Listing detail. Shows teaser layer + a **"Request
   reveal"** action. On reveal (after accepting per-listing terms) it inserts a
   `network_reveal_events` row and unlocks the reveal layer (address, price, contact,
   docs). Render an audit marker (reveal id + your handle + timestamp). Also an "Express
   interest / create intro" action.
4. **`/invest/circle/listings/new`** — Originator submits a listing (teaser + reveal
   fields), saved as `draft` then `submitted`. Warn the user to scrub re-identifying
   detail from teaser fields.
5. **`/invest/circle/intros`** — My intros list with state machine actions
   (propose → accept/decline → in_deal → closed). Split terms field.
6. **`/invest/circle/messages`** — Handle-masked threads. List of threads by counterparty
   handle; thread view sends/reads `network_messages`. Never show real identity here.
7. **`/operate/circle-desk`** (curator only) — Vetting queue (members in
   applied/under_review → approve to active or revoke), listing moderation queue
   (submitted/moderation → live or reject), reveal-event audit log, intro/dispute viewer
   with full L2/L3 visibility. Reuse the existing Operate/admin shell.

Hide every route and all nav entries when the flag is OFF or the user isn't an active member.

---

### 3 · Components (shadcn-based, tokens only)
`MemberGate`, `HandleBadge` (pseudonym + role + region), `ListingTeaserCard`,
`ListingDetailReveal` (teaser → reveal transition with terms modal/sheet),
`RevealAuditMarker`, `IntroPanel` (state machine), `MaskedThread`, `VettingQueue`,
`ModerationQueue`, `ReputationCard`. Loading skeletons + empty states for each list.

### 4 · Edge functions (Deno 2.0, in supabase/functions, reuse `_shared`)
- `circle-notify` — on new application / new intro / new reveal, notify the curator via
  the existing WhatsApp (UltraMSG) + Telegram admin channels. Use `_shared/admin-config.ts`
  for contacts — never hardcode email/phone.
- `circle-invite` — generate/redeem invite codes (member state `invited → applied`).
Keep it minimal; no AML/KYC automation in this phase (curator does it manually).

### 5 · Seed data (test only)
Insert ~6 `network_members` (mix of originator/placer, one curator) with `is_test = true`
and pseudonymous handles, ~8 `live` `network_listings` with `is_test = true` across Phuket
districts. Tag everything `is_test = true` so it's removable. Do NOT create real PII.

### 6 · Acceptance criteria (verify before finishing)
- Flag OFF → no Circle routes/nav exist anywhere; consumer app unchanged.
- A non-member hitting any `/invest/circle/*` route sees the invitation gate, not data.
- A logged-in active member sees only L1 (handle/badge) of others — never real name/firm,
  confirmed by trying to query the base table directly (RLS blocks L3).
- Reveal layer of a listing is invisible until a `network_reveal_events` row exists for
  that member; after reveal, the audit marker renders.
- Curator desk can approve a member and moderate a listing to `live`.
- Every list has loading + empty states; every mutation has error toasts; all strings RU+EN.
- TypeScript strict, no `any`. Build passes.

Build the database tables + RLS first, then the hooks/data layer, then the screens, then
the curator desk, then seed data. Keep everything inside the feature flag.

---

## FOLLOW-UP PROMPTS (run after the MVP is verified, one at a time)

**A — Anti-circumvention & reputation.** Add a tail-period field to `network_intros`
(`tail_until timestamptz`); when an intro for the same listing+buyer_ref closes within the
tail period, lock the recorded `split_terms` as authoritative. Add reputation signals to
the member's public view (response rate, tenure, dispute flags) — counts only, no value,
no leaderboard.

**B — AI teaser scrubber.** Add an edge function that, on listing submission, uses the
existing AI prompt infrastructure to flag re-identifying signal in teaser fields (exact
address leakage, distinctive detail). Moderation assist only — never auto-publish. Add the
system prompt to `docs/canonical/08-ai-prompts-library.md`.

**C — AI match routing.** Surface `live` listings to the member handles most likely to
have a matching buyer, using role/region signals. Suggestions only; intros are always
user-confirmed — never auto-create an intro or money move.

**D — Membership monetisation.** Gate `active` membership behind a Stripe subscription
(reuse the `stays_subscription` pattern). Access-fee model only for now — no success/
brokerage fee (legal review pending).

**E — Masked WhatsApp relay (optional).** Replace/augment on-platform messaging with a
relay over the existing UltraMSG integration that bridges two members without exposing
phone numbers until an L2 reveal.

---

## Notes for Pavel (not part of the Lovable prompt)
- Defaults baked in (from spec §15, adjust before pasting if needed): one handle per
  identity, on-platform messaging for MVP, monetisation deferred, Phuket-first.
- **Legal review is still a hard gate** before turning the flag ON for real members or
  adding any success/clearing fee — the prompt does not (and cannot) resolve AML/licensing.
- Because Lovable writes to the production DB, review the generated migrations before they
  apply, and keep the flag OFF until QA on the anonymity/reveal RLS passes.
