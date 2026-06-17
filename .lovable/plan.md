## Цель
1. Дать локальному бизнесу (салоны, рестораны, фитнес, аптеки, ветеринары, цветочные, магазины, площадки) возможность ставить точку на карте через Google Places, чтобы они появлялись слоями на единой карте Пхукета.
2. Привести в порядок футер и инфо-страницы (About / Contact / Privacy / Terms): убрать «дичь», единый tone-of-voice уровня региональной инфраструктуры, RU + EN.
3. Заменить все контактные e-mail на домен `myuno.app`.

---

## Что обнаружено

**Геолокация вендоров**
- В БД у `salons`, `restaurants`, `gyms`, `pharmacies`, `veterinary_clinics`, `flower_shops`, `stores`, `venues`, `vendor_locations`, `providers`, `listings` уже есть колонки `address`, `lat`, `lng`.
- В формах вендоров (`VendorBeauty.tsx`, `VendorRestaurants.tsx`, `VendorPharmacy.tsx`, `VendorFitness.tsx` и т.д.) `address` — обычный `<Input>` без геокодинга. `lat`/`lng` **не заполняются** → точки не попадают на карту (`UnifiedCatalogMap` фильтрует `lat===0`).
- Готовый компонент `src/components/shared/GooglePlacesAutocomplete.tsx` (Places API New + геокодер) уже существует и используется в недвижимости/трансфере. Его нужно переиспользовать.
- `MapView.tsx` поддерживает только `property | commercial | land | beauty | restaurant`. Нужно расширить слоями для остальных вертикалей.

**Контакты (`src/lib/config/contacts.ts`)**
- E-mail’ы на домене `uno.ae` (`support@uno.ae`, `partners@uno.ae`, `press@uno.ae`, `privacy@uno.ae`, `info@uno.ae`) → нужно перевести на `myuno.app`.
- Телефон/WhatsApp `+66 92 240 7355` — совпадает с `system_settings.org_telephone`, OK.

**Футер и инфо-страницы**
- `CompactFooter` — структура нормальная.
- `AboutPage` перегружена: «500+ верифицированных партнёров», «50K+ активных пользователей», «100K+ успешных бронирований», SOS-кнопка, VIP-менеджеры — вымышленные цифры и обещания, не соответствуют статусу платформы. Подлежит переписи.
- `ContactPage` тянет `uno.ae` e-mail’ы.
- `Privacy`/`Terms`/`Cookies`/`Refund` — нужно проверить на ту же «дичь» и согласовать с реальной моделью (Lovable Cloud + Stripe, Чалонг/Пхукет).

---

## План работ

### Шаг 1. Reusable LocationField для вендоров
Новый компонент `src/components/vendor/VendorLocationField.tsx`:
- Поле адреса с `GooglePlacesAutocomplete` (Phuket bias).
- Мини-карта (`GoogleMap` + draggable `Marker`) под полем для уточнения точки.
- Кнопка «Использовать моё местоположение» (`navigator.geolocation`).
- Выдаёт наружу `{ address, lat, lng, district? }`.
- Локализация RU/EN.

### Шаг 2. Подключить поле к вендор-формам
В формах добавить `VendorLocationField`, писать `lat`/`lng` в БД:
- `src/pages/vendor/VendorBeauty.tsx` (salons)
- `src/pages/vendor/VendorRestaurants.tsx` (restaurants)
- `src/pages/vendor/VendorFitness.tsx` (gyms)
- `src/pages/vendor/VendorPharmacy.tsx` (pharmacies)
- + `flower_shops`, `veterinary_clinics`, `stores`, `venues`, `vendor_locations` — там, где есть формы.
Сейчас они шлют только `address`; добавим `lat`, `lng` в payload `insert/update`.

### Шаг 3. Единая карта Пхукета со слоями
`src/pages/MapView.tsx`:
- Расширить `VerticalFilter` до: `property | restaurant | beauty | fitness | pharmacy | vet | flowers | shop | venue`.
- Добавить хуки `useSalons`, `useGyms`, `usePharmacies`, `useVeterinaryClinics`, `useFlowerShops`, `useStores`, `useVenues` (часть уже есть, недостающие — тонкие React Query обёртки).
- Маркеры с разными иконками/цветом по `VERTICAL_CONFIG`, кластеризация при >200 точек.
- Чипсы фильтров «слоёв» сверху + сохранение в URL (`?layers=beauty,restaurant`).
- InfoWindow ведёт на canonical detail-страницу вертикали.

### Шаг 4. Контакты → `myuno.app`
В `src/lib/config/contacts.ts` заменить все `@uno.ae` на `@myuno.app`:
`support@`, `partners@`, `press@`, `privacy@`, `info@`. Прочие ссылки оставить.
Проверить `rg "uno\.ae"` — добить остатки в коде/документации.

### Шаг 5. Перепись AboutPage
Короткая, спокойно-уверенная подача (canon §03 Tone of Voice):
- Кто мы: цифровая инфраструктура для иностранцев на Пхукете (жильё, услуги, юр.вопросы, образ жизни).
- Что делаем: единый аккаунт, проверенные локальные партнёры, прозрачные платежи, поддержка RU/EN/TH.
- Принципы: доверие, локальность, прозрачность, забота.
- **Убрать вымышленные метрики** (500+/50K+/100K+) и нереализованные фичи (SOS-кнопка, VIP-менеджер) — заменить на честные формулировки («каталог растёт», «партнёры проходят верификацию» и т.п.).
- CTA: «Связаться», «Стать партнёром», «Установить приложение».

### Шаг 6. ContactPage, Privacy, Terms, Cookies, Refund
- ContactPage: автоматически подтянет новые e-mail’ы. Перепроверить тексты на «дичь».
- Privacy/Terms/Cookies/Refund: пройтись, синхронизировать с реальностью (Чалонг/Пхукет, юр.лицо из `system_settings`, Stripe-платежи, домен `myuno.app`), убрать пустые обещания, оставить чёткие формулировки RU + EN.

### Шаг 7. Проверка
- Build + ESLint.
- Ручной smoke: создать тестовую запись салона → она появляется на `/map` с правильной иконкой.
- `rg "uno\.ae"` → 0 совпадений.
- Linter Supabase: 0 новых warnings.

---

## Технические детали

**Расширение `VERTICAL_CONFIG` в `MapView.tsx`**
```ts
beauty:   { icon: '💇', route: id => APP_ROUTES.BEAUTY_DETAIL(id) }
restaurant:{ icon: '🍽', route: id => APP_ROUTES.RESTAURANT_DETAIL(id) }
fitness:  { icon: '🏋', route: id => APP_ROUTES.GYM_DETAIL(id) }
pharmacy: { icon: '💊', route: id => APP_ROUTES.PHARMACY_DETAIL(id) }
vet:      { icon: '🐾', route: id => APP_ROUTES.VET_DETAIL(id) }
flowers:  { icon: '💐', route: id => APP_ROUTES.FLOWER_DETAIL(id) }
shop:     { icon: '🛍', route: id => APP_ROUTES.STORE_DETAIL(id) }
venue:    { icon: '🎪', route: id => APP_ROUTES.VENUE_DETAIL(id) }
```

**Источник Google Maps** — уже подключённый коннектор `google_maps` через `GoogleMapsContext`. Никаких новых ключей не требуется.

**Безопасность** — `lat`/`lng` запись через RLS, которая уже есть у вендорских таблиц (вендор пишет только свою запись). Дополнительных миграций не нужно.

---

## Рекомендую
Сделать всё одной итерацией в указанном порядке — изменения слабо связаны, но дают связный публичный эффект к запуску: вендоры видят себя на карте → доверие, инфо-страницы перестают звучать «маркетингово» → доверие к платформе, e-mail на `myuno.app` → бренд-консистентность.
