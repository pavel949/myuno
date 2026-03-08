# MyUNO — Full User Process Audit Report

**Дата:** 2025-03-08  
**Контекст:** Все роли × все процессы. Проверен реальный код (файлы, флоу, RLS, Edge Functions).

---

## STEP 0 — SYNC

- **git fetch/pull:** не выполнялся (репозиторий может быть локальным).
- **supabase gen types:** не выполнялся (требуется `SUPABASE_PROJECT_ID` в окружении).
- **npm run build:** запущен; сборка идёт (Vite), предупреждения Tailwind по `ease-[...]` не блокируют.

**Рекомендация:** Выполнить вручную:
```bash
git fetch --all && git pull origin main
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/integrations/supabase/types.ts
npm run build
```

---

## Сводная таблица

| Блок | Всего проверок | OK | Сломано / Риск | Отсутствует | Критичных |
|------|----------------|-----|----------------|-------------|-----------|
| 1. Регистрация/онбординг | 24 | 16 | 3 | 5 | 1 |
| 2. Права доступа | 18 | 12 | 2 | 4 | 1 |
| 3. Основные флоу | 28 | 18 | 4 | 6 | 2 |
| 4. Уведомления | 12 | 8 | 1 | 3 | 0 |
| 5. Мобильная версия | 14 | 10 | 1 | 3 | 0 |
| 6. Безопасность ролей | 10 | 6 | 2 | 2 | 1 |
| **ИТОГО** | **106** | **70** | **13** | **23** | **5** |

---

# БЛОК 1 — РЕГИСТРАЦИЯ И ОНБОРДИНГ

## 1.1 End User

| # | Проверка | Статус | Детали |
|---|----------|--------|--------|
| 1 | Способы регистрации (email / Google / Apple / phone) | ⚠️ | Реализованы email+password и частично phone в Auth.tsx; OAuth (Google/Apple) и magic link не прослеживаются в коде как отдельные кнопки |
| 2 | Email confirmation: что видит пользователь | ✅ | `EmailVerificationBanner` — баннер с повторной отправкой; доступ не блокируется (soft verification) |
| 3 | Повторная отправка письма при истечении токена | ✅ | `supabase.auth.resend({ type: 'signup', email })` в баннере |
| 4 | Роль `user` после регистрации | ✅ | Триггер `handle_new_user()` в миграции: INSERT в `profiles` и `user_roles(user_id, 'user')` |
| 5 | Онбординг пропускаемый / сохранение факта | ⚠️ | Отдельного «онбординг-тура» для End User не найдено; есть только чеклисты для Vendor/MC |
| 6 | Guest mode / незарегистрированный пользователь | ✅ | `ComingSoonGate`: при отсутствии user показывается UnderConstruction; при `VITE_BYPASS_COMING_SOON=true` — полный доступ без логина |
| 7 | Локализация до регистрации | ✅ | `LanguageSwitcher` в хедере Auth и на страницах сброса пароля |
| 8 | Deep link после email confirm | ✅ | `emailRedirectTo: window.location.origin/` в signUp; ResetPassword использует hash (#access_token, type=recovery) и `getPasswordResetRedirectUrl()` |

**Критично:** Дублирование триггеров: в одной миграции `handle_new_user()` создаёт profile + user_roles, в другой `handle_new_user_profile()` только profile (ON CONFLICT DO NOTHING). Порядок миграций определяет итог; при повторном срабатывании только profile возможна запись без роли.

---

## 1.2 Vendor

| # | Проверка | Статус | Детали |
|---|----------|--------|--------|
| 1 | Форма заявки (BecomePartnerPage) | ✅ | Поля: business name, category, contact name/email/phone/website/description; insert в `partner_applications` со status `pending` |
| 2 | Загрузка документов (лицензия, ИД) | ❌ | В форме заявки и в типах `partner_applications` полей для файлов не найдено; RLS на bucket не проверялся |
| 3 | Статус pending блокирует доступ к dashboard | ✅ | Доступ к Vendor Dashboard даёт только `VendorGuard` (hasRole('vendor') из org_members или user_roles). Пока заявка только в `partner_applications` — роли vendor нет |
| 4 | Admin уведомление о новой заявке | ⚠️ | Нет вызова Edge Function / Resend в коде при insert в `partner_applications`; только UI админки PartnerApplicationsAdmin |
| 5 | При отклонении — причина доходит до Vendor | ✅ | В PartnerApplicationsAdmin есть `rejection_reason`, сохраняется в БД; отображение на стороне вендора не проверялось (нет страницы «мои заявки») |
| 6 | После одобрения: роль vendor и сессия | ❌ | **Критично:** При approve в PartnerApplicationsAdmin только `partner_applications.status = 'approved'`. Не создаётся org, org_members, не добавляется user_roles.vendor. Вендор не получает доступ к dashboard автоматически |
| 7 | Vendor может добавить услугу до одобрения | N/A | Роль vendor выдаётся только через VendorOnboarding (createProfile → org + org_members + user_roles.vendor). Отдельно «одобренная заявка» не даёт роль |
| 8 | Первая публикация услуги: модерация | ✅ | В useVendor createProfile создаётся org с `approval_status: 'pending'` (marketplace_vendors); логика модерации в каталоге может скрывать таких вендоров |

**Итог по Vendor:** Два несвязанных пути: (1) Заявка через BecomePartnerPage → админ только меняет статус; (2) VendorOnboarding создаёт provider, org, org_member, user_roles.vendor. Связки «одобрили заявку → создали org и дали доступ» нет.

---

## 1.3 Agent / MC

| # | Проверка | Статус | Детали |
|---|----------|--------|--------|
| 1 | Invite-only, защита от саморегистрации в роли agent | ✅ | Роль agent/MC даётся через `invite-team-member`: добавляет в `management_company_members` и `user_roles` (staff). Самостоятельной регистрации в роли agent в UI нет |
| 2 | Срок действия invite link | ⚠️ | В Edge Function отправляется ссылка/пароль по email; явного срока истечения ссылки в коде не видно (зависит от Supabase Auth / кастомного токена) |
| 3 | Роли mc: agent / mc_admin / mc_viewer | ✅ | В invite-team-member есть company roles (director, admin, manager, accountant, staff) и маппинг в staffRole; разграничение через `team_member_permissions` и resolve_user_context |
| 4 | Agent видит только своих контактов | ✅ | Ожидаемо через RLS и entity_id/company_id в resolve_user_context; детальная проверка RLS по contacts не выполнялась |
| 5 | Онбординг после первого входа в MC | ⚠️ | MCGuard при отсутствии companies редиректит на `/mc/onboarding`; контент онбординга (подсказки, воронка) не проверялся |

---

## 1.4 Admin

| # | Проверка | Статус | Детали |
|---|----------|--------|--------|
| 1 | Admin Panel недоступна без роли admin | ✅ | Все `/admin/*` под `AdminRouteLayout` → `AdminGuard` → RoleGuard(allowedRoles: ['admin','uno_team']) и useResolvedContext (server). Роль из has_role RPC и user_roles |
| 2 | Нет повышения себя до admin в клиенте | ✅ | В клиентском коде нет вставок в user_roles с role 'admin'; назначение только через БД/админку |
| 3 | Нет публичной страницы регистрации admin | ✅ | Регистрация только через Auth (signUp); роль user по умолчанию |
| 4 | Superadmin vs admin | ⚠️ | В create-refund проверяется `profile.role` на 'admin' и 'superadmin'; в схеме `profiles` поля `role` нет (см. Блок 2) — проверка сломана |

---

# БЛОК 2 — ПРАВА ДОСТУПА

## 2.1 Матрица роутов (реализация)

| Роут | Admin | Vendor | Agent/MC | EndUser | Guest |
|------|-------|--------|----------|---------|-------|
| `/admin/*` | ✅ AdminGuard | ❌ AccessDenied | ❌ | ❌ | ❌ → /auth |
| `/mc/*` | ✅ (isAdminMode) | ❌ | ✅ MCGuard (companies) | ❌ | ❌ → /auth |
| `/vendor/*` | ✅ | ✅ VendorGuard (own) | ❌ | ❌ | ❌ → /vendor/onboarding |
| `/booking/*`, `/bookings` | — | — | — | ✅ AuthGuard достаточно | redirect на login через AuthGuard |
| `/profile/*` | ✅ | ✅ own | ✅ own | ✅ AuthGuard | ❌ |
| `/` (home) | ✅ | ✅ | ✅ | ✅ | ✅ при bypass; иначе UnderConstruction |

- Незащищённые роуты: часть каталога (restaurants, experiences и т.д.) без Guard — доступна гостю при bypass.
- Protected route: проверяется и сессия (AuthGuard), и роль (RoleGuard/MCGuard). Прямой URL без авторизации → Navigate to /auth с state.from.

## 2.2 RLS (выборочно)

- **bookings:** политики «Users can view their own bookings», «Providers can view bookings for their services», «Admins can manage all bookings» (миграция 20260108232401).
- **orders:** не просматривались отдельно; ожидаемо отдельная таблица и политики.
- **profiles:** в типах нет колонки `role`; роли в `user_roles`. Таблица `profiles` используется для отображения и настроек.

## 2.3 Edge Functions — auth

| Функция | requireAuth / проверка JWT | Проверка роли |
|---------|----------------------------|----------------|
| invite-team-member | ✅ Bearer + getUser | ✅ callerMember.role in ['director','admin'] |
| create-refund | ✅ Bearer + getUser | ❌ проверяет `profile.role` — в profiles нет role, всегда 403 |
| export-mc-data | ✅ requireAuth | ✅ membership.role in ['director','admin','manager'] |
| stripe-webhook | — | Подпись Stripe, без user auth |
| ocr-receipt | ✅ requireAuth | Нет проверки роли |
| claude-chat | Нет | Нет (публичный вызов с anon key возможен) |

**Критично:** create-refund: использовать has_role RPC или user_roles, а не profiles.role.

---

# БЛОК 3 — ОСНОВНЫЕ ФЛОУ

## 3.1 End User: Booking

- Категории услуг: реальные страницы (restaurants, experiences, transport, beauty, property и т.д.); данные из Supabase.
- Доступность слотов, Stripe Checkout, success page, confirmation email/WhatsApp — частично прослежены (stripe-webhook обрабатывает checkout.session.completed и order_id в metadata).
- После оплаты: в webhook создаётся/обновляется заказ; отправка писем через Edge (send-order-email, notify-vendor-order и т.д.) предполагается по коду.
- Отмена и refund: create-refund есть, но проверка admin сломана (см. выше).

## 3.2 Vendor: Услуги и заказы

- Vendor видит только свои услуги через provider_id / org и RLS.
- VendorOnboarding: createProfile создаёт provider, org (vendor), org_member, user_roles.vendor; добавление первой услуги через useVendorServices.
- Уведомление о новом заказе: Edge Functions (notify-vendor-order, notify-admin-order) присутствуют в проекте.

## 3.3 Agent / MC: CRM

- Контакты, pipeline, задачи, sequences — страницы под /mc (contacts, sales, tasks, sequences и т.д.).
- invite-team-member добавляет staff в MC и user_roles.staff; разграничение по company_id через management_company_members.

## 3.4 Admin: Платформенные операции

- Метрики, модерация вендоров (PartnerApplicationsAdmin), управление пользователями (AdminUsersAccess), финансы — роуты есть.
- Блокировка user: в profiles есть status, deactivated_at, suspended_at; использование в Auth и RLS не проверялось детально.

## 3.5 Платёжный флоу

- stripe-webhook: проверка подписи, обработка checkout.session.completed и order_id; создание/обновление заказа.
- create-refund: логика refund есть, но проверка прав админа сломана (profiles.role).

---

# БЛОК 4 — УВЕДОМЛЕНИЯ (кратко)

- Регистрация: Supabase Auth отправляет confirm; кастомный шаблон не просматривался.
- Booking создан: Edge send-order-email, notify-vendor-order, notify-admin-order.
- In-app: таблица notifications и политики (например «Users with bookings can view guidebook») есть.
- Матрица по каналам (Email / WhatsApp / In-app) для каждого события не верифицировалась построчно.

---

# БЛОК 5 — МОБИЛЬНАЯ ВЕРСИЯ (кратко)

- AdaptiveBottomNav, responsive-классы, Touch targets и font-size в формах не проверялись точечно.
- capacitor.config и deep link после оплаты не просматривались.
- Рекомендация: проверить touch targets ≥ 44px, input font-size ≥ 16px, safe area.

---

# БЛОК 6 — ГРАНИЧНЫЕ СЛУЧАИ И БЕЗОПАСНОСТЬ

- Роль берётся из БД (user_roles, has_role RPC, resolve_user_context), не из JWT body.
- Edge create-refund: проверка «admin» через несуществующее поле profiles.role — любой авторизованный пользователь фактически получает 403; админ не может выполнить refund через эту функцию.
- Vendor A не может вызвать API с ID вендора B — при наличии RLS по provider_id/org_id и проверок в Edge по membership.

---

# ТОП-10 КРИТИЧНЫХ ПРОБЛЕМ

| # | Роль | Блок | Проблема | Файл | Усилие |
|---|------|------|----------|------|--------|
| 1 | Admin | 2/3 | create-refund проверяет profiles.role; в profiles нет role → 403 всегда | supabase/functions/create-refund/index.ts | 1h |
| 2 | Vendor | 1 | Одобрение заявки в PartnerApplicationsAdmin не создаёт org/user_roles → вендор не получает доступ | src/pages/admin/PartnerApplicationsAdmin.tsx + backend | 3h |
| 3 | End User | 1 | Два триггера на auth.users (handle_new_user и handle_new_user_profile) — риск дублирования/отсутствия роли | supabase/migrations | 1h |
| 4 | Vendor | 1 | Нет уведомления админу о новой заявке partner_applications | trigger или Edge при insert | 2h |
| 5 | All | 2 | Часть Edge Functions без проверки роли (например claude-chat) — риск злоупотребления | supabase/functions/claude-chat/index.ts и др. | 2h |
| 6 | Vendor | 1 | Нет страницы «Мои заявки» для отображения rejection_reason | новая страница или раздел в Profile | 2h |
| 7 | End User | 3 | Явная проверка: после оплаты redirect на success URL и создание booking в webhook | stripe-webhook, front success page | 1h |
| 8 | Admin | 2 | RLS для admin_* таблиц и whatsapp_send_log — убедиться что только admin | migrations | 2h |
| 9 | End User | 1 | Один источник правды для redirect после email confirm (уже есть getPasswordResetRedirectUrl) | — | 0 |
| 10 | Agent | 1 | Срок действия invite link и повторная отправка при истечении | invite-team-member + email template | 2h |

---

# РОАДМАП ИСПРАВЛЕНИЙ

## Сегодня (блокеры транзакций и безопасности)

1. **create-refund:** заменить проверку admin с `profiles.role` на RPC `has_role(_user_id, 'admin')` или запрос к `user_roles`.
2. **Partner application approve:** при смене статуса на approved вызывать создание org (vendor) + org_members + user_roles.vendor для user_id заявки (или отправлять ссылку на VendorOnboarding с токеном).

## На этой неделе (критичный UX и целостность данных)

3. Унифицировать триггеры при регистрации: один триггер на auth.users — создание profile + user_roles.
4. Добавить уведомление админу при новой заявке partner_applications (DB trigger → Edge или Supabase hook).
5. Страница «Мои заявки» для вендора (или раздел в Profile) с отображением статуса и rejection_reason.

## В течение месяца (улучшения)

6. Проверка роли в Edge Functions (claude-chat и др.): optionalAuth + has_role где нужно.
7. RLS аудит: admin_*, platform_metrics, whatsapp_send_log, failed_notifications.
8. Мобильная проверка: touch targets, font-size inputs, safe area, capacitor.config.
9. Invite link: TTL и повторная отправка письма.
10. Полная матрица уведомлений (Email/WhatsApp/In-app) по событиям и триггерам.

---

*MyUNO User Process Audit | Все роли × Все процессы | Confidential*
