# myUNO

> **Application identity (2026-10-21):** React/Vite myUNO App, repository `pavel949/myuno`. `pavel949/myUNO-final` is a separate Next.js application. Both require the same verified 39-villa Layantara catalogue and tariffs. [Current data, publication status and remaining parity work](docs/LAYANTARA_APPLICATION_PARITY.md).

> **Destination Property, Services & Living Operating System**
>
> Production core for Homes, PMS/Operations, Services Marketplace, Concierge, CRM, Owners, Agents and Finance.

## Start here

**Read [PROJECT.md](./PROJECT.md) first.** It is the repository constitution for product, architecture, canonical domain ownership, UX, P0 priorities and change governance.

For AI/Codex/Lovable execution rules, then read [AGENTS.md](./AGENTS.md).

### Canonical reading order

1. [PROJECT.md](./PROJECT.md) — product & engineering constitution; highest-level authority.
2. [AGENTS.md](./AGENTS.md) — concise AI/engineering execution invariants.
3. [Connected Product Blueprint](./docs/canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md) — One Operational Reality and convergence.
4. [Operating Spaces Design](./docs/canonical/OPERATING_SPACES_DESIGN.md) — Management Company → Operating Space scope.
5. [Canonical docs index](./docs/canonical/README.md) — specialized product/data/design contracts.
6. [Documentation guide](./docs/README.md) — canonical vs evidence vs historical documents.

## What myUNO is

myUNO connects three customer entry points:

```text
HOMES                 SERVICES                CONCIERGE
Rent / Buy            Structured              Exceptional /
                      Marketplace              high-touch
     \                   |                    /
      └────────────── shared identity / CRM ──┘
                           |
                  Operations / Finance
```

The system follows **One Operational Reality**: different surfaces project the same canonical property, booking, payment, person, service and accounting facts instead of creating parallel copies.

### Target operating acceptance

The current P0 is to operate:

```text
Ignatev Estate
├── Layantara — resort portfolio
└── Condominiums — distributed managed units
```

with secure team isolation, founder consolidated oversight, and one Layantara booking proven from quote through checkout and P&L.

This is an acceptance target, not evidence that Spaces are populated/enforced or that live booking, payment and P&L acceptance has passed. Reconcile progress with current source and dated verification; preserve accepted gates rather than restarting the roadmap.

## Core domain boundaries

| Domain | Canonical authority |
|---|---|
| Physical property | `properties` / canonical property graph |
| Rental inventory | `property_bookings` + canonical blocks |
| Commercial order | `orders` |
| Service request/booking | `service_orders` |
| Payment-provider state | verified writers / `payment_intents` where applicable |
| Accounting | `ledger_entries` |
| Operational scope | Management Company + Operating Space |
| Relationship | unified CRM/person model |
| Public discovery | safe allowlisted projections |

Do not merge `service_orders` into `orders` merely for neatness. Do not infer that an `orders` success means property inventory was reserved.

## Product surfaces

This is the product map, not an implementation/readiness matrix. A route or source file alone does not prove operational readiness; use PROJECT.md and the relevant current acceptance evidence.

- **Homes** — Rent / Buy discovery, project portal, home/unit detail, availability/terms, quote, booking/enquiry.
- **Services Marketplace** — REQUEST / BOOK / BOOK+PAY structured services.
- **Concierge** — human escalation for exceptional requests; not a replacement for working Marketplace.
- **PMS / Operations** — Today, Calendar, Bookings, Properties, Housekeeping, Maintenance, Rates, Inventory, Finance.
- **Agent Workspace** — authorized inventory, availability, pricing, markup, quote and booking/request.
- **Owner** — occupancy, finance, statements, payouts, maintenance and documents.
- **CRM** — one relationship history across property + services.

## Technology

- React 18 + TypeScript + Vite
- Tailwind + shadcn/ui
- Supabase: Postgres, Auth, Storage, Edge Functions
- TanStack Query
- Stripe where applicable
- PWA / Capacitor
- Vitest / Testing Library / Playwright
- Vercel production deployment

See current source/package manifests for exact versions; do not treat README version numbers as runtime truth.

## Local development

```bash
git clone <repo-url>
cd myuno
npm install
cp .env.example .env
npm run dev
```

Common checks:

```bash
npm run build
npm run lint
npm test
```

Use only scripts that actually exist in the current `package.json`; inspect it before assuming a command.

## Production safety

There is no assumption of an isolated staging database. Preview/local tooling may point at production-backed infrastructure.

- Never use production business mutations as QA.
- Use synthetic/stubbed UI tests and isolated PostgreSQL fixtures for security/data work.
- Never edit already-applied migrations.
- Use forward migrations and security-preserving rollbacks.
- Critical money/inventory/RLS/schema changes require explicit GO/NO-GO.

## Documentation model

```text
PROJECT.md                  normative constitution
AGENTS.md                   concise execution rules
docs/canonical/             durable specialized contracts
docs/convergence/           implementation evidence / audits
docs/hardening/rollback/    security-preserving rollback artifacts
archive/                    historical only
```

Convergence/audit documents are evidence, not permanent architectural authority. When a rule becomes durable, promote it into canonical documentation.

## Deployment

Production is deployed through Vercel from the repository's production branch/configuration. Supabase Edge Functions and database changes are production-sensitive. Verify current deployment configuration before changing release behavior.

## Ownership

Proprietary · Ignatev Group · Phuket, Thailand.
