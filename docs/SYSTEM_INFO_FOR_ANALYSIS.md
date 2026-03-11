# myUNO — полная информация о системе для анализа (Claude / внешний ревью)

Документ сгенерирован для передачи в Claude или другой инструмент анализа. Содержит сводку по проекту без секретов.

---

## 1. Идентичность проекта

- **Название:** myUNO — SuperApp для Пхукета
- **Автор/команда:** Pavel Ignatev | Ignatev Group | Phuket, Thailand
- **Назначение:** Единая платформа, объединяющая сервисы Пхукета (недвижимость, транспорт, рестораны, красота, здоровье, образование, события, яхты и др.) в одном приложении.
- **Связь с экосистемой:**
  - Ignatev Capital → привлекает инвесторов
  - Ignatev Estate → управляет недвижимостью
  - myUNO → обслуживает резидентов активов, даёт данные и денежный поток
- **Целевая аудитория:** Русскоязычные туристы, экспаты, собственники недвижимости, инвесторы в Пхукете.
- **Стадия:** Pre-PMF. Фокус на валидации.

---

## 2. Технологический стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, TypeScript, Vite 5 |
| UI | shadcn/ui, Radix UI, Tailwind CSS, Framer Motion, Lucide icons |
| Состояние | React Context (9+ провайдеров), TanStack React Query v5 |
| Роутинг | React Router v6, централизованный реестр APP_ROUTES (src/lib/config/routes.ts) |
| Backend/DB | Supabase (PostgreSQL, Auth, Storage, Realtime), 60+ Edge Functions |
| Платежи | Stripe (checkout, webhooks, подписки вендоров) |
| Карты/геокодинг | Google Maps JavaScript API, Geocoding API, Places API (ключ: VITE_GOOGLE_MAPS_API_KEY) |
| Уведомления | Resend (email), интеграции WhatsApp |
| PWA | vite-plugin-pwa (injectManifest), офлайн, standalone |
| Сборка | Vite, ручные чанки (vendor-react, vendor-radix, vendor-map, vendor-charts, vendor-pdf и др.) |
| Тесты | Vitest, Playwright (e2e) |
| Хостинг | Vercel (автодеплой с main) |

---

## 3. Структура репозитория

```
myUNO/
├── src/
│   ├── components/     # UI по доменам (admin, vendor, owner, booking, property, transport, ui, …)
│   ├── pages/          # Страницы маршрутов (40+ вертикалей)
│   ├── hooks/          # Бизнес-логика (230+ хуков)
│   ├── contexts/      # Auth, Cart, Language, Currency, Theme, Maintenance, PWA, LifeSituation, Storefront, GoogleMaps
│   ├── lib/           # config (routes, geography, contacts), taxonomies, queryConfig, googleMaps, sanitize, logger
│   ├── design-system/ # tokens, components, patterns, foundations
│   ├── integrations/  # Автогенерация (supabase client, types) — не редактировать
│   └── i18n/          # Локализация (en, ru)
├── supabase/
│   ├── functions/     # Edge Functions (60+): auth, stripe, notify-*, create-*-checkout, ai-*, sync-maps-key, geocode-address, …
│   │   └── _shared/  # cors, supabase, stripe, auth-guard, email-templates, ssrf-guard
│   └── migrations/   # SQL-миграции
├── docs/              # Архитектура, аудиты, гайды (GOOGLE_MAPS_KEY_SETUP, DATA_SOURCE_MAPPING, BUILD_AND_CI, …)
├── e2e/               # Playwright e2e тесты
├── .cursor/rules/     # Правила для Cursor (myuno-project.mdc, typography-fonts.mdc)
├── package.json
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json
└── .env.example       # Шаблон переменных (секреты не в репо)
```

---

## 4. Конфигурация

### 4.1 package.json (скрипты)

- `npm run dev` — Vite dev-сервер (порт 8080 по умолчанию, при занятости — следующий)
- `npm run build` — production-сборка
- `npm run build:dev` — сборка в режиме development
- `npm run lint` — ESLint
- `npm run preview` — превью собранного приложения
- `supabase:deploy`, `supabase:db-push` — деплой функций и миграций

### 4.2 Переменные окружения (.env.example)

- **Supabase:** VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
- **Google Maps:** VITE_GOOGLE_MAPS_API_KEY (Maps JavaScript API, Geocoding API, Places API)
- **Флаг:** VITE_BYPASS_COMING_SOON — обход экрана «Coming Soon» для тестов без входа
- Секреты только на бэкенде: STRIPE_*, RESEND_API_KEY, FIRECRAWL_API_KEY, LOVABLE_API_KEY

### 4.3 TypeScript

- strict: false, noImplicitAny: false (постепенное ужесточение)
- paths: "@/*" → "./src/*"
- References: tsconfig.app.json, tsconfig.node.json

### 4.4 Vite

- Плагины: React (SWC), lovable-tagger (dev), VitePWA (injectManifest, sw.ts)
- Алиас: @ → ./src
- Ручные чанки для vendor-библиотек (см. vite.config.ts)

---

## 5. Роутинг и провайдеры

- **Маршруты:** Единый источник правды — `APP_ROUTES` в `src/lib/config/routes.ts`. В коде используются только константы, строки путей не хардкодятся.
- **Провайдеры (порядок в App.tsx):**  
  ErrorBoundary → HelmetProvider → QueryClientProvider → ThemeProvider → MaintenanceProvider → LanguageProvider → LocationProvider → CurrencyProvider → AuthProvider → CartProvider → PWAInstallProvider → LifeSituationProvider → StorefrontProvider → GoogleMapsProvider → TooltipProvider → HintProvider → PrefetchProvider → AppContent
- **Coming Soon:** Для неавторизованных показывается UnderConstruction, кроме маршрутов /auth, /for-management-companies, /vendor/join, и т.п. Обход: VITE_BYPASS_COMING_SOON=true.

---

## 6. Роли пользователей (персоны)

1. **Турист** — короткий визит, туры, трансферы, впечатления
2. **Резидент** — экспат, бытовые сервисы, доставка, ремонты
3. **Собственник** — владелец недвижимости, управление, доход от аренды
4. **Инвестор** — сделки с недвижимостью, ROI, аналитика

---

## 7. Правила и соглашения (из .cursor/rules)

- Навигация только через APP_ROUTES
- Один экземпляр Supabase-клиента, импорт из общего файла
- Обработка ошибок и состояния загрузки у всех запросов
- Логика в хуках, не в крупных компонентах
- Мобильный первый дизайн
- Русский + английский в UI
- Код и коммиты на английском
- RLS всегда включён; service role не в фронтенде
- Не хардкодить пути, не дублировать клиент Supabase, не удалять обработку ошибок

---

## 8. Supabase Edge Functions (выборка)

- **Платежи:** stripe-webhook, create-checkout-session, create-order-checkout, create-service-checkout, create-restaurant-checkout, create-property-deposit-checkout, create-vendor-subscription, create-mc-subscription, create-refund, check-vendor-subscription, check-mc-subscription
- **Уведомления:** send-email, send-order-email, send-crm-email, send-promotions, notify-admin-order, notify-new-signup, notify-vendor-order, notify-order-status-change, notify-chat-message, notify-admin-partner-application, notify-transfer-booking, auth-email-hook
- **Карты/геокод:** sync-maps-key, geocode-address
- **AI:** ai-agent, ai-support-chat, ai-smart-search, ai-generate-description, ai-translate, ai-chat-moderator, ai-intake-extract, ai-concierge, и др.
- **Интеграции:** airbnb-sync, rentals-united-sync, ota-scrape, whatsapp-incoming-webhook, firecrawl-*
- **CRM/лиды:** leads-factory, execute-crm-workflow, detect-crm-duplicates
- **Админка:** approve-partner-application, admin-manage-user, admin-manage-mc-subscription, admin-secrets-status
- Остальные: generate-sitemap, ical-sync, booking-reminders, document-reminder-check, lifecycle-processor, и т.д.

---

## 9. Документация в репозитории

- ARCHITECTURE.md — обзор архитектуры и структуры
- GOOGLE_MAPS_KEY_SETUP.md — настройка ключа Google Maps (HTTP referrers, API restrictions)
- DATA_SOURCE_MAPPING.md — откуда берутся данные для админки/дашбордов
- BUILD_AND_CI.md, EDGE_FUNCTIONS_JWT.md, TYPESCRIPT_POLICY.md
- TECHNICAL_AUDIT_REPORT.md, AUDIT_CYCLE_2.md, FIX_SPRINT_CYCLE2_REPORT.md
- DATABASE.md, EDGE_FUNCTIONS.md, DEPLOY_EDGE_FUNCTIONS.md
- Конвенции, UX-контракт, аудиты по MC, админке, процессам пользователей

---

## 10. Текущие приоритеты (из правил проекта)

- Стабильность важнее новых фич
- Сначала исправлять баги, потом добавлять функциональность
- У каждой фичи — работающий счастливый путь
- Реальные данные вместо заглушек

---

## 11. Домен и окружение

- Продакшен: https://myuno.app, https://www.myuno.app
- Локальная разработка: http://localhost:8080 (или 8081, 8082, 8083 при занятости порта)
- Деплой: main → Vercel

---

*Документ подготовлен для передачи в Claude или иной инструмент анализа. Секреты (ключи API, пароли, .env) в файл не включены.*
