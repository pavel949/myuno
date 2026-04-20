

## Цель
Поднять готовность админ-инструментов внесения сервисов и продуктов с **~60% до 100%**: убрать все 10 разрывов из аудита, чтобы один оператор мог за день внести 200+ листингов без ручной чистки.

---

## Фаза 1 — P0: критические блокеры

### 1.1 Маршрутизация AI Intake → правильные витринные таблицы
**Проблема:** `intakeVerticals.ts` пишет restaurants/clinics/salons в `listings`, а витрины читают отдельные таблицы.

**Что делаю:**
- Аудит 22 вертикалей: `table` в конфиге vs реальная таблица витрины.
- Правка `intakeVerticals.ts` — каноническая таблица для каждой вертикали.
- В `useIntakeAgent.ts` (approve) — корректный INSERT + маппинг полей.
- Автосоздание `providers` записи, если у листинга нет `provider_id`.

**Файлы:** `src/lib/intakeVerticals.ts`, `src/hooks/useIntakeAgent.ts`, `supabase/functions/intake-listing-agent/index.ts`.

### 1.2 Валидация обязательных полей перед approve
- `src/lib/intake/validateItem.ts` (new) — `{ valid, missing[], warnings[] }`.
- В `IntakeQueue` — блок approve при `!valid` + красный список «Не хватает: X, Y, Z».
- `approveAll` — пропуск невалидных + тост «Approved 18 of 25, 7 skipped».

### 1.3 Прогресс + список ошибок в bulk
- `progress` state в `useIntakeAgent`: `{ total, processed, failed, currentItem }`.
- Progress bar + текущий айтем в `IntakeInputForm` (bulk).
- Failed айтемы в отдельной секции «Ошибки парсинга (3)» с «Retry».

---

## Фаза 2 — P1: x3 скорость

### 2.1 CSV upload с маппингом колонок
- Новый `CSVImportWizard.tsx` (3 шага: загрузить → маппинг → превью → импорт).
- Зависимости: `papaparse`, `xlsx`.
- Интегрирую как 4-й режим в `IntakeModeSelector` (`csv`).
- Использует тот же approve-pipeline (валидация, прогресс).

### 2.2 Единый медиа-флоу
- В `IntakeQueueItem` — drag-and-drop через существующий `UnifiedMediaUploader`.
- Файлы → Supabase Storage `intake-temp/` → после approve переезжают в `listings/`.
- URL картинок из URL-режима — превью внутри карточки.

### 2.3 Health-score карточка
- `src/lib/intake/healthScore.ts` (new) — 0–100% по правилам (required 40%, images 20%, description 15%, location 15%, price 10%).
- Кружок с %, цвет от красного к зелёному, tooltip с недостающим.
- Сортировка очереди по убыванию score.

---

## Фаза 3 — P2: UX-полировка

### 3.1 Хаб `/admin/add`
- Новая страница `AdminAddHub.tsx` — 4 крупные карточки: один объект / bulk текст-URL / CSV / заявки партнёров.
- Route в `App.tsx` + ссылка в админ-сайдбаре как главный «➕ Добавить».

### 3.2 Keyboard shortcuts
- В `IntakeQueue`: `A` approve, `D` discard, `E` edit, `↑↓` navigate.
- Hint внизу экрана.

### 3.3 Mobile-first для `/admin/intake`
- `IntakeModeSelector` — `grid-cols-1` на 384px.
- `PageHeader` — collapsible subtitle.
- `IntakeQueueItem` — компактная вёрстка + свайпы (approve вправо, discard влево).

### 3.4 Audit log + soft-delete confirm
- `useIntakeAgent.approveItem/approveAll` пишет в `admin_audit_logs`.
- Bulk-операции — `AlertDialog` с подтверждением.

---

## Фаза 4 — Финальная проверка

**Smoke-test чек-лист:**
- ✅ 1 ресторан single → проверка в `/restaurants`.
- ✅ Bulk 5 яхт → approveAll → health-score, валидация, прогресс.
- ✅ CSV 10 клиник → маппинг → попадание на `/clinics`.
- ✅ Невалидная карточка → блокировка approve.
- ✅ Mobile 384px — полный flow single.

**Memory:**
- Создать `mem://features/admin/intake-pipeline-v3`.
- Обновить `mem://features/admin/supplier-discovery-agent`.

---

## Файлы

**Новые (4):**
- `src/lib/intake/validateItem.ts`
- `src/lib/intake/healthScore.ts`
- `src/components/admin/intake/CSVImportWizard.tsx`
- `src/pages/admin/AdminAddHub.tsx`

**Изменяемые (~12):**
- `src/lib/intakeVerticals.ts`
- `src/hooks/useIntakeAgent.ts`
- `src/components/admin/intake/IntakeQueue.tsx`
- `src/components/admin/intake/IntakeQueueItem.tsx` (создам, если нет)
- `src/components/admin/intake/IntakeInputForm.tsx`
- `src/components/admin/intake/IntakeModeSelector.tsx`
- `src/pages/admin/AdminIntake.tsx`
- `src/pages/admin/AdminTrash.tsx`
- `src/App.tsx`
- `src/components/admin/AdminSidebar.tsx` (или эквивалент)
- `supabase/functions/intake-listing-agent/index.ts`
- `package.json` (+papaparse +xlsx)

**Не трогаю:**
- Витринные страницы (`/restaurants`, `/clinics`…).
- БД-схему.
- Stripe/checkout.
- 60 вертикальных админок (`AdminFlowers` и т.п.).
- Партнёрский self-service.

---

## Оценка и риски

- **Объём:** ~16 файлов, 4 итерации.
- **Главный риск:** маппинг AI Intake → правильные таблицы. Может вскрыть несостыковки в схемах. Если потребуется БД-миграция — спрашиваю отдельно.
- **Стратегия:** иду фазами последовательно, после каждой — short summary + пауза.

---

## Что НЕ входит
- A/B тесты, аналитика «время до approve».
- Редизайн витрин.
- Новые вертикали.
- Партнёрский self-service `/vendor/*`.

