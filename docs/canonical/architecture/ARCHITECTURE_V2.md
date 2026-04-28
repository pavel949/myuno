# myUNO — Architecture Blueprint v2

> **Purpose.** A restructuring blueprint that collapses the ad-hoc growth from Lovable/Claude-Code into one coherent system: **Roles · Clusters · Surfaces · Agents.**
> **Audience.** Claude Code, Cursor, human engineers.
> **Supersedes.** `docs/ARCHITECTURE.md` for structural decisions. The existing doc remains valid for current directory layout.
>
> **⚠️ Master Taxonomy v1.0 supersedes this document on classification.** This blueprint defines 6 surfaces and 6 colour-locked clusters (`arrive/live/manage/invest/legal/build`) — those remain canonical for **navigation**. For **functional tagging** of services, personas, and AI routing, use the 10 JTBD clusters (A..J) and 25 personas (P01–P25) from `/docs/canonical/00-master-taxonomy.md` and `src/lib/taxonomies/master.ts`. Surface ≠ JTBD; never confuse them.

## Current implementation in this repo (not the blueprint below)

The live app uses **`NavRoleKey`** navigation with **`/mc`, `/owner`, `/vendor`, `/admin`, `/team`, `/my-property`, `/invest/...`** etc. — see [`docs/NAVIGATION.md`](../docs/NAVIGATION.md) and [`src/lib/nav/roleIA.ts`](../src/lib/nav/roleIA.ts). The **4-tab mobile** and **`/operate/*` tree** below are a *target* architecture, not what is mounted in the router today. When the blueprint and code diverge, **trust the navigation doc + `APP_ROUTES`** for day-to-day engineering.

---

## 01 · Principles

1. **One person, many roles.** Role is a stack the user edits over time. Home blends signals across active roles; no role-switching modals.
2. **Cluster over catalog.** 45 apps live in 6 colour-locked clusters. Users learn spatial meaning once (Legal is always amber).
3. **Concierge is an agent, not a bot.** AI is a silent router producing intents with one-tap accept/later. Never chat.
4. **Surfaces, not screens.** Home, Discover, Operate, Wallet, Me, Admin are long-lived canvases the cluster modules mount into.
5. **Events over direct calls.** Every state change fires a typed event. UI, notifications, AI all subscribe.
6. **Trust is UI, not a footer.** Licence and audit-trail markers inline on every money-moving screen.

---

## 02 · Role model

Six roles, multi-select, weighted. One primary.

| Role | Colour | Description |
|---|---|---|
| Tourist | `#4E7BFF` | Visiting Phuket |
| Resident | `#00D68F` | Living in Phuket |
| Owner | `#16BDCA` | Property owner |
| Agent | `#A78BFA` | Real-estate company |
| Developer | `#EF4444` | Off-plan / new builds |
| Provider | `#F59E0B` | Local business, goods, services |
| Investor | `#EAB308` | RE + non-RE, partners, syndication |

**Ranking equation** (used by home feed, quick actions, notifications):
```
weight = primary·3 + secondary·2 + tertiary·1
```

**Storage target** (Supabase):
```sql
alter table profiles
  add column roles_stack jsonb default '[]'::jsonb,
  add column primary_role app_role;
```
Backfill from existing `user_roles` joins. RLS reads the stack.

---

## 03 · Six surfaces

| # | Surface | Audience | Purpose |
|---|---|---|---|
| 1 | **Home** `/` | All roles | Signal stack · blended quick actions · concierge · feed · cluster grid |
| 2 | **Discover** `/discover` | Tourist, Resident primary | Catalog, life situations, storefronts, search, map |
| 3 | **Operate** `/operate` | Owner, Agent, Developer, Provider, Investor | Pro dashboards — replaces today's `/mc`, `/owner-portal`, `/developer-portal`, `/vendor` |
| 4 | **Wallet** `/wallet` | All roles | Money in/out, statements, payouts, tax |
| 5 | **Me** `/me` | All roles | Identity, roles, docs, KYC, consents, notifications |
| 6 | **Admin** `/admin` | Platform staff only | KYC review, disputes, agent observability, flags |

**Collapse target.** Today's 11+ shell variants (AppLayout, MiniAppLayout, mc/*, owner-portal/*, developer-portal/*, guest, nomad, expat, peylaa, landing/*) → **six surfaces, one shell.**

---

## 04 · Cluster IA

45+ apps → 6 colour-locked clusters. A new vertical joins an existing cluster or forces a deliberate 7th — never an ad-hoc tab.

| Cluster | Colour | Count | Examples |
|---|---|---|---|
| **Arrive** | `#00D68F` mint | ~5 | Airport transfer, short-term stays, SIM, relocation concierge, schools |
| **Live** | `#4E7BFF` blue | ~14 | Cleaning, delivery, beauty, fitness, medical, pharmacy, pets, events, restaurants |
| **Manage** | `#16BDCA` teal | ~9 | PM, maintenance, staff, utilities, owner statements, guest ops |
| **Invest** | `#A78BFA` purple | ~7 | Property search, off-plan, yield calc, viewings, classifieds |
| **Legal** | `#F59E0B` amber | ~6 | Visa, company setup, contracts, tax, insurance |
| **Build** | `#EF4444` coral | ~4 | Inventory, reservations, campaigns, construction milestones |

**Required code change:** add `cluster` field to `VerticalDefinition` in `src/lib/verticals.ts`. Tag every entry.

---

## 05 · Navigation shell

**Mobile · 4 tabs:** Home · Discover · Wallet · Me. Professional roles (Owner, Agent, Developer, Provider, Investor) swap **Discover** for **Operate**.

**Desktop · sidebar:** same surfaces, expanded. Operate pinned for pro roles. Cluster modules open in a right-side sheet or full canvas.

**Rule:** tab count never exceeds 4 on mobile.

---

## 06 · Route tree

```
/                              # Home
├─ /discover
│  ├─ /discover/cluster/:id
│  ├─ /discover/life/:situation
│  ├─ /discover/search
│  └─ /discover/map
├─ /app/:cluster/:vertical     # /app/live/cleaning, /app/legal/visa
│  ├─ .../search
│  ├─ .../item/:id
│  ├─ .../booking/new
│  └─ .../order/:id
├─ /operate
│  ├─ /operate/mc
│  ├─ /operate/owner
│  ├─ /operate/agent
│  ├─ /operate/dev
│  ├─ /operate/provider
│  └─ /operate/invest
├─ /wallet
├─ /me
│  ├─ /me/roles
│  ├─ /me/docs
│  └─ /me/consents
├─ /sos                        # modal only, never a page
└─ /admin                      # separate auth boundary
```

**Collapses:**
- `/stays /peylaa /nomad /guest /expat /relocate` → content under `/app/:cluster/:vertical` or `/discover/life/:situation`
- `/mc /owner-portal /developer-portal /vendor` → `/operate/*`
- Marketing landings → subdomain or `/discover/life/:situation`

---

## 07 · Role × Surface matrix

| Role | Home | Discover | Operate | Wallet | Me | Default landing |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Tourist | ● | ● | — | ○ | ○ | `/` |
| Resident | ● | ○ | — | ● | ● | `/` |
| Owner | ● | ○ | ● | ● | ● | `/operate/owner` |
| Agent | ● | ○ | ● | ● | ● | `/operate/agent` |
| Developer | ● | — | ● | ● | ● | `/operate/dev` |
| Provider | ● | ○ | ● | ● | ● | `/operate/provider` |
| Investor | ● | ● | ● | ● | ● | `/operate/invest` |

`●` primary · `○` secondary

---

## 08 · System layers

```
L6  Surfaces         Home · Discover · Operate · Wallet · Me · Admin
L5  Cluster modules  Arrive · Live · Manage · Invest · Legal · Build
L4  Domain prims     Booking · Listing · Order · Contract · Payment · Document · Message · Ticket · Property · Person · Company
L3  Platform         Auth · Event bus · AI agents · Search · Notifications · Payments · KYC · i18n · Flags
L2  Integrations     Supabase · Odoo CRM · Stripe/Omise · Google Maps · Siam Legal · OTAs · Tokio Marine · Thai gov
L1  Runtime          React 18 · Vite · Capacitor · PWA · Supabase edge · Vercel
```

**Hard rule:** L5 cluster modules may only depend on L4 domain primitives & L3 services. **Never** import from other L5 clusters.

---

## 09 · AI agents & event bus

Every L4 domain primitive emits typed events (`booking.confirmed`, `visa.expiring`, `payment.failed`). Three subscribers:

1. **UI** — events render as activity rows, signal cards, badges.
2. **Notifications** — single router, fan-out to push/email/SMS.
3. **AI agents** — produce intents surfaced in Home concierge. One-tap accept/later. **Never auto-execute money moves.**

**Agent roster** (phase in incrementally):

| Agent | Listens | Produces | Surfaces |
|---|---|---|---|
| Visa Guardian | `visa.*`, `document.uploaded` | "Start extension with Siam Legal" | Home, Me |
| Yield Optimiser | `booking.*`, `property.*`, `rate.*` | "Queue rate uplift for high season" | Operate / owner |
| Concierge | `trip.*`, `calendar.*` | "Hold table at Suay Thursday" | Home, Discover |
| Pipeline Nudger | `lead.*`, `viewing.*` | "3 viewings overlap — re-slot?" | Operate / agent |
| Maintenance Triage | `ticket.*`, `property.*` | "Approve AC service ฿1,800" | Operate / mc |
| Payout Reconciler | `payment.*`, `invoice.*` | "Statement ready to sign" | Wallet |

---

## 10 · Canonical data model

```
Person                one row per human
├─ roles_stack: jsonb
├─ primary_role: app_role
├─ kyc_level
├─ consents[]
├─ documents[] → Document
├─ memberships[] → Company   (via company_members)
└─ households[]

Company               legal entity
├─ company_type: agent | developer | provider | mc
├─ members[] → Person        (via company_members)
└─ properties[] → Property

Property
├─ owner → Person | Company
├─ managed_by → Company (MC)
├─ listings[] → Listing
└─ bookings[] → Booking

Listing                offer: stay, service, product, property-for-sale
├─ cluster · vertical
├─ provider → Person | Company
└─ items[]

Booking · Order · Contract · Ticket
   inherit: id, actor, counterparty, state, payments[], messages[], events[]

Payment · Document · Message       attachable to any domain object
```

**Row-level security.** Every table carries `person_id` and/or `company_id`. RLS reads session role stack and enforces: a person sees their own rows + rows of companies they belong to + public listings. No per-vertical auth logic.

---

## 11 · Collapse map (today → target)

| Today | Target |
|---|---|
| 11+ shells (AppLayout, MiniAppLayout, mc/*, portals, landings) | One shell, one nav, surface variant via prop |
| 40+ page folders with duplicated patterns — `guest`, `nomad`, `expat`, `peylaa`, `relocate`, `stays` | Every vertical at `/app/:cluster/:vertical` — identical template |
| Two DS specs: `tokens.json` (DS2.0 Navy, unshipped) vs `tokens.css` (shipped) | `tokens.css` is truth; `tokens.json` deleted; lint blocks hardcoded hex |
| Ad-hoc AI entry points | Agent registry in L3, events typed, observability in `/admin/agents` |
| Persona = onboarding choice | Role stack in `profiles`, editable from home & `/me/roles` |
| Owner, developer, provider each have their own portal URL & chrome | One `/operate` shell with nested `/mc`, `/owner`, `/agent`, `/dev`, `/provider`, `/invest` |
| Notifications wired per-feature | Single notification router subscribed to event bus |

---

## 12 · Migration roadmap

| # | Phase | Effort |
|---|---|---|
| 1 | Role stack in DB + AuthContext | ~1 sprint |
| 2 | Home hub — blended signal stack | ~1 sprint |
| 3 | Cluster taxonomy on verticals | ~1 sprint |
| 4 | `/operate` consolidation + Company entity | ~2 sprints |
| 5 | Event bus + 3 agents | ~2 sprints |
| 6 | Cluster-based routes + legacy redirects | ~2 sprints |
| 7 | Investor surface (greenfield) | ~3 sprints |
| 8 | Trust, tokens, cleanup | ~1 sprint |

**Sequencing rationale.** Role stack first because every downstream phase assumes it. Surfaces before routes so UI collapse happens before URL churn. Agents after routes so event taxonomy is stable. Tokens & trust last — polish.

---

## 13 · Hard rules (copy into CLAUDE.md)

1. Never add a new top-level route. Put it under `/app/:cluster/:vertical` or `/operate/*`.
2. Never create a new shell. Use `MiniAppLayout` or the Operate shell.
3. Never hardcode a hex colour. Use `tokens.css` variables.
4. Never import across L5 cluster boundaries. Use L4 primitives or L3 services.
5. Never auto-execute money moves from an agent. Always route through user-confirmed intent.
6. Every money-moving screen must show the audit-trail marker (tx id + ledger entry id + timestamp).
7. Every new feature is gated behind a `feature_flag:*` in `system_settings` until GA.
