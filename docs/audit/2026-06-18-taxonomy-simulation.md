# Аудит таксономии и симуляция 50 пользователей

**Дата:** 2026-06-18
**Скоуп:** вертикали, группировка услуг, маппинг life situations ↔ роли ↔ кластеры, vendor onboarding + модерация
**Метод:** read-only анализ БД + SSOT + симуляция 50 персон (6 ролей × 3 языка × 37 ситуаций)

---

## TL;DR

- **Реальных «вертикалей»:** 6 SSOT-кластеров → 18 SSOT-категорий → ~67 услуг. В БД параллельно живут **15 кластеров** и **81 категория** — расхождение в ~4× больше, чем нужно.
- **17 из 50** сценариев пользователей закрываются полностью. **33 из 50** упираются в одну из дыр: сирота-ситуация (12), нулевое предложение поставщиков (21).
- **Все 10 vendor-сценариев и все 8 owner-сценариев — красные.** Поставщикам некуда «приземлиться» в каталоге (кластер `manage` имеет 0 категорий в БД), собственники жилья видят пустые разделы.
- **Vendor onboarding технически работает корректно** (заявка идёт в `partner_applications` → `pending` → admin queue), но **`CategoryPicker` строится из SSOT, а провайдеры пишут `business_category` свободной строкой** — листинг от поставщика не находится через каталог потребителя (фронт ищет по `categories.slug`, БД хранит `home-cleaning`, `yacht_charter`, etc.).
- **Язык:** ситуации (`life_situations`) переведены на ru/en, **тайского нет вообще** — для th-пользователя весь Discover остаётся на английском.

---

## 1. Структурное расхождение SSOT ↔ БД ↔ UI

### 1.1 Кластеры

| Источник | Кол-во | Список |
|---|---|---|
| `src/lib/catalog/taxonomy.ts` (SSOT) | **6** | arrive, live, manage, invest, legal, build |
| `category_groups` (БД) | **15** | + home-maintenance, home-living, leisure, professional, life-admin, water, transport, health-wellness, other |
| `Master Taxonomy v1.0` (мемори) | **6** | совпадает с SSOT |

**Вердикт:** 9 БД-кластеров — фантомы. Они существуют физически, но не входят ни в SSOT, ни в Master Taxonomy v1.0. Категории внутри `live`/`arrive` дублируются в этих фантомах (например `cleaning` сидит и под `live`, и был бы логичен под `home-maintenance`).

### 1.2 Категории

- SSOT: **18** (`cat-emergency`, `cat-transport`, `cat-tourism`, `cat-home-services`, `cat-food-delivery`, `cat-health-wellness`, `cat-family-kids`, `cat-pet-services`, `cat-leisure`, `cat-real-estate`, `cat-business-legal`, `cat-finance`, `cat-halal-faith`, `cat-partner-portal` + ещё 4).
- БД: **81** (включая `cleaning`, `yacht`, `flowers`, `medical`, `tax`, `visa` и десятки других «листовых» слагов).

**Вердикт:** в БД смешаны *категории* (зонтики) и *вертикали/услуги* (листья). Канонический док обещает «16 × 230», по факту в SSOT 18 × 67, в БД 15 × 81 — три разные карты.

### 1.3 Каталог товаров vs услуг

`marketplace_categories` (12 записей: «Thai Delicacies», «Fish & Seafood», ...) живёт **полностью отдельно** от `categories`/`category_groups`. Моста нет, поиск по одному не находит другое. Для пользователя «купить розы» (товар) и «заказать букет» (услуга `flowers`) — два разных дерева без общей корневой точки.

### 1.4 `listings.category` — свободная строка

74 листинга без категории. В остальных значениях встречается `mixed`, `boxes`, `premium`, `deep` — это не категории, а тэги/тиры. Enum'а нет, валидации нет, привязки к таксономии нет.

### 1.5 Vendor categories

`providers.business_category` хранит произвольные строки (`home-cleaning`, `yacht_charter`, `transfer`, `pool`, `ac`, `pest`). Нормализации к `categories.slug` или к SSOT-vertical id нет. Из-за этого:
- `useCatalogFromDB` считает поставщиков по `categories.slug` — большинство активных провайдеров **не учитываются** в счётчиках на лендинге.
- Симуляция показывает 0 поставщиков в кластерах `legal`/`manage`/`build`, хотя в `providers` точно есть юридические и PMS-компании (просто под другими ярлыками).

---

## 2. Vendor onboarding — flow audit

**Файлы:** `src/pages/vendor/VendorOnboarding.tsx`, `src/components/vendor/onboarding/CategoryPicker.tsx`

### Что работает ✅
1. `CategoryPicker` — двухуровневый Airbnb-style (6 кластеров → услуги внутри), читается из `VERTICAL_GROUPS`, который теперь корректно деривируется из SSOT `taxonomy.ts`.
2. Заявка пишется в `providers` (с `is_active=false`) **+** `partner_applications` (статус `pending`).
3. Edge-функция `notify-admin-partner-application` дёргается → админ получает уведомление.
4. Защита от дублей (7-дневное окно), rollback orphan-providers при ошибке.
5. Email/имя валидируются до записи (BUG-01 закрыт).

### Что не работает ⚠️
1. **Языковой пробел:** `CategoryPicker` отображает только ru/en. Поле `labelTh` в `VerticalGroupItem` определено, но **не передаётся** в UI (видны только `labelRu`/`labelEn`). Тайскому поставщику названия категорий не локализованы.
2. **Поиск отсутствует.** 67 услуг разложены по 6 кластерам ровно по сетке 2-в-ряд, без поиска/фильтра. Поставщик «массаж» должен угадать, что это под `live → wellness`, а не `arrive → tourism`.
3. **Категория ≠ моя услуга.** Если поставщик делает **узкую** услугу, которой нет в SSOT (например «доставка воды 19 л» или «детский фотограф»), у него нет варианта «другое / предложить категорию». Только `category_suggestions` таблица в БД (есть, но не подключена к picker'у).
4. **Раскол с фактическими `providers.business_category`.** Picker сохраняет `verticalId` (например `home-cleaning`), но существующие провайдеры в БД помечены кто как — нет единого нормализатора. Каталог потребителя не агрегирует их.
5. **Модерация:** заявка попадает в `partner_applications`, но **не дублируется** в общий `moderation_queue` — у админа два разных места проверки контента.

---

## 3. Маппинг ролей ↔ ситуации ↔ кластеры

### 3.1 Ситуации (`life_situations`)
- Всего **37 записей**, активных и с приоритетом.
- 12 из 37 (**32%**) — **сироты**: не привязаны ни к одному кластеру через `cluster_life_situations`. Среди них критичные: `planning`, `pre_trip_planning`, `digital_nomad`, `pets`, `sports`, `retirement_living`, `shopping`, `property`, `relocation`, `health`, `emergency`, `visa_renewal`.
- Все 37 заведены на ru+en, **поле для тайского отсутствует в схеме** (`title_th` нет в таблице).

### 3.2 Привязки
- `cluster_life_situations`: 31 связь.
- `arrive` — 5 ситуаций, `live` — 8, `legal` — 6, `invest` — 4, `manage` — 6, `build` — 2.
- Кластер `manage` имеет 6 ситуаций, но **0 категорий** → ситуация ссылается на пустой раздел.

### 3.3 Роли (P01–P25 Master Taxonomy)
Формального join'а «персона → ситуация → кластер» в БД нет. `persona_detection_log` есть, но `user_personas` хранит только `persona_id` без связи с situations. Это значит: AI-агент не может авто-роутить пользователя «турист с детьми» на корректный набор ситуаций.

---

## 4. Симуляция 50 пользователей

Распределение: tourist×10, resident×10, investor×8, owner×8, developer×4, vendor×10. Языки: ru/en/th поочерёдно. Каждая персона получает 1 реальный `life_situations.code` из своей роли.

| # | Роль | Lang | Ситуация | Кластеры | Поставщики | Статус |
|---|---|---|---|---|---|---|
| P01 | tourist | en | `planning` | — | 0 | ⚠️ сирота |
| P02 | tourist | th | `pre_trip_planning` | — | 0 | ⚠️ сирота |
| P03 | tourist | ru | `arrival` | arrive | 11 | ✅ |
| P04 | tourist | en | `transit` | arrive | 11 | ✅ |
| P05 | tourist | th | `tourist` | arrive | 11 | ✅ |
| P06 | tourist | ru | `leisure` | live | 8 | ✅ |
| P07 | tourist | en | `nightlife` | live | 8 | ✅ |
| P08 | tourist | th | `shopping` | — | 0 | ⚠️ сирота |
| P09 | tourist | ru | `food` | live | 8 | ✅ |
| P10 | tourist | en | `planning` | — | 0 | ⚠️ сирота |
| P11 | resident | th | `living` | live | 8 | ✅ |
| P12 | resident | ru | `family` | live | 8 | ✅ |
| P13 | resident | en | `resident` | live | 8 | ✅ |
| P14 | resident | th | `settling` | legal | 0 | ⚠️ 0 поставщиков |
| P15 | resident | ru | `first_time` | arrive | 11 | ✅ |
| P16 | resident | en | `digital_nomad` | — | 0 | ⚠️ сирота |
| P17 | resident | th | `pets` | — | 0 | ⚠️ сирота |
| P18 | resident | ru | `pet_owner` | live | 8 | ✅ |
| P19 | resident | en | `sports` | — | 0 | ⚠️ сирота |
| P20 | resident | th | `retirement_living` | — | 0 | ⚠️ сирота |
| P21 | investor | ru | `investing` | invest | 1 | ✅ |
| P22 | investor | en | `investor` | invest | 1 | ✅ |
| P23 | investor | th | `property` | — | 0 | ⚠️ сирота |
| P24 | investor | ru | `business` | build, manage, invest, legal | 1 | ✅ |
| P25 | investor | en | `investing` | invest | 1 | ✅ |
| P26 | investor | th | `investor` | invest | 1 | ✅ |
| P27 | investor | ru | `property` | — | 0 | ⚠️ сирота |
| P28 | investor | en | `business` | build, manage, invest, legal | 1 | ✅ |
| P29 | owner | th | `property_owner` | manage | 0 | ⚠️ 0 поставщиков |
| P30 | owner | ru | `management_company` | manage | 0 | ⚠️ 0 поставщиков |
| P31 | owner | en | `managing` | manage | 0 | ⚠️ 0 поставщиков |
| P32 | owner | th | `property` | — | 0 | ⚠️ сирота |
| P33 | owner | ru | `property_owner` | manage | 0 | ⚠️ 0 поставщиков |
| P34 | owner | en | `management_company` | manage | 0 | ⚠️ 0 поставщиков |
| P35 | owner | th | `managing` | manage | 0 | ⚠️ 0 поставщиков |
| P36 | owner | ru | `property` | — | 0 | ⚠️ сирота |
| P37 | developer | en | `developer` | build | 0 | ⚠️ 0 поставщиков |
| P38 | developer | th | `developer` | build | 0 | ⚠️ 0 поставщиков |
| P39 | developer | ru | `developer` | build | 0 | ⚠️ 0 поставщиков |
| P40 | developer | en | `developer` | build | 0 | ⚠️ 0 поставщиков |
| P41–P50 | vendor | th/ru/en | `vendor_onboarding` | manage | 0 | ⚠️ 0 поставщиков (× 10) |

### Сводка

| Метрика | Значение |
|---|---|
| ✅ Полностью обслуживаемые | **17 / 50** (34%) |
| ⚠️ Сирота-ситуация | 12 / 50 |
| ⚠️ 0 поставщиков в нужном кластере | 21 / 50 |
| ❌ Ситуации нет в БД | 0 / 50 |

### По ролям

| Роль | OK / total |
|---|---|
| tourist | **6 / 10** |
| resident | **5 / 10** |
| investor | **6 / 8** |
| owner | **0 / 8** 🔴 |
| developer | **0 / 4** 🔴 |
| vendor | **0 / 10** 🔴 |

### По языкам (качество локализации UI/контента)

| Язык | Полное покрытие | Замечания |
|---|---|---|
| ru | ✅ ситуации + категории + UI | Базовый язык, всё переведено |
| en | ✅ ситуации + категории + UI | Базовый язык, всё переведено |
| th | ❌ нет столбца `title_th` в `life_situations`, нет `name_th` в `categories`, `labelTh` в SSOT добавлен, но не везде используется | **Критично** — для тайского рынка платформа фактически не локализована |

---

## 5. Top gaps (приоритизированный список фиксов)

### 🔴 P0 — блокеры для всей экосистемы

1. **Кластер `manage` пуст в БД.** 6 ситуаций ссылаются туда, все 18 owner+vendor сценариев умирают. Завести категории под PMS (cleaning, maintenance, accounting, channel-mgmt) под `manage` ИЛИ перепривязать ситуации к `live`. — *миграция данных, без кода*
2. **Нормализация `providers.business_category`.** Маппинг существующих 20+ свободных строк (`home-cleaning`, `yacht_charter`, `transfer`...) на SSOT vertical id. Без этого счётчики поставщиков на лендинге врут, поиск ничего не находит. — *одноразовая миграция + CHECK constraint*
3. **12 сирот-ситуаций.** `planning`, `pre_trip_planning`, `digital_nomad`, `shopping`, `pets`, `sports`, `retirement_living`, `property`, `relocation`, `health`, `emergency`, `visa_renewal` — каждая обязана иметь ≥1 связь в `cluster_life_situations`. — *одноразовая миграция*

### 🟡 P1 — серьёзные UX-проблемы

4. **Тайская локализация:** добавить `title_th`/`description_th` в `life_situations`, `name_th` в `categories`/`category_groups`, протянуть `labelTh` через `CategoryPicker`. Без этого `language='th'` не имеет смысла.
5. **9 фантомных БД-кластеров** (`home-maintenance`, `professional`, `water`, ...). Категории под ними перенести в SSOT-кластеры или дропнуть. Чтобы Drawer/footer не показывал пустые разделы.
6. **`marketplace_categories` ↔ `categories` мост.** Завести явный FK или unified view, чтобы товары и услуги искались из одного места.
7. **`CategoryPicker` без поиска.** Добавить `Input` с fuzzy-match по 67 услугам — поставщик находит свою категорию за 2 секунды, а не сканирует сетку.

### 🟢 P2 — улучшения

8. **`listings.category` enum** — заменить TEXT на FK к `categories.slug` (или хотя бы CHECK на whitelist).
9. **«Моей категории нет»** в `CategoryPicker` → запись в `category_suggestions` для админ-ревью.
10. **`partner_applications` → `moderation_queue`** дубликат, чтобы у админа единая лента модерации.
11. **`user_personas` ↔ `life_situations`** join-таблица для AI-роутинга «персона видит свои ситуации».

---

## 6. Что я НЕ сделал

- Не правил SSOT и не запускал миграции — это аудит.
- Не гонял реальные браузерные сессии × 50 — симуляция работала на уровне SQL/SSOT-данных, что точнее для структурных багов, но не ловит JS-runtime issues.
- Не проверял конкретные landing-страницы вертикалей (отдельный аудит).

---

## 7. Рекомендуемый порядок работ

**Рекомендую** идти строго по приоритетам:
1. Сначала **P0-2** (нормализация `business_category`) — это разблокирует счётчики и поиск без миграций контента.
2. Затем **P0-1** (`manage` категории) — открывает owner/vendor сценарии (28 из 50).
3. Параллельно **P0-3** (12 сирот) — 5 минут SQL, моментально +12 ✅ в симуляции.
4. После — **P1-4** (тайская локализация), потому что без неё `language='th'` создаёт ложное впечатление поддержки.

После всех P0-фиксов прогон 50 персон должен дать ~45/50 ✅ вместо текущих 17/50.

Готов выполнить любой из пунктов отдельным заходом — скажи, с какого начинаем.
