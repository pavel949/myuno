# myUNO Information Architecture — Life-task map

> A task-based map of what foreigners actually need to do on Phuket, organised
> by persona and by life cluster. Inspired by the GOV.UK "Browse" taxonomy.
>
> This document is the source of truth for navigation, search keywords,
> AI Concierge intents, and admin content classification.

Version: 1.0 · Last updated: 2026-04-21

---

## How to read this map

- **Personas (rows)**: 4 long-lived states a user can be in. A user can move
  between personas over time (Tourist → Resident → Owner).
- **Clusters (columns)**: 6 colour-locked life domains from `ARCHITECTURE_V2.md §4`.
- **Cells**: the concrete tasks a person in that persona is most likely to need.

Each task should map to **one** start page (`StartPageLayout`) or, if it spans
multiple steps, to **one** step-by-step flow (`StepByStepNav`).

---

## Personas

| Code | Persona | Trigger | Primary need |
|---|---|---|---|
| `tourist` | Tourist (1–30 days) | Arrived for holiday | Get oriented, stay safe, enjoy |
| `resident` | Resident (>30 days) | Lives or works on Phuket | Daily life infrastructure |
| `owner` | Property owner | Owns or rents out property | Manage, comply, earn |
| `investor` | Investor / second-home | Buying or scaling | Capital deployment, advisory |

---

## Clusters (from ARCHITECTURE_V2)

| Cluster | Colour token | Meaning |
|---|---|---|
| Arrive | `--cluster-arrive` | First 72 hours on the island |
| Live | `--cluster-live` | Day-to-day life |
| Manage | `--cluster-manage` | Property, team, operations |
| Invest | `--cluster-invest` | Real estate and capital |
| Legal | `--cluster-legal` | Visas, documents, compliance |
| Build | `--cluster-build` | New developments, custom builds |

---

## The 24 life tasks

Each row is a persona; each column is a cluster. Cells list the canonical
tasks. Bold = flagship task that must have a start page on day one.

### Tourist
| | Arrive | Live | Manage | Invest | Legal | Build |
|---|---|---|---|---|---|---|
| Tasks | **Airport transfer**, SIM card, first night | Tours, restaurants, beaches | — | — | Visa-on-arrival rules | — |

### Resident
| | Arrive | Live | Manage | Invest | Legal | Build |
|---|---|---|---|---|---|---|
| Tasks | Find long-term rental | **Doctor, school, gym, delivery** | — | Open bank account | **Extend visa, TM30, work permit** | — |

### Owner
| | Arrive | Live | Manage | Invest | Legal | Build |
|---|---|---|---|---|---|---|
| Tasks | — | — | **List property, channel manager, cleaning, guest comms** | Resale / assignment | Tax filing, insurance | Renovate |

### Investor
| | Arrive | Live | Manage | Invest | Legal | Build |
|---|---|---|---|---|---|---|
| Tasks | Site visit logistics | — | Portfolio reporting | **Off-plan purchase, secondary market, yield analysis** | LTR visa, company setup | **Custom villa build** |

---

## Flagship flows (Stage B targets)

These are the first journeys to receive a `StartPageLayout` + `StepByStepNav`:

1. **Relocate to Phuket** — 9 steps · persona: `resident` · cluster: Arrive→Live→Legal
2. **Get a Thai visa** — variable steps · persona: any · cluster: Legal
   - Wraps the existing `/visa/quiz`.
3. **Buy your first off-plan condo** — 7 steps · persona: `investor` · cluster: Invest→Build
4. **List your property for short-term rental** — 6 steps · persona: `owner` · cluster: Manage
5. **Custom villa build** — 8 steps · persona: `investor` · cluster: Build

---

## Search and intent vocabulary

Each task has 3–5 user phrasings used for search ranking and AI Concierge intent
matching. Stored in `system_settings` under `task_intents:*`.

Example for `extend_visa`:
- ru: «продлить визу», «остаться ещё на месяц», «оверстей»
- en: «extend visa», «stay longer», «overstay»

(Full vocabulary lives in a follow-up table; this doc names the tasks.)

---

## Mapping to current routes

| Task | Existing route(s) | Status |
|---|---|---|
| Airport transfer | `/transfer`, `/airport` | ✅ shipped |
| Find long-term rental | `/property/rent` | ✅ shipped |
| Extend visa | `/visa/quiz`, `/legal` | 🟡 needs start page |
| List property | `/owner/properties/new` | ✅ shipped |
| Off-plan purchase | `/newbuilds` | 🟡 needs start page |
| Relocate | `/relocate` | 🟡 needs step-by-step |
| Custom villa build | not yet | ❌ to design |

---

## Governance

- New tasks must be added here **before** a route or component is created.
- Each task name maps to a `feature_flag:task.<id>` in `system_settings`.
- Cluster colours are non-negotiable — see `tokens.css`.
- A task can belong to one cluster only. If it spans two, split it.
