
# План: финансы, админка, навигатор

Объём огромный (БД 400+ таблиц, 82 admin-страницы, 13 вертикалей). Разбиваю на 4 волны. Каждая волна — атомарный мердж, можно остановиться после любой.

## Текущее состояние (факты из БД)
- `payment_intents`: 7 всего, **0 succeeded** → платёжный цикл не закрыт
- `orders`: 217, из них 185 `confirmed`, но `vendor_payout_amount=0` и `ledger_entries` (88 шт.) не связаны с orders
- `vendor_prospects` / `partner_applications`: **0 заявок за 30 дней** → онбоардинг не используется
- `moderation_queue`: пустая → нет единой очереди модерации
- 82 страницы `/admin/*` — фрагментировано, нет инбокса и единого списка партнёров
- `/discover` (NavigatorPageV3): плоская сетка situations без группировки по кластерам и контекста выдачи — клиент не понимает что и почему ему показывается

---

## Волна 1 — Навигатор (UX critical, делаем первым)

**Проблема:** плоский grid `life_situations` без структуры. Нет понимания «где я / зачем эта карточка / куда ведёт».

**Что меняем в `NavigatorPageV3.tsx`:**
1. Группировка situations по 6 surface-кластерам Master Taxonomy (Arrive / Live / Manage / Invest / Legal / Build) с заголовками-секциями и иконками.
2. Над сеткой — sticky cluster-tabs (chip-row) для быстрого скролла к секции.
3. Каждая `SituationCard` получает:
   - бейдж кластера (цвет из `--accent-*`)
   - явный счётчик услуг из `useSituationServiceCounts`
   - короткий «outcome» (что получит клиент), а не описание ситуации
4. Hero-блок сверху: «Что вам нужно сегодня?» + 3 promoted-карточки на основе persona + поисковая строка остаётся.
5. Empty/error states: вместо «нет ситуаций» — fallback на 6 кластеров напрямую с CTA «связаться с консьержем».
6. Map-link переезжает в hero (не в правый угол header).

**Файлы:** `NavigatorPageV3.tsx`, `SituationCard.tsx`, `useSituationServiceCounts.ts` (добавить cluster-grouping), новый `src/components/navigation/v3/NavigatorClusterSection.tsx`.

---

## Волна 2 — P0: Финансы (критика)

1. **Edge function `stripe-webhook`**: после `payment_intent.succeeded` гарантированно вызывать `record_ledger_entries(order_id)`. Проверить idempotency.
2. **RPC `record_ledger_entries`**: убедиться что пишет 3 ноги — `platform_fee`, `vendor_payout`, опционально `mc_commission`. Связь с `orders.id` через `ledger_entries.reference_id`.
3. **Backfill миграция**: для всех `orders.status='confirmed'` без `ledger_entries` — посчитать `vendor_payout_amount` из `vertical_commission_rules` и пересоздать записи.
4. **`reconciliation_alerts` cron**: ежедневный edge function `reconciliation-daily` сравнивает orders vs ledger и пишет alerts.

**Миграции:** `add_ledger_backfill`, `add_reconciliation_cron`.

---

## Волна 3 — P0/P1: Админка

**3.1 Унифицированный Inbox `/admin/inbox`** (новая страница)
- Источники: `partner_applications`, `vendor_prospects`, `moderation_queue`, `listing_applications`, `property_inquiries`, `consultation_requests`, `nb_leads`
- Tabs: «Новые / В работе / Эскалация / Закрытые»
- Bulk-actions: approve / reject / assign / снять с очереди
- Realtime через Supabase channel
- Заменяет 6+ разрозненных страниц

**3.2 Унифицированный `/admin/providers`** (новая страница)
- Single table: `providers` + join с `marketplace_vendors` + `vendor_subscriptions`
- Фильтры по vertical, статусу, рейтингу ClearView, выручке
- Inline-actions: pause / verify / open card
- Заменяет AdminSalons / AdminCleaning / AdminClinics / AdminPharmacies / AdminGyms / AdminFlowers / AdminPets / AdminExperiences / AdminEvents / AdminTransport (~10 страниц)

**3.3 Унифицированный `<OfferCardEditor />`** компонент
- Один редактор для всех вертикалей (медиа, цены, описания, ClearView, RU/EN/TH локали)
- Подключается из карточки provider'а и из вертикальных страниц как fallback
- Использует JSONB `listings.attributes` для vertical-specific полей

**3.4 `/admin/dashboard` редизайн**
- KPI ленты: GMV, заявки сегодня, payout pending, reconciliation alerts
- Quick-links на Inbox + Providers + Finance

---

## Волна 4 — P2: Cleanup

1. Пометить seed-данные: добавить `orders.is_seed` boolean, проставить true для всех существующих confirmed с `vendor_payout_amount=0` И `created_at < 2026-04-01`.
2. Smoke-test lead-форм через `lead_magnet_submissions` insert + проверка RLS allow `anon`.
3. Удалить (или редиректнуть) 10 устаревших vertical-admin страниц, заменённых Providers.

---

## Технические детали
- Все новые маршруты добавить в `src/lib/config/routes.ts` (`APP_ROUTES.admin.inbox`, `.providers`)
- Reuse `MiniAppLayout` для админских страниц
- React Query + Supabase generated types, никаких новых клиентов
- Семантические токены DS 2.1, никаких хардкод-цветов
- RLS: новые SELECT-запросы под `has_role(auth.uid(), 'admin')`
- WhatsApp CTA — везде `+66922407355` (canonical)

## Порядок мерджа
1. Волна 1 (Навигатор) — самостоятельно, безопасно
2. Волна 2 (Финансы) — backfill в read-only режиме сначала, потом write
3. Волна 3.1 (Inbox) → 3.2 (Providers) → 3.3 (Editor) → 3.4 (Dashboard)
4. Волна 4 (Cleanup) — после прохождения 1-2 недель на новых страницах

## Что НЕ делаем сейчас
- Не трогаем `/market` (по предыдущей договорённости)
- Не меняем Stripe pricing/тарифы
- Не мигрируем существующие 82 admin-страницы целиком — только консолидируем те, что покрыты Providers/Inbox
- Не правим schema `properties` (281 колонка — отдельная задача)

---

**Подтверди — стартую Волну 1 (Навигатор) сразу после approve.** Дальше волны идут последовательно, каждую закрываю отдельным сообщением чтобы можно было ревьюить.
