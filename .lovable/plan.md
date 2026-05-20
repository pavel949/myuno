## Цель

Перед коммерческим запуском закрыть Playwright-тестами полный transaction loop для всех 11 marketplace-вертикалей: **поиск → фильтр → карта → карточка → создание заявки/брони → приём партнёром → смена статуса админом**. Запуск локально и в CI на каждый PR (chromium-only).

## Архитектура

### 1. Seed данные (`e2e/fixtures/seedListings.ts`)
Один `globalSetup` создаёт по 1-2 тестовых листинга в каждой из 11 вертикалей с маркером `metadata.e2e_seed = true` (через service-role insert в `public.listings` или вертикальные таблицы где это ещё требуется). Привязываем к `test-vendor` (P04 partner) и публикуем (`status='active'`). `globalTeardown` чистит по маркеру.

### 2. Параметризованный flow (`e2e/flows/marketplaceFlow.ts`)
Один абстрактный helper `runVerticalFlow(vertical: VerticalKey)`, использующий `VERTICALS` из `src/lib/verticals.ts`. Внутри:
- guest: `/discover` → клик по category chip вертикали → проверка фильтр-панели и счётчика результатов → переключение на `/map?vertical=…` → клик по pin → детальная карточка (`data-testid="listing-detail"`) → CTA «Забронировать/Запросить» → форма заявки → submit.
- утверждаем: появилась запись в `orders` (или `service_requests` для non-bookable) со статусом `pending` и `metadata.e2e_run_id`.

### 3. Spec-файлы (`e2e/tests/marketplace/`)
- `discover-filters.spec.ts` — для каждой вертикали проверка search-input, фильтров и карты (быстрый smoke без бронирования).
- `vertical-loops.spec.ts` — параметризованный `for (const v of MARKETPLACE_VERTICALS) test(v.id, …)` прогоняет полный 3-actor loop. 11 тестов из одного файла.
- `events.spec.ts`, `transfer.spec.ts` — переопределения для вертикалей с нестандартным flow (event inventory; transfer pickup-form).

### 4. Multi-actor оркестрация
В каждом vertical-тесте — три изолированных browser-контекста (`browser.newContext()`):
- **Guest** (`test-tourist`) создаёт заявку → берём `order_id` из toast/URL/DOM.
- **Partner** (`test-vendor`) логинится, идёт в `/vendor/requests`, находит заявку по `order_id`, нажимает «Принять» → статус `confirmed`.
- **Admin** (`test-admin`) логинится, идёт в `/admin/orders`, меняет статус на `completed` → проверяем финальный статус через `supabase.from('orders').select` под service-role.

### 5. Мок Stripe checkout
Новая edge function `supabase/functions/e2e-mark-paid/index.ts`:
- Проверяет header `x-e2e-token` против секрета `E2E_TEST_TOKEN` (gating; никакого фича-флага в проде).
- Принимает `{ order_id }`, валидирует наличие `metadata.e2e_seed = true` или `metadata.e2e_run_id`, иначе 403 — чтобы по чистой случайности не отметить prod-ордер.
- Вызывает существующий `record_ledger_entries` RPC, проставляет `paid_at`, `status='paid'`, создаёт `payment_intents` запись со штампом `provider='e2e_mock'`.
- В spec вместо клика «Pay with card» зовём `request.post('/functions/v1/e2e-mark-paid', …)` с тестовым токеном.

### 6. CI (`.github/workflows/e2e.yml`)
Новый workflow:
- `node 20`, `bun install`, `bunx playwright install chromium`, `bunx playwright test --project=chromium`.
- Артефакты: `playwright-report/`, видео/трейсы при падении.
- Секреты: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (для seed/teardown/проверок), `E2E_TEST_TOKEN`.
- Триггер: `pull_request` + `workflow_dispatch`. Mobile project отключаем в CI флагом `--project=chromium`.

### 7. Конфиг
- `playwright.config.ts`: добавить `globalSetup`/`globalTeardown`, выкрутить timeout per-spec до 90s (loop multi-actor длиннее), оставить mobile project для локалки.
- `playwright.ci.config.ts`: только chromium, `workers: 1`, `retries: 2`.

## Объём по вертикалям

Параметризованный тест покрывает: `property, yacht, vehicle, experience, cleaning, babysitter, beauty, restaurant, medical, legal, education, fitness, event, water_activity, pet_service, flower, transfer` — берём из `VERTICALS`. Не-bookable (`insurance, pharmacy, bank`) получают облегчённый flow «заявка вместо брони» (без partner accept), помечается `test.skip` в loop-файле, отдельный smoke в `discover-filters.spec.ts`.

## Не входит в этот этап

- Реальный Stripe redirect (мок через edge function).
- Mobile viewport в CI (только локалка).
- Edge cases отказа партнёра / возвратов — следующая волна.
- Тесты ClearView / Newbuilds (отдельная вертикаль `/newbuilds`).

## Структура файлов

```text
e2e/
├── fixtures/
│   ├── seedListings.ts          (new) globalSetup/teardown
│   ├── multiActor.ts            (new) makeGuestContext/PartnerContext/AdminContext
│   └── testUsers.ts             (existing)
├── flows/
│   └── marketplaceFlow.ts       (new) параметризованный 3-actor loop
├── tests/marketplace/
│   ├── discover-filters.spec.ts (new) 11 smoke
│   ├── vertical-loops.spec.ts   (new) 11 full-loop
│   ├── events.spec.ts           (new) event inventory override
│   └── transfer.spec.ts         (new) transfer pickup override
supabase/functions/e2e-mark-paid/index.ts  (new) gated mock-pay
.github/workflows/e2e.yml                  (new) PR gate
playwright.ci.config.ts                    (edit) chromium-only
```

## DoD

- Все 11 specs зелёные локально (`bunx playwright test`).
- CI green на PR.
- Teardown оставляет 0 `e2e_seed` записей в `listings`/`orders`.
- `e2e-mark-paid` отклоняет вызовы без токена и без `e2e_seed`-маркера (тест в `supabase/functions/e2e-mark-paid/index.test.ts`).
- README в `e2e/README.md` с инструкцией запуска.

**Рекомендую** именно этот объём: пользователь явно попросил полный loop по всем 11 вертикалям, а параметризация и edge-mock держат stability и время прогона в разумных пределах (~10-12 мин в CI).

---

## Implementation log (2026-05-20)

**Status:** scaffolded, awaiting first CI run + `E2E_TEST_TOKEN` secret.

### Created
- `e2e/fixtures/marketplaceVerticals.ts` — 20 verticals (17 full-loop + 3 smoke)
- `e2e/fixtures/serviceClient.ts` — service-role client + helpers
- `e2e/fixtures/seedListings.ts` — globalSetup, auto-skips without service key
- `e2e/fixtures/teardownListings.ts` — deletes by `metadata->>e2e_run_id`
- `e2e/fixtures/multiActor.ts` — `loginAs(role)` returns isolated context
- `e2e/flows/marketplaceFlow.ts` — parametrised guest→partner→admin loop
- `e2e/tests/marketplace/discover-filters.spec.ts` — 20 smokes
- `e2e/tests/marketplace/vertical-loops.spec.ts` — 17 full loops
- `supabase/functions/e2e-mark-paid/index.ts` — gated mock-pay edge fn
- `supabase/functions/e2e-mark-paid/index.test.ts` — token + 404 tests
- `playwright.ci.config.ts` — chromium-only, workers=1
- `.github/workflows/e2e.yml` — PR gate
- `e2e/README.md` — runbook

### Edited
- `playwright.config.ts` — added `globalSetup`/`globalTeardown`, timeout 60→90s

### Follow-ups (NOT done — user action required)
- Add Supabase Edge Function secret `E2E_TEST_TOKEN` (random 32+ chars)
- Add same value as GitHub Actions secret + `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Seed test users (P01 tourist / P04 vendor / admin) must already exist in DB — they're listed in `e2e/fixtures/testUsers.ts` with fixed UUIDs
- First green run will likely require selector tweaks per vertical (the flow uses tolerant fallbacks but some CTAs may need `data-testid="primary-cta"` added)
- Real Stripe e2e and refund/cancel paths — next wave

### Out of scope (intentional)
- Stripe live redirect (mocked via `e2e-mark-paid`)
- Mobile viewport in CI (local only)
- ClearView / Newbuilds (separate suite)
