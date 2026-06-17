## Цель
Дать чёткий ответ: можно ли начинать приглашать поставщиков на платформу прямо сейчас. Аудит, без правок кода — правки оформим отдельной итерацией только если найдём блокеры.

## Что я уже проверил (по коду)

**Точки входа и flow:**
- `/vendor/join` → `VendorLanding` (преимущества, 4-шаговое объяснение, уровни верификации). Если уже vendor — редирект на `/vendor`.
- `/vendor/onboarding` → `VendorOnboarding` за `AuthGuard`. Wizard на 3 шага:
  1. О бизнесе (имя, категория через `CategoryPicker`, телефон) → создаёт `providers` (is_active=false) + `partner_applications` (status=pending) + fire-and-forget `notify-admin-partner-application`.
  2. Первый листинг (имя, цена, описание, фото) → создаёт `vendor_services` (is_active=false).
  3. Pending review — статус ожидания модерации.
- Альтернативная B2C-точка: `/become-partner` (`BecomePartnerPage`) и `/partner/status` для отслеживания.

**Защита от ошибок (уже в коде):**
- BUG-01: блок на отсутствие email.
- BUG-09: rollback `providers` если `partner_applications` insert упал.
- BUG-10: блок дубль-заявок за 7 дней.

**Админская модерация:**
- `/admin/partner-applications` → `PartnerApplicationsAdmin` (фильтры по статусам, статистика, диалог approve/reject).
- Approve вызывает edge function `approve-partner-application` (C2-fix: сначала активирует `providers.is_active=true` + `vendor_services.is_active=true` + `marketplace_vendors`, создаёт/находит vendor org, добавляет `user_roles.vendor`, и только потом помечает заявку approved). Логика корректная, атомарная по смыслу.

## Что нужно проверить вживую (это и есть план)

### 1. Сквозной прогон Vendor flow на preview (390×800)
- [ ] Открыть `/vendor/join` неавторизованным → CTA ведёт на `/auth?redirect=/vendor/onboarding`.
- [ ] Зарегистрироваться тестовым email → редирект в wizard.
- [ ] Шаг 1: заполнить имя/категорию/телефон → submit. Проверить:
  - `providers` row создан с `is_active=false`.
  - `partner_applications` row создан со `status=pending`, `metadata.provider_id` совпадает.
  - В UI шаг переключился на 2.
- [ ] Шаг 2: добавить услугу с ценой → `vendor_services` row с `is_active=false`.
- [ ] Шаг 3: показан экран Pending Review. Кнопки/линки на `/partner/status` работают.
- [ ] `/partner/status` отображает поданную заявку и текущий статус.

### 2. Сквозной прогон админ-модерации
- [ ] Залогиниться админом, открыть `/admin/partner-applications`.
- [ ] Найти тест-заявку, нажать Approve.
- [ ] Проверить в БД:
  - `partner_applications.status='approved'`.
  - `providers.is_active=true`.
  - `vendor_services.is_active=true`.
  - `user_roles` содержит `role='vendor'` для user_id.
  - `orgs` / `org_members` — vendor org привязан.
- [ ] Логи `approve-partner-application` без ошибок.
- [ ] Письмо одобрения (Resend) ушло — проверить лог.
- [ ] Сразу после approve: тест-юзер при логине попадает в `/vendor` дашборд и видит свою услугу.

### 3. Прогон Reject-сценария
- [ ] Подать вторую тест-заявку, отклонить с причиной.
- [ ] Проверить email отклонения и `rejection_reason` в `partner_applications`.

### 4. Видимость на витрине
- [ ] После approve услуга появляется в публичном каталоге своей категории (например, `/services/<vertical>` или универсальный поиск).
- [ ] До approve услуга нигде не светится (RLS + is_active=false).

### 5. Edge cases и риски
- [ ] Что происходит, если юзер закрыл вкладку между шагом 1 и шагом 2? (`providers` уже есть → при следующем заходе wizard должен корректно подхватить). Проверить ветку `if (createdProviderId) setCurrentStep(1)`.
- [ ] Двойной submit (защита от спама заявок) — есть anti-dup за 7 дней, ок.
- [ ] `CategoryPicker` — все 6 кластеров и подкатегории присутствуют, активные, без пустых.
- [ ] Mobile 375px — формы не ломаются, кнопки ≥44px.

### 6. Сопровождающие материалы (нужны до рассылки приглашений)
- [ ] Текст инвайт-сообщения для поставщиков (RU/EN) — короткое описание условий, ссылка на `/vendor/join`.
- [ ] FAQ или раздел Help для поставщика (комиссии, выплаты, сроки модерации, escrow).
- [ ] Договор партнёра / оферта на `/partner-agreement` — проверить актуальность.

## Технические детали (для разработчика)

- Файлы: `src/pages/vendor/VendorLanding.tsx`, `src/pages/vendor/VendorOnboarding.tsx`, `src/pages/admin/PartnerApplicationsAdmin.tsx`, `supabase/functions/approve-partner-application/`, `supabase/functions/notify-admin-partner-application/`.
- Таблицы: `providers`, `partner_applications`, `vendor_services`, `marketplace_vendors`, `orgs`, `org_members`, `user_roles`.
- Edge: `approve-partner-application`, `notify-admin-partner-application`.
- Что проверять SQL-ами: запросы на `partner_applications`, `providers`, `vendor_services`, `user_roles` после каждого шага.

## Деливерабл

После прогона я выдам короткий отчёт:
- **GREEN / YELLOW / RED** по каждому из 6 пунктов.
- Список багов с приоритетом (P0 = блокер для рассылки, P1 = починить в первой неделе, P2 = бэклог).
- Рекомендация: «можно начинать инвайтить» / «нужны такие-то P0-фиксы сначала».

## Что НЕ делаю в этой итерации

- Никаких правок кода до согласования с тобой по итогам отчёта.
- Не трогаю дизайн-токены и компоненты вне vendor-flow.
- Не меняю схему БД и RLS.

---

**Рекомендую:** дай аппрув на этот аудит — я прогоню всё и пришлю отчёт со светофором и списком багов. Если найду P0-блокеры, отдельным сообщением предложу минимальный фикс-пак до публичной рассылки приглашений.