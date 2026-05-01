## План: подготовка к продакшну (без Stripe)

### Контекст

Уже сделано в предыдущих заходах:
- ✅ Auth Gate активирован (`bypassComingSoon` через env)
- ✅ 5 критических RLS-уязвимостей закрыты (PII, ClearView, storage)
- ✅ `clearview_grade_to_recommendation` — `search_path` зафиксирован
- ✅ Wave 1 cleanup: 33 orphan edge fn в `_archive/`, 19 пустых таблиц удалены
- ✅ Wave 5 batch 1+2: 12 RPC удалены

Остаётся: не-платёжная часть RE Audit багов, Wave 5 deep RPC аудит, удаление подтверждённых dead code edge fn, верификация Auth Gate end-to-end.

---

### Скоуп (что делаем)

#### 1. RE Audit баги — не-платёжная часть
Из 5 блоков багов исключаем всё, что трогает Stripe webhook / `payment_intents` / orders creation после оплаты. Чиним:

- **Auth/Role selection (Bug #5)** — edge case при первом логине: иногда роль не присваивается, юзер падает на пустой `/account`. Проверить `useEnsureMultiRoleQaBundle` + триггер `handle_new_user`, добавить fallback на `primary_role='guest'` в profile-trigger.
- **Owner financials (Bug #4)** — non-Stripe часть: расхождения income/expense в `property_financials` дашборде. Проверить агрегацию в `usePropertyFinancials`, типизировать ответы (убрать `any`), добавить empty-state.
- **Booking flow confirmation (Bug #3)** — non-payment edge cases: после успешной брони не обновляется UI (cache stale). Добавить invalidation `['bookings', propertyId]` после `useCreateBooking` mutation.

Багов **#1 (Checkout/Payments)** и **#2 (Flowers cart)** — НЕ трогаем (требуют изменений в Stripe webhook).

#### 2. Cleanup Wave 5 — deep RPC drop
Из `docs/audits/rpc-true-orphans-2026-04-29.txt` (30 функций) ручная верификация через `pg_depend` + `pg_proc.prosrc` scan. Безопасно дропаем (миграция):
- `find_nearby_*` остатки (если есть)
- `get_*_summary` функции БЕЗ ссылок в RLS/триггерах/cron
- `devmod_*` функции (dev-only)

Цель: 420 → ≤ 405 RPC.

#### 3. Cleanup — подтверждённые dead edge functions
Из `docs/audits/2026-04-wave5-dead-code.md` категория 🟥 "Recommend DELETE":
- `claude-chat`, `auto-social-publish`, `firecrawl-map`, `firecrawl-search`, `etagi-scrape-projects`, `process-guest-messages`, `document-reminder-check`

Действие: переместить в `supabase/functions/_archive/` + убрать из `supabase/config.toml`. Категорию 🟨 (webhook-suspects) НЕ трогаем.

#### 4. Типизация `any` в критичных hooks
Узкий проход по 5-8 hooks в `src/hooks/`, связанных с финансами и бронированиями (где `any` маскирует баги):
- `usePropertyFinancials`, `useOwnerDashboard`, `useBookingsList`, `useReservations`
- Заменить `any` → Supabase generated types (`Database['public']['Tables'][...]['Row']`).

Полный sweep 745 `any` — НЕ делаем (это отдельная большая работа).

#### 5. Верификация Auth Gate
- Прогнать существующий e2e `e2e/tests/auth/login.spec.ts` мысленно по коду
- Убедиться что `VITE_BYPASS_COMING_SOON` НЕ установлена в продакшн-сборке (проверить `.env.example`, `vercel.json`)
- Whitelist публичных роутов: `/`, `/auth`, `/reset-password`, `/legal/*`, `/vendor/join`, `/developer-portal/apply` — проверить что все доступны без логина

#### 6. Финальный security scan
- Запустить `supabase--linter` и `security--run_security_scan`
- Зафиксировать найденное: что критично — починить миграцией; что не критично (extension warnings, anon-доступ к auth-триггерам) — задокументировать в `docs/SECURITY_BASELINE.md`

---

### Что НЕ делаем (явно)

- ❌ Stripe webhook (`stripe-webhook/index.ts`, 1056 строк) — не трогаем
- ❌ `payment_intents` / `orders` creation flow
- ❌ Cart checkout (Flowers, Market, Wellness)
- ❌ Полный sweep 745 `any`
- ❌ Wave 1.C (419 hardcoded routes) — оппортунистически в других PR
- ❌ Удаление 296 RPC «orphan-кандидатов» без deep verification

---

### Технические детали

**Миграции:**
- 1 миграция: drop ~10 верифицированных RPC + опц. fix `handle_new_user` trigger fallback

**Файлы (правки):**
- `src/hooks/owner/usePropertyFinancials.ts` (типы + agg fix)
- `src/hooks/booking/useCreateBooking.ts` (cache invalidation)
- `src/contexts/AuthContext.tsx` или `useEnsureMultiRoleQaBundle` (role fallback)
- `supabase/config.toml` (убрать 7 dead fn блоков)

**Файлы (перемещение в `_archive/`):**
- 7 edge functions из категории 🟥

**Новые файлы:**
- `docs/SECURITY_BASELINE.md` — что осталось из warnings и почему OK
- `docs/audits/wave-progress-2026-05-01.md` — финальный отчёт

---

### Критерии готовности

1. `supabase--linter` — 0 ERROR-level findings (WARN допустимо с обоснованием)
2. `security--run_security_scan` — 0 critical
3. RPC count: 420 → ≤ 410
4. Active edge fn: 124 → ≤ 117
5. Auth Gate: незалогиненный юзер видит `UnderConstruction` на всех непубличных роутах
6. 3 RE Audit бага (#3, #4, #5) воспроизводимо починены

---

### Что нужно от вас

После approve — переключаюсь в build mode и реализую за 1 заход. Если в процессе deep RPC аудита найдутся неоднозначные функции — оставлю их, отмечу в финальном отчёте.

Stripe-блок (баги #1, #2 + переход на live keys + webhook→orders fix) — отдельным заходом по вашему сигналу.