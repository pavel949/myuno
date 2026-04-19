

## План: Hotels как часть Commercial RE — для инвесторов/бизнесменов

### Контекст
В `commercialTaxonomy.ts` уже есть тип `hotel_building` (🏨), но он подан как обычный коммерческий объект. Отель — это **операционный бизнес**, а не просто здание: ключи (rooms), ADR, RevPAR, occupancy, brand/flag, лицензия (Hotel License), management contract. Нужно дать ему отдельную "под-вертикаль" внутри Commercial с собственной карточкой, фильтрами и сценариями: **Buy / Sell / Rent (lease) / Hand over to management**.

### Цель
Сделать Hotels полноценным разделом внутри Commercial Hub — видимым для personas `investor` и `business`, с покупкой/продажей/арендой и опцией передать в управление (HMA — Hotel Management Agreement).

---

### Архитектура

#### 1. Данные (DB)
Новые поля в `properties` (только для `asset_class='commercial' AND property_type='hotel_building'`):
- `hotel_keys` int — количество номеров
- `hotel_star_rating` numeric(2,1) — 1.0–5.0
- `hotel_brand` text — бренд/флаг (Marriott, Hilton, independent…)
- `hotel_license_type` text enum-like — `full_hotel_license` | `non_hotel_license` | `pending`
- `hotel_adr_thb` numeric — Average Daily Rate
- `hotel_revpar_thb` numeric — Revenue per Available Room
- `hotel_occupancy_pct` numeric — текущая загрузка
- `hotel_gop_margin_pct` numeric — GOP%
- `hotel_management_status` text — `owner_operated` | `under_hma` | `seeking_operator` | `for_lease`
- `hotel_operator_name` text — текущий оператор (если under_hma)
- `hotel_year_renovated` int

Новый sub-intent в URL: `?hotelMode=buy | sell | lease | management`.

#### 2. Таксономия
- Расширить `commercialTaxonomy.ts`: добавить `HOTEL_LICENSE_TYPES`, `HOTEL_MANAGEMENT_STATUSES` (bilingual labels) + хелперы `getHotelLicenseLabel`, `getHotelManagementStatusLabel`.
- Добавить в `CommercialPropertyType` подтипы: `boutique_hotel`, `resort`, `serviced_apartment_building`, `hostel` — рядом с `hotel_building`. Все они группируются в Hotels-секцию через хелпер `isHotelType()`.

#### 3. Hooks
- `useHotelProperties(filters)` — обёртка над `useCommercialProperties` с predicate `property_type IN (hotel_building, resort, boutique_hotel, serviced_apartment_building, hostel)`.
- Поля Hotel добавить в `COMMERCIAL_COLUMNS` и интерфейс `CommercialProperty`.
- `HotelFilters` extends `CommercialFilters`: `minKeys`, `maxKeys`, `licenseType`, `managementStatus`, `minOccupancy`, `minStars`.

#### 4. UI компоненты (новые)

**`HotelPropertyCard.tsx`** — карточка отеля. Отличия от `CommercialPropertyCard`:
- Hero: aspect 16/10, бейджи: `тип` + `звёздность` (звёздочки) + intent (Buy/Lease/Management) + verified
- Тело:
  - Заголовок + локация
  - **KPI strip**: Keys / ADR / RevPAR / Occupancy% (4 метрики в grid)
  - Цена: для buy — sale_price; для lease — monthly_rent; для management — "Operator wanted" CTA
  - Cap rate + GOP% (если есть) рядом с ценой
  - Badge management_status: "Под управлением Marriott" / "Owner-operated" / "Seeking operator"
  - License badge (Full Hotel License — зелёный, Non-hotel — янтарный)

**`HotelFilters.tsx`** — bottom sheet: keys range, stars min, license, management_status, intent (buy/sell/lease/management).

**`HotelHeroBanner.tsx`** — на лендинге `/property/commercial?tab=hotels`: 4 use-case карточки:
1. **Купить отель** — investor flow
2. **Продать отель** — owner flow → `/mc/properties/new?asset=commercial&type=hotel_building`
3. **Арендовать здание** — lease flow
4. **Передать в управление** — HMA lead form → CRM

**`HotelManagementLeadSheet.tsx`** — форма "Передать в управление": owner inputs (keys, location, current state) → создаёт `crm_contacts` запись с `source='hotel_hma_inquiry'`, отправляет уведомление в Telegram.

#### 5. Страницы

**Новая:** `src/pages/property/HotelsIndex.tsx` (route: `/property/hotels`)
- Tabs: Buy / Lease / Management opportunities
- Hero banner (4 use-cases)
- Filters bar
- Grid of `HotelPropertyCard`
- Empty state с CTA "Опубликовать отель"

**Обновить:** `CommercialIndex.tsx`:
- Добавить sub-tab "Hotels" рядом с All/Office/Retail/Warehouse — но клик ведёт на `/property/hotels` (отдельный URL для SEO).
- В `useCommercialProperties` добавить флаг `excludeHotels` (по умолчанию false на All, true когда выбрана не-hotel категория).

**Обновить:** `PropertyLanding.tsx`:
- В Capital section (видна для investor/business) добавить 4-ю карточку **Hotels** (icon `Hotel` из lucide) → `/property/hotels`.

**Обновить:** `PropertyHub.tsx`:
- В табах под Commercial добавить sub-link "Hotels" с бейджем "Pro".

#### 6. Wizard (создание)
В `BasicInfoStep.tsx`:
- При выборе `asset_class=commercial` + `property_type=hotel_building/resort/boutique_hotel/...` показать дополнительный блок "Hotel details": keys, stars, brand, license, management_status, ADR, occupancy.
- Если `management_status=seeking_operator` — показать чекбокс "Опубликовать в разделе HMA opportunities".

#### 7. CRM интеграция
- Source `hotel_hma_inquiry` для лидов от owners, ищущих оператора.
- Source `hotel_acquisition_inquiry` для investor leads.
- Pipeline: Hotels (новая Kanban доска или подтип в existing).

#### 8. Routes
В `APP_ROUTES`:
- `HOTELS_INDEX = '/property/hotels'`
- `HOTEL_DETAIL = (id) => '/property/hotels/${id}'` (использует тот же `CommercialDetail` с conditional Hotel KPI section)

#### 9. i18n
Добавить `propertyHub.hotels.*` keys (RU/EN): tabs, KPI labels, license types, management statuses, HMA form copy.

#### 10. Map
В `MapView.tsx` добавить sub-toggle для отелей внутри Commercial layer (icon 🏨, цвет золото с тёмной обводкой).

#### 11. Версия
`appVersion.ts` → `3.41.6`.

---

### Файлы

**Create:**
- `src/components/property/commercial/HotelPropertyCard.tsx`
- `src/components/property/commercial/HotelFilters.tsx`
- `src/components/property/commercial/HotelHeroBanner.tsx`
- `src/components/property/commercial/HotelManagementLeadSheet.tsx`
- `src/hooks/useHotelProperties.ts`
- `src/pages/property/HotelsIndex.tsx`

**Modify:**
- `src/lib/real-estate/commercialTaxonomy.ts` — Hotel taxonomies + helpers
- `src/hooks/useCommercialProperties.ts` — Hotel fields в `COMMERCIAL_COLUMNS`, `excludeHotels` filter
- `src/pages/property/CommercialIndex.tsx` — Hotels sub-tab
- `src/pages/property/PropertyLanding.tsx` — Hotels card в Capital section
- `src/pages/property/PropertyHub.tsx` — Hotels sub-link
- `src/pages/property/CommercialDetail.tsx` — Hotel KPI section (conditional)
- `src/components/owner/property-wizard/steps/BasicInfoStep.tsx` — Hotel details block
- `src/pages/MapView.tsx` — Hotel sub-toggle
- `src/lib/config/routes.ts` — `HOTELS_INDEX`, `HOTEL_DETAIL`
- `src/i18n/en.ts`, `src/i18n/ru.ts` — hotels keys
- `src/lib/appVersion.ts` → 3.41.6

**Migration:**
- ALTER TABLE properties ADD COLUMN hotel_keys, hotel_star_rating, hotel_brand, hotel_license_type, hotel_adr_thb, hotel_revpar_thb, hotel_occupancy_pct, hotel_gop_margin_pct, hotel_management_status, hotel_operator_name, hotel_year_renovated.

---

### Открытые вопросы (default отвечу сам)

| # | Вопрос | Default |
|---|--------|---------|
| 1 | Делать Hotels отдельный URL `/property/hotels` или sub-tab в `/property/commercial`? | Отдельный URL для SEO + sub-link в Commercial |
| 2 | HMA-лиды — куда писать? | `crm_contacts` с source `hotel_hma_inquiry` + Telegram alert |
| 3 | Звёздность как pip (5 звёздочек) или текст? | Pip-звёздочки в карточке, text в фильтре |
| 4 | Финансовые KPI (ADR/RevPAR/GOP) — публично или auth-gated? | Публично базовые (keys/stars/occupancy), ADR/RevPAR/GOP — auth-gated tooltip "Sign in to view" |

