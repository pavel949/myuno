
# План: единая модель «Недвижимость» — 6 треков сделок

## Что есть сейчас (фактически в коде)

| Слой | Состояние |
|---|---|
| Таблица `properties` (32 шт.) | `listing_modes[]` = rent/sale/platform, `price_per_night`, `sale_price`, `min_stay_nights`, `ownership_form`, `video_url` |
| Таблица `resale_properties` (3 шт.) | `is_assignment`, `assignment_premium`, `remaining_payments` (jsonb), `transfer_fee_paid_by`, `original_purchase_price`, `condition`, `title_type`, `lease_years_remaining` |
| Таблица `property_projects` (266 шт.) | `payment_plan` (jsonb), `virtual_tour_url`, `commission_pct` |
| Wizard (`PricingStep`) | 3 пресета: short_term · long_term (=min_nights 30) · sale. Нет medium. Нет рассрочки/эскроу |
| URL `tenancy=` | поддержка `short` / `long`. Нет `medium` |
| Эскроу | только на странице услуг (TermsPage / RefundPolicy), не привязано к продаже недвижимости |
| Distressed / Quick sale | **нет** ни поля, ни UI, ни таба |
| Переуступка | живёт только в `resale_properties`, не в `properties` |
| Видео-тур | поле `video_url` (URL) — загрузки файла нет |

## Целевая модель — 6 треков

```text
properties.listing_modes[] ─┐
properties.tenancy_modes[] ─┤  → одна запись объекта
sale_intent ────────────────┘    может одновременно сдаваться/продаваться/в переуступке

Track 1: STR    short-term rent     1–29 ночей
Track 2: MTR    medium-term rent    30–179 ночей  (НОВОЕ)
Track 3: LTR    long-term rent      180+ ночей / годовой контракт
Track 4: RESALE вторичная продажа   готовый объект
Track 5: ASSIGN переуступка прав    new-build, недостроен
Track 6: QUICK  быстрая/distressed  любой тип, флаг + причина + дисконт
```

## Архитектурные принципы

1. **Источник истины — `properties`** для residential (включая sale + assignment если объект уже на стадии готовности). `resale_properties` оставляем как legacy + витрина.
2. **Источник средств не проверяем** — нет KYC-полей, нет SoF-документов, только опциональная отметка «готов предоставить SoF».
3. **Эскроу — опция листинга, не обязательна**. Видна как badge на карточке. Включается продавцом / застройщиком, не платформой.
4. **Рассрочка — структурированный payment_plan**: список milestones (booking, contract, construction %, transfer). Без банка, только seller/developer financing.
5. **Видео-тур — два варианта**: внешний URL (YouTube/Vimeo) + загрузка mp4 в Supabase Storage (≤500 МБ).
6. **Витрину пока не трогаем** — изменения схемы и wizard'а готовят данные; редизайн карточек/фильтров — следующий этап.

---

## Stage 1 — База данных (миграции)

### 1.1 `properties` — новые колонки

```sql
ALTER TABLE properties
  -- Tenancy modes: какие сроки сдачи поддерживает объект
  ADD COLUMN tenancy_modes text[] DEFAULT '{}',  -- 'short' | 'medium' | 'long'
  ADD COLUMN price_per_month numeric,            -- THB/мес для medium-term
  ADD COLUMN price_per_year numeric,             -- THB/год для long-term
  ADD COLUMN deposit_months_long numeric DEFAULT 2,  -- стандарт Таиланда: 2 мес
  ADD COLUMN advance_months_long numeric DEFAULT 1,  -- предоплата 1 мес
  ADD COLUMN min_lease_months integer,           -- 1, 6, 12
  -- Sale / assignment
  ADD COLUMN sale_intent text,                   -- 'standard' | 'assignment' | 'quick_sale'
  ADD COLUMN is_assignment boolean DEFAULT false,
  ADD COLUMN assignment_premium numeric,         -- доплата к контрактной цене
  ADD COLUMN original_contract_price numeric,    -- цена по SPA с застройщиком
  ADD COLUMN remaining_to_developer numeric,     -- сколько ещё платить застройщику
  ADD COLUMN transfer_fee_split text,            -- 'buyer' | 'seller' | '50_50'
  -- Quick sale / distressed
  ADD COLUMN is_quick_sale boolean DEFAULT false,
  ADD COLUMN quick_sale_reason text,             -- relocation | divorce | financial | other
  ADD COLUMN quick_sale_discount_pct numeric,    -- скидка от рыночной
  ADD COLUMN urgency_deadline date,              -- «нужно продать до …»
  -- Payment options (продажа / переуступка)
  ADD COLUMN accepts_installments boolean DEFAULT false,
  ADD COLUMN installment_plan jsonb,             -- [{label, percent, due_at}]
  ADD COLUMN escrow_offered boolean DEFAULT false,
  ADD COLUMN escrow_provider text,               -- 'platform' | 'lawyer' | 'bank' | null
  -- Юр. готовность (без SoF)
  ADD COLUMN title_deed_type text,               -- chanote | nor_sor_3 | leasehold
  ADD COLUMN title_deed_url text,                -- скан (опц.)
  ADD COLUMN encumbrances_disclosed boolean DEFAULT false,
  ADD COLUMN foreign_quota_available boolean,    -- есть ли иностр. квота на юните
  -- Видео-тур
  ADD COLUMN video_file_url text,                -- загруженный mp4 (Supabase Storage)
  ADD COLUMN virtual_tour_url text;              -- 360° / Matterport
```

### 1.2 Storage bucket для видео

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-videos', 'property-videos', true, 524288000,
  ARRAY['video/mp4','video/quicktime','video/webm']);
```
+ RLS: владелец / managed_by_org может писать; публичное чтение.

### 1.3 Backfill существующих 32 объектов

```sql
UPDATE properties
SET tenancy_modes = CASE
  WHEN price_per_night IS NOT NULL AND min_stay_nights < 30 THEN ARRAY['short']
  WHEN price_per_night IS NOT NULL AND min_stay_nights >= 30 THEN ARRAY['long']
  ELSE '{}' END
WHERE tenancy_modes = '{}' OR tenancy_modes IS NULL;
```

---

## Stage 2 — Property Wizard (форма создания)

Файлы: `src/hooks/usePropertyWizard.ts`, `src/components/owner/property-wizard/steps/PricingStep.tsx`, `BasicInfoStep.tsx`.

### 2.1 Новый селектор «Что вы делаете с объектом» (multi-select)

В начале PricingStep вместо текущих 3 кнопок-радио — мульти-выбор «треков»:

```text
☐ Сдавать посуточно (1–29 ночей)
☐ Сдавать на 1+ месяц (medium-term)
☐ Сдавать долгосрочно (6+ мес, годовой контракт)
☐ Продавать (готовый объект)
☐ Переуступка прав (новостройка, недостроена)
☐ Срочная продажа / спец. условия
```

Каждый чек-бокс раскрывает свой блок полей.

### 2.2 Блок «Medium-term» (новое)

- `price_per_month` (THB/мес)
- `min_lease_months` (1 / 3 / 6 пресеты)
- доступно с (date)
- включено в цену (utilities, internet, cleaning) — мульти-чип

### 2.3 Блок «Long-term» (расширение существующего)

- `price_per_month` или `price_per_year`
- `min_lease_months` (6 / 12 пресеты)
- `deposit_months_long` (по умолчанию 2)
- `advance_months_long` (по умолчанию 1)
- какие коммуналки покрывает арендодатель
- разрешена ли регистрация (TM30) — boolean

### 2.4 Блок «Sale» (расширение)

- `sale_price` (есть)
- `transfer_fee_split` — radio: «50/50» / «покупатель» / «продавец»
- `title_deed_type` — chanote / nor sor 3 / leasehold
- `title_deed_url` — UnifiedMediaUploader (опц.)
- `foreign_quota_available` — boolean (только для condo)
- `encumbrances_disclosed` — checkbox + поле «обременения, описание»

**Sub-блок «Условия оплаты»:**
- ☐ Принимаю рассрочку → раскрывается редактор `installment_plan`:
  - drag-drop список milestones: «Бронь 5%», «Контракт 25%», «На передаче 70%»
  - три пресета кнопкой: «Стандарт 25/75», «Рассрочка 12 мес», «Custom»
- ☐ Готов через эскроу → выбор провайдера: «myUNO escrow» / «свой юрист» / «банк»

### 2.5 Блок «Assignment» (новое — переуступка)

Появляется, если `is_assignment=true` ИЛИ `project.project_status` ∈ (offplan, under_construction):

- `original_contract_price` (THB) — цена по SPA с застройщиком
- `assignment_premium` (THB) — наценка
- `remaining_to_developer` (THB) — сколько осталось внести
- `installment_plan` — выгрузить из `property_projects.payment_plan`, дать редактировать
- какая стадия SPA подписана (booking / contract / DBD-registered)
- `transfer_fee_split`

### 2.6 Блок «Quick sale / Distressed» (новое)

- `is_quick_sale` toggle
- `quick_sale_reason` — select (relocation / divorce / financial / business / inheritance / other)
- `quick_sale_discount_pct` — slider 5–40%
- `urgency_deadline` — date picker
- автоматически добавляется бейдж «🔥 Quick sale» на карточку каталога

### 2.7 Видео-тур (расширение `BasicInfoStep`)

Сейчас: один input для URL.
Станет: tab-selector
- **URL**: YouTube / Vimeo / TikTok (валидация формата) → `video_url`
- **Файл**: UnifiedMediaUploader для mp4 ≤500 МБ → `video_file_url` в bucket `property-videos`
- **Виртуальный тур**: Matterport / Kuula → `virtual_tour_url`

---

## Stage 3 — URL / каталог / навигация (минимальная подготовка)

Витрину не редизайним, но готовим параметры:

1. `tenancy=medium` добавляем как валидный третий вариант в `PropertyIndex.tsx` и `PropertySearchPage.tsx`.
2. `mode=sale&intent=assignment` и `mode=sale&intent=quick` — новые URL-фильтры.
3. В `propertyBrowseFilters.ts` (создан в прошлой итерации) добавляем эти ключи в whitelist для URL/localStorage persist.
4. `useProperties` — добавить filter-параметры: `tenancy`, `intent`, `is_assignment`, `is_quick_sale`.
5. Хедер вкладок (`PropertyHub.tsx`) — оставляем как есть; покажем новые состояния только когда придут реальные данные.

---

## Stage 4 — Карточка детали (`PropertyDetail.tsx`)

Условный рендер новых блоков (если данные есть — показываем, иначе скрыто):

- **Цена-сводка**: показывать одновременно посуточно / помесячно / годовая / sale, если соответствующий tenancy mode активен.
- **Badge-стрип**: «Эскроу», «Рассрочка», «Переуступка», «Quick sale -15%», «Видео-тур», «360°».
- **Секция «Условия оплаты»**: рендер `installment_plan` как stepper.
- **Секция «Юридический статус»**: chanote type, foreign quota, обременения disclosed.
- **Видео-плеер**: если `video_file_url` — нативный `<video>`; если YouTube — iframe; если Matterport — iframe.

---

## Stage 5 — Лид-форма (`PropertyInquiry.tsx` / `UniversalLeadForm`)

Расширяем форму запроса под трек:

- Для **rent (любой)**: даты + кол-во гостей.
- Для **medium/long**: «на сколько месяцев», «дата въезда», «нужна регистрация TM30».
- Для **sale / assignment**: «способ оплаты» (cash / installments / escrow), «сроки сделки».
- Для **quick sale**: добавить срочный канал — кнопка «Связаться сейчас» (WhatsApp + Telegram паралельно).

Источник средств **не запрашиваем**.

---

## Stage 6 — RLS / Approval / Витрина

- `approval_status` остаётся: новые поля не меняют workflow.
- `quick_sale` записи требуют отдельной модерации (флаг `requires_review` если discount > 25%).
- Public read RLS для `properties` уже разрешает `is_active=true AND approval_status='approved'` — новые колонки видны автоматически.

---

## Технический план файлов

**Миграции:**
- 1 миграция: расширение `properties`, создание bucket, backfill.

**Edit:**
- `src/hooks/usePropertyWizard.ts` — расширить `PropertyFormData`, `initialFormData`, `buildPropertyPayload` (mapping новых полей в `tenancy_modes`, `installment_plan`, `sale_intent`).
- `src/components/owner/property-wizard/steps/PricingStep.tsx` — заменить 3-радио на multi-select треков, добавить блоки medium/long-term, sale, assignment, quick-sale, payment options.
- `src/components/owner/property-wizard/steps/BasicInfoStep.tsx` — расширить блок видео (3 таба).
- `src/components/owner/property-wizard/propertyValidation.ts` — добавить валидаторы для новых блоков.
- `src/hooks/useProperties.ts` — добавить параметры фильтрации `tenancy`, `intent`, `is_assignment`, `is_quick_sale`.
- `src/lib/propertyBrowseFilters.ts` — расширить whitelist URL-параметров.
- `src/pages/property/PropertyIndex.tsx` — поддержать `tenancy=medium`, читать `intent` из URL.
- `src/pages/property/PropertyDetail.tsx` — условный рендер новых секций.
- `src/components/property/PropertyInquiry.tsx` — поля под трек.

**New:**
- `src/components/property/InstallmentPlanEditor.tsx` — drag-drop редактор milestones.
- `src/components/property/QuickSaleBadge.tsx` — бейдж «🔥 Quick -15%».
- `src/components/property/EscrowBadge.tsx`, `AssignmentBadge.tsx`.
- `src/components/property/PropertyVideoPlayer.tsx` — универсальный плеер (file / yt / matterport).
- `src/components/upload/PropertyVideoUploader.tsx` — обёртка над `UnifiedMediaUploader` для bucket `property-videos`.
- `src/lib/real-estate/installmentPresets.ts` — пресеты «25/75», «12 мес», «застройщик».
- `src/lib/real-estate/saleIntentTaxonomy.ts` — справочник `quick_sale_reason`, `transfer_fee_split`.

---

## Что НЕ делаем в этом этапе

- KYC / Source of Funds покупателя.
- Витринный редизайн карточек/фильтров (только подготовка параметров).
- Интеграция реального эскроу-провайдера (только флаг + название).
- Ипотечный калькулятор (банки в TH не дают ипотеку иностранцам).
- Подключение MLS / внешних источников.
- Перенос `resale_properties` в `properties` (оставляем legacy таблицу, в `properties` появляется параллельная функциональность через `is_assignment`).

---

## Порядок реализации (рекомендуемый)

1. **Миграция БД** + bucket + backfill — без риска для текущего UI.
2. **Wizard PricingStep** — мульти-трек селектор, medium-term блок, расширение sale-блока, опции эскроу/рассрочки.
3. **Assignment / Quick-sale блоки** в wizard.
4. **Видео-загрузчик** (BasicInfoStep + новый компонент + bucket).
5. **PropertyDetail** — рендер новых секций.
6. **Каталог** — `tenancy=medium`, `intent` фильтры, persist в URL/localStorage.
7. **Лид-форма** — поля под трек.

Каждый шаг работоспособен независимо, ничего из работающего не ломает.
