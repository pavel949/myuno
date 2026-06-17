
# Финальный аудит перед публичным запуском

Свежие проверки `supabase--linter`, `security--get_scan_results`, `seo--list_findings` и прямые запросы к БД дали следующую картину. Ниже — что чинить, что игнорировать с обоснованием, что проверить вручную.

---

## 1. БЛОКЕРЫ — фиксим перед запуском

### 1.1 `ERROR` × 2 — Security Definer View
Линтер Supabase нашёл 2 view в `public` без `security_invoker=on`. Такие view исполняют RLS от имени владельца (postgres), а не вызывающего пользователя — это обход RLS.
**Действие:** найти оба view (`SELECT viewname FROM pg_views WHERE schemaname='public' AND definition ILIKE '%security_definer%'` + проверка `reloptions`), пересоздать с `WITH (security_invoker = on)`, прогнать линтер до зелёного.

### 1.2 `WARN` (sec-scan) — Buyers KYC доступен любому broker/admin
`buyers` (passport_number, passport_expiry, DOB, passport_scan_url, sanctions_flag, pep_flag, kyc_status, funds_source_*) — политика `devmod: broker admin full access buyers` даёт **ALL** любому `broker`/`admin`. Любой брокер видит KYC всех клиентов платформы, не только своих.
**Действие:** заменить политику на scoped — broker видит только buyers, привязанных к его лидам/девелоперу (через `agent_deals.broker_user_id` или `developer_users`). Полный доступ — только `admin`.

### 1.3 `WARN` (sec-scan) — Банковские реквизиты MC видны всем активным членам
`management_companies.bank_account/swift_code/bank_name/stripe_customer_id/stripe_subscription_id` — SELECT-политика «Members and admins can view their companies» открывает поля любому активному `member`/`staff`.
**Действие:** либо вынести banking-поля в отдельную таблицу `management_company_banking` с RLS на `director`+`admin`, либо создать view `management_companies_public` без banking и заменить запросы во фронте + закрыть SELECT базовой таблицы для не-директоров.

### 1.4 `WARN` (sec-scan) — Realtime `public:*` канал = чужие заказы/чаты
Realtime-политика разрешает любому авторизованному подписаться на `public:%`. Если где-то бродкастим `public:orders`, `public:bookings`, `public:property_chat_messages` — данные утекают.
**Действие:** аудит всех `supabase.channel('public:...')` в `src/`, перевод на `user:{auth.uid()}` / `org:{id}` топики, политика — `topic LIKE 'user:' || auth.uid()::text || '%'`.

### 1.5 `WARN` (sec-scan) — Webhook signing secrets читаемы owner/admin MC
`webhook_endpoints.secret` (HMAC) виден через SELECT любому owner/admin MC. Достаточно подделать payload и отправить на их же endpoint.
**Действие:** revoke SELECT на колонке `secret` для `authenticated`; добавить view `webhook_endpoints_safe` с `LEFT(secret, 4) || '…'`; полный secret — только service_role + одноразовый показ при создании.

---

## 2. WARN — оставляем (с обоснованием в security-memory)

### 2.1 `RLS Policy Always True` × 3 — намеренно
- `email_subscriptions` (INSERT) — подписка на рассылку без авторизации.
- `lead_magnet_submissions` (INSERT) — публичные формы захвата лидов.
- `mcc_landing_events` (INSERT) — лендинг-аналитика без логина.
Все три — **только INSERT** (не SELECT/UPDATE/DELETE), что соответствует use-case'у публичных форм. **Действие:** добавить rate-limit edge function перед каждым (если ещё нет) и зафиксировать в `update_memory`.

### 2.2 `Public Bucket Allows Listing` × N — намеренно для CDN
Публичные бакеты (`bouquet-images`, `company-logos`, `property-images`, `property-videos`, `experience-images`, `project-images`, `tour-media`, `yacht-images`, `vendor-uploads`, `complex-media`, `company-assets`, `magnet-landings`, `intake-uploads`, `property-care`) — это контент-CDN, listing допустим. **Действие:** проверить, что в этих бакетах нет приватных файлов (быстрый sample-аудит storage), зафиксировать в memory.

### 2.3 `Extension in Public` × 2
Старые расширения в `public` (вероятно `pg_trgm`, `uuid-ossp`). Миграция в `extensions` schema ломает совместимость со старыми migrations. **Действие:** зафиксировать в memory как «accepted risk», поднять в Q3 backlog.

### 2.4 `Public Can Execute SECURITY DEFINER Function` × ~50 (anon + auth)
Огромный набор `has_role`, `has_property_access`, `is_admin` и т.п. — намеренно SECURITY DEFINER, потому что они нужны в RLS-политиках. **Действие:** пройтись по списку, для каждой проверить, что внутри есть `auth.uid()`-проверка или функция действительно публична (sitemap/seo helpers). Точечно `REVOKE EXECUTE ... FROM anon` там, где anon не нужен.

---

## 3. SEO

### 3.1 Google Search Console не подключен (`failing`, level=mid)
Без GSC мы вслепую — нет данных по индексации, кликам, ошибкам crawl.
**Действие:** подключить `google_search_console` через `standard_connectors--connect`, верифицировать `https://www.myuno.app/`, отправить `sitemap.xml`. Это user-action (OAuth), агент только инициирует.

### 3.2 Per-route Helmet — выборочно
В прошлой итерации добавлены og/canonical на `/for-developers`, `/for-local-services`, `/for-business`. **Действие:** пройтись по топ-10 индексируемых страниц (главная, `/property`, `/newbuilds`, `/relocate`, `/wedding`, `/sim`, `/exchange`, `/legal`, `/visa`, `/account/auth`) — убедиться, что у каждой уникальные `title`, `description`, `canonical`, `og:*`. Сейчас многие наследуют sitewide из `index.html`.

### 3.3 Sitemap consistency
Проверить `scripts/generate-sitemap.ts` (или статический `public/sitemap.xml`) — что все live-маршруты из `src/lib/config/routes.ts` присутствуют, а deprecated (`/lifehub/*`, killed lifestyle apps) — исключены.

---

## 4. Data consistency — ручной spot-check

```text
ledger ↔ orders          : SELECT order_id FROM orders WHERE status='paid'
                           EXCEPT
                           SELECT order_id FROM ledger_entries → должно быть 0
property_bookings RLS    : залогиниться гостем A, попытаться SELECT букинг гостя B
properties col-whitelist : anon curl /rest/v1/properties?select=actual_owner_*
                           → permission denied
storage upload anon      : curl POST /storage/v1/object/property-images/test.jpg без JWT
                           → 401
guidebook                : guest без брони → /rest/v1/property_guidebook → 0 rows
crm_email_accounts.token : authenticated SELECT access_token → permission denied
```

Все 5 проверок должны пройти — это P0 из предыдущей итерации, нужно подтвердить, что миграции применились на prod.

---

## 5. Pre-launch checklist (для тебя руками)

- [ ] **Auth providers:** Email+Password + Google включены, "Confirm email" — ON, HIBP — ON.
- [ ] **Stripe:** переключить с test на live (`stripe_mode=live` в `system_settings`), проверить webhook endpoint и signing secret.
- [ ] **`system_settings.org_*`** заполнены (телефон, адрес, lat/lng, opening hours) — сделано в прошлой итерации, проверить prod.
- [ ] **`feature_flag:*`** — пройтись и отключить всё, что не готово (`navigator_v3`, экспериментальные lifestyle apps).
- [ ] **Robots.txt** — `Allow: /` (не `Disallow: /`); preview-домен `id-preview--*.lovable.app` должен быть `Disallow` или иметь `X-Robots-Tag: noindex`.
- [ ] **`ComingSoonGate`** — отключить или открыть только нужные cluster'ы.
- [ ] **Sentry DSN** + release version (`appVersion.ts` 3.55.3) подняты в prod env.
- [ ] **Backup** — снять snapshot БД перед запуском (Lovable Cloud auto, но проверить дату последнего).

---

## 6. Порядок выполнения

```text
Step 1 (миграция #1): Security Definer Views → invoker
Step 2 (миграция #2): buyers RLS scoping (broker → свои лиды)
Step 3 (миграция #3): management_companies banking split + view
Step 4 (миграция #4): webhook_endpoints.secret column-RLS + safe view
Step 5 (миграция #5): realtime channel rename audit + policy
Step 6 (frontend):     заменить supabase.channel('public:*') → user-scoped
Step 7 (frontend):     заменить запросы management_companies / webhook_endpoints на _safe views
Step 8 (SEO):          per-route Helmet на топ-10 + sitemap diff
Step 9 (security-memory update): зафиксировать accepted WARN-ы
Step 10 (verify):      supabase--linter → 0 ERROR; security--run_security_scan → 0 critical
Step 11 (manual QA):   data-consistency checks из раздела 4
Step 12:               publish
```

**Рекомендую: пройти steps 1–7 в этом PR (это закрывает все 2 ERROR + 4 critical WARN). SEO (8) и memory (9) можно отдельным PR-ом параллельно — они не блокируют запуск, но желательны до анонса. Шаги 10–12 — обязательны перед `preview_ui--publish`.**

---

## 7. Что НЕ входит в этот аудит

- Performance / bundle-size аудит (отдельная задача для `performance-optimizer`).
- Финансовая сверка ledger × Stripe payouts за прошлые периоды (отдельный finance job).
- A11y-проход — рекомендую сделать после запуска beta.
- Полный ручной QA всех 40+ микро-аппов — нереально в рамках одного PR; делаем sample по top-revenue вертикалям (Stays, Transfer, Newbuilds, Visa, Yacht).

После approve этого плана — переключайся в build mode, и я выкачу миграции по очереди с approval после каждой.
