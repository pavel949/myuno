# План: верификация drop-а 21 RPC + smoke-тесты

## Что уже проверено (read-only, до этого плана)

**Code-side (rg по `src/` + `supabase/functions/`, без _archive/docs/types.ts):**
- 0 вхождений всех 21 удалённых имён (20 dropped + `cleanup_old_sync_logs`). Никаких `.rpc('<name>')`, никаких прямых SQL-вызовов.

**DB-side (pg_proc / pg_trigger / cron.job):**
- Все 21 функции отсутствуют в `public` (still_in_db = 0).
- 0 триггеров и 0 cron-задач ссылается на них.
- Битый cron `cleanup-sync-logs-daily` удалён.

**LIVE RPC sanity-check (10 функций из `[LIVE]` + 4 ключевых платёжных):**
- Все 14 присутствуют в `public`: `apply_referral_code`, `has_canonical_role`, `get_subscription_revenue`, `get_all_currency_rates`, `detect_booking_conflicts`, `add_team_points`, `rotate_ical_token`, `ensure_multi_role_qa_bundle`, `resolve_life_os_context`, `resolve_user_context`, `check_availability`, `check_yacht_availability`, `record_ledger_entries`, `process_payout`.
- ⚠️ Замечен дубль: `check_yacht_availability` существует в 2 экземплярах (overload). Не блокер, но отметить отдельно — кандидат на дальнейший аудит сигнатур.

**Вывод:** регрессии от drop-а 21 RPC нет — ни одна точка кода/инфры в них больше не упирается.

---

## Smoke-план (что прогнать дальше)

### A. Статика (быстро, ~1 мин)
1. `tsc --noEmit` — после регена `types.ts` миграцией убедиться, что нигде не осталось импорта удалённых типов RPC.
2. `vitest run` — полный unit + navigation suite (77/77 прошёл в предыдущем шаге, сейчас перепрогон с фиксом типов).

### B. Динамика — Playwright smoke (CI-config, chromium only)
Минимальный набор, покрывающий потоки, где живут оставшиеся LIVE RPC:

| Spec | Покрытый RPC / поток |
|---|---|
| `e2e/tests/auth/login.spec.ts` + `signup.spec.ts` | `has_canonical_role`, `apply_referral_code`, `ensure_multi_role_qa_bundle`, `resolve_user_context` |
| `e2e/tests/navigation/home.spec.ts` | `resolve_life_os_context`, `get_all_currency_rates` |
| `e2e/tests/booking/yacht-booking.spec.ts` | `check_yacht_availability` (важно — есть overload, надо убедиться что клиент бьёт в правильный) |
| `e2e/tests/booking/tour-booking.spec.ts` + `booking-flow.spec.ts` | `check_availability`, `detect_booking_conflicts`, `record_ledger_entries` (через мок `e2e-mark-paid`) |
| `e2e/tests/marketplace/vertical-loops.spec.ts` (1 вертикаль `yacht` или `tour`, не все 17) | order→paid→ledger полный цикл |
| `e2e/tests/wallet/wallet.spec.ts` | `get_subscription_revenue` admin-side обходим, но wallet UI читает баланс |

Команда: `bunx playwright test --config=playwright.ci.config.ts --project=chromium e2e/tests/auth e2e/tests/navigation e2e/tests/booking e2e/tests/wallet e2e/tests/marketplace/discover-filters.spec.ts`

### C. Runtime telemetry (5 мин окно)
- `supabase--edge_function_logs` по самым нагруженным функциям (`stripe-webhook`, `analyze-contract`, `e2e-mark-paid`) на предмет `function ... does not exist` / `42883`.
- Браузер: `code--read_console_logs` + `code--read_network_requests` на главной (`/`), `/discover`, `/wallet`, `/yachts` — ищем 400/500 от `/rest/v1/rpc/...`.

### D. Отчёт
Краткая таблица: «проверено / зелёное / красное / следующий шаг». Если что-то красное — отдельный fix-PR, не смешиваем с этим аудитом.

---

## Технические детали

- `playwright.ci.config.ts` уже требует секреты `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_TOKEN`. Service role на Lovable Cloud недоступен → marketplace full-loop auto-skip (`E2E_SEED_SKIPPED=1`). Discover smokes и payment mock через `e2e-mark-paid` отработают.
- Для overload `check_yacht_availability` — НЕ дропать в этом шаге, только зафиксировать в `docs/audits/rpc-true-orphans-2026-04-29.txt` как «дальнейший аудит сигнатур», чтобы случайно не уронить `useYachtAvailability` / `useCheckYachtAvailability`.
- При красном smoke — НЕ откатывать миграцию drop-а (она уже доказана безопасной), искать причину в самом потоке.

## Что НЕ делаем в этом плане

- Не трогаем `[LIVE]` и `[CRON]` RPC.
- Не дропаем дубликат `check_yacht_availability` overload — отдельная задача.
- Не запускаем полный 17-vertical full-loop (требует service role, недоступен).

**Рекомендую:** запустить Шаги A → B (auth + navigation + booking + discover-filters) → C. Если зелёное — закрываем тикет; если есть фейлы, тогда фикс отдельным заходом. — самый быстрый путь к подтверждению, что drop ничего не сломал, без раздувания scope.
