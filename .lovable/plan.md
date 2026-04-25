
# План: интеграция ClearView V3 как полноценного продукта

Цель: превратить ClearView из «карточки в углу» в основной знак доверия для покупателей off-plan и в отдельный SaaS-продукт для девелоперов. Вся работа разбита на 5 этапов (F1–F5). Можно реализовать целиком за один заход или поэтапно — итоговая структура одна.

---

## F1 · Нормализация методологии и данных

**Проблема:** в БД две параллельные системы (`due_diligence_reports` + `clearview_projects/scores/categories`), веса категорий не совпадают с Canon V3, `TrustStrip` обращается к несуществующим полям (`clearview_badge`, `clearview_recommendation`).

**Что делаем:**
1. Создаём единый конфиг `src/lib/clearview/methodology.ts` — 8 категорий, веса по Canon V3 (LRC 20, DCF 20, CQP 15, LMA 15, FRC 10, ROI 10, MAS 5, LRT 5), пороги грейдов AAA/AA/A/BBB/BB, маппинг рекомендаций BUY/WATCH/AVOID.
2. Миграция БД:
   - Синхронизируем веса в `clearview_categories` с Canon V3.
   - Добавляем view `v_clearview_public` поверх `due_diligence_reports`, отдающую только публичные поля (grade, total_score, recommendation, top-3 risks/strengths, executive_summary).
   - Добавляем computed-колонки на `properties`: `clearview_grade`, `clearview_recommendation`, `clearview_score` (через trigger от последнего published `due_diligence_reports.project_id = properties.project_id`) — чтобы `TrustStrip` и каталог читали без N+1.
   - Помечаем `clearview_projects/scores` как deprecated (оставляем для обратной совместимости, далее дропнем отдельной миграцией).
3. RLS:
   - `due_diligence_reports`: SELECT публично только при `is_published = true`; админы/девелоперы — свои отчёты.
   - Полные `analysis`, `evidence_gaps`, `red_flags` (всё) — отдаются только покупателям отчёта (см. F3) или владельцу проекта.

---

## F2 · Визуализация рейтинга

Создаём 3 переиспользуемых компонента в `src/components/clearview/`:

1. **`<ClearViewBadge />`** — компактный значок (grade + цвет). Размеры `xs / sm / md`. Используется в:
   - `TrustStrip` (заменяет текущую заглушку)
   - `PropertyListingCard` (правый верхний угол изображения)
   - `PropertyMapView` InfoWindow (рядом с ценой)
   - `OffplanCard`
2. **`<ClearViewGauge />`** — полукруговой gauge 0–100 с цветовой шкалой и подписью грейда. Для шапки `ClearViewReport` и `OffplanDetail` hero.
3. **`<ClearViewRadar />`** — radar chart (recharts) по 8 категориям. Используется в публичной превью отчёта (free) и полной версии (paid).

Дизайн: токены `tokens.css` (никаких хексов), grade-цвета:
- AAA `--success`, AA `--success-soft`, A `--info`, BBB `--warning`, BB `--destructive`.

**Интеграции:**
- `PropertyListingCard.tsx` — добавить overlay-badge на превью.
- `PropertyMapView.tsx` — chip в InfoWindow.
- `OffplanDetail.tsx` — секция «ClearView Rating» с Gauge + Radar + 3 Top Risks (free).
- `TrustStrip.tsx` — переписать чип `clearview_badge` на `<ClearViewBadge />`.

---

## F3 · Free vs Paid (paywall)

Единый принцип «что показываем публично, что нет»:

| Поле | Public (free) | Premium (paid) |
|---|---|---|
| Grade (AAA…BB) | ✅ | ✅ |
| Total score 0–100 | ✅ | ✅ |
| Recommendation BUY/WATCH/AVOID | ✅ | ✅ |
| Radar по 8 категориям (баллы) | ✅ | ✅ |
| Top-3 red flags / green flags | ✅ | ✅ |
| Executive summary (1 параграф) | ✅ | ✅ |
| Полные findings по каждой категории | ❌ | ✅ |
| Evidence gaps + источники | ❌ | ✅ |
| Maturity levels | ❌ | ✅ |
| Modifiers и история ревизий | ❌ | ✅ |
| PDF-выгрузка | ❌ | ✅ |

**Реализация:**
- Рефактор `src/components/newbuilds/ClearViewReport.tsx`:
  - Часть 1 «Free Summary» — всегда видна.
  - Часть 2 «Full Report» — показывается только если у юзера есть запись в `clearview_purchases (user_id, project_id, expires_at)` или роль `admin/developer-owner`.
  - Заглушка-paywall с CTA «Купить полный отчёт ฿2,900» / «Корпоративная подписка».
- Подключаем `ClearViewReport` в `OffplanDetail` (сейчас не используется нигде).
- Новая таблица `clearview_purchases` + RLS (юзер видит только свои покупки).

---

## F4 · Монетизация

**B2C — продажа отчётов покупателям:**
- Новая Edge Function `create-clearview-checkout` (по шаблону `_shared/checkout-handler.ts`):
  - One-off Stripe payment, `mode: 'payment'`.
  - Два price_id: Single Report ฿2,900 / Bundle 3 ฿7,500.
  - На `payment_intent.succeeded` через `stripe-webhook` создаём запись в `clearview_purchases` (12 мес).
- Хук `useClearViewPurchase(projectId)` — проверка доступа, инициация чекаута через `useStripeUnifiedCheckout`.

**B2B — продажа оценок девелоперам:**
- Доводим `ClearViewApplyPage` (intake-форма): сохраняем заявку в `clearview_applications`, шлём admin-уведомление через WhatsApp/Email (`_shared/admin-config.ts`).
- Тарифы из `06-clearview-methodology.md`: Standard ฿150K, Premium ฿300K, Annual Subscription ฿500K/year. Без онлайн-оплаты — это sales-led.

**CTA-сетка** (везде единая):
- Public: «Открыть полный отчёт» → checkout.
- Developer: «Получить рейтинг проекта» → `/clearview/apply`.
- Inside report: «Подписаться на обновления проекта» (free, lead capture).

---

## F5 · Публичная директория и SEO

- Новая страница `/clearview/projects` — каталог опубликованных рейтингов (фильтр по grade, району, девелоперу), карточки с `<ClearViewBadge />` и линком на проект.
- Sitemap: добавить URL'ы опубликованных отчётов в `public/sitemap-pillars.xml`.
- Линк в шапке `ClearViewLanding` → «Смотреть рейтинги проектов».
- На `OffplanIndex` — фильтр «Только с ClearView рейтингом».

---

## Технические детали

**Файлы создаются:**
- `src/lib/clearview/methodology.ts` — single source of truth по весам/грейдам
- `src/components/clearview/ClearViewBadge.tsx`
- `src/components/clearview/ClearViewGauge.tsx`
- `src/components/clearview/ClearViewRadar.tsx`
- `src/components/clearview/ClearViewPaywall.tsx`
- `src/hooks/useClearViewPurchase.ts`
- `src/pages/clearview/ClearViewProjects.tsx`
- `supabase/functions/create-clearview-checkout/index.ts`
- Миграции: sync весов, `v_clearview_public` view, `clearview_purchases` table + RLS, computed columns на `properties`, обновление `stripe-webhook` для clearview-purchase

**Файлы редактируются:**
- `src/components/property/TrustStrip.tsx` — использовать `<ClearViewBadge />`, читать из computed columns
- `src/components/property/PropertyListingCard.tsx` — overlay badge
- `src/components/property/PropertyMapView.tsx` — chip в InfoWindow
- `src/components/newbuilds/ClearViewReport.tsx` — split free/paid + Radar/Gauge
- `src/pages/property/OffplanDetail.tsx` — встроить `ClearViewReport`
- `src/pages/clearview/ClearViewLanding.tsx` — линк на директорию
- `src/lib/config/routes.ts` — добавить `CLEARVIEW_PROJECTS`
- `supabase/functions/stripe-webhook/index.ts` — обработка clearview-purchase

**Стек:** recharts (уже в проекте) для Radar/Gauge, Stripe one-off через `_shared/checkout-handler.ts`, RLS на новых таблицах, токены `tokens.css`.

---

## Порядок реализации (рекомендуемый)

1. F1 (миграция + methodology config) — критично, без этого данные несогласованы
2. F2 (Badge/Gauge/Radar) — даёт мгновенный визуальный эффект на всех карточках
3. F3 (paywall split) — готовит монетизацию
4. F4 (Stripe + B2B intake) — включает деньги
5. F5 (директория + SEO) — рост органики

Подтвердите — иду реализовывать **все 5 этапов** одним проходом, либо назовите конкретные (например только F1+F2 сейчас, остальное позже).
