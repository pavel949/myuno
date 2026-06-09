# План: профессиональные онбординги, карточки и фильтры по 18 вертикалям

Цель: для каждой вертикали привести (1) онбординг владельца/партнёра, (2) форму-конструктор карточки услуги/объекта, (3) каталог-фильтры и (4) детальную страницу к уровню мировых лидеров рынка.

Сделанo сейчас (вне плана, быстрый фикс):
- «Еда» → «Рестораны» в чипах поиска (`searchData.ts`, `MapView.tsx`, `Bookings.tsx`) и i18n (`category.restaurants`). Категории партнёров «Еда и напитки» оставлены — это другой контекст (B2B-каталог).

---

## Единая архитектура (общая для всех вертикалей)

Чтобы не плодить 18 разных wizard'ов, вводим **универсальный фреймворк**:

```text
src/lib/vertical-specs/
  ├─ types.ts              ← VerticalSpec, FieldSpec, FilterSpec, OnboardingStep
  ├─ index.ts              ← registry: { restaurant, property, salon, … }
  ├─ restaurant.ts
  ├─ property.ts
  ├─ salon.ts
  └─ … (18 файлов)
src/components/vertical-wizard/
  ├─ VerticalWizard.tsx    ← рендерит spec → шаги онбординга
  ├─ ListingEditor.tsx     ← рендерит spec → форму карточки (tabs: Basics/Media/Details/Pricing/Policies/SEO)
  ├─ FilterPanel.tsx       ← рендерит spec.filters → каталог-фильтры
  └─ DetailRenderer.tsx    ← рендерит spec.detail → детальную страницу
```

Каждая `VerticalSpec` описывает: поля (типы, валидация Zod, i18n, обязательность, hints), media-требования (мин. фото, обложка, видео-тур), фильтры каталога (фасеты + диапазоны + сортировки), карточные бейджи, разделы детальной страницы, шаги онбординга и quality-score правила.

Это даёт: 1 движок, 18 конфигов, единое качество, лёгкие правки, A/B по индустриям.

---

## Best-practices эталоны по вертикалям

| # | Вертикаль | Таблица | Эталон-референс | Ключевые фильтры |
|---|-----------|---------|-----------------|------------------|
| 1 | Рестораны | `listings.restaurant` | TheFork, Google, Tripadvisor, OpenTable | кухня, средний чек ฿, район, бронь онлайн, веранда/вид, halal/veg/vegan, детское меню, доставка/самовывоз, часы сейчас открыто, рейтинг |
| 2 | Недвижимость (resale/rent) | `properties` | Idealista, Rightmove, Zillow, Airbnb | сделка (rent/sale), тип (villa/condo/townhouse), спальни, ванные, площадь м², цена, район+карта, бассейн, вид на море, pet-friendly, мебель, год постройки, freehold/leasehold |
| 3 | New-builds | `property_projects` + `nb_*` | PropertyGuru, Lamudi + ClearView | застройщик, рейтинг ClearView (AAA-CCC), стадия (off-plan/RTM), сдача (квартал/год), цена/м², ROI guaranteed, freehold, тип юнитов, рассрочка |
| 4 | Чартеры (yachts) | `listings.yacht` | GetMyBoat, Boatsetter, Click&Boat | тип (catamaran/yacht/speedboat), длина, гостей max, экипаж, длительность (½d/1d/multi-day), маршруты, цена/день, обед включён |
| 5 | Туры/Experiences | `listings.experience` | Viator, GetYourGuide, Klook | категория (snorkel/island/jungle), длительность, group size, pickup, язык гида, мин. возраст, цена, рейтинг |
| 6 | Транспорт (rent-a-car/bike) | `listings.vehicle` | Rentalcars, Turo, DriveMate | тип (car/bike/scooter), коробка, мест, бензин/электро, депозит, доставка, страховка вкл., мин. срок, права |
| 7 | Медицина (clinic/doctor) | `listings.clinic` + `doctors` | Doctolib, Practo, Bumrungrad | специализация, языки врачей, страховка, телемедицина, цена консультации, район, JCI-аккредитация, неотложка 24/7 |
| 8 | Образование | `listings.education` | School-Advisor, FindAPhD, Preply | возраст/уровень, программа (IB/BC/русская/тайская), язык, цена/год, общежитие, транспорт, экзамены |
| 9 | Уборка | `listings.cleaning` | TaskRabbit, Handy, Helpling | тип (regular/deep/post-construction/move-in), частота, кол-во спален, эко-средства, окна, BYO supplies, цена/час vs flat |
| 10| Няни | `listings.babysitter` | Care.com, Sitly | возраст детей, языки, опыт лет, ночёвка, права, готовка, спец-нужды, медкнижка |
| 11| Питомцы | `listings.pet_service` + `veterinary_clinics` | Rover, PetBacker | услуга (walk/sit/groom/vet/board), типы животных, размер, экстренный вызов, страховка, цена |
| 12| Красота/SPA | `salons` | Treatwell, Fresha, Booksy | услуги, мастера, языки, выезд на дом, бренды косметики, halal, цена, онлайн-запись |
| 13| Фитнес | `gyms` | ClassPass, Mindbody | тип (gym/yoga/crossfit/muay-thai), trial, day-pass, абонемент, сауна/бассейн, детская комната, тренер 1-на-1 |
| 14| Водный спорт | `water_activities` | PADI, Tripadvisor | дисциплина (dive/surf/kite/SUP), сертификаты (PADI/SSI), уровень, оборудование вкл., группа size, цена, фото/видео |
| 15| Юридические | `legal_services` | Avvo, LegalZoom | специализация (visa/company/property/family), языки, лицензия (Lawyers Council TH), цена консультации, paid retainer, удалённо |
| 16| Цветы (магазины+букеты) | `flower_shops` + `listings.bouquet` | FloraQueen, Interflora | повод (wedding/birthday/funeral), бюджет, тип (bouquet/arrangement/plant), доставка зон, same-day, кастом |
| 17| Аптеки | `pharmacies` | GoodRx, Apteka.ru | 24/7, рецепт-онлайн, доставка, бренды, страховка, тест-зоны, языки |
| 18| Магазины (универс.) | `stores` + `marketplace_products` | Etsy, Lazada vendor | категория товаров, доставка, возврат, бренды, способы оплаты, шоурум |
| 19| События | `events` | Eventbrite, DICE | дата/время, категория, возраст, цена/билет, площадка, организатор, оставшиеся места |
| 20| Услуги (универс.) | `services` | Thumbtack, Bark | категория, выезд/online, мин. цена, гарантия, языки, лицензии |

(18 чипов поиска + 2 кросс-вертикали — события и универсальные услуги, итого 20.)

---

## Шаги онбординга (универсальный шаблон, кастом под вертикаль)

1. **Кто вы** — single-/multi-location, юр.лицо/ИП, языки общения.
2. **Лицензии и compliance** — индустриальные документы (для legal — Lawyers Council TH license; для медицины — JCI/MOH; для water sports — PADI/SSI; для авто — TLB лицензия; для F&B — food license). Поля + аплоадер.
3. **Основные данные** — название, slug, адрес+карта (Google Places), часы, контакты, мессенджеры.
4. **Каталог/услуги/меню/юниты** — индустриальная сетка (рестораны: меню+категории; недвижимость: юниты; salons: услуги+мастера; clinic: врачи+специальности).
5. **Цены и policies** — прайс, депозит, отмена, налоги, оплаты (Stripe/cash/PromptPay).
6. **Медиа** — обязательная обложка + min 5 фото WebP, опц. видео-тур (для property/yacht — обязателен video walkthrough).
7. **SEO/описание** — RU + EN (обязательно), AI-перевод on demand, метатеги, hashtags.
8. **Бронирование/лид** — выбор: instant book / request-to-book / lead-form-only. Слоты, лимит на день, no-show fee.
9. **Quality check** — авто-скор (% заполненности + best-practice чек-лист), что добавить, чтобы пройти модерацию.
10. **Submit → moderation** — `approval_status='pending'`, нотификация в админку.

Wizard сохраняет draft автоматически, можно прервать и вернуться (`mc_onboarding_progress`).

---

## Конструктор карточки (Listing Editor)

Tab-структура:
- **Basics** — name, slug, vertical, cluster, JTBD tag.
- **Location** — address, lat/lng, район, метро/landmarks.
- **Media** — gallery, cover, video, virtual tour.
- **Details (vertical-specific)** — рендер из `VerticalSpec.fields`.
- **Pricing** — основная цена + сезонные/доп. опции (для property → `property_rate_seasons`, для yacht → `yacht_pricing_rules`).
- **Policies** — отмена, депозит, правила.
- **Booking** — слоты/availability/instant.
- **SEO** — title, description, OG image (auto-generated).
- **Quality** — live-score 0-100, чек-лист.

Live preview справа (мобайл-фрейм), как в Airbnb/Idealista.

---

## Фасетные фильтры каталога

Каждый `FilterSpec` поддерживает:
- `enum` (chips, multi)
- `range` (slider — цена, площадь, гости)
- `bool` (toggle — pool, halal, 24/7)
- `distance` (radius from map pin)
- `daterange` (для events/bookings — availability)
- `text` (search в названии)
- `sort` (relevance / price asc / price desc / rating / newest / distance)

URL-state синхронизирован (?cuisine=thai&price=1-1000&pool=true&sort=rating).

---

## План поставки (волнами)

**Wave 0 — Фундамент (1 спринт)**
- Универсальный фреймворк `vertical-specs/` + `VerticalWizard` + `ListingEditor` + `FilterPanel` + `DetailRenderer`.
- Quality-score engine + i18n валидация (RU+EN required).
- Миграция: добавить `quality_score` (int) и `completion_pct` (int) в `listings`, `properties`, `salons`, `gyms`, `events` и т.д. (унифицированный helper).

**Wave 1 — Топ-3 по выручке (1 спринт каждая)**
1. **Недвижимость** — самый сложный spec (≈80 полей, юниты, сезонные цены, ClearView для new-builds).
2. **Рестораны** — меню+категории, бронь, кухни, часы (Google Places sync).
3. **Чартеры** — длительности, маршруты, экипаж, фото-кейсы.

**Wave 2 — Сервисный кластер (1 спринт)**
4. Красота 5. Фитнес 6. Медицина 7. Юридические

**Wave 3 — Лайфстайл (1 спринт)**
8. Туры/Experiences 9. Водный спорт 10. События 11. Транспорт

**Wave 4 — Дом/быт + Прочее (1 спринт)**
12. Уборка 13. Няни 14. Питомцы 15. Цветы 16. Аптеки 17. Магазины 18. Универс. услуги

**Wave 5 — Полировка (½ спринт)**
- A/B на «Quality score gate» (нельзя publish до 60%).
- Industry-specific badges (Verified PADI / JCI-accredited / ClearView AAA / Halal-friendly).
- AI-помощник: «улучшить описание», «предложить недостающие фильтры», «перевести меню».

Итого: ~6 спринтов до полного покрытия 18 вертикалей.

---

## Технические детали

- Spec hot-reload без билда — JSON-совместимый TS.
- Zod schema из spec → форма + Edge Function валидация одинаково.
- Все строки через `useLocalizedField` + `autoTranslatedFrom` (как уже сделано для `bouquets`).
- Media: уже есть `UnifiedMediaUploader` — переиспользуем.
- Maps: уже есть `Google Places (New)` integration — переиспользуем для адресов и Place ID-импорта.
- RLS: editor пишет в свою таблицу только если `created_by = auth.uid()` или член MC; админ — везде. Существующие политики не трогаем.
- Никаких новых top-level роутов: онбординг живёт в `/operate/onboarding/:vertical`, editor — в `/operate/listings/:id/edit`, каталоги — на грандфазерных `/property`, `/flowers`, `/beauty` и т.д.

---

## Что не входит

- Не меняем сами таблицы публичного каталога (только добавляем 2 универсальных столбца качества).
- Не переписываем существующие детальные страницы вертикалей в Wave 0-1 — они будут постепенно мигрировать на `DetailRenderer` по мере готовности соответствующего spec.
- AI-генерация контента — отдельный спринт после Wave 1.

---

## Рекомендую

**Рекомендую: начать с Wave 0 + Wave 1 (Недвижимость + Рестораны + Чартеры).** Это даёт фреймворк один раз, плюс закрывает 3 вертикали с самой большой выручкой и самым большим запросом от пользователей (вы уже ловите «Еда → Рестораны», это сигнал). Остальные 15 вертикалей потом ложатся как конфиги по 1-2 дня каждый, без переписывания UI.

Подтвердите план — стартую с Wave 0 (фреймворк + первый spec для ресторанов как референс).