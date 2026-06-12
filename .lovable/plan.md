# Аудит myUNO: честный ответ на 4 вопроса

## TL;DR — короткий вердикт

| Вопрос | Ответ |
|---|---|
| Крутая ли система? | **Да по амбиции, нет по исполнению.** 510 страниц, 405 таблиц, 25 персон, ClearView, PMS, CRM — масштаб уникальный. Но 50–60% поверхности дублируется или мёртвая. |
| Решает все проблемы иностранцев? | **Частично.** Только 1 из 3 целевых сегментов (Investor) покрыт нормально (67%). Relocator $300–800K покрыт на **35%** — это главная дыра. Second-home — 50%. |
| Работает ли? | **С серьёзными утечками.** Найдено **18 битых маршрутов** (404 на проде), 1 критическая Order-First дыра в Stripe (Yacht), 7+ хардкод-комиссий в коде. |
| Есть ли дубли и неясности? | **Да, системные.** 3 параллельных таксономии персон, 6 коллизий P-кодов, 4 из 6 surface-лендингов отсутствуют, дублирующиеся investor/developer/raise страницы. |

---

## Что реально круто (не трогать)

- **Master Taxonomy v1.0** как замысел — двухслойная (Surface×6 + JTBD×10) с 25 персонами — индустриально-сильный фундамент.
- **PMS на `properties` SSOT** с 281 колонкой и 20 RLS-политиками — серьёзная инженерия.
- **ClearView V3** с 8-критериями, paywall и публичной сводкой через `v_clearview_public` — реальное конкурентное преимущество.
- **AnimatedRoutes + APP_ROUTES + lazy-loading** — архитектурно правильно; нарушения локальные.
- **Order-First** соблюдается в 3 из 4 проверенных flow.
- Главные home-точки (`PrimaryGrid`, `ClusterGrid`, `TrustAsAService`) — все ссылки рабочие после фикса ClearView сегодня.

---

## Топ-проблемы по 4 осям

### 🔴 Ось 1: Битые маршруты (404 на проде)

| # | Маршрут | Где ссылка | Тип |
|---|---|---|---|
| 1 | `/invest/ops/market` + 4 sibling'а | `AnimatedRoutes.tsx:335` (редирект *на* несуществующий путь) | **404-петля** |
| 2 | `/banking` | `LiveSurfaceLandingPage` | 404 |
| 3 | `/school-finder` | `LiveSurfaceLandingPage` | 404 |
| 4 | `/property/my` | `PropertyLanding.tsx:297` (должно быть `/my-property`) | 404 на главной property |
| 5 | `/legal/deposit-vault` | `DepositRiskQuizPage:163` | 404 на платном flow |
| 6 | `/legal/contract-analysis` | `NbTermsTab:153` | 404 |
| 7 | `/services/architecture`, `/services/construction`, `/services/utilities/internet` | `BuildSurfaceLandingPage`, `LiveSurfaceLandingPage` | 404 (свежие лендинги ссылаются на несуществующие сервисы) |
| 8 | `/invest/submit` | `DeveloperOverview:103` | 404 |
| 9 | `/me/payments` | `PendingPaymentsChip:61` | 404 |
| 10 | `/admin/newbuilds/documents` | `AdminNewbuildsConsole:71` | админ-404 |

**Плюс:** `MeDocuments:214` — необработанный throw на архиве документа; `MCOnboarding:124,206` — silent fail на онбординге MC.

### 🔴 Ось 2: Дубли и таксономический хаос

**Самое серьёзное — 3 параллельные системы персон:**
- `master.ts` (канон, P01–P25)
- `content/landings/personas/*.ts` (старая P1–P26, **6 коллизий**: P10/P11/P13/P22/P23/P24/P25 указывают на разные персоны в двух системах)
- `useUserPersonas.ts` (14 runtime-значений, не связаны ни с одной из двух)

→ **PersonaLandingPage сейчас рендерит чужой контент** для большинства персон. Файл `P13_PET_OWNERS` живёт по адресу мастер-персоны `P13_employee_expat`.

**Дублирующиеся страницы под одну job:**
- Investor: `/for/investor` vs `/invest/capital-advisory` — нет канона, делят SEO-вес
- Developer: 3 точки входа (`/for-developers`, `/clearview/for-developers`, `/developer-portal/apply`)
- Raise: `/invest/raise` + `/invest/pitch` redirect + `/invest/submit` (объявлен, не зарегистрирован)
- `/partner-terms` и `/partner-agreement` рендерят **один и тот же компонент** → duplicate content
- `IndexSimplified.tsx` — orphan-страница без маршрута

**Surface-лендинги:** из 6 surface'ов есть только `/for/live` и `/for/build`. **Нет `/for/arrive`, `/for/manage`, `/for/invest`, `/for/legal`** — половина заявленной IA не существует.

### 🔴 Ось 3: Покрытие персон и сегментов

| Сегмент | Покрытие | Главная дыра |
|---|---|---|
| **Investor $2M+** | 67% | P21 Active Investor нет канонического лендинга (размазан по `hnw`+`mn-investors`) |
| **Relocator $300–800K** | **35%** | P08/P09 нет своих лендингов, **P10 Returnee — полный 0**, нет `/for/relocator-*` маршрутов |
| **Second-home $200–500K** | 50% | P23 Property Owner подан как B2B-management, не как buyer journey |

**Orphan-персоны с контентом, но без двери с главной:** P14 Medical, P15 Wedding, P16 Athletes, P18 LGBTQ, P19 Accessibility, P11/P25 Students.

**Фантомные персоны без канона:** P26 Conscious Eaters, P13 Pet Owners — едят content surface, не описаны в master.ts.

### 🔴 Ось 4: Деньги и бизнес-логика

| # | Проблема | Файл |
|---|---|---|
| 1 | **Order-First нарушен в Yacht** — Stripe-чекаут до создания order | `YachtBooking.tsx:215 vs 238` |
| 2 | **Все commission rates хардкод** (10%, 6%, 5%, 12%, 3%, 30%, 19%) — должны идти из `commission_agreements` | `realEstateEngine.ts:120-211`, `useAdminAnalytics.ts:213` |
| 3 | **Stale ClearView копи "AAA–BB"** — должно быть AAA–CCC | `P9_HNW.ts:29,36` |
| 4 | **WorldCheck не gated** для русских клиентов в capital deals | `realEstateEngine.ts`, `CapitalDealFeeBreakdown` |
| 5 | **Audit marker отсутствует** на всех money-screen'ах кроме одного (`CapitalDealIntake`). Wallet и TransactionCard показывают `"—"` вместо ledger_entry_id | `Wallet.tsx:352`, `TransactionCard:96` |
| 6 | **Feature flags не используются** для новых revenue features (STR fees, cross-sell, ClearView paywall) | разные |
| 7 | **Хардкод "10% commission" в публичных лендингах** | `WeddingLandingPage:58`, P21/P22/P23 личные лендинги |
| 8 | **FX/exchange_rates таблица не используется нигде в src/** — мультивалюта по факту не реализована | весь src |

---

## Roadmap — 4 спринта по приоритету

### Sprint A · Stop the bleeding (1–2 дня)
Только то, что прямо сейчас отдаёт 404 или теряет деньги.
1. Yacht Order-First fix (P0, риск нерасшифровываемых платежей)
2. 10 битых маршрутов из таблицы выше — либо зарегистрировать заглушки `ComingSoon`, либо переписать ссылки на канонические
3. `/partner-terms` → `<Navigate>` на `/partner-agreement`
4. `MeDocuments.tsx:214`, `MCOnboarding:124,206` — обернуть в try/catch + toast
5. Стереть `IndexSimplified.tsx`

### Sprint B · Таксономия персон (3–4 дня)
Без этого все persona landings врут пользователю.
1. Переименовать файлы в `content/landings/personas/` на канонические P-коды (resolve 6 коллизий)
2. Добавить `canonicalCode: PersonaCode` в `PersonaLanding` type и backfill всех 27 файлов
3. Связать `UserPersona` hook → landing slug → master P-code единым lookup
4. Убить `P26_CONSCIOUS_EATERS`, `P13_PET_OWNERS` или промотировать их в master.ts (решение продукта)

### Sprint C · Закрыть Relocator-сегмент (5–7 дней)
Самая большая бизнес-дыра — $300–800K сегмент покрыт на 35%.
1. `/for/relocator-family` (P08) и `/for/relocator-solo` (P09) — отдельные лендинги
2. `/for/returnee` (P10) — единственная персона с полным нулём
3. `/for/active-investor` (P21) — отделить от HNW
4. `/for/property-owner` (P23) — buyer-журналинг вместо ops-копи
5. Добавить P07 retiree в area-pages: `kamala`, `rawai`, `chalong`

### Sprint D · Деньги по правилам (5–7 дней)
1. Все commission rates → live query к `commission_agreements`
2. `<AuditMarker>` на Wallet/TransactionCard/OwnerPayouts/OwnerInvoices/OrderSuccess (реальные tx_id + ledger_entry_id + ISO timestamp)
3. WorldCheck gate в capital flow (Russian clients)
4. Feature flags для ClearView paywall, STR fees, cross-sell
5. Стереть hardcoded "10%" из public-facing копи (4 файла лендингов)
6. Поправить `AAA–BB` → `AAA–CCC` в `P9_HNW.ts`

### Sprint E · Surface landings (3 дня)
`/for/arrive`, `/for/manage`, `/for/invest`, `/for/legal` — 4 недостающих surface-лендинга для закрытия IA и SEO.

---

## Метрика "после"

| Показатель | Сейчас | После A–D |
|---|---|---|
| Битых маршрутов в hot-paths | 10 | 0 |
| Order-First compliance | 75% | 100% |
| Relocator покрытие | 35% | 80% |
| Investor покрытие | 67% | 90% |
| Hardcoded commissions в src | 12 мест | 0 |
| Money screens с audit marker | 1/8 | 8/8 |
| Surface landings | 2/6 | 6/6 |

---

## Технические детали (для разработки)

- **Sprint A** — фронтенд + 1 backend touch (yacht checkout reorder)
- **Sprint B** — чисто фронтенд + types refactor, no DB
- **Sprint C** — фронтенд (5 новых страниц + area config edits)
- **Sprint D** — фронтенд + хуки `useCommissionRate(verticalId)` поверх существующей `commission_agreements` таблицы
- **Sprint E** — чисто фронтенд

DB-миграции не требуются — все нужные таблицы уже есть (`commission_agreements`, `system_settings`, `ledger_entries`).

---

## Рекомендация

**Рекомендую начать со Sprint A немедленно** — это 1–2 дня работы, ноль продуктовых решений, и закрывает риск реальных потерь денег (Yacht Stripe) и потери трафика (10 hot-path 404). После A — Sprint B (таксономия), потому что без него Sprint C построит лендинги поверх сломанного фундамента.

Скажите «делай Sprint A» — и я выкачу фиксы пачкой.
