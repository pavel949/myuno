# План: закрытие 4 P0 security-ERRORs

Цель — устранить критические утечки данных, чтобы можно было приглашать поставщиков и открывать публичный доступ. Каждое исправление = отдельная миграция + проверка кода, который читает затронутые объекты.

---

## P0-1. `properties.public_view_active` — утечка PII/финансов владельцев

**Проблема:** view с `security_invoker=off` (или GRANT для anon) отдаёт анонимам колонки `actual_owner_phone/email/name`, `purchase_price`, `mortgage_amount`, lock-коды, wifi-поля. 32 объекта.

**Фикс (миграция):**
1. `DROP VIEW public.public_view_active`.
2. `CREATE VIEW public.public_view_active` с явным whitelist безопасных колонок: `id, slug, title, description_*, city, district, lat, lng, bedrooms, bathrooms, area_sqm, property_type, listing_type, base_price_night, sale_price, currency, cover_image_url, gallery, amenities, status, published_at`.
3. `ALTER VIEW … SET (security_invoker = true)`.
4. `GRANT SELECT ON public.public_view_active TO anon, authenticated`.

**Проверка кода:** `rg "public_view_active"` в `src/` и `supabase/functions/` — убедиться, что фронт не запрашивает удалённые колонки; при необходимости переключить на `properties` (под RLS) для авторизованных владельцев/MC.

---

## P0-2. `property_guidebook` — wifi/door/lockbox коды по email гостя

**Проблема:** RLS-политика разрешает `SELECT` если `auth.email() = property_bookings.guest_email` — любой залогиненный с произвольным email может получить коды.

**Фикс (миграция):**
1. `DROP POLICY` текущей email-based политики на `property_guidebook`.
2. Новая политика: SELECT только если есть active `property_bookings` где `user_id = auth.uid()` (а не email-match) и `check_out >= now() - interval '1 day'`.
3. Доступ владельцу/MC через существующий `has_property_access(auth.uid(), property_id)`.

**Проверка:** хук гостевого portal — заменить запрос с email-match на `user_id`-match; гостям без аккаунта guidebook отдавать через signed edge function с одноразовым токеном (вне scope этой PR — отдельный TODO).

---

## P0-3. Storage `property-images` / `property-reports` — анонимная запись

**Проблема:** policies на `storage.objects` для этих bucket с ролью `{public}` на INSERT/UPDATE/DELETE — любой может перезаписать фото.

**Фикс (миграция):**
1. `DROP POLICY` всех `public`-write политик на этих двух bucket в `storage.objects`.
2. Новые политики: INSERT/UPDATE/DELETE только `authenticated` И `has_property_access(auth.uid(), (storage.foldername(name))[1]::uuid)`.
3. SELECT: `property-images` — `public` (галерея публична), `property-reports` — только `authenticated` + access check.
4. `UPDATE storage.buckets SET public = false WHERE id = 'property-reports'`.

**Проверка:** компоненты загрузки фото — проверить, что используют `supabase.auth.getUser()` перед upload.

---

## P0-4. `crm_email_accounts` — OAuth refresh tokens в plaintext

**Проблема:** колонки `access_token`, `refresh_token` хранятся как text, читаются обычным SELECT.

**Фикс (миграция):**
1. Включить `pgsodium` (если не включено) или использовать Supabase Vault.
2. Создать `vault.secrets` записи для существующих токенов, заменить колонки на `token_secret_id uuid` references vault.
3. RPC `get_crm_email_token(account_id)` SECURITY DEFINER — отдаёт расшифрованный токен только если `auth.uid() = owner_id`.
4. `REVOKE SELECT (access_token, refresh_token)` или удалить колонки после миграции значений.
5. RLS уже есть, но добавить column-level: GRANT SELECT (всё кроме токенов) authenticated.

**Проверка:** edge functions, которые отправляют email от имени пользователя — переписать на вызов RPC `get_crm_email_token`.

---

## Порядок исполнения

1. Сначала P0-3 (storage) — самый изолированный, минимум фронт-изменений.
2. P0-1 (view) — затем, проверка `rg` по фронту.
3. P0-2 (guidebook) — с обновлением хука гостевого portal.
4. P0-4 (CRM tokens) — последним, требует миграции данных + правки edge functions.

После каждой миграции — `supabase--linter` + `security--run_security_scan` чтобы убедиться, что ERROR ушёл и не появилось regressions.

## Что НЕ входит в эту PR

- 96 мест с `navigate('/auth')` (UX-blocker) — следующая итерация.
- WARN-уровень (`buyers`, realtime, `management_companies`, `webhook_endpoints.secret`) — отдельная PR.
- Guest-checkout для guidebook без аккаунта — отдельный TODO.

## Acceptance

- `security--run_security_scan` показывает 0 ERROR (было 5; одна — `auth-otp-long-expiry` — конфиг, не код).
- Анонимный `curl` к `public_view_active` не возвращает `purchase_price`/`actual_owner_*`.
- Анонимный upload в `property-images` отклоняется 403.
- Гостевой запрос guidebook с чужим email возвращает 0 строк.
- `SELECT access_token FROM crm_email_accounts` для обычного пользователя возвращает NULL/permission denied.
