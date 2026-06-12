## Phase 1 — что делаю в этой сессии (4–6 шагов, проверяемо)

Цель: убрать максимум технических блокеров **без** касания live-платежей, тестовых данных и внешних ключей. После — честный re-check готовности.

### Шаг 1. Database security sweep (миграция)
- Поправить **все** функции с `search_path_mutable` → добавить `SET search_path = public` (warn-level, но это OWASP-категория).
- Пересоздать `SECURITY DEFINER` views с `security_invoker=on` где безопасно; задокументировать остальные.
- Pgvector / прочие расширения из `public` — оценить и при безопасности перенести в `extensions`.
- **Проверка:** повторный `security--run_security_scan`, целевое снижение error+warn ≥ 80%.

### Шаг 2. Аудит stripe-webhook (без правок логики платежей)
- Прочитать все 600+ строк `supabase/functions/stripe-webhook/index.ts`.
- Проверить идемпотентность по `payment_intent.id` (двойное срабатывание webhook).
- Найти кейсы где `record_ledger_entries` НЕ вызывается → задокументировать.
- Сверить покрытие `order_type`: clearview, service, vehicle, flowers, yacht, restaurant, contract, dispute, property_deposit + другие.
- **Deliverable:** `docs/audits/stripe-webhook-audit-2026-06.md` с явным списком багов и приоритетом. Код НЕ трогаю без твоего OK по каждому пункту.

### Шаг 3. Reconciliation health-check (read-only SQL)
- Запрос: за последние 30 дней — `orders.status='paid'` без соответствующих `ledger_entries` → список «потерянных» транзакций.
- Запрос: `reconciliation_alerts` за 30 дней.
- **Deliverable:** числа в отчёте. Если 0 расхождений — это сильный сигнал, что webhook работает. Если N>0 — приоритет фикса автоматически растёт.

### Шаг 4. ComingSoonGate whitelist (готовые вертикали)
- Расширить whitelist для роутов с готовностью ≥80%: `/`, `/property`, `/newbuilds`, `/legal`, `/auth`.
- Остальное остаётся за gate до починки.
- **Проверка:** ручной тест через browser preview — открыть `/property` без логина, увидеть лендинг (не gate).

### Шаг 5. Lazy-load Sentry (perf win)
- Перенести `@sentry/react` init в `requestIdleCallback` после first paint.
- Ожидаемо: −80 KB из initial bundle, лучше LCP.
- **Проверка:** `browser--performance_profile` до/после.

### Шаг 6. Финальный re-check
Запускаю снова:
- `security--run_security_scan` → сравнение числа находок.
- `browser--performance_profile` на `/` → сравнение LCP/initial JS.
- Reconciliation SQL → сравнение.
- Обновляю `.lovable/plan.md` с честным launch-readiness status.

---

## Что НЕ делаю в этой сессии (требует твоего решения отдельно)

1. **Фикс 5 bug-блоков платежей** — после Шага 2 ты решаешь по каждому: чинить сейчас или релиз без него.
2. **Stripe test → live** — переключение режима ты делаешь сам, я только подготовлю чек-лист.
3. **Удаление 30 тестовых properties** — нужен твой OK на конкретный SQL.
4. **WorldCheck integration** — нужен API-ключ от тебя.
5. **E2E прогон vertical-loops** — это в GitHub Actions, не в чате.

---

## Технические детали

**Шаг 1 SQL pattern:**
```sql
ALTER FUNCTION public.<name>(...) SET search_path = public;
-- для DEFINER views:
DROP VIEW IF EXISTS public.<view> CASCADE;
CREATE VIEW public.<view> WITH (security_invoker=on) AS SELECT ...;
```

**Шаг 4 файл:** `src/components/ComingSoonGate.tsx` (или эквивалент по memory `security/global-authentication-gate`).

**Шаг 5 файл:** `src/main.tsx` — обернуть `Sentry.init` в `requestIdleCallback`.

---

## Время и риски

- Phase 1 ≈ 30–45 минут моих + ~5 мин твоего ревью результатов.
- **Риск регрессий:** низкий (никаких изменений в бизнес-логике, бэке транзакций, RLS).
- **Что НЕ улучшится:** Stripe-баги, тестовые данные в проде, отсутствие WorldCheck. Это явно остаётся в TODO после Phase 1.

После Phase 1 у тебя будет: чистый security baseline, документированный список реальных платёжных багов с приоритетом, и реалистичный чек-лист до live launch.

---

## Рекомендация

**Рекомендую: одобрить Phase 1 как есть.** Это даёт максимум измеримой ценности без касания денег и без риска сломать прод; платёжные баги получают честный приоритет на основе данных, а не догадок.
