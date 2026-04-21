

## Phase A5: Госуслуги-style Universal Hub `/me`

Цель — превратить разрозненные `/`, `/discover`, `/account` в единый B2C-шелл из 4 универсальных контейнеров (Лента / Услуги / Документы / Платежи) + Профиль, опираясь на уже созданную инфраструктуру Phase A (`myUNO ID`, `compliance_*`, `notification_*`, `concierge_journeys`).

### Архитектура

```text
/me                  → MeShellLayout (новый, тонкая обёртка над AppLayout)
├─ /me               → MeFeed         (Лента действий — главный экран)
├─ /me/services      → MeServices     (каталог = реюз DiscoverPage)
├─ /me/documents     → MeDocuments    (vault + passports + visas)
├─ /me/payments      → MePayments     (агрегатор orders + bills + fees)
├─ /me/requests      → MeRequests     (visa/viewing/support статусы)
└─ /me/profile       → MeProfile      (реюз UserAccountDashboard, settings only)
```

### Что строим

**1. Routing & Shell**
- `APP_ROUTES.ME = '/me'` + 5 sub-routes в `src/lib/config/routes.ts`
- 6 lazy-страниц зарегистрированы в `pageRegistry.ts` и `AnimatedRoutes.tsx`
- `MeShellLayout.tsx` — обёртка с inner-tab nav (Sticky top на мобиле, sidebar-tabs на десктопе)
- Все страницы внутри `/me` используют один shell, не дублируют header

**2. `/me` — MeFeed (Лента действий)** — ключевой экран
Источники:
- `compliance_obligations` где `status='pending'` И `due_date <= now() + 30d` → высокий приоритет
- `notification_deliveries` где `read_at IS NULL` → средний приоритет
- `bookings` со статусом `pending_confirmation` или `checkin <= now()+7d`
- `concierge_journeys` (последний) → персональные рекомендации
- Hero card «Что нужно сделать» с цветовой кодировкой срочности
- Quick actions chip-row (≤6): Подать TM30 / Продлить визу / Оплатить счёт / Загрузить документ

**3. `/me/documents` — MeDocuments**
- Сетка карточек: Паспорт / Виза / TIN / Driving / Insurance / Property docs
- Источники: `user_passports`, `user_visa_status`, `user_documents_vault`
- Каждая карточка: статус, дата истечения, действие (продлить/обновить/скачать)
- Пустое состояние с CTA «Добавить паспорт» → существующий `myUNO ID` flow

**4. `/me/payments` — MePayments**
- 3 секции: «К оплате» / «Подписки» / «История»
- Источники: `orders` (status='pending'), `stays_subscription`, `payment_intents`
- Универсальные строки с типом (booking/visa/tax/utility/subscription) и единой кнопкой Pay
- Реюз `wallet/` компонентов карточек где возможно

**5. `/me/requests` — MeRequests**
- Канбан / список 4 колонок: New / In Progress / Waiting / Done
- Источники: `concierge_sessions`, `visa_records`, `crm_contacts` (где `user_id=current`), service-orders
- Каждая карточка: тип запроса, статус, ETA, контакт ответственного

**6. `/me/services` — MeServices**
- Тонкая обёртка вокруг текущего `/discover` контента (без отдельного дашборда)
- Сохраняет AudienceFilter + AllServicesGrid + LifeSituations
- При заходе с `/me` сохраняется shell, breadcrumbs

**7. `/me/profile` — MeProfile**
- Реюз `UserAccountDashboard` минус ActiveStay/Activity/Recommendations (они уехали в Feed)
- Только: ProfileCard, Roles, Language, Theme, Logout, DownloadApp

**8. Bottom-nav guest роли** (только для `guest` в `navigationModel.ts`)
- Было: Home / Discover / Market / Property / Me
- Стало: Home / Feed (`/me`) / Services (`/me/services`) / Documents (`/me/documents`) / Profile (`/me/profile`)
- Property/Market доступны через Services и глобальный поиск
- Owner/Vendor/Admin/Investor — без изменений (enterprise шеллы)

**9. Feature flag**
- `feature_flag:me_shell_v1` в `system_settings`, default OFF
- При OFF — старая навигация работает как раньше; `/me` всё равно доступен по прямой ссылке
- Старые `/account` и `/discover` остаются работать (редиректов нет на этом этапе)

**10. Hooks**
- `useMeFeed()` — агрегатор compliance + notifications + bookings + journey
- `useMyDocuments()` — passports + visas + vault в одном запросе
- `useMyPayments()` — pending orders + subscriptions + history
- `useMyRequests()` — все заявки пользователя

### Технические детали

- **Файлы (новые, ~10):**
  - `src/components/layout/MeShellLayout.tsx`
  - `src/pages/me/MeFeed.tsx`, `MeServices.tsx`, `MeDocuments.tsx`, `MePayments.tsx`, `MeRequests.tsx`, `MeProfile.tsx`
  - `src/hooks/useMeFeed.ts`, `useMyDocuments.ts`, `useMyPayments.ts`, `useMyRequests.ts`
- **Файлы (правки, ~4):**
  - `src/lib/config/routes.ts` — +6 routes
  - `src/components/layout/pageRegistry.ts` — +6 lazy entries
  - `src/components/layout/AnimatedRoutes.tsx` — +6 routes
  - `src/lib/nav/navigationModel.ts` — обновить guest bottom-nav (за флагом)
- **Миграция:** 1 SQL — добавить `feature_flag:me_shell_v1` в `system_settings`
- **Нет breaking changes:** все старые маршруты остаются. Новый `/me` — аддитивно.

### Что НЕ входит (вынесено в Phase A6/B)

- Notification dispatcher edge function (Phase A4 завершение)
- Payment aggregation для не-myUNO платежей (utilities/tax) — Phase B
- Замена Index/Discover/Account редиректами на `/me` — после валидации Phase A5
- Расширение на owner/vendor/admin роли — они enterprise, остаются как есть
- WhatsApp/Telegram бот для concierge — Phase B

### Готовность

После Phase A5 myUNO покрывает 4/4 универсальных контейнера Госуслуг для физлица + сохраняет всю enterprise-функциональность. Готовность к модели документа поднимется с 55–65% до ~75%.

