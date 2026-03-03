

## Что можно реализовать прямо сейчас

Проанализировав кодовую базу, вот что уже есть и чего реально не хватает:

**Уже реализовано:**
- Система отзывов (таблица `reviews`, компоненты `WriteReviewModal`, `ReviewsSection`, `EntityReviewsSummary`)
- Реферальная система (таблица `referrals`, хуки, UI-компоненты, RPC-функции)
- Админ-панель с KPI, финансами, операциями
- Stripe-интеграция для платежей

**Отсутствует и можно сделать сейчас:**

### 1. Promoted Listings (Монетизация)
Создать систему платного продвижения объектов:
- Таблица `promoted_listings` (listing_id, type, starts_at, expires_at, amount_paid, status)
- UI для владельца: кнопка "Продвинуть" на карточке объекта в личном кабинете
- Оплата через баланс кошелька (уже есть)
- Логика сортировки: promoted объекты показываются выше в каталогах
- Админ: просмотр активных промо в AdminFinance

### 2. Система диспутов (Trust & Safety)
Создать функциональную систему споров (сейчас есть только информационная страница `DisputeResolutionPage`):
- Таблица `disputes` (order_id, user_id, provider_id, type, status, description, evidence_urls, resolution, resolved_at)
- Кнопка "Открыть спор" в деталях заказа/бронирования
- UI формы: тип проблемы, описание, загрузка доказательств
- Админ-вкладка в Operations для модерации споров
- Статусы: open → under_review → resolved/rejected

### 3. Продуктовая аналитика (Event Tracking)
Лёгкий внутренний трекинг без внешних сервисов:
- Таблица `analytics_events` (user_id, event_name, event_data, page_path, created_at)
- Хук `useAnalytics` с методом `track(eventName, data)`
- Трекинг ключевых событий: page_view, search, listing_click, booking_start, payment_complete
- Дашборд в админке: воронка конверсии, GMV, MAU — данные для инвесторов

### 4. Investor Metrics Dashboard
Отдельная страница в админке с ключевыми метриками:
- GMV (общий объём транзакций)
- MAU / DAU (активные пользователи)
- Конверсия по воронке (просмотр → бронирование → оплата)
- Unit economics: средний чек, LTV
- Графики на recharts (уже установлен)

---

### Техническая реализация

**База данных (3 миграции):**
1. `promoted_listings` + RLS (владелец видит свои, админ — все)
2. `disputes` + RLS (участники спора + админ)
3. `analytics_events` + RLS (insert для authenticated, select для админа)

**Новые компоненты:**
- `src/components/promoted/PromoteListingModal.tsx` — форма промо с выбором срока и оплатой
- `src/components/disputes/OpenDisputeModal.tsx` — форма открытия спора
- `src/components/disputes/DisputeCard.tsx` — карточка спора
- `src/pages/admin/AdminDisputes.tsx` — админ-модерация
- `src/hooks/usePromotedListings.ts`, `src/hooks/useDisputes.ts`, `src/hooks/useAnalytics.ts`
- `src/pages/admin/AdminInvestorMetrics.tsx` — дашборд для инвесторов

**Модификации существующих файлов:**
- Каталоги (PropertyIndex, ServicesIndex и тд) — сортировка promoted выше
- Страница заказа — кнопка "Открыть спор"
- App.tsx / routes — новые маршруты
- AdminOperations — вкладка "Споры"

**Ничего не ломается** — это всё новые таблицы и компоненты, существующий код затрагивается минимально (добавление кнопок и сортировки).

