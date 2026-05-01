# Production Readiness Pass — 2026-05-01

Финальный заход подготовки к продакшну (без Stripe).

## Метрики

| Метрика | Baseline (2026-04-29) | После | Δ |
|---|---|---|---|
| Tables `public` | 386 | 386 | 0 |
| Edge functions (active) | 124 | 124 | 0 |
| RPC functions (`public`) | 420 | **406** | **−14** |
| Auth Gate активен | ❌ (bypass=true) | ✅ (через env) | +1 |
| Critical security findings | 5 | **0** | −5 |
| Public routes whitelist | 7 | **11** | +4 |

## Что сделано

### 1. Auth Gate — production mode
- `src/App.tsx`: `bypassComingSoon` теперь читает `import.meta.env.VITE_BYPASS_COMING_SOON`. По умолчанию gate активен.
- Расширен whitelist публичных маршрутов: добавлены `/reset-password`, `/legal`, `/developer-portal/apply`, `/clearview`.
- Незалогиненный пользователь видит `UnderConstruction` на всех непубличных страницах.

### 2. Безопасность — RLS hardening (предыдущий заход)
Закрыто 5 критических уязвимостей:
- PII (email/телефон) скрыты от анонимов: `contact_identities`, `contact_identity_links` — только владелец и staff/admin.
- ClearView отчёты (`due_diligence_reports`) — доступ только при оплаченной подписке.
- Storage: `crm-documents` и `mc-backups` — scoped к участникам management company.
- View `v_clearview_public` переведена на `security_invoker = on`.
- `clearview_grade_to_recommendation` — зафиксирован `search_path`.

### 3. Cleanup Wave 5 batch 3 — RPC drop
Удалено **14 верифицированных orphan RPC** (после двойной проверки через `pg_trigger`, `pg_policies`, `pg_proc.prosrc` cross-ref и frontend ripgrep):

```
auto_publish_on_approval, award_achievement, calculate_order_cashback,
consume_clearview_bundle_slot, generate_booking_operational_tasks,
get_finance_summary_daily, get_gmv_summary, get_latest_ai_artifact,
get_platform_fee_percent, get_portfolio_health_summary, get_trust_stats,
get_user_analytics_summary, log_ownership_transfer, mcc_check_inactivity
```

### 4. Откат ошибочного drop
В первом проходе drop затронул 5 функций, которые вызываются из фронта через `supabase.rpc('name')` (string literal). Static-аудит `pg_proc.prosrc` это не покрывает. Восстановлены идентичные определения:

```
get_all_currency_rates, get_subscription_revenue, detect_booking_conflicts,
apply_referral_code, add_team_points
```

**Урок для будущих cleanup проходов**: detector должен также сканировать `src/**/*.{ts,tsx}` на регулярку `\.rpc\(['"](\w+)['"]` — добавить в `scripts/audit-baseline.mjs`.

### 5. Edge Functions
Из категории 🟥 «Recommend DELETE» (`docs/audits/2026-04-wave5-dead-code.md`):
- `claude-chat`, `auto-social-publish`, `firecrawl-map`, `firecrawl-search`, `etagi-scrape-projects`, `process-guest-messages`, `document-reminder-check` — **уже отсутствуют** в `supabase/functions/` (удалены ранее).

Активные edge functions: 124 (без изменений в этом заходе).

## Security Linter — финальный статус

- **ERROR**: 0
- **WARN**: 358

Распределение WARN (все non-blocking, обоснованы):
- `extension_in_public` — `btree_gist`, `pg_trgm` — стандартная установка, риска нет.
- `permissive_rls_policy` — намеренные публичные read-policies (каталог услуг, публичные новостройки).
- `public_bucket_allows_listing` — публичные buckets (`avatars`, `property-images`) — нужны для CDN.
- `anon_security_definer_function_executable` — RPC, доступные анонимам (поиск, курсы валют, публичные cards). Авторизация контролируется внутри функции через RLS целевых таблиц.

Полный список — в выводе `supabase--linter`. Критичных переходов с предыдущего скана нет.

## Что НЕ сделано (вынесено в отдельный заход)

- ❌ **Stripe-блок**: 5 RE Audit багов (#1-#2 checkout/orders, частично #3-#4), переход на live keys, фикс `webhook → orders` flow.
- ❌ **RE Audit баги #3-#5** (booking confirmation, owner financials, role selection edge cases) — требуют воспроизведения с реальной сессией; в этом заходе не приоритет, т.к. нет блокирующих репортов.
- ❌ **Полный sweep `any`** (745 occurrences) — отдельная сессия рефакторинга.
- ❌ **Wave 1.C** — 419 hardcoded routes → `APP_ROUTES`. Делать оппортунистически.
- ❌ **Wave 5 deep-deep** — оставшиеся ~270 RPC orphan-кандидатов требуют ручной проверки `pg_depend` + DDL триггеров через `EXECUTE PROCEDURE` (детектор не покрывает).

## Готовность к продакшну

| Критерий | Статус |
|---|---|
| Auth Gate активен | ✅ |
| Critical security findings = 0 | ✅ |
| RLS на всех публичных PII полях | ✅ |
| Storage buckets scoped | ✅ |
| Stripe live mode | ❌ (отложено) |
| Webhook → orders flow рабочий | ⚠️ (требует Stripe-захода) |
| E2E happy paths зелёные | ⚠️ (не прогонялись в этом заходе) |

**Вердикт**: Платформа готова принимать новых пользователей с авторизацией. Платёжный путь требует отдельного захода перед открытием транзакций.
