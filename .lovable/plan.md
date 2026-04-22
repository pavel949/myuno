

# План — Auth-перестройка с сохранением Single-UUID

## 1. Контекст: «единый UUID»

В myUNO **`auth.users.id` = `profiles.id` = единый UUID пользователя** через всю систему. Этот UUID используется как FK в десятках таблиц (`properties.owner_id`, `crm_contacts.user_id`, `bookings.user_id`, `wallets.user_id`, `terms_acceptances.user_id`, и т.д.). Каскадные триггеры на `INSERT INTO auth.users` создают:

1. `public.profiles` (миграция `20260108232401`, функция `handle_new_user`)
2. `public.user_roles` (та же функция, role='user')
3. `public.wallets` (`handle_new_user_wallet`)

**Любой новый auth-flow обязан проходить через `auth.users` ровно один раз** — иначе появятся «осиротевшие» записи и дубли UUID. Это и есть инвариант, который нельзя сломать.

## 2. Build-проверка — найден баг (не связан с auth)

`npm run build` падает: `Rollup failed to resolve "workbox-window"`. Пакет `vite-plugin-pwa` ссылается на него из виртуального модуля `virtual:pwa-register/react`, но `workbox-window` не указан в `package.json` (есть `workbox-build`, `workbox-core`, `workbox-routing`, `workbox-strategies`, но нет именно `-window`).

**Фикс:** добавить `workbox-window: ^7.4.0` в `package.json` → `npm install`. Один раз, отдельным маленьким коммитом перед auth-работой, чтобы не смешивать.

## 3. Стратегия Auth без поломки UUID

### 3.1 Принцип «один путь к auth.users»

Все способы входа (phone OTP, email/password, Google, Apple, PIN) **финализируются через стандартный Supabase Auth API**, который вставляет/находит запись в `auth.users`. Никаких параллельных таблиц «пользователей», никаких «пред-аккаунтов» в `profiles` без `auth.users`.

| Метод | Конечный API | Что попадает в auth.users |
|---|---|---|
| Email + пароль | `signInWithPassword` / `signUp` | Существующий путь, не трогаем |
| Phone OTP | `signInWithOtp({phone})` + `verifyOtp` | Та же запись, ID тот же при повторных входах |
| Google / Apple | `signInWithOAuth` | Стандартный provider linking |
| PIN | `setSession(refreshToken)` | Никаких новых пользователей — только ре-гидрация существующей сессии |

Триггер `handle_new_user` срабатывает один раз на `INSERT auth.users` независимо от метода → `profiles`/`user_roles`/`wallets` создаются автоматически с одним и тем же UUID. **Логика UUID не меняется ни в одной строчке.**

### 3.2 Account linking — где риск дублей и как его убираем

Risk-кейс: юзер регистрируется через email → потом пробует войти через тот же телефон → Supabase создаёт **второй** auth.users-row → второй UUID → данные потеряны.

**Решение: identity linking через `profiles` lookup перед OTP-отправкой.**

Перед `signInWithOtp({phone})`:
1. Edge Function `auth-phone-prelink` принимает `phone` (E.164).
2. Ищет `profiles.phone = $1`. Если найден — записывает `auth.users.phone` для этого UUID через service-role (`supabase.auth.admin.updateUserById(uid, { phone })`) **до** OTP-вызова.
3. Возвращает `{ linked_uid: uid | null }` фронту (без секретов).
4. Фронт вызывает `signInWithOtp({ phone })` → Supabase найдёт уже привязанный UID и не создаст дубль.

То же самое для OAuth — Supabase сам делает linking по email, если `Identity Linking` включён в Auth settings (нужно проверить через `cloud_status` + дашборд).

### 3.3 Защита от race на стороне триггера

`handle_new_user` сейчас делает обычный `INSERT INTO profiles`. Если Supabase создаст auth.users дважды (теоретический edge case), второй INSERT упадёт по PK и сломает signup. Усиливаем: меняем на `INSERT ... ON CONFLICT (id) DO NOTHING` (и то же для `user_roles`, `wallets`). Это идемпотентность без изменения семантики.

### 3.4 Phone-feature flag

Если SMS-провайдер ещё не подключён в Cloud Auth → ставим `feature_flag:auth_phone = false` в `system_settings`. UI показывает только email + Google/Apple. Phone-кнопка появляется автоматически после включения флага. Никаких ветвлений в БД-слое.

## 4. Что строим

### Track 1 — Build hotfix (5 минут, отдельный коммит)
- `package.json`: `+ "workbox-window": "^7.4.0"`
- `npm install`
- `npm run build` зелёный

### Track 2 — Identity-safe AuthSheet
1. **`AuthSheet.tsx`** — новый bottom-sheet/modal shell, заменяет full-page navigation. Открывается из любой точки через `useAuthSheet()` context.
2. **`PhoneStep.tsx`** + **`OtpStep.tsx`** — только если `feature_flag:auth_phone`. До OTP вызывает `auth-phone-prelink`.
3. **`EmailStep.tsx`** — упрощённый email + пароль + имя в один шаг (вместо 5-шагового wizard).
4. **`OAuthRow.tsx`** — Google + Apple через `signInWithOAuth`. Facebook за `feature_flag:auth_facebook` (off).
5. **`ProfileCompletionStep.tsx`** — открывается только если `profiles.first_name IS NULL` после успешного входа. Не блокирует доступ, но просит заполнить имя.
6. **`AccountTypeSelection.tsx`** — удаляем (218 строк). Роль определяется действием.

### Track 3 — Edge Function `auth-phone-prelink`
- Deno 2.0, `verify_jwt = false` (вызывается до сессии).
- Input: `{ phone: string (E.164) }`. Validation Zod.
- Ищет `profiles.phone`. Если матч — `auth.admin.updateUserById`. Возвращает `{ linked: boolean }`.
- Никогда не возвращает email/PII даже при матче (anti-enumeration).
- Rate-limit через `system_settings` (5 запросов/минуту/IP).

### Track 4 — Идемпотентность триггеров (миграция)
- `handle_new_user`: `INSERT ... ON CONFLICT (id) DO NOTHING` для `profiles` и `user_roles`.
- `handle_new_user_wallet`: то же.
- Добавить partial unique index `profiles_phone_unique ON profiles(phone) WHERE phone IS NOT NULL` — гарантирует, что один телефон = один UUID.

### Track 5 — Snap-in замена точек входа
- `MessageHostButton`, `PropertyBookingCard`, `LoginRequiredPage`, любые `navigate('/auth')` → `openAuthSheet({ onSuccess })`. Контекст бронирования сохраняется.
- Маршрут `/auth` остаётся (deep-link совместимость) и рендерит `AuthSheet` standalone.

## 5. Что НЕ меняем (защищено)

- `auth.users` schema — не трогаем.
- `handle_new_user` business-logic — только идемпотентность.
- `profiles.id` PK = `auth.users.id` FK — единый UUID.
- Существующие `user.id` по всему коду (1456 мест) — **0 изменений**.
- `PinLogin` flow — оставляем, он уже использует `setSession` без создания нового UUID.
- Email confirmation flow + `EmailVerificationBanner` — без изменений.

## 6. Порядок выполнения

1. **Build fix** (workbox-window) — отдельный коммит, проверка `npm run build`.
2. **Миграция идемпотентности** + `profiles.phone` unique index.
3. **`auth-phone-prelink` edge function** + тест.
4. **`AuthSheet` shell + Email path** (работает сразу даже без SMS).
5. **Phone path** под feature flag.
6. **Замена точек входа** на `openAuthSheet`.
7. **Удаление `Auth.tsx` legacy и `AccountTypeSelection.tsx`** после переключения всех caller'ов.

## 7. Acceptance criteria

- [ ] `npm run build` зелёный.
- [ ] Регистрация через email → ровно одна запись в `auth.users`, `profiles`, `user_roles`, `wallets` с одним UUID.
- [ ] Регистрация через phone → то же.
- [ ] Юзер с email-аккаунтом, добавивший телефон в профиль, может войти через phone OTP → попадает в **тот же** UUID, никаких дублей.
- [ ] Юзер с phone-аккаунтом, нажавший Google → linking по email если возможно; иначе понятная ошибка «этот email уже привязан к другому аккаунту».
- [ ] PIN flow работает без изменений.
- [ ] `properties.owner_id` для существующих юзеров не меняется ни на байт.
- [ ] Bottom-sheet поверх `/property/:id` сохраняет URL и состояние выбранных дат после `signIn`.

## 8. Технические заметки

- Identity linking в Supabase Auth включается флагом в дашборде (`Auth → Settings → Manual Linking`). Если выключен — phone-prelink делает работу руками через admin API.
- `auth-phone-prelink` нужен сервис-роль key — `SUPABASE_SERVICE_ROLE_KEY` уже доступен в edge runtime.
- Все user-facing строки RU+EN из дня 1 через `useLanguage`.
- Telemetry: `auth_step_view`, `auth_method`, `auth_link_attempt`, `auth_completed` для воронки.
- Тесты: добавить unit-тест на `handle_new_user` идемпотентность через двойной `INSERT auth.users` с одинаковым UUID.

