# План: Phase 1 — фундамент мульти-локационности

**Цель:** убрать архитектурные блокеры, после которых добавление новой локации (Бали, Дубай, Дананг, Гонконг — уже есть в `cities` как coming-soon) станет вопросом контента и сидинга, а не рефакторинга.

**Что НЕ входит в Phase 1:** локализация контента лендингов, partner network в новом городе, compliance/visa справочники, домены/субдомены. Это Phase 2/3 — отдельный план для каждой новой локации.

**Текущее состояние (по аудиту):** `cities`, `LocationContext`, `CurrencyContext`, `currency_rates`, `AdminCities`, `geography.ts` уже есть. Блокеры: 1 225 хардкодов `'THB'`, 265 файлов c "Phuket", `city` хранится как свободный текст на ~30 таблицах вместо FK, URL без префикса локации.

---

## Шаги (порядок важен — каждый разблокирует следующий)

### 1. БД: добавить `city_id` на доменные таблицы + бэкфилл

Одна миграция, добавляет `city_id uuid REFERENCES cities(id)` + индекс на каждую таблицу из списка. Бэкфилл — все существующие записи получают `city_id = (select id from cities where slug='phuket')`. NOT NULL после бэкфилла там, где можно.

Таблицы первой волны (бизнес-критичные):
- `properties`, `property_projects`, `property_complexes`, `project_units`, `development_units`, `resale_properties`
- `providers`, `marketplace_vendors`, `listings`, `business_listings`, `user_listings`
- `restaurants`, `salons`, `gyms`, `flower_shops`, `pharmacies`, `veterinary_clinics`, `doctors`, `education_providers`, `insurance_providers`
- `events`, `venues`, `experience_categories`, `water_activities`, `transfers`, `airport_services`, `legal_services`, `medical_services`, `visa_services`, `cleaning_services`
- `developers`, `management_companies`, `crm_companies`, `crm_contacts`
- `official_news`, `platform_news`, `lead_magnets`, `magnet_landings`
- `phuket_osm_pois` → переименовать в `osm_pois` + `city_id`

Существующий `city` text-столбец **не удаляем** — оставляем как human-readable label, добавляем `city_id` поверх. Удалим в Phase 4 после полной миграции консьюмеров.

RLS не меняем (всё остаётся как есть). Только GRANT не нужен — это ALTER, не CREATE.

### 2. БД: вспомогательные таблицы для мульти-локационности

- `city_areas` (id, city_id, slug, name_en/ru/th, lat, lng, polygon) — заменит хардкод `src/lib/config/phuketAreas.ts`. Бэкфилл из существующего файла для Пхукета.
- `city_content` (city_id, key, value_en, value_ru, value_th) — локализованные тексты (адрес офиса, контакты, hero копирайт), заменит хардкод в `src/lib/config/contacts.ts`.
- `cities.metadata` jsonb — расширение под per-city конфиг (compliance flags, sources, default zoom, og_image_url) без миграций на каждый чих.

### 3. Контекст локации: убрать хардкод `'phuket'`

`src/contexts/LocationContext.tsx`:
- Дефолт через детекцию: localStorage → IP geo (есть edge function `ip-geolocate`? если нет — `navigator.geolocation` с timeout 1.5s) → ближайший активный город из `cities` по координатам → фолбэк на первый `is_active=true` город по `sort_order`.
- Если детекция дала coming-soon город — открыть `CitySwitcherSheet` с CTA «Уведомить о запуске» + выбор активного города.
- Все компоненты, которые сейчас читают `currentCitySlug === 'phuket'`, переходят на `currentCity.slug` (без сравнений с литералом).

### 4. Унификация валют: codemod `'THB'` → city default

Хелпер `src/lib/format/price.ts`:
```ts
formatPrice(amount, { from?: Currency, to?: Currency }) // to = currentCity.default_currency
```
Использует существующий `currency_rates` через `useCurrencyConversion`.

Codemod-скрипт (jscodeshift или ручной find-replace по паттернам):
- `'THB'` literal → `currentCity.default_currency` где есть контекст
- `฿{amount}` → `<Price amount={amount} />` компонент
- `Intl.NumberFormat('th-TH', { currency: 'THB' })` → `formatPrice(...)`

Ожидаемый охват: ~80% из 1225 случаев автоматом, остальные руками. Отдельным PR-ом, маленькими порциями (по 50 файлов), чтобы review был возможен.

### 5. City-aware queries: фильтрация хуков по `currentCity.id`

Шаблон-хук `useCityScopedQuery`:
```ts
useCityScopedQuery(['properties'], (cityId) => 
  supabase.from('properties').select('*').eq('city_id', cityId)
)
```
Рефакторим в первую очередь хуки маркетплейса/discovery: `useProperties`, `useProviders`, `useListings`, `useRestaurants`, `useExperiences`, `useEvents`, `useTransfers`. CRM/owner/admin хуки — после, они tenant-scoped и менее срочны.

### 6. URL-структура: опциональный префикс `/:city`

`src/lib/config/routes.ts` + `AnimatedRoutes.tsx`:
- Все публичные маркетинговые/discovery маршруты получают опциональный префикс: `/:city?/property`, `/:city?/restaurants`, `/:city?/for/:slug`.
- Без префикса = currentCity по контексту (как сейчас).
- С префиксом = override + автоматический `setCity(slug)`.
- Legacy редиректы: `/property/...` → 301 → `/phuket/property/...` через middleware (или клиентский redirect в роутере), чтобы существующие беклинки и SEO не сломались.
- `hreflang`/canonical в `LandingSeoHead` обновить под `/:city/` префикс.

### 7. Расхардкод оставшихся `'phuket'` literals

15 string-литералов `'phuket'` в коде (после п.3 их станет меньше). Заменить на `currentCity.slug` или удалить условные ветки. Контент-файлы (`src/content/landings/personas/*`) — оставляем как есть в Phase 1, они и так Phuket-only (Phase 2 вынесет в БД per-city).

### 8. Launch checklist в админке

`src/pages/admin/AdminCities.tsx`:
- Кнопка «Запустить город»: чек-лист с проверками (есть ≥1 partner в каждом ключевом кластере, есть city_content для contacts/hero, есть translations покрытие ≥80%, geography заполнен, default_currency есть в `currency_rates`).
- При всех зелёных — флипает `is_active=true, is_coming_soon=false`.
- Read-only до Phase 2 контента, но фреймворк готов.

### 9. CI guard

Eslint-правило или скрипт в `predev`: запрет на новые литералы `'THB'`, `'phuket'`, `'Thailand'`, `'฿'` в `src/` (кроме whitelist: `geography.ts`, `i18n/`, `cities` seed). Не даст откатить прогресс.

---

## Технические детали

**Стэк:** существующий — Supabase, React Query, LocationContext, CurrencyContext. Никаких новых зависимостей.

**Что НЕ трогаем в Phase 1:**
- Auth/wallet/CRM — cross-city by design, остаются глобальными
- Контент персональных лендингов — Phase 2 per-city
- Compliance/visa/tax справочники — Phase 2 per-country (нужны отдельные таблицы `visa_types_by_country`, `tax_rates_by_country`)
- Партнёрская сеть — Phase 3, контентная работа
- Edge functions scraping (TAT/Bangkok Post) — Phase 2, per-city source configs
- Lifecycle messaging шаблоны — Phase 2, per-city контент

**Риски:**
- Бэкфилл `city_id` на `properties` (281 колонка) — самая большая таблица, миграция может занять минуту. Делаем с `CONCURRENTLY` на индексе и батч-апдейтом.
- Codemod на 1225 случаях `'THB'` — высокий риск регрессий в форматировании цен. Тесты на `formatPrice` обязательны, PR-ы по 50 файлов с visual review каждого экрана с ценами.
- Legacy 301-редиректы могут просесть SEO — за неделю до накатки добавить `<link rel="canonical">` с новой URL-схемой на старых маршрутах, чтобы Google переиндексировал плавно.

**Оценка трудоёмкости (один разработчик):**
- Шаги 1–2 (миграции): 2 дня
- Шаг 3 (LocationContext): 1 день
- Шаг 4 (codemod валют): 5–7 дней (растянуто по PR-ам)
- Шаг 5 (city-aware hooks): 3 дня
- Шаг 6 (URL prefix): 3 дня
- Шаги 7–9: 2 дня
- **Итого:** ~3 недели чистой работы + неделя на стабилизацию.

**Критерий готовности Phase 1:**
1. `UPDATE cities SET is_active=true WHERE slug='bali'` + seed 10 fake properties с `city_id=<bali>` → на `/bali/property` видны только эти 10, цены в IDR, карта центрирована на Бали. Phuket не задет.
2. CI guard блокирует PR с новыми `'THB'` литералами.
3. Все существующие пользователи и URL продолжают работать без изменений (Phuket = дефолт).

---

## Что дальше (вне Phase 1, для контекста)

- **Phase 2 (per-locale контент, 2–3 недели на каждую новую локацию):** вынос лендингов в БД, локальные FAQ/visa/tax, источники новостей, OG-images, hreflang per-city.
- **Phase 3 (launch playbook, 1 неделя на город):** seed партнёров, активация, домен/субдомен, маркетинг.

Когда Phase 1 готов — спросишь меня про Phase 2 для конкретной локации (Бали? Дубай?), я составлю отдельный план с учётом местной специфики.