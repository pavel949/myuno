> ARCHIVED: 2026-04-20
> Superseded by: docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md, project.md
> Reason: March 2026 system overview — superseded by April 2026 snapshot and project.md

# myUNO — Полное описание системы

> Документ составлен на основе реального кода проекта. Дата: 2026-03-09.

---

## 1. Что такое myUNO

**myUNO** — SuperApp-платформа для резидентов и туристов Пхукета (Таиланд), объединяющая 20+ сервисных вертикалей, маркетплейс, систему управления недвижимостью (PMS), CRM и AI-инструменты в одном приложении.

**Целевая аудитория:** экспаты, туристы, инвесторы, управляющие компании, сервис-провайдеры.

**Стадия:** MVP. Ядро (Auth, RBAC, Stripe-платежи, PMS, мульти-тенант для УК) готово к эксплуатации.

---

## 2. Технологический стек

| Слой | Технология |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI Kit | shadcn/ui + Radix UI + Tailwind CSS (семантические токены) |
| State | React Context (12 провайдеров) + TanStack React Query |
| Backend | Lovable Cloud (Supabase) — PostgreSQL, Edge Functions (Deno) |
| Payments | Stripe (checkout sessions, webhooks, vendor/MC подписки) |
| Maps | Google Maps API + Mapbox GL |
| Email | Resend |
| Мессенджеры | WhatsApp (webhook in/out), Telegram (posting) |
| AI | Lovable AI (Gemini, GPT-5 — без внешних ключей) |
| PWA | vite-plugin-pwa + workbox (offline-support) |
| Mobile | Capacitor (iOS/Android обертка) |

---

## 3. Масштаб кодовой базы

| Метрика | Количество |
|---------|-----------|
| React-компоненты (папки в components/) | **73 домена** |
| Страницы (папки в pages/) | **42 раздела** |
| Бизнес-хуки (hooks/) | **310+** |
| Контекст-провайдеры | **12** |
| Edge Functions (backend) | **110+** |
| Таблицы в БД | **100+** (см. types.ts) |
| Таблицы с Realtime | **17** |
| SQL-миграции | **60+** |

---

## 4. Сервисные вертикали (20 штук)

Каждая вертикаль имеет собственную таблицу, страницы, хуки, фильтры и компоненты.

| # | ID | Название EN | Таблица БД | Bookable |
|---|-----|-------------|-----------|----------|
| 1 | property | Real Estate | `properties` | ✅ |
| 2 | yacht | Yacht Charter | `yachts` | ✅ |
| 3 | vehicle | Car & Bike Rental | `vehicles` | ✅ |
| 4 | experience | Things To Do | `experiences` | ✅ |
| 5 | cleaning | Home Cleaning | `cleaning_services` | ✅ |
| 6 | babysitter | Childcare | `babysitters` | ✅ |
| 7 | beauty | Beauty & Wellness | `salons` | ✅ |
| 8 | restaurant | Restaurants | `restaurants` | ✅ |
| 9 | medical | Healthcare | `clinics` | ✅ |
| 10 | legal | Legal Services | `legal_services` | ✅ |
| 11 | education | Education & Courses | `education_providers` | ✅ |
| 12 | fitness | Fitness & Gyms | `gyms` | ✅ |
| 13 | event | Events | `events` | ✅ |
| 14 | water_activity | Water Sports | `water_activities` | ✅ |
| 15 | pet_service | Pet Care | `pet_services` | ✅ |
| 16 | flower | Flower Delivery | `flower_shops` / `bouquets` | ✅ |
| 17 | insurance | Insurance | `insurance_providers` | ❌ |
| 18 | transfer | Airport & City Transfers | `transfers` / `airport_*` | ✅ |
| 19 | pharmacy | Pharmacy | `pharmacies` | ❌ |
| 20 | bank | Banking | `banks` | ❌ |

**Дополнительные standalone-экраны:** Fast Track, Food Delivery, Laundry, Plumbing, Electrical, AC Repair, Gardening, Pest Control, Handyman, Locksmith, Visa & Immigration, Veterinary.

---

## 5. Группировка вертикалей (Service Hub)

| # | Группа | Вертикали |
|---|--------|-----------|
| 1 | 🏠 Home & Living | Property, Cleaning, Babysitter, Pets, Flowers |
| 2 | 🚗 Transport | Transfers, Vehicles, Fast Track |
| 3 | 🎯 Leisure & Activities | Restaurants, Experiences, Yachts, Water Sports, Events, Food Delivery |
| 4 | 🏥 Health & Wellness | Beauty, Medical, Pharmacy, Fitness, Veterinary, Insurance |
| 5 | 📋 Life Admin | Legal, Education, Banking, Visa |
| 6 | 🔧 Home Maintenance | Laundry, Plumbing, Electrical, AC Repair, Gardening, Pest Control, Handyman, Locksmith |
| 7 | 🆘 Help | VIP Concierge, SOS Emergency |

---

## 6. Пользовательские режимы (User Modes)

| Режим | Маршрут | Описание |
|-------|---------|----------|
| **Life** | `/` | LifeOS — персонализированный дашборд с контекстными рекомендациями |
| **Services** | `/discover` | Хаб обнаружения сервисов по жизненным контекстам |
| **Marketplace** | `/market` | Маркетплейс товаров (магазины, продукты, варианты) |
| **Me** | `/account` | Профиль, бронирования, кошелек, настройки |

---

## 7. Профессиональные порталы

| Портал | Маршрут | Для кого | Ключевой функционал |
|--------|---------|----------|---------------------|
| **Admin** | `/admin` | Команда платформы | Управление контентом, пользователями, заказами, аналитика, AI-центр, MCC |
| **Vendor** | `/vendor` | Сервис-провайдеры | Управление листингами, заказами, подписка, документы |
| **Owner** | `/owner` | Владельцы недвижимости | PMS, бронирования, финансы, Channel Manager, задачи |
| **MC** | `/mc` | Управляющие компании | Мульти-тенант управление портфелем, RBAC (Director > Admin > Manager > Staff) |
| **Team** | `/team` | Внутренняя команда | Лиды, чат, геймификация, задачи |
| **Staff** | `/staff` | Персонал УК | Задачи, уборки, чек-ин/аут |
| **Guest** | `/guest` | Гости недвижимости | Гайдбук, чек-ин, чат с хозяином |

---

## 8. Архитектура контекстов (12 провайдеров)

Порядок вложенности в App.tsx:

```
ErrorBoundary → HelmetProvider → QueryClientProvider → ThemeProvider →
MaintenanceProvider → LanguageProvider → LocationProvider → CurrencyProvider →
AuthProvider → CartProvider → PWAInstallProvider → LifeSituationProvider →
StorefrontProvider → GoogleMapsProvider → TooltipProvider → HintProvider →
PrefetchProvider → AppContent
```

| Контекст | Назначение |
|----------|-----------|
| `AuthContext` | Авторизация, сессии, роли |
| `LanguageContext` | Билингвальность EN/RU |
| `CurrencyContext` | Мультивалютность (THB, USD, EUR, RUB) |
| `LocationContext` | Геолокация пользователя |
| `CartContext` | Корзина покупок |
| `ThemeContext` | Светлая/темная тема |
| `MaintenanceContext` | Режим техобслуживания |
| `PWAInstallContext` | Управление установкой PWA |
| `LifeSituationContext` | Контекстные ситуации (приезд, досуг и т.д.) |
| `StorefrontContext` | Контекст витрины магазина |
| `GoogleMapsContext` | Google Maps SDK |
| `DashboardFilterContext` | Фильтры дашборда |

---

## 9. Backend: Edge Functions (110+)

### 9.1. AI-функции (17 штук)

| Функция | Назначение |
|---------|-----------|
| `ai-agent` | Универсальный разговорный AI-агент |
| `ai-generate-description` | Автогенерация описаний листингов |
| `ai-image-enhance` | Улучшение качества изображений |
| `ai-intake-extract` | Извлечение структурированных данных из текста/фото |
| `ai-personalize-home` | Персонализированные рекомендации на главной |
| `ai-smart-data` | AI-аналитика и инсайты |
| `ai-smart-search` | Семантический поиск |
| `ai-support-chat` | Чат-бот поддержки |
| `ai-translate` | Автоперевод EN↔RU |
| `ai-concierge` | AI-консьерж |
| `ai-chat-moderator` | Модерация чат-сообщений |
| `ai-content-planner` | Планировщик контента |
| `ai-cross-sell` | Кросс-продажи и рекомендации |
| `ai-guest-autoreply` | Авто-ответы гостям |
| `ai-legal-assistant` | Юридический AI-помощник |
| `ai-owner-nurture` | Взращивание владельцев |
| `ai-platform-intelligence` | Аналитика платформы |
| `ai-pricing-optimizer` | Оптимизация ценообразования |
| `intake-listing-agent` | AI-агент для массового импорта листингов |
| `lifeos-ai-analyst` | LifeOS AI-рекомендации |
| `listing-quality-analyzer` | Оценка качества листингов |
| `crm-ai-assistant` | AI-помощник для CRM |
| `vendor-outreach-agent` | AI-агент для привлечения вендоров |

### 9.2. Платежи Stripe (12 функций)

| Функция | Описание |
|---------|----------|
| `create-checkout-session` | Общий Stripe checkout |
| `create-checkout` | Унифицированный checkout |
| `create-flowers-checkout` | Оплата цветов |
| `create-market-checkout` | Оплата товаров маркетплейса |
| `create-order-checkout` | Оплата заказов |
| `create-property-deposit-checkout` | Депозит за недвижимость |
| `create-restaurant-checkout` | Оплата ресторана |
| `create-service-checkout` | Оплата услуг |
| `create-vendor-subscription` | Подписка вендора |
| `create-mc-subscription` | Подписка УК |
| `check-vendor-subscription` | Проверка статуса подписки |
| `check-mc-subscription` | Проверка подписки УК |
| `stripe-webhook` | Обработчик вебхуков Stripe |
| `create-refund` | Возврат средств |

### 9.3. Уведомления (17 функций)

Каналы: **Email (Resend)**, **WhatsApp**, **Telegram**, **In-app**.

| Функция | Триггер |
|---------|---------|
| `notify-admin-order` | Новый заказ |
| `notify-admin-property-submission` | Новый объект на модерацию |
| `notify-admin-partner-application` | Заявка партнера |
| `notify-fasttrack-booking` | Фаст-трек бронирование |
| `notify-lead-whatsapp` | Лид в WhatsApp |
| `notify-new-signup` | Регистрация пользователя |
| `notify-order-status-change` | Изменение статуса заказа |
| `notify-transfer-booking` | Бронирование трансфера |
| `notify-vendor-order` | Заказ для вендора |
| `notify-chat-message` | Сообщение в чате |
| `property-moderation-email` | Результат модерации |
| `restaurant-order-notifications` | Заказ в ресторане |
| `send-order-email` | Подтверждение заказа |
| `send-promotions` | Промо-рассылки |
| `send-property-report` | Отчет по объекту |
| `booking-reminders` | Напоминания о бронировании |
| `send-email` | Универсальная отправка email |

### 9.4. Синхронизация и импорт (10 функций)

| Функция | Описание |
|---------|----------|
| `airbnb-sync` | Синхронизация с Airbnb |
| `ical-sync` / `ical-scheduled-sync` | iCal-синхронизация календарей |
| `yacht-ical-sync` | Календарь яхт |
| `bulk-import` | Массовый импорт CSV/Excel |
| `import-experience-media` | Импорт медиа для туров |
| `etagi-scrape-projects` | Парсинг проектов Etagi |
| `ota-scrape` | Парсинг OTA-площадок |
| `scrape-phuket-insider` | Парсинг Phuket Insider |
| `rentals-united-sync` | 2-way синхронизация с Rentals United |
| `firecrawl-scrape` / `firecrawl-search` / `firecrawl-map` | Web-скрапинг через Firecrawl |

### 9.5. CRM и автоматизация (15+ функций)

| Функция | Описание |
|---------|----------|
| `leads-factory` | Автоматическая генерация лидов |
| `auto-lead-scoring` | Авто-скоринг лидов |
| `auto-lifecycle-actions` | Действия по жизненному циклу |
| `auto-vendor-nurture` | Взращивание вендоров |
| `auto-social-publish` | Авто-публикация в соцсети |
| `execute-campaign-rules` | Выполнение правил кампаний |
| `execute-crm-workflow` | CRM-воркфлоу |
| `detect-crm-duplicates` | Обнаружение дубликатов |
| `send-crm-email` | CRM-рассылки |
| `send-nurture-messages` | Drip-кампании |
| `update-user-segments` | Сегментация пользователей |
| `lifecycle-processor` | Обработчик жизненного цикла |
| `vendor-acquisition` | Привлечение вендоров |
| `supplier-discovery` | Поиск поставщиков |
| `post-order-autopilot` | Автопилот после заказа |

### 9.6. Утилиты и прочее (20+ функций)

Geocoding, погода, генерация PDF-ваучеров и отчетов, ресайз изображений, OCR чеков, сканирование визиток, прокси-сервер изображений, экспорт календарей, карта сайта, аналитика и др.

---

## 10. База данных

### 10.1. Ключевые таблицы по доменам

**Ядро платформы:**
- `profiles` — профили пользователей
- `providers` — сервис-провайдеры
- `orders` / `order_items` / `order_status_history` — заказы
- `bookings` / `booking_*` — бронирования (8+ связанных таблиц)
- `cart_items` — корзина
- `lookup_values` — динамическая таксономия (51 тип)
- `system_settings` / `system_config` — конфигурация

**Недвижимость (15+ таблиц):**
- `properties`, `property_bookings`, `property_projects`
- `property_inventory_items`, `property_meters`, `property_key_assignments`
- `property_maintenance_schedules`, `property_activity_log`
- `booking_operations` (чек-ин/аут, депозиты, уборки)
- `booking_meter_readings`, `booking_inventory_reports`

**Управляющие компании:**
- `management_companies`, `management_company_members`
- `mc_subscriptions`, `property_management_terms`
- `user_active_context` — переключение контекста (owner/mc/investor)

**Маркетплейс:**
- `stores`, `products`, `product_variants`, `bundle_offers`
- `marketplace_vendors`

**CRM (15+ таблиц):**
- `crm_contacts`, `crm_companies`, `crm_pipelines`
- `agent_deals`, `agent_deal_activities`
- `crm_nurture_queue`, `crm_workflows`, `crm_sequences`

**AI:**
- `ai_agents`, `ai_agent_knowledge`, `ai_agent_logs`
- `ai_artifacts`, `ai_intake_sessions`

**Трансферы:**
- `airport_bookings`, `airport_passengers`, `airport_services`, `airport_suppliers`

**Маркетинг (MCC):**
- `mcc_campaigns`, `mcc_leads`, `mcc_funnels`, `mcc_funnel_events`
- `mcc_creatives`, `mcc_events`, `mcc_channel_metrics`, `mcc_automation_rules`

**Финансы:**
- `booking_payments`, `booking_vouchers`
- `property_financial_records`, `property_budgets`

### 10.2. Таблицы с Realtime (17 штук)

```
booking_messages, notifications, property_bookings,
property_chat_messages, service_orders, orders,
order_status_history, portal_messages, owner_notifications,
translations, support_tickets, ticket_messages,
team_messages, chat_message_flags, property_maintenance_schedules,
property_activity_log, realtime_stats,
mcc_landing_events, mcc_ai_recommendations, lifecycle_executions
```

### 10.3. Паттерны данных

- **Билингвальность:** `name_en` / `name_ru`, `description_en` / `description_ru`
- **Мягкое удаление:** `is_active` (boolean, default true)
- **Модерация:** `approval_status` (pending → approved/rejected), `reviewed_by`, `reviewed_at`
- **Провайдер:** `provider_id` FK → `providers`
- **UNO-контент:** `created_by_uno_team`, `uno_team_creator_id`

### 10.4. RLS (Row-Level Security)

- **Public read:** Большинство entity-таблиц — `SELECT WHERE is_active = true`
- **Owner write:** `auth.uid() = user_id`
- **Provider write:** вендор может модифицировать свои сущности
- **MC scoping:** `mc_can_access()`, `staff_can_access_property()`
- **Admin bypass:** через `service_role` key в Edge Functions
- **Роли** хранятся в отдельной таблице `user_roles`, проверка через `has_role()` SECURITY DEFINER

---

## 11. Платежная система (Stripe)

### 11.1. Checkout-потоки

| Поток | success_url | Статус |
|-------|-------------|--------|
| Service checkout | `/services/order/success` | ✅ |
| Flowers checkout | `/flowers/success` | ✅ |
| Market checkout | `/market/success` | ✅ |
| Property deposit | `/property/deposit-success` | ✅ |
| Wallet top-up | `/wallet?success=true` | ✅ |
| Restaurant | `/restaurants/:id?payment=success` | ✅ |
| Order checkout | `/bookings/:id?success=true` | ✅ |
| MC subscription | `/mc/subscription?success=true` | ✅ |
| Vendor subscription | `/vendor/subscription?success=true` | ✅ |

### 11.2. Webhook-обработка

`stripe-webhook` обрабатывает `checkout.session.completed`:
- Создает запись в `orders` со статусом `confirmed`
- Идемпотентность через проверку `stripe_session_id`
- Триггерит email и уведомления
- Поддерживает тип `service_payment` с маппингом metadata

### 11.3. Подписки

- **Вендор:** Stripe-подписка для доступа к dashboard
- **MC/PMS:** 4-уровневая модель слотов ($25/объект): Basic(1), Starter(5), Professional(15), Enterprise(50)

---

## 12. AI-система

### 12.1. Модели (через Lovable AI — без внешних ключей)

- Google Gemini 2.5/3.x (Pro, Flash, Lite)
- OpenAI GPT-5 / 5-mini / 5-nano / 5.2

### 12.2. Применения

- Генерация описаний листингов
- Семантический поиск
- Автоперевод EN↔RU
- Модерация чатов
- Персонализация главной страницы
- Скоринг качества листингов
- Кросс-продажи
- Авто-ответы гостям
- LifeOS-рекомендации
- CRM-ассистент
- Оценка ценообразования
- Массовый intake (текст → структурированные данные)
- OCR чеков и визиток

### 12.3. Хранение

- `ai_agents` — конфигурация агентов (model, temperature, max_tokens, тон)
- `ai_agent_knowledge` — knowledge base, system prompt, версионирование
- `ai_agent_logs` — аналитика использования
- `ai_artifacts` — сгенерированный контент с feedback loop

---

## 13. LifeOS — рекомендательный движок

- Контекстные ситуации: «Приехал на Пхукет», «Выходной день», «С детьми» и т.д.
- Иерархия разрешения: активный код > персона > приоритет БД
- Представление `life_os_catalog` агрегирует 14+ источников
- Ограничение: MAX_SCENARIOS_PER_ENTITY = 3
- Страницы `/life/:code` с адаптивной сеткой (3–5 колонок)

---

## 14. CRM-система

- **Пайплайны:** Kanban-доска для сделок с метриками
- **Скоринг лидов:** Авто-скоринг + «Ready to buy» триггеры (2+ бронирования)
- **Автоматизация:** Drip-кампании через `crm_nurture_queue`
- **WhatsApp:** Входящий webhook для автоматического захвата лидов
- **Импорт:** CSV с Odoo-совместимой нормализацией
- **Воркфлоу:** Trigger-based автоматизация действий

---

## 15. Channel Manager (для недвижимости)

- 25+ OTA-площадок: Airbnb, Booking.com, Expedia, Agoda, VRBO
- Рынок РФ/СНГ: Ostrovok, Sutochno.ru, Avito, CIAN
- iCal 2-way синхронизация
- Rentals United Direct API интеграция (планируется)
- Централизованный реестр `channelRegistry.ts`

---

## 16. Marketing Command Center (MCC)

Расположен в `/admin/marketing`. 7 модулей:

1. **Dashboard** — KPI, воронка, AI-инсайты
2. **Campaign Factory** — мульти-канальные кампании
3. **Lead Hub** — CRM-lite с lead scoring
4. **Funnel Engine** — визуальный конструктор воронок
5. **Content Lab** — AI-генерация контента
6. **Analytics** — атрибуция, перформанс каналов
7. **Automation** — trigger-based правила

8 таблиц: `mcc_campaigns`, `mcc_leads`, `mcc_funnels`, `mcc_funnel_events`, `mcc_creatives`, `mcc_events`, `mcc_channel_metrics`, `mcc_automation_rules`.

---

## 17. Монетизация

| Модель | Ставка |
|--------|--------|
| Комиссия с сервисов | 10% (норма Пхукета) |
| Комиссия с продажи недвижимости | 5% |
| Управление недвижимостью | 0.3% |
| Подписка PMS | $25/слот/мес |
| Подписка вендора | Stripe recurring |

Минимальные требования для активного листинга:
- 3+ реальных фото
- Билингвальное описание (EN+RU)
- Цены в THB
- SLA: ответ за 2 часа, рейтинг ≥ 4.0

---

## 18. Безопасность

- **RLS:** включен на всех пользовательских таблицах
- **RBAC:** роли в отдельной таблице `user_roles`, проверка через `has_role()` (SECURITY DEFINER)
- **MC-контекст:** `resolve_user_context` RPC с проверкой `auth.uid()`
- **Edge Functions:** внутренние/cron-функции защищены `X-Internal-Secret` header (21 функция)
- **JWT:** verify_jwt = true по умолчанию
- **Soft delete:** данные не удаляются физически
- **Аудит:** `admin_audit_logs` для всех административных действий

---

## 19. Ключевые архитектурные паттерны

| Паттерн | Реализация |
|---------|-----------|
| Single Source of Truth (вертикали) | `src/lib/verticals.ts` — 20 вертикалей |
| Таксономия | `src/lib/taxonomies/` + `lookup_values` (51 тип) |
| Unified Booking Engine | `useOrders` + `create_order_atomic` RPC |
| MiniAppLayout | Стандартная обёртка для всех вертикалей |
| Canonical Listing Wizard | Schema-driven формы для создания/редактирования |
| Provider ID Mapping | `providerIdMapping.ts` — маппинг FK для 20+ таблиц |
| Lazy Loading | `lazyWithRetry()` для всех страниц |
| Multi-tenant context | `user_active_context` + `useResolvedContext` |
| Идемпотентность | Проверка дубликатов по session_id в webhook |

---

## 20. Интеграции с внешними сервисами

| Сервис | Назначение | Секрет |
|--------|-----------|--------|
| Stripe | Платежи, подписки, вебхуки | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Resend | Транзакционные email | `RESEND_API_KEY` |
| Google Maps | Карты, геокодинг | `GOOGLE_MAPS_API_KEY` |
| Mapbox | Карты (альтернатива) | `MAPBOX_PUBLIC_TOKEN` |
| Firecrawl | Web-скрапинг | `FIRECRAWL_API_KEY` |
| Lovable AI | AI-модели | `LOVABLE_API_KEY` |
| Telegram | Публикация постов | через Bot API |
| WhatsApp | Входящие/исходящие сообщения | Webhook |
| Rentals United | Синхронизация каналов | Direct API |
| Airbnb | iCal-синхронизация | Public iCal URLs |

---

## 21. PWA и мобильный опыт

- **PWA:** Service Worker через workbox, offline-кеширование, push-уведомления
- **Capacitor:** Обёртки для iOS и Android
- **Responsive:** Breakpoints через `use-mobile`, `use-desktop` хуки
- **Install prompt:** Управляемый `PWAInstallContext`
- **Update prompt:** `PWAUpdatePrompt` для обновлений

---

## 22. Технический долг (известный)

- ~1500 использований типа `any`
- 229 файлов с `.select(*)` (избыточная выборка)
- `useEffect` без очистки в ряде мест
- Демо-данные в некоторых вертикалях (Babysitter, Beauty)
- Admin Panel и LifeOS требуют доработки