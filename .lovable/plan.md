
# Комплексный план блока недвижимости myUNO

Сравнение с Airbnb / Дом.РФ / Циан / distressed-платформами (Auction.com, RealtyTrac), синхронизация с PROJECT.md, и план интеграции с Базой Знаний.

---

## 1. Где мы сейчас (по факту кода + БД)

| Под-блок | URL | Статус | Покрытие vs эталон |
|---|---|---|---|
| Краткосрочная аренда (STR) | `/property/browse?tenancy=short` + `PropertyDetail` + `PropertyInquiry` | Работает: календарь, цены сезонами, инстант/запрос, депозит, iCal sync, Stripe | ~70% Airbnb |
| Среднесрочная (MTR) | `?tenancy=medium` (редирект в browse) | Каркас данных есть, UI лидформы нет | ~20% |
| Долгосрочная (LTR) | `?tenancy=long` | Поля БД есть (`min_lease_months`, `deposit_months_long`), отдельного флоу нет | ~20% |
| Новостройки (Off-plan) | `/property/offplan`, `OffplanDetail`, `/newbuilds/*` | Каталог + ClearView badge + Compare + Calculator + Map + DueDiligence-страница | ~50% Дом.РФ |
| Вторичка | `/property/resale` | Каталог + табы Assignment/Ready, карточки | ~40% Циан |
| Distressed/Quick Sale | поле `is_quick_sale` в БД, страницы нет | 0% |
| База знаний | `/knowledge`, `/knowledge/pillar/*` | Гайды есть, но **не привязаны к карточкам объектов** | ~30% |
| Полный цикл покупки (PROJECT.md §9, 8 этапов) | частично: ContractAI/FloodScore/DD упомянуты, snagging/milestones/furnishing — нет | ~25% |

**Данные:** 24 активных объекта, все STR; 0 продажных, 0 переуступок, 0 quick sale, 0 с installment plan. То есть «треки» инфраструктурно готовы, но **витрин и контента под них нет**.

---

## 2. Что есть у эталонов и чего нам не хватает

### 2.1 Airbnb (STR)
| Функция | У нас | Gap |
|---|---|---|
| Календарь + инстант-бронь | ✅ | — |
| Wishlist | ✅ `useFavorites` | — |
| Reviews (рейтинги после стэя) | ❌ нет | **Критично** |
| Superhost-статус | ❌ нет (есть Verified vendor) | средне |
| Карта с ценами | ✅ `/property/map` | — |
| Гибкие даты ("± 3 дня") | ❌ | средне |
| Фильтр amenities + property type | ✅ `UniversalFilter` | — |
| Сплит-оплата | ✅ `PayWhenSelector` | — |
| Гид/чат с хостом | ✅ `MessageHostButton` | — |
| Cancellation policies | ✅ `cancellation_policy` | — |
| Translation reviews | ❌ | низко |
| Trip planning | частично `/trip-planner` | средне |

**Главный gap STR:** нет публичных отзывов после поездки → нет soсial proof → конверсия ниже Airbnb на 30-40%.

### 2.2 Дом.РФ + Циан (новостройки)
| Функция | У нас | Gap |
|---|---|---|
| Карточка ЖК с планировками | частично (нет планировок-чертежей) | **Критично** |
| Шкала строительства + фотоотчёты по месяцам | ❌ | **Критично** (это PROJECT.md §9 этап 3) |
| Эскроу-индикатор | поле `escrow_offered` есть, UI badge нет | средне |
| Платёжные вехи (milestones) | поле `installment_plan` есть, визуализации нет | **Критично** |
| Рейтинг застройщика | ✅ `DeveloperDetail` + ClearView AAA-BB | сильнее эталонов |
| Сравнение проектов | ✅ `NewbuildsCompare` | — |
| Калькулятор доходности/ипотеки | ✅ `NewbuildsCalculator` | — |
| Квота иностранцев (живой счётчик) | ❌ | средне (для Пхукета критично) |
| Виртуальный тур / 360° | ❌ только видео-URL | средне |
| Документы проекта (SPA template, Title) | частично `AdminProjectDocuments` (admin only) | **Критично** для buyer |
| Due Diligence отчёт | ✅ `NewbuildsDueDiligence` | — |
| Площадь по типам юнитов с фильтром | ❌ | средне |

**Главный gap новостроек:** покупатель не видит, как идёт стройка после депозита (§9 этап 3 PROJECT.md), и не может скачать SPA-шаблон / читать платёжные вехи в карточке.

### 2.3 Циан (вторичка)
| Функция | У нас | Gap |
|---|---|---|
| Каталог + assignment/ready табы | ✅ | — |
| История цены | ❌ | **Критично** для investor trust |
| Карточка с премией к первоначальной цене (`premiumPercent`) | ✅ есть | — |
| Виртуальный показ (видео walkthrough) | поле есть, но нет загрузчика | средне |
| Запрос показа (viewing) | частично через `MessageHostButton` | средне |
| Title verification badge (Чанот/Лизхолд) | поле `title_deed_type` есть, в карточке не отображается | **Критично** |
| Encumbrances / залоги | ❌ | средне |
| Юридический отчёт по объекту | ❌ (есть ContractAI как продукт, но не привязан к карточке) | средне |

### 2.4 Distressed / Quick Sale (Auction.com, RealtyTrac, Avito-Срочно)
| Функция | У нас | Gap |
|---|---|---|
| Дисконт vs market value (badge) | ❌ | **Критично** |
| Срок действия предложения (countdown) | ❌ | **Критично** |
| Сценарий продажи (развод, переезд, кэш-флоу) | ❌ | средне |
| NDA-gated детали | ❌ (актуально для $1M+) | средне |
| Pre-approved buyers list | ❌ | средне |
| Closed-bid форма | ❌ | средне |
| Эскроу обязательно | поле есть | средне |

**Сейчас этого блока нет вообще** — а это `PROJECT.md` тип сделки #03 переуступка и #04 вторичка с потенциальным средним чеком ฿2M-80M.

### 2.5 База знаний
**Что есть:** `/knowledge` с pillar guides, sections, articles.
**Чего нет:**
- Связи «гайд ↔ карточка объекта» (на странице `/property/offplan/:id` нет ссылки на гайд "Как покупать off-plan", хотя §10 PROJECT.md прямо требует "Право и собственность ведёт во все Слой-4 инструменты")
- Связи «инструмент ↔ гайд» (ContractAI/FloodScore/DueDiligence упомянуты в PROJECT.md §10, в коде ссылок из карточки на инструмент нет)
- Lead Intelligence трекинга чтения (PROJECT.md §11: "+15 баллов за 3 статьи о покупке" — функционала скоринга по контенту нет)

---

## 3. Как всё должно работать вместе (карта взаимодействия)

```text
                 ┌────────────────────────────────────┐
                 │  ВХОД: /property (PropertyHub)     │
                 │  Табы: Nightly · Monthly · Buy ·   │
                 │  New · Resale · Commercial · Land  │
                 └──────────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼─────────────────────────┐
        ▼                           ▼                         ▼
   ┌──────────┐              ┌──────────────┐         ┌──────────────┐
   │  АРЕНДА  │              │   ПОКУПКА    │         │   QUICK      │
   │ STR/MTR  │              │ Offplan ·    │         │   SALE       │
   │  / LTR   │              │ Resale ·     │         │ (приоритет)  │
   └────┬─────┘              │ Assignment   │         └──────┬───────┘
        │                    └──────┬───────┘                │
        │                           │                        │
        │   ┌───────────────────────┼────────────────────────┘
        │   │                       │
        ▼   ▼                       ▼
   ┌─────────────────────────────────────────────────┐
   │   КАРТОЧКА ОБЪЕКТА (PropertyDetail)             │
   │   ┌──────────────────────────────────────────┐  │
   │   │ Trust Strip: ClearView · FloodScore ·    │  │
   │   │ Title type · Escrow · Verified owner    │  │
   │   ├──────────────────────────────────────────┤  │
   │   │ Sticky CTA по треку:                     │  │
   │   │  STR  → BookingCard (даты+оплата)        │  │
   │   │  MTR/LTR → "Запросить аренду" (lead)     │  │
   │   │  Offplan → "Запросить просмотр" + DD     │  │
   │   │  Resale  → "Запросить показ" + ContractAI│  │
   │   │  Quick   → countdown + offer-form (NDA)  │  │
   │   ├──────────────────────────────────────────┤  │
   │   │ "Что почитать" (auto-pull из Knowledge   │  │
   │   │  по тегам track + zone + audience)       │  │
   │   ├──────────────────────────────────────────┤  │
   │   │ "Связанные инструменты" (ContractAI,     │  │
   │   │  FinanceGuide, FloodScore, ClearView)    │  │
   │   └──────────────────────────────────────────┘  │
   └─────────────┬───────────────────────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────────────────────┐
   │  LEAD SCORING (PROJECT.md §11)                  │
   │  Просмотр 3+ раз → +35 → WhatsApp Павлу        │
   │  Чтение 3 статей → +15                         │
   │  ClearView Report куплен → +50                 │
   └─────────────────────────────────────────────────┘
```

База знаний **не отдельный остров**, а **подложка для каждой карточки**:
- Под каждым объектом — блок "Что важно знать перед сделкой" (3-5 статей по тегам)
- В каждой статье — "Объекты по теме" (если статья про переуступку → подборка assignments)

---

## 4. Комплексный план — 5 этапов, 30 задач

### Этап A — Критические фиксы и видимость (1-2 недели)

**A1. Видимость Title Deed / Escrow / Installment в карточке**
- Файл: `PropertyDetail.tsx` + `OffplanDetail.tsx` + `ResaleDetail.tsx`
- Добавить **TrustStrip** компонент: chip-ленту с `title_deed_type` (Chanote/Leasehold/Nor Sor), `escrow_offered`, foreign quota %, ClearView score, FloodScore.
- Использует существующие поля БД, новых миграций не нужно.

**A2. Визуализация платёжных вех (`installment_plan` jsonb)**
- Новый компонент `InstallmentTimeline.tsx` — горизонтальная шкала с %/датами/суммами.
- Подключить в `OffplanDetail` и `ResaleDetail` (для assignments).
- Загрузчик плана в визарде (`PricingStep.tsx`) — пресеты из `installmentPresets.ts` уже есть, не подключены к UI.

**A3. Фикс табов PropertyHub под фактические треки**
- В `PropertyHub.tsx` уже есть табы `rent_short/rent_long/buy/newbuild/resale` — но `mode=buy` ничего не фильтрует в `PropertyIndex` (нет логики).
- Добавить в `PropertyIndex.tsx` чтение `mode/tenancy` URL-параметров и фильтрацию по `tenancy_modes` / `sale_intent`.

**A4. Storage bucket для STR-видео-туров**
- Bucket `property-videos` уже создан миграцией, нужен компонент `PropertyVideoUploader.tsx` (max 500MB, .mp4) — подключить в визард шага "Медиа".

### Этап B — STR на уровне Airbnb (2-3 недели)

**B1. Reviews после стэя**
- Миграция: `property_reviews (id, property_id, order_id, reviewer_id, rating_overall, rating_cleanliness, rating_location, rating_value, comment, comment_translated, created_at)`.
- Триггер: после `order.status='completed'` через 24ч → создаётся pending review request.
- UI: `ReviewForm.tsx` (modal на `/me/bookings`), `ReviewsBlock.tsx` в `PropertyDetail`.
- Bilingual: автоперевод через Lovable AI (gemini-2.5-flash) on demand.

**B2. Гибкие даты + map view с ценами**
- В `useStaysSearch.ts` добавить параметр `flexibility: 0|3|7` дней.
- `PropertyMap.tsx` уже есть, добавить ценовые pins (зелёный/красный/жёлтый по категории цены).

**B3. Superhost эквивалент: "myUNO Verified Host"**
- Использовать существующий `VendorVerificationBadge` + критерии: `>10 завершённых брони`, `rating >= 4.7`, `response_time < 1h`. Считать триггером, флаг в `providers.is_superhost`.

### Этап C — Off-plan Buyer Journey (PROJECT.md §9) (3-4 недели)

**C1. Шкала строительства + фотоотчёты (этап 3 PROJECT.md)**
- Миграция: `project_construction_updates (project_id, month, photos[], description, ai_progress_estimate, posted_by)`.
- Уже есть `NbUpdatesTab` — расширить: галерея с timeline, AI-краткое резюме каждого обновления (Claude Vision).
- На `OffplanDetail` — sticky тред "Стройка" видимый покупателям с депозитом.

**C2. Документы проекта в карточке (не только admin)**
- Миграция: `project_documents.is_public boolean default false`.
- В `OffplanDetail` блок "Документы": SPA шаблон, схема юнитов, разрешения, лицензии — публично (с ClearView watermark) либо после `Lead`.

**C3. Foreign quota live-counter**
- Если есть `foreign_quota_units / foreign_quota_sold` в проекте → показать "Осталось X из Y юнитов в иностранной квоте" + цвет (зелёный/жёлтый/красный).
- Это PROJECT.md §10 "freehold vs leasehold, иностранная квота".

**C4. Snagging checklist (этап 4 PROJECT.md)**
- Миграция: `property_snagging_items (property_id, location_room, defect_type, status, photos[], reported_by, fixed_at)`.
- UI на `/owner-portal/property/:id/snagging` — пользователь видит чек-лист, добавляет дефекты, статус устранения.

**C5. Furniture packages (этап 5 PROJECT.md)**
- Уже есть `marketplace`/`stores`, нужен tag `furniture_package` + страница `/property/furnishing` с фиксированными пакетами.

### Этап D — Resale + Quick Sale + Distressed (2-3 недели)

**D1. История цены для resale**
- Миграция: `property_price_history (property_id, price, currency, recorded_at, source)` + триггер на изменение `properties.price`.
- График в `ResaleDetail` — 12-месячная динамика.

**D2. Quick Sale страница и фильтры**
- Новый роут `/property/quick-sale` (или `?intent=quick_sale` на `/property/browse`).
- Карточка quick-sale: discount-badge ("-25% к рыночной"), countdown ("осталось 7 дней"), сценарий ("причина: переезд").
- Миграция (поля уже есть — `is_quick_sale`, `discount_percent`, `quick_sale_expires_at`): добавить в SELECT хука.
- Запрос-форма: NDA-gate для тикетов от ฿20M, для остальных — обычный lead.

**D3. Title type / encumbrance badge в Resale карточке**
- Использовать `title_deed_type` (поле есть). На `ResalePropertyCard` добавить чип "Чанот" / "Лизхолд 30+30+30".

**D4. Closed-bid форма для distressed $500K+**
- Миграция: `distressed_offers (property_id, bidder_id, amount, currency, conditions, expires_at, status, nda_signed_at)`.
- Edge-function `notify-distressed-offer` → WhatsApp Павлу.

### Этап E — База знаний как подложка (1-2 недели)

**E1. Линковка статья ↔ объекты**
- Миграция: `knowledge_articles.related_property_tags text[]` + `properties.knowledge_tags text[]`.
- Хук `useRelatedKnowledge(property)` — top-3 статьи по пересечению тегов + zone.

**E2. Блок "Что почитать перед сделкой" в `PropertyDetail`/`OffplanDetail`**
- Под трек: STR → "Правила гостевого этикета Пхукета", "Visa overstay"; Offplan → "Freehold vs Leasehold", "Платёжные вехи и FET", "Как читать ClearView"; Resale → "Переуступка прав в Таиланде", "Налог при перепродаже".

**E3. Lead-scoring по чтению (PROJECT.md §11)**
- Edge-function `track-knowledge-read` (POST из `KnowledgeArticlePage` after 30s scroll).
- Записывает в `user_engagement_events` → агрегирует в `lead_score`.

**E4. CTA в конце каждой статьи**
- §10 PROJECT.md: "каждая статья заканчивается одним конкретным следующим шагом".
- Компонент `KnowledgeArticleCTA` — выбирает CTA по pillar: статья про FET → "Запустить FinanceGuide"; статья про DD → "Запросить ClearView отчёт"; статья про переуступку → "Смотреть переуступки".

---

## 5. Приоритизация по интересам ЦА (из PROJECT.md §13)

| Этап | Кому критично | Почему | Когда |
|---|---|---|---|
| A1-A4 | Все ЦА | Базовая видимость trust-сигналов; без этого не работает ничего | Сейчас |
| B1 (Reviews) | Турист, Семья, Snowbirds | Без отзывов конверсия STR ниже Airbnb | Спринт 2 |
| C1-C4 (Off-plan journey) | HNW investor, Монг./Бангл./Европ. инвестор, Пассивный инвестор | Главный revenue (PROJECT.md §1: 70% выручки от RE/Invest) | Спринт 3-4 |
| D2 (Quick Sale) | HNW investor, Capital | $500K+ deals с быстрым циклом | Спринт 5 |
| E1-E4 (Knowledge link) | Все ЦА, особенно Новый экспат | Lead scoring + удержание + SEO | Спринт 5-6 |

---

## 6. Тест против 5 правил PROJECT.md §16

| Тест | Этапы A-E |
|---|---|
| Revenue Line (90 дней) | A,B,D — yes; C — частично; E — длинный хвост |
| Funnel Proximity | Все этапы строго на пути турист→арендатор→покупатель |
| Asset Leverage | C,D используют отношения с Sansiri/Rhom Bho и омбудсмен; E использует контентный актив |
| Founder Bandwidth | Не требуется новый найм; всё реализуемо текущей командой |
| Narrative Coherence | Полностью укладывается в "инфраструктура + доверенный оператор" |

**Все 5 этапов проходят 3+ "да" → строить.**

---

## 7. Что НЕ делаем сейчас (явно)

- Не трогаем рабочий STR-флоу (orders, ledger, Stripe, iCal, pricingEngine).
- Не строим white-label SaaS для PM (в Defer списке PROJECT.md §15).
- Не добавляем ипотечный калькулятор (в Таиланде иностранцам ипотеку не дают; вместо — installment plan от застройщика, что C-этап и закрывает).
- Не делаем верификацию источника средств (KYC) — пользователь явно сказал.

---

## 8. Что нужно подтвердить, прежде чем стартовать

Готов начать с **Этапа A** (1-2 недели работы, дает быстрый visible impact). Подтвердите либо скорректируйте:

1. Стартуем с **Этапа A** (TrustStrip + Installment Timeline + табы PropertyHub + видеоуплоадер) — самое срочное и видимое?
2. Или с **Этапа C** (off-plan buyer journey — главный revenue)?
3. Или с **Этапа E** (Knowledge link — long-term moat)?

Если согласны с порядком A → B → C → D → E — стартую с A.
