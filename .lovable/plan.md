# myUNO Launch-Readiness — Phase 1 results
Last updated: 2026-06-12 (Phase 1 complete)

## ✅ Done in Phase 1

| Шаг | Результат |
|---|---|
| 1. Security sweep (search_path) | Миграция применена — 7 user-функций. Linter: **353 → 346** issues (−7) |
| 2. Stripe webhook audit | `docs/audits/stripe-webhook-audit-2026-06.md`. **Опровергает 3 из 5** «известных багов» из CLAUDE.md §3 |
| 3. Reconciliation check | **0** reconciliation_alerts за 30 дней. 132/132 confirmed orders с корректным ledger flow. ✅ |
| 4. ComingSoonGate whitelist | Расширен: `/`, `/discover`, `/property/*` теперь доступны без логина |
| 5. Sentry lazy-init | Перенесён в `requestIdleCallback` + динамический `import()`. Из initial bundle уходит ~250KB |
| 6. Re-scan | См. ниже |

## Снимок состояния (как есть)

**Security:** 346 linter issues (2 ERROR + 344 WARN).
- 2 SECURITY DEFINER views — требуют ручного решения (нужно знать назначение view'ов).
- ~150 WARN: `function_search_path_mutable` на расширениях (pgvector) — **нормально, не трогать**.
- ~30 WARN: RLS «always true» — каждый требует ревью, не blanket-fix.
- 3 WARN: public storage buckets с listing — проверить нужно ли listing вообще.
- ~150 WARN: `public_can_execute_security_definer_function` — массовый pattern; нужно по каждой решать revoke EXECUTE или security invoker.

**Платежи:** в production-quality форме. Идемпотентность на каждой ветке. 0 расхождений.

**Performance:** Sentry убран из критического пути.

## ⚠ Pending — требует твоего решения (НЕ блокирует launch)

1. **Cleanup 3 stale pending orders** (5+ мес давности) — SQL ready:
   ```sql
   UPDATE orders SET status='cancelled', notes='Auto-cancelled (stale >5mo, Phase 1 cleanup)'
   WHERE id IN ('49b0221c-...', '580d710f-...', '2bd196fc-...');
   ```
2. **Обновить CLAUDE.md §3** — убрать опровергнутые баги (1, 3). Оставить (2) flowers с пометкой «требует e2e», (4, 5) — отдельные модули.
3. **2 SECURITY DEFINER views** — нужны имена views (linter не показал) + назначение.
4. **WorldCheck integration** — нужен API-ключ.
5. **Stripe live mode switch** — твоё ручное действие.
6. **Удалить 30 тестовых properties** — нужен список ID на удаление.

## Honest launch-readiness

| Сегмент | Готовность | Что мешает |
|---|---|---|
| **Stays PMS (B2B SaaS)** | 85% | iCal edge cases на нестандартных календарях |
| **Newbuilds lead-gen** | 90% | Нужен Pavel-on-call для WhatsApp leads |
| **AI Concierge (RAG)** | 80% | Knowledge base пуст — нужны твои документы |
| **Concierge paid services** (visa ฿2000) | 70% | Live Stripe + webhook smoke test |
| **Marketplace verticals** (flowers, beauty, transport) | 50–70% | E2E тест чекаута, особенно flowers |

**Можно запускать сегодня:** Stays PMS + Newbuilds lead-gen + бесплатный AI Concierge.
**Через 1–2 недели:** + paid concierge услуги в live Stripe.
**Через 3–4 недели:** + marketplace вертикали по одной.

## Phase 2 (предложение, для следующего turn)

Если одобришь — следующий приоритет:
- Per-finding ревью RLS «always true» (выберем top-10 опасных таблиц)
- E2E тест чекаута flowers
- Cron alert на stale `orders.pending`
- Документировать 2 SECURITY DEFINER views и принять решение
