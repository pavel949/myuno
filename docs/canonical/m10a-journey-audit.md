# M10a Journey Audit Report — 2026-04-24

**Status:** Draft v1 · Generated from repository inventory.
**Scope:** 7 канонических persona-journey (P5/P6/P8/P9/P10/P11/P22) + 2 situational flow (distressed seller, distressed buyer) per IPP.md §20.
**Ground rule respected:** Не написано ни одной строки нового кода. Это карта существующего, не план реализации.

> **Чтение:** этот файл — input для M10b–M10h. Каждая рекомендация в §3.5 ссылается на конкретную веху и конкретные файлы/таблицы из инвентаря §3.1–3.4.

---

## 0 · Executive Summary

| Метрика | Значение |
|---|---|
| Проверенных journey | **9** (7 personas + 2 distressed flows) |
| Проверенных stages | **57** (∑ stages всех journey) |
| ✅ Fully connected (no gap) | **6** stages |
| 🟡 Partially connected (UX/cross-link gap) | **31** stages |
| 🔴 Disconnected (missing связка существующих компонентов) | **14** stages |
| ⚫ Missing components (нужно создать) | **6** компонентов |

**Самый критический вывод.** Реальная функциональность IPP **сильно фрагментирована** и реализована преимущественно под одним доменом `myuno.app` через path-based роутинг (`/property/*`, `/invest/*`, `/mc/*`, `/developer-portal/*`). Архитектурный слой «один аккаунт — много дверей» (Seven Doors из §18.1) **отсутствует**: ни одного `/for/[persona]` роута не существует, persona-aware дверь есть только в Home через `PersonaAwareSections` (M6 D.3 за feature-flag).

**Второй критический вывод.** Distressed vertical (§17) — **полностью greenfield**. Нет ни таблиц (`distressed_listings`, `investor_criteria`, `distressed_matches`), ни роутов (`/sell/quick`, `/urgent`), ни компонентов. Это единственная веха протокола M10, где CONNECT BEFORE CREATE неприменим: создавать придётся почти всё.

**Третий вывод.** ROI Calculator существует в **4 несогласованных версиях** (`src/components/property/ROICalculator.tsx`, `src/components/newbuilds/NbROICalculator.tsx`, `src/components/newbuilds/ProjectROICalculator.tsx`, `src/pages/peylaa/components/PeylaaROICalculator.tsx`). Persona-aware presets («Snowbird live-in», «Pure Investor», «Live-in + Rent») — отсутствуют ни в одной. Каждая journey require modification of an unclear «main» calculator. **Решение нужно принять до M10c**.

**Четвёртый вывод.** ClearView в коде = **landing + apply-form** (`src/pages/clearview/ClearViewLanding.tsx`, route `APP_ROUTES.CLEARVIEW = '/property/clearview'`). Поля `clearview_assessment_id`, `clearview_grade` на `properties` — **не нашёл в схеме** (в типах Supabase отсутствуют). Lead-scoring trigger «ClearView Full Report purchased» (+50 / +100 в §3 IPP) — не реализован. P8 journey stage 5 «PROOF & DEEP VERIFICATION» — disconnected.

---

## 1 · Архитектурные расхождения IPP.md ↔ codebase

Зафиксированные расхождения, которые **блокируют наивную интерпретацию IPP.md** и должны быть учтены в каждой следующей вехе.

| # | Канон IPP.md | Реальность кода | Импликация для M10b–h |
|---|---|---|---|
| A1 | Субдомены `invest./stay./owner./developers./clearview./app.myuno.app` | Один домен `myuno.app`, path-based: `/invest`, `/property`, `/mc`, `/developer-portal`, `/property/clearview`, `/me`, `/account` | M10b: `/for/[persona]` создаём как path под `myuno.app/for/...`, не subdomain. M10d: nav-герархия §18.5 проектируется под path-prefix, не cross-domain. |
| A2 | `invest.myuno.app/projects/off-plan/[district]` (separate каталог) | Off-plan живёт под `/property/offplan` (`OffplanIndex.tsx`); resale — `/property/resale`. `/invest/*` — параллельный «Investment Hub» с другой моделью данных (campaigns, deals, business). | M10b/M10d: `/for/investor` должен ссылаться на `/property/offplan` + `/property/resale`, а не на `/invest`. **Слово «invest» в codebase ≠ «invest» в IPP.md**. |
| A3 | `invest.myuno.app/portfolio` = инвесторский dashboard | Реализовано как `InvestorDashboard.tsx` под `/invest/dashboard` (на основе `investment_deals`, не недвижимость). Owner-side dashboard для сданных в управление объектов = `/owner/*` + `/my-property/*`. | M10c: «Investor Dashboard» из IPP надо мапить на **синтез** `/invest/dashboard` + `/my-property` + `/account`. Без этого решения «куда вешать widget Ready for #2» — M10c blocked. |
| A4 | `myuno.app/sell/quick` для distressed seller intake | Маршрут `/sell` уже занят: `MARKET → /sell` (P2P market vendor onboarding для goods, не RE). | M10g: использовать **`/property/sell-quick`** (под Property Hub, как канон §13 ARCHITECTURE_V2). |
| A5 | `invest.myuno.app/urgent` для distressed buyer catalog | Свободно. | M10g: `/property/urgent` (под Property Hub) или альтернативная локация — **открытый вопрос** для M10g. |
| A6 | Mongolian door — `/for/mongolia` + RU/MN i18n | i18n поддерживает только `ru`/`en`/`th`. Mongolian отсутствует. | M10b: P11 landing создаётся в RU + EN (no MN). Полный MN — отдельный workstream вне M10. Зафиксировать как known limitation. |
| A7 | Subdomain `clearview.myuno.app` (public ratings) | Нет. ClearView — landing на `/property/clearview` + `/property/clearview/apply` (форма заявки от застройщика). Public ratings catalog — **отсутствует**. | M10d: «public ClearView ratings» = missing component (см. §3.4). |
| A8 | Knowledge Hub под `myuno.app/guides/[category]/[slug]` | Реальный путь: `/knowledge/{section}/{slug}` (`KNOWLEDGE_ARTICLE`). Pillar-pages: `/knowledge/pillars/{slug}`. Контент — `src/content/landings/`, `src/content/semantic/pillarPages.ts`. | Все ссылки `/guides/...` в IPP.md в коде должны читаться как `/knowledge/...`. |

**Решение по нотации:** в этом аудите я использую URL **из IPP.md** в кавычках и **реальный** в коде через `→`. Пример: «`/sell/quick` → `/property/sell-quick` (предлагается)».

---

## 2 · Глобальный inventory релевантных компонентов

### 2.1 Catalog

| Артефакт | Путь | Статус |
|---|---|---|
| Property hub | `src/pages/property/PropertyHub.tsx` | ✅ tabs: Nightly/Monthly/Buy/New/Resale/Commercial/Land/Hotels |
| Off-plan catalog | `src/pages/property/OffplanIndex.tsx` + `OffplanDetail.tsx` | ✅ |
| Resale | `src/pages/property/ResaleIndex.tsx` + `ResaleDetail.tsx` | ✅ |
| Newbuilds (themed tools) | `src/pages/newbuilds/*` (calculator, compare, areas, map, due-diligence) | ✅ — отдельный «Dark Luxury» layer поверх off-plan (см. mem://style/editorial-dark-luxury-theme) |
| Property browse | `src/pages/property/PropertySearchPage.tsx` | ✅ filters, sort |
| Map | `/property/map`, `/newbuilds/map` | ✅ |
| Compare provider | `<CompareProvider>` в `PropertyHub.tsx` (`src/components/property/PropertyCompare`) | 🟡 provider есть, **dedicated compare UI page = missing** |
| Newbuilds compare | `/newbuilds/compare` | ✅ (но scoped только к newbuilds) |
| ClearView landing | `/property/clearview` (`ClearViewLanding.tsx`) + apply form | 🟡 landing only, нет ratings catalog |

### 2.2 Tools

| Артефакт | Путь | Статус |
|---|---|---|
| ROI Calculator (generic) | `src/components/property/ROICalculator.tsx` | ✅ basic, без presets |
| ROI Calculator (newbuilds full) | `src/components/newbuilds/NbROICalculator.tsx` | ✅ полный |
| ROI Calculator (microsite reusable) | `src/components/newbuilds/ProjectROICalculator.tsx` | ✅ |
| ROI Calculator (peylaa wrapper) | `src/pages/peylaa/components/PeylaaROICalculator.tsx` | ✅ |
| Standalone ROI page | `/newbuilds/calculator` (`NewbuildsCalculator.tsx`) | ✅ |
| Due diligence | `/newbuilds/due-diligence` | ✅ контент |
| Purchase Costs / FET / Mortgage / Jurisdiction | — | 🔴 **missing** (в IPP.md §2 Модуль C перечислены) |
| District Heatmap | — | 🔴 **missing** (Pro tool, IPP §2/§4F) |
| Stress Test ROI | — | 🔴 **missing** (Pro) |
| Investment Thesis Builder | — | 🔴 **missing** (IPP §4E) |
| Comparison Engine page (dedicated) | — | 🔴 **missing** (есть только провайдер + scoped newbuilds compare) |

### 2.3 Investor + capital

| Артефакт | Путь | Статус |
|---|---|---|
| Investment hub landing | `/invest` (`InvestmentHubLanding.tsx`) | ✅ |
| Real-estate zone | `/invest/real-estate` (`InvestmentRealEstateZone.tsx`) | ✅ |
| Investor dashboard | `/invest/dashboard` (`InvestorDashboard.tsx`) | ✅ — но это **investments-deals based**, не propery-portfolio |
| Capital deal intake | `/invest/capital-deal` (`CapitalDealIntake.tsx`) | ✅ — для P9 mandate intake |
| Capital CRM (admin) | `/capital/*` (Pipeline/Outreach/Templates/Contacts/Campaigns) | ✅ |
| Mandate / Deal Room (`/mandate`) | — | 🔴 **missing** (IPP §4G) |

### 2.4 Owner / MC / Operator

| Артефакт | Путь | Статус |
|---|---|---|
| Owner dashboard | `/owner` + `OwnerDashboard.tsx` | ✅ |
| MC workspace | `/mc/*` (Properties/Calendar/Sales/Finance/Reports/CRM) | ✅ |
| Owner portal (managed by MC) | `/my-property` (`OWNER_PORTAL`) | ✅ |
| Owner portfolio | `OwnerPortfolio.tsx` | ✅ — yield/occupancy reports |
| «Ready for #2?» / expansion widget | — | 🔴 **missing** (IPP §14, P10 stage 2) |
| Distressed match alerts in Owner Portal | — | 🔴 **missing** |

### 2.5 Developer

| Артефакт | Путь | Статус |
|---|---|---|
| Developer portal | `/developer-portal/*` (Apply/Onboarding/Company/Leads/Projects/Team/Analytics) | ✅ полный |
| Project editor | `DeveloperProjectEditor.tsx` | ✅ inventory upload |
| Developer leads | `DeveloperLeads.tsx` + `DeveloperLeadDetail.tsx` | ✅ |
| Developer analytics | `DeveloperAnalytics.tsx` | ✅ |
| Bi-directional inventory sync с `/property/offplan` | hooks под `useNewbuildProjects` | 🟡 — данные **читаются** из той же таблицы, но push из dev-portal в публичный каталог = manual approval flow (см. `CapitalDevelopersPending.tsx`) |
| Public-facing developer pages | `/property/developers/{id}` (`DeveloperDetail.tsx`) | ✅ |

### 2.6 Knowledge / content

| Артефакт | Путь | Статус |
|---|---|---|
| Knowledge hub | `/knowledge` (`KnowledgeHub.tsx`) | ✅ |
| Pillar pages | `/knowledge/pillars/{slug}` + `src/content/semantic/pillarPages.ts` | ✅ — «buying-property-thailand», «leasehold-vs-freehold», «foreign-quota», «rental-income-tax» в content; pillar 6.2 (off-plan DD) — статус `placeholder` |
| Cluster landings | `src/content/landings/clusterLandings.ts` (6 кластеров: arrive/live/manage/invest/legal/build) | ✅ |
| Persona landings (content layer) | `src/content/landings/personaLandings.ts` | ✅ контент готов, **routes отсутствуют** |
| `PersonaLandingPage.tsx` | `src/pages/landings/PersonaLandingPage.tsx` | 🟡 компонент существует, но смотрит на cluster-personas, **не на P5/P6/P8/P9/P10/P11/P22** из IPP.md |

### 2.7 Persona / segmentation infra

| Артефакт | Путь | Статус |
|---|---|---|
| `users.persona_code` | `profiles.detected_persona` (через `v_profiles_canonical`) | ✅ — поле `detected_persona` в `CanonicalProfile`, `PersonaCode = P1..P25` (`src/types/canonical.ts`) |
| `lifecycle_stage` | enum `lifecycle_stage` в DB | ✅ |
| `useCanonicalProfile()` | `src/hooks/useCanonicalProfile.ts` | ✅ |
| `useUserPersonas()` | `src/hooks/useUserPersonas.ts` | ✅ — multi-select user personas (отдельная система от P1..P25) |
| Persona detection preview | `src/components/account/PersonaDetectionPreview.tsx` | ✅ |
| Persona-aware sections (Home) | `src/components/home/PersonaAwareSections.tsx` + `lib/segmentation/prioritizeHomeSections` | ✅ за `feature_flag:home_persona_aware_v1` |
| Persona prompt banner | `src/components/home/PersonaPromptBanner.tsx` | ✅ |

**Конфликт двух persona-систем (важно для M10c):** в коде сосуществуют:
- **Canonical** `P1..P25` (`src/types/canonical.ts`, fed by detection алгоритм + manual override) — **то, что IPP.md имеет в виду под P5/P6/P8/P9/P10/P11/P22**.
- **`useUserPersonas`** — вручную выбранные роли (`tourist|resident|owner|investor|family|...`) — то, что использует `PropertyHub.personaGated` для tab visibility.

M10c должен опираться на **canonical** P-codes, иначе widget «Ready for #2» не сможет triggered correctly. Mapping `useUserPersonas → CanonicalRole` уже описан в `mem://ux/persona-system-and-ui-standard`.

### 2.8 AI-консьерж / LifeOS

| Артефакт | Путь | Статус |
|---|---|---|
| LifeOS context | `src/contexts/LifeSituationContext.tsx` | ✅ |
| LifeOS admin console | `src/pages/admin/lifeos/*` (10 tabs: situations, mappings, routes, ai-panel, audit, …) | ✅ |
| Life-flow user routes | `/life-flow/{code}` | ✅ |
| Proactive AI concierge | `mem://features/home/proactive-ai-concierge` (suggestions blok) | 🟡 generates suggestions, no intent-routing for «I need to sell quickly» / «срочные продажи» |
| WhatsApp / Telegram channels | UltraMSG + Resend (mentioned in CLAUDE.md, no public client-side router) | ✅ существует на уровне notifications |
| Intent handler «distressed» | — | 🔴 **missing** |
| Intent handler «remote-buyer» | — | 🔴 **missing** |
| Intent handler «expand portfolio» | — | 🔴 **missing** |

### 2.9 Distressed vertical (§17)

| Артефакт | Статус |
|---|---|
| `distressed_listings` table | 🔴 **missing** (нет в `supabase/migrations/`, нет в `types.ts`) |
| `investor_criteria` table | 🔴 **missing** |
| `distressed_matches` table | 🔴 **missing** |
| `/sell/quick` route + intake form | 🔴 **missing** |
| `/urgent` catalog page | 🔴 **missing** |
| Distressed PropertyCard variant | 🔴 **missing** |
| Matching engine (SQL/RPC + WhatsApp template) | 🔴 **missing** |
| AVM helper (для validation) | 🔴 **missing** |

**Вердикт по distressed:** единственный workstream в M10, где «CONNECT BEFORE CREATE» неприменим. Все 8 артефактов выше — net-new.

### 2.10 Search

| Артефакт | Путь | Статус |
|---|---|---|
| Global search route | `/search` (`SEARCH`) | ✅ |
| Super-search hook | `mem://features/search/super-search-architecture-v2` — 21+ table coverage | ✅ |
| Cross-content включая Knowledge + Tools | — | 🟡 partial — properties/services/market покрыты; tools (calculators) и pillar-articles **не indexed** в одном результате |
| Distressed in unified search | n/a (depends on M10g) | 🔴 |

---

## 3 · Journey-by-journey detail

> Формат: для каждой journey — таблица `Stage / Existing component / Status / Connected to next? / Gap`.

### 3.1 P5 · Snowbird → Owner

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | DISCOVERY (Stay banner «Love this place? Own it.») | Stay-side: нет dedicated booking-detail page; есть `/bookings/{id}` (`BOOKING_DETAIL`), но банера про purchase нет | 🟡 stub | нет | **GAP-P5-1.** Нет post-stay CTA «Own vs Rent». Нужен widget в booking detail, ссылающийся на ROI tool с pre-filled rate из booking. |
| 2 | EDUCATION (Knowledge pillar) | `KnowledgeHub` + `/knowledge/pillars/buying-property-thailand` (контент в `pillarPages.ts`, статус `placeholder`) | 🟡 контент-skeleton | partial | **GAP-P5-2.** Pillar существует только как placeholder; контекстный CTA «Я уже арендую — показать варианты» для авторизованного snowbird = отсутствует. |
| 3 | LOCAL EXPLORATION (`/projects/off-plan/[district]`) | `OffplanIndex.tsx` + filters | ✅ | да | **GAP-P5-3.** Нет pre-filter по `last_stay_district`. Дата stay-bookings есть в `bookings`, district mapping — manual. |
| 4 | SHORTLIST (Watchlist) | `favorites` (через `useUserCollections`, `/favorites`) | ✅ | partial | **GAP-P5-4.** Watchlist существует как favorites, но **30-day re-engagement trigger** (WhatsApp updates) — отсутствует. Нет cron/edge-function `re_engagement_watchlist`. |
| 5 | COMPARISON | `CompareProvider` + `/newbuilds/compare` (только newbuilds) | 🟡 partial | partial | **GAP-P5-5.** Нет dedicated `/property/compare` страницы. Snowbird-preset «total cost of ownership по сезонам» отсутствует. |
| 6 | HUMAN CONTACT (WhatsApp от Павла) | CRM + `lead_scores` (упоминается в `useMCCControlTower`) | 🟡 partial | partial | **GAP-P5-6.** Лид-score system существует фрагментарно (`re_engaged_at` отсутствует). P5-specific template «дом на вашу зиму» — нет. |
| 7 | TRANSACTION (`/deals/[deal-id]`) | `/mc/sales/{id}` + `NewDealPage.tsx` (admin-side); user-side deal flow | 🟡 partial | partial | **GAP-P5-7.** Нет user-facing `/deals/{id}` с inline объяснениями шагов. |

**Verdict P5:** 0 fully connected, 7 partial. Critical gap: post-stay CTA (1) + re-engagement (4) + user-facing deal page (7).

### 3.2 P6 · Settler → Local Investor

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | DISCOVERY (resident dashboard widget) | `/account` + `UserAccountDashboard.tsx` + `DashboardStatsBar.tsx` | ✅ | partial | **GAP-P6-1.** Real-estate widget «You've been renting 18 months. Calculate own vs rent.» — нет. |
| 2 | PEER VALIDATION (rent-vs-buy pillar) | `/knowledge/pillars/...` | 🟡 | нет | **GAP-P6-2.** Pillar `rent-vs-buy-expat` отсутствует в `pillarPages.ts`. |
| 3 | DEEP DIVE (jurisdiction articles) | Knowledge sections | 🟡 | partial | **GAP-P6-3.** «Settler track» reading sequence не существует — нет UI для chained articles. |
| 4 | BROWSE & SAVE (`/projects/off-plan/[district]`) | `OffplanIndex.tsx` | ✅ | partial | **GAP-P6-4.** «Your district» shortcut по profile location = missing. |
| 5 | ROI MODELING (Live-in + partial STR preset) | `NbROICalculator.tsx` | 🟡 | нет | **GAP-P6-5.** Preset «Live-in + Rent» — отсутствует во всех 4 версиях ROI калькулятора. |
| 6 | LOCAL MEETUP (offline calendar invite) | CRM + `/mc/meetings` | ✅ | partial | **GAP-P6-6.** Persona-aware trigger «P6 → возможна личная встреча, P8 → нет» = отсутствует, всё через manual CRM. |
| 7 | TRANSACTION (skip POA) | Deal flow | 🟡 | partial | **GAP-P6-7.** Conditional steps по resident-status = отсутствует. |

**Verdict P6:** 0 fully connected, 7 partial. Critical gap: dashboard widget (1) + Live-in preset (5).

### 3.3 P8 · Passive Investor (critical mass)

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | DISCOVERY (SEO pillar) | `/knowledge/pillars/buying-property-thailand` | 🟡 placeholder | нет | **GAP-P8-1.** Контент pillar = stub, CTA «Объекты с доходностью 7%+» отсутствует. |
| 2 | TRUST BUILDING (`clearview.myuno.app`) | `/property/clearview` landing | 🟡 | нет | **GAP-P8-2.** Public ratings catalog (`clearview.myuno.app` per канон) = missing. Нет страницы distribution рейтингов. |
| 3 | CATALOGUE (`/for/investor`) | — | 🔴 **missing** | n/a | **GAP-P8-3.** `/for/investor` route отсутствует целиком. |
| 4 | TOOLS (ROI + Compare) | NbROICalculator + Compare provider | 🟡 | partial | **GAP-P8-4.** Preset «Pure Investor» (100% STR) отсутствует; dedicated compare page отсутствует. |
| 5 | PROOF (ClearView Full Report ฿4,900 + DD AI) | `/property/clearview/apply` (ApplyForm только для застройщиков), DD AI = `/newbuilds/due-diligence` (контент-page без AI) | 🔴 disconnected | нет | **GAP-P8-5.** Для investor-side ClearView Full Report покупки **нет flow вообще**. Это блокирует main lead-scoring trigger (+50/+100). |
| 6 | WHATSAPP CONTACT (lead-score 100+) | CRM templates существуют | 🟡 | partial | **GAP-P8-6.** P8-specific «investor-grade tone» template отсутствует в `MessageTemplates.tsx`. |
| 7 | RESERVATION REMOTE (POA dist) | Deal flow generic | 🟡 | partial | **GAP-P8-7.** «Remote buyer track» = absent — нет mode toggle в deal flow для absentee buyers. |
| 8 | OWNERSHIP HANDOFF (deal → portfolio + PM) | `/invest/dashboard` + `/owner` portal | 🟡 | partial | **GAP-P8-8.** Seamless transition `/deals/{id}/closed → /portfolio/{property-id}` = manual. |

**Verdict P8:** 0 fully, 1 missing route, 7 partial. **Самая критическая journey** (=70% выручки IPP). Critical gaps: 3 (route), 5 (ClearView purchase), 7 (remote-buyer).

### 3.4 P9 · HNW Investor

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | DISCOVERY (private invite) | CRM tags via `/capital/contacts` | 🟡 | partial | **GAP-P9-1.** CRM tag `HNW_pending_intro` не задокументирован, нет dedicated workflow. |
| 2 | INITIAL CALL (mandate intake) | `/invest/capital-deal` (`CapitalDealIntake.tsx`) | ✅ | partial | **GAP-P9-2.** Mandate intake template с 7 ключевыми вопросами IPP §13 — не унифицирован. |
| 3 | DEAL ROOM (`/mandate`) | — | 🔴 **missing** | n/a | **GAP-P9-3.** `/mandate` route + Deal Room UI = missing. |
| 4 | DEEP ANALYSIS (Investment Thesis Builder PDF) | — | 🔴 **missing** | n/a | **GAP-P9-4.** Investment Thesis Builder + `investment_thesis` table = missing. |
| 5 | SITE VISIT | CRM events | ✅ | partial | **GAP-P9-5.** Pre-visit brief PDF + post-visit follow-up template отсутствуют. |
| 6 | STRUCTURING | CRM negotiation | 🟡 | partial | **GAP-P9-6.** `deal_terms` JSONB на `deals` таблице = needs verification (см. §4 SQL аудит). |
| 7 | TRANSACTION (white-glove) | Deal flow | 🟡 | partial | **GAP-P9-7.** «HNW track» mode = отсутствует. |
| 8 | PORTFOLIO ONBOARDING (HNW dashboard) | `/invest/dashboard` + `/owner` | 🟡 | partial | **GAP-P9-8.** Aggregated HNW view с mandate notes = отсутствует. |

**Verdict P9:** 1 fully, 2 missing, 5 partial. Critical gaps: Deal Room (3), Thesis Builder (4) — оба блокируют premium-positioning P9.

### 3.5 P10 · Operator (retention loop)

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | MONTHLY OPERATIONS | `OwnerDashboard`, `OwnerRevenueDashboard`, `/my-property` | ✅ | partial | **GAP-P10-1.** Monthly report «Market insight: similar objects yielding X%» — не вшит. |
| 2 | EXPANSION TRIGGER (widget «Ready for #2?») | — | 🔴 **missing** | n/a | **GAP-P10-2.** Widget + trigger logic = missing. |
| 3 | SECOND-OBJECT BROWSE (`?filter=diversification`) | Filters в `OffplanIndex` есть, persona-aware filter — нет | 🟡 | partial | **GAP-P10-3.** «Not like my current» filter отсутствует. |
| 4 | PM-VERIFIED COMPARISON | Compare provider | 🟡 | partial | **GAP-P10-4.** «Your current property» column в compare = отсутствует. |
| 5 | FAST-TRACK PURCHASE («Returning buyer» track) | Generic deal flow | 🟡 | нет | **GAP-P10-5.** Returning-buyer pre-fill не реализован. |
| 6 | PORTFOLIO SCALE (auto-prompt Investor Pro) | `/invest/dashboard` | 🟡 | нет | **GAP-P10-6.** Investor Pro upgrade prompt = отсутствует (subscription tier «Investor Pro» из IPP §2/§5 в коде не нашёл). |

**Verdict P10:** 0 fully, 1 missing, 5 partial. Это retention loop — gaps менее критичны для year-1 revenue, но критичны для year-2+ retention.

### 3.6 P11 · Mongolian Investor

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | SCOUT VISIT | CRM contacts | ✅ | partial | **GAP-P11-1.** P11 intake (family structure, decision-makers) отсутствует. |
| 2 | FAMILY COUNCIL MATERIAL (3 объекта × Full ClearView + compare + thesis bundle, EN+RU) | bundling = manual | 🔴 disconnected | нет | **GAP-P11-2.** P11 bundle auto-generator missing; no MN locale. |
| 3 | REMOTE DECISION (multi-stakeholder) | CRM | 🟡 | нет | **GAP-P11-3.** Multi-stakeholder deal tracking = отсутствует. |
| 4 | RETURN VISIT + viewings | CRM events | ✅ | partial | **GAP-P11-4.** Pre-visit briefing PDF — нет. |
| 5 | RESERVATION (Mongolian banking) | — | 🔴 missing | n/a | **GAP-P11-5.** XacBank/Khan Bank partnership integration = none. |
| 6 | FUNDS TRANSFER (MNT→USD→THB FET) | FET guide отсутствует | 🔴 missing | n/a | **GAP-P11-6.** P11-specific FET guide = none. |
| 7 | TRANSACTION + family onboarding | Property ownership = single owner | 🟡 | partial | **GAP-P11-7.** Multi-user permissions на property = отсутствует (есть `team` для MC, но не family-share для owner). |

**Verdict P11:** 0 fully, 2 missing, 5 partial. Critical: bundle generator (2), multi-stakeholder CRM (3), MN locale (cross-cutting).

### 3.7 P22 · Developer (B2B supply)

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | INITIAL INTRO | `/developer-portal/apply` (`DeveloperApply.tsx`) | ✅ | да | small: 7 questions intake = нужна верификация. |
| 2 | CLEARVIEW ASSESSMENT | `/property/clearview/apply` | ✅ | partial | **GAP-P22-2.** Developer-side dashboard самого процесса assessment = отсутствует. |
| 3 | AGENCY AGREEMENT | — | 🔴 missing | n/a | **GAP-P22-3.** Digital agreement signing flow для агентского контракта = none. |
| 4 | INVENTORY UPLOAD | `DeveloperProjectEditor.tsx`, `useNewbuildProjects` | ✅ | да | bi-directional sync через approval flow (`CapitalDevelopersPending.tsx`) = manual. |
| 5 | LISTING LIVE + MARKETING | `OffplanDetail.tsx` + SEO | ✅ | partial | **GAP-P22-5.** Automatic featured placement для paying = отсутствует. |
| 6 | ANALYTICS & DEMAND SIGNALS | `DeveloperAnalytics.tsx` | ✅ | partial | **GAP-P22-6.** Watchlist adds / comparisons / inquiries в анonymized виде = частично, нужна верификация полей. |
| 7 | DEAL FLOW | `DeveloperLeads.tsx` + `/mc/sales/*` | ✅ | partial | **GAP-P22-7.** Unified deal status (developer + investor view) = разведено. |
| 8 | QUARTERLY REVIEW | manual | 🟡 | нет | **GAP-P22-8.** Calendar automation для recurring reviews = отсутствует. |

**Verdict P22:** **самая зрелая journey** — 5 fully connected, 1 missing, 2 partial. Это уже ≈80% того, что нужно для P22. Critical: только digital agreement (3).

### 3.8 Distressed Seller flow

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | INTAKE | — | 🔴 missing | n/a | Нет `/sell/quick` (или `/property/sell-quick`); нет `distressed_listings` table; нет form. |
| 2 | VALIDATION (admin) | — | 🔴 missing | n/a | Нет admin workflow в `/admin/*` для distressed approval. |
| 3 | PRICING AGREEMENT | — | 🔴 missing | n/a | Нет signing flow. |
| 4 | DISCRETE LISTING | — | 🔴 missing | n/a | Нет `PropertyCard` distressed variant. |
| 5 | MATCHING | — | 🔴 missing | n/a | Нет matching engine, нет `investor_criteria`, `distressed_matches`. |
| 6 | FAST-TRACK TRANSACTION | — | 🔴 missing | n/a | Нет fast-track modifier на deal flow. |
| 7 | CLOSED (commission attribution) | `commission_ledger` упоминается в IPP, **в коде/types отсутствует** | 🔴 missing | n/a | Нет distressed source attribution. |

**Verdict distressed seller:** **100% greenfield**. Все 7 stages — net-new для M10g.

### 3.9 Distressed Buyer flow

| # | Stage | Существующий компонент | Статус | Connected? | Gap |
|---|---|---|---|---|---|
| 1 | DISCOVERY (`/urgent`) | — | 🔴 missing | n/a | Нет catalog page. |
| 2 | ACCESS VERIFICATION (gating) | — | 🔴 missing | n/a | Нет `access_tier` enum на distressed_listings. |
| 3 | FAST ANALYSIS | — | 🔴 missing | n/a | Нет distressed-specific DD template. |
| 4 | INTEREST SIGNAL | — | 🔴 missing | n/a | Нет interest-request table с buyer vetting. |
| 5 | VERIFIED OFFER | — | 🔴 missing | n/a | Нет `deal_terms` JSONB. |
| 6 | FAST-TRACK RESERVATION | — | 🔴 missing | n/a | Нет flexible deposit flow. |
| 7 | CLOSING 14–30 DAYS | — | 🔴 missing | n/a | Нет fast-track deal template. |

**Verdict distressed buyer:** также **100% greenfield**.

---

## 4 · Special checks (§20.2 ШАГ 3.1–3.8)

| # | Check | Result |
|---|---|---|
| **3.1.a** | Есть ли связка `stay.myuno.app → invest.myuno.app`? | ❌ Нет, нет subdomain. На `myuno.app/bookings/{id}` нет CTA «Own vs Rent». |
| **3.1.b** | Widget «Own vs Rent» в Stay? | ❌ Не найдено. |
| **3.1.c** | Pre-filter каталога по `last_stay_district`? | ❌ Filter framework существует, persona/last-stay coupling = нет. |
| **3.2.a** | Real-estate widget в `app.myuno.app` (resident dashboard)? | ❌ В `/account` widget про RE отсутствует. Есть `DashboardStatsBar` и `AccountQuickLinks` — без RE-блока. |
| **3.2.b** | Pillar «rent vs buy expat»? | ❌ Не найдено в `pillarPages.ts`. |
| **3.2.c** | `persona_code` настроен в profiles? | ✅ Через `profiles.detected_persona` + `v_profiles_canonical.canonical_primary_role`. P-code typing — `src/types/canonical.ts`. |
| **3.3.a** | `/for/investor` landing? | ❌ Не существует. |
| **3.3.b** | ClearView Full Report как lead scoring trigger? | ❌ Самой Full Report покупки нет (есть только Apply form для застройщиков). Lead-scoring system существует частично (`useMCCControlTower`), specific triggers IPP §3 — не реализованы. |
| **3.3.c** | Remote-buyer deal flow (без visit)? | ❌ Нет mode toggle. |
| **3.4.a** | Deal Room (`/mandate`)? | ❌ Не существует. |
| **3.4.b** | `investment_thesis` table? | ❌ Не найдено. |
| **3.4.c** | Mandate intake template в CRM? | 🟡 partial — `/invest/capital-deal` (`CapitalDealIntake.tsx`) существует, **но не унифицирован с canonical 7-question template**. |
| **3.5.a** | Widget «Ready for #2?» в Owner Dashboard? | ❌ |
| **3.5.b** | «Returning buyer» fast-track? | ❌ |
| **3.5.c** | «Not like my current» filter? | ❌ |
| **3.6.a** | MN language в i18n? | ❌ Только `ru/en/th`. |
| **3.6.b** | Mongolian banking partnerships (XacBank, Khan)? | ❌ Не найдено в `secrets`/integrations. |
| **3.6.c** | Multi-stakeholder deal tracking? | ❌ |
| **3.7.a** | `developers.myuno.app`? | 🟡 path-based: `/developer-portal/*` (полная реализация). |
| **3.7.b** | Bi-directional inventory sync? | 🟡 partial — данные читаются из той же БД, push-flow через approval. |
| **3.7.c** | Analytics dashboard для developer? | ✅ `DeveloperAnalytics.tsx`. |
| **3.8.a** | `/sell/quick`? | ❌ |
| **3.8.b** | `distressed_listings` table? | ❌ |
| **3.8.c** | Matching engine? | ❌ |
| **3.8.d** | `/urgent` catalogue? | ❌ |

---

## 5 · Critical gaps prioritized (impact × effort)

Шкала: **impact** = размер выручки + persona priority; **effort** = размер изменений в codebase.

| # | Gap | Impact | Effort | Priority | Веха |
|---|---|---|---|---|---|
| 1 | **Distressed vertical целиком** (P3.8 + P3.9) | 🔴 high (additional ฿4.8–7.2M/год) | 🔴 high (8 net-new tables + 4 routes + matching engine) | P0 | M10g |
| 2 | **`/for/investor` landing (P8)** | 🔴 high (P8 = 70% выручки) | 🟡 med (composing existing components) | P0 | M10b |
| 3 | **ClearView Full Report purchase flow для investor** (GAP-P8-5) | 🔴 high (lead-scoring + trust) | 🟡 med (Stripe + report-generation) | P0 | M10b/M10f follow-up — **открытый вопрос: scope в M10 или вне?** |
| 4 | **Resident dashboard RE widget (P6)** | 🟡 med (P6 = $10K/сделка × 8–12% conversion) | 🟢 low (новый виджет) | P1 | M10c |
| 5 | **Post-stay «Own vs Rent» CTA (P5)** | 🟡 med | 🟢 low (виджет в booking detail) | P1 | M10c |
| 6 | **Persona-aware ROI presets** (5 presets) | 🟡 med (используется 5 journeys) | 🟢 low (один компонент, несколько presets) | P1 | M10c (или mini-task в M10f) |
| 7 | **Dedicated `/property/compare` page** | 🟡 med | 🟡 med | P1 | M10b/M10f |
| 8 | **`/for/snowbird`, `/for/expat`, `/for/operator`, `/for/mongolia`, `/for/developer` landings** | 🟡 med (each persona × $10–20K commission) | 🟢 low (template-based) | P1 | M10b |
| 9 | **«Ready for #2?» expansion widget (P10)** | 🟡 med (retention) | 🟢 low | P1 | M10c |
| 10 | **30-day re-engagement trigger** | 🟡 med | 🟡 med (cron + WhatsApp template) | P2 | M10f |
| 11 | **Deal Room `/mandate` (P9)** | 🔴 high (per deal $60K commission) | 🔴 high (invite-only flow + access control + Thesis Builder) | P0 | **выпадает за M10** — обозначить как M11? |
| 12 | **Public ClearView ratings catalog** | 🟡 med (SEO + trust) | 🟡 med | P2 | M10b/M10d |
| 13 | **Multi-stakeholder deal tracking (P11)** | 🟡 med | 🔴 high | P2 | M11 |
| 14 | **MN locale for P11** | 🟢 low | 🔴 high (полный i18n bundle) | P3 | вне M10 |
| 15 | **Unified search inc. tools + articles + distressed** | 🟡 med | 🟡 med | P2 | M10h |
| 16 | **AI-консьерж intent routing (distressed, remote-buyer, expand)** | 🔴 high (universal entry point) | 🟡 med | P0 | M10e |

---

## 6 · Components to create (not connect)

Все компоненты ниже **не имеют** существующего эквивалента в codebase. Для каждого — обоснование, почему `connect` не работает.

| # | Component | Обоснование |
|---|---|---|
| 1 | `distressed_listings`, `investor_criteria`, `distressed_matches` (3 tables, RLS) | §17.7 IPP — net-new domain. Никакая существующая таблица не покрывает (`properties` — это static catalog, `bookings` — STR rentals, `investment_deals` — capital marketplace, не RE). |
| 2 | `/property/sell-quick` route + intake form (6 fields) | §17.4. Существующий `/sell` занят P2P market goods, концептуально другой flow (vendor onboarding ≠ distressed seller intake). |
| 3 | `/property/urgent` catalog page + distressed PropertyCard variant | §17.5. Distressed-specific UX (countdown, reason category, AVM diff badge) ≠ обычная PropertyCard. |
| 4 | Matching engine (Edge Function `distressed-match-runner` + WhatsApp template) | §17.6. Нет аналога — событийная привязка `INSERT INTO distressed_listings → push to matching investors` net-new. |
| 5 | AVM helper (Edge Function или RPC, для validation шага) | §17.4 stage 2 «admin checks AVM < −15%». Сейчас в codebase нет AVM логики (только цены из listing). |
| 6 | `investment_thesis` table + Thesis Builder PDF generator | §4E IPP. Нет существующих PDF generators под investor memo формат (`pdfFonts.ts` есть, но без шаблонов P9 thesis). |

**Все 6 компонентов нужны для M10g (1–5) и M11 (6, если scope Deal Room окажется вне M10).**

---

## 7 · Recommendations for M10b–M10h

### M10b · Persona Landing Pages (7 страниц)

**Приоритет создания** (по impact из §5):
1. **`/for/investor`** (P8) — main funnel, P0
2. **`/for/snowbird`** (P5) — высокий volume, low effort
3. **`/for/expat`** (P6) — settler conversion play
4. **`/for/operator`** (P10) — retention loop entry
5. **`/for/developer`** (P22) — B2B (или редирект на `/developer-portal/apply`?)
6. **`/for/mongolia`** (P11) — ниша, RU+EN (без MN)
7. **`/mandate`** (P9) — invite-only, отдельный access control

**Архитектурные решения для M10b (требуют ack от Pavel):**
- A: Route `myuno.app/for/[persona]` или nested под `/property/for/[persona]` (canon §13: «not add new top-level route»)?
- B: Reuse `src/pages/landings/PersonaLandingPage.tsx` (cluster-aware) или новый `IPPPersonaLandingPage` под P-coded таксономию?
- C: Контент для landings — где живёт? Текущий `src/content/landings/personaLandings.ts` использует другую таксономию.

### M10c · Dashboard Personalization

**Виджеты по dashboard:**
- `/account` (resident dashboard, P6): «Rent vs Buy widget» (GAP-P6-1).
- `/bookings/{id}` (snowbird booking detail, P5): «Own vs Rent CTA» (GAP-P5-1).
- `/owner` & `/my-property` (operator dashboard, P10): «Ready for #2?» widget (GAP-P10-2).
- `/invest/dashboard` (passive investor, P8): distressed-match alerts (после M10g) + watchlist updates.

**Foundation:** `useCanonicalProfile().profile.detectedPersona` + `useFeatureFlag('m10c_persona_widgets_v1')`. Mapping P-code → widget set задокументировать в `mem://ux/persona-system-and-ui-standard`.

### M10d · Navigation & Discoverability Consolidation

Конкретные изменения:
1. **Header `myuno.app`:** добавить пункт «Urgent» (зависит от M10g feature-flag).
2. **`/property` PropertyHub:** добавить tab «Urgent» рядом с «Buy/New/Resale» при наличии active distressed listings.
3. **Cross-link matrix (§18.3):** реализовать badge clicks `Leasehold 30Y → /knowledge/.../leasehold-risks` на `PropertyCard`. Проверить, какие из 8 contextual CTA matrix уже есть.
4. **Mobile bottom nav:** оценить замену (текущий 5-tab: Home/Browse/AI/Me + role-based; добавить «Urgent» = breaking change, нужен flag).

### M10e · AI-консьерж Journey Router

Intent handlers (добавить к M9e):
- `distressed_sell` → «I need to sell quickly» → push `/property/sell-quick` form.
- `distressed_buy` → «deals with discount» / «срочные продажи» → push `/property/urgent`.
- `remote_buyer` → «можно ли купить удалённо?» → P8 «Remote buyer track» CTA.
- `expand_portfolio` → «как купить второй?» → P10 «Returning buyer» fast-track.
- `family_decision` → multi-stakeholder hint → P11 multi-CRM thread.
- `rent_vs_own` → P5/P6 → ROI Calculator deep-link with persona preset.

### M10f · Cross-journey CTAs

Matrix пар «из → в»:

| From | To | Trigger condition |
|---|---|---|
| `/bookings/{id}` (Stay) | `/for/snowbird` + ROI tool | 2nd booking same district |
| `/account` (resident) | `/for/expat` + ROI tool | 6+ мес active + has lease |
| `/knowledge/pillars/{slug}` (article) | `/property/offplan?district=...` | mid-article CTA |
| `/property/{id}` (PropertyCard) | `/property/compare?ids=...` | 3+ same-district viewed |
| `/property/compare` | `/mandate` (если HNW) | 2+ properties >$1M compared |
| `/owner` (Operator) | `/property/urgent?match=criteria` | watchlist criteria match |
| `/invest/dashboard` | `/property/urgent` | sidebar «2 matches» |

Telemetry table `cross_journey_ctas` (append-only) — feeds M10a future audits.

### M10g · Distressed (новый модуль)

Scope clarifications:
- **Routes:** `/property/sell-quick` (seller intake) + `/property/urgent` (buyer catalog) — under Property Hub, не subdomain.
- **Tables:** `distressed_listings`, `investor_criteria`, `distressed_matches` — 3 net-new, RLS из §17.7.
- **Admin workflow:** `/admin/distressed/*` (queue, AVM-validation, approve/reject) — добавить в `/admin/*`.
- **Matching engine:** Edge Function `distressed-match-runner` (Deno, trigger via DB webhook on `INSERT INTO distressed_listings WHERE status='active'`) + WhatsApp template via UltraMSG.
- **PropertyCard variant:** `<DistressedPropertyCard>` с `urgency-badge`, `discount-vs-avm`, `deadline-countdown`, `reason-category` (no personal seller info).
- **Feature flag:** `feature_flag:distressed_v1` в `system_settings`.
- **Open questions:** AVM source (manual admin input в Phase 1? Или integration с external API?).

### M10h · Unified Search

Indexing scope (после M10b/M10g):
- properties (existing, super-search v2)
- knowledge articles (pillarPages + section articles) — добавить
- tools (calculators) — добавить как results type
- districts (location data из `lookup_values`)
- developers (existing in super-search v2)
- distressed listings (post M10g, `status='active'`)

Implementation: Postgres full-text search поверх existing tables + weighted ranking (property > distressed > article > tool > developer).

---

## 8 · Открытые вопросы для @Pavel

> **Я не делаю код в M10a, но эти вопросы блокируют M10b. Прошу ответить до старта M10b.**

1. **Route placement (см. A1, A4, A5).** Все `/for/[persona]` роуты делать `myuno.app/for/...` (top-level, ломает правило ARCHITECTURE_V2 §13.1) или nested `myuno.app/property/for/...`? IPP.md говорит «top-level» по канону субдоменов; ARCHITECTURE_V2.md говорит «never add new top-level route». **Конфликт canonical-документов** — это trigger остановки.

2. **ClearView Full Report для investor.** В IPP.md лид-scoring trigger «ClearView Full Report ฿4,900 purchased = +50» — central для P8 conversion. В коде сегодня **нет flow покупки** report инвестором (есть только developer-side apply). Это входит в scope M10 (M10b/M10f) или это отдельный сторонний M11?

3. **Deal Room `/mandate` (P9).** §4G IPP описывает Deal Room как полноценный модуль (invite-only, First Look objects, mandate-personalized UI). Effort = high (см. §5 priority 11). M10 не упоминает Deal Room как deliverable ни в одной из вех; единственное упоминание — в `/for/[persona]`-mapping выше (P9 → `/mandate`). **Делаем minimal stub в M10b или выносим в M11?**

4. **ROI Calculator unification.** 4 версии в codebase (см. §0). M10c presets потребует выбора «main» калькулятора. Решение: (a) consolidate to one (refactor — не consolidation в духе M10), (b) добавить presets в каждый (дублирование), (c) выбрать один как «canonical» и redirect остальные. **Какой путь?**

5. **Persona system reconciliation.** `useUserPersonas` (manual selectable) vs `CanonicalProfile.detectedPersona` (P1..P25 algorithmic). M10c widgets использует какую систему для targeting? IPP.md = Canonical, реальный gating tabs (PropertyHub) = useUserPersonas. **Подтверждаешь Canonical как single source?**

6. **MN locale.** Полный Mongolian i18n — вне scope M10 (effort high, impact niche). Подтверди: P11 landing делается RU+EN, MN — отложено. ОК?

7. **`commission_ledger` source of truth.** IPP.md описывает append-only commission_ledger. В codebase упоминается ledger system (`mem://architecture/finance/professional-ledger-and-billing-ecosystem`), но `commission_ledger` как таблица — не нашёл. Это проблема naming или missing table? Distressed (M10g) attribution depends on this.

---

## 9 · Acceptance checklist (§20.3)

- [x] `/docs/canonical/m10a-journey-audit.md` создан
- [x] Все 9 journey проаудированы (P5, P6, P8, P9, P10, P11, P22 + distressed_seller, distressed_buyer)
- [x] Critical gaps приоритизированы по impact × effort (§5)
- [x] Список компонентов to create (не connect) с обоснованием (§6)
- [x] Ни одной строки нового кода

---

*Owner: Pavel Ignatev. AI-исполнитель: Lovable. Эта карта — input для M10b–M10h. Без ответа на 7 открытых вопросов §8 любая следующая веха = угадывание.*
