# myUNO · Investment Property Platform (IPP)
## Единый канонический документ v2.1 — Architecture + Customer Journeys + Consolidation Protocol

> **Назначение.** Один файл, покрывающий весь real estate слой myUNO: что это (architecture), как этим пользуются 7 разных персон (customer journey maps) и как это консолидировать в связный опыт (consolidation protocol M10). Документ самодостаточен для AI-инженера (Lovable / Cursor / Claude Code).
>
> **Ключевой сдвиг v2.1.** Версия 2.0 предполагала, что real estate нужно строить с нуля (протокол M9 «FIND BEFORE BUILD»). Версия 2.1 исходит из факта: **функциональность в основном уже существует**. Главная задача — не создавать новые модули, а **консолидировать существующие, подключить их к journey каждой персоны и сделать опыт интуитивно понятным**. Протокол M9 (build) заменён на протокол M10 (consolidate).
>
> **Философия v2.1.** Вместо «FIND BEFORE BUILD» — «**CONNECT BEFORE CREATE**». Если компонент существует, но не подключён к journey нужной персоны — это баг консолидации, не пропуск фичи. 90% работы — соединить то, что уже есть, через UX, навигацию и персонализацию. 10% — точечные доработки.
>
> **Статус.** Эталонный. Все решения по `invest.myuno.app`, каталогу объектов, Knowledge Hub и расширению существующих порталов принимаются на основе этого документа.
>
> **Changelog v2.1:** протокол M9 заменён на M10; добавлен PART II с customer journey maps для 7 персон (P5, P6, P8, P9, P10, P11, P22); принцип «consolidate-first» заменяет «build-first»; сохранены корректные ставки комиссий (condo 5–10%, villa 3–8%, resale 3–5%).
>
> **Внешние зависимости:**
> - `myuno_segmentation_framework.md` — 25 персон, 3 оси (lifecycle × role × modifier)
> - `07-information-architecture.md` — субдомены, URL conventions, cross-domain flows
> - `09-data-schema.md` — эталонная схема данных
> - `08-ai-prompts-library.md` — AI-агенты и промпты
> - `06-clearview-methodology.md` — ClearView rating methodology
> - `myuno_tone_of_voice.md` — голос бренда
> - `PROJECT_v2.2.md` — transaction-first принцип, lead scoring
>
> **Константы проекта — не нарушаются никогда:**
> - Один Supabase public schema
> - Один `user_id` через все субдомены (SSO)
> - TypeScript strict, mobile-first 375px, bilingual RU/EN
> - Append-only для финансовых и audit-данных
> - Transaction-first: каждая фича оценивается вопросом «Это приближает закрытую сделку?»

---

# PART I · ARCHITECTURE & BUSINESS LOGIC

## 0 · Почему IPP существует

На рынке инвестиционной недвижимости Пхукета у иностранного покупателя структурно нет информационного паритета с продавцом. Агент знает всё о проекте; инвестор — только то, что ему показали в брошюре. Due diligence требует 10–15 точечных юристов, аналитиков, агентов, налоговых консультантов и специалистов по title deeds. Никто из них не говорит одним языком.

Это не проблема образования инвестора. Это проблема архитектуры рынка.

myUNO решает её через **транзакционную инфраструктуру**: платформу, в которой информация, инструменты, верификация и сделка существуют в одном месте, на языке инвестора. Investment Property Platform (IPP) — операционный центр этой инфраструктуры.

---

## 1 · Позиционирование

IPP — **транзакционная инвестиционная платформа** внутри myUNO, охватывающая полный цикл от первого интереса к объекту до закрытия сделки и управления активом. Две вертикали — off-plan и resale — под единым интерфейсом, единой методологией DD, единой системой сопровождения.

**IPP не является:**
- Маркетплейсом без верификации
- Образовательным курсом
- Финансовым советником
- Медиапроектом в духе Bangkok Post
- Платформой краудинвестинга (это Liquidity Layer L3–L4)

**Место в архитектуре myUNO.** IPP — операционное лицо Real Estate Core. Шесть продуктов REC (PropertySearch, DueDiligence AI, Transaction Suite, PM Platform, Owner Portal, Liquidity Layer) реализованы технически. IPP соединяет их в единый investor journey. Домены: `invest.myuno.app` (основной), `myuno.app/guides` (knowledge), `clearview.myuno.app` (public ratings).

---

## 2 · Пять модулей IPP

```
МОДУЛЬ A · Каталог объектов         /buy/off-plan · /buy/resale
МОДУЛЬ B · Knowledge Hub            /guides/[category]/[slug]
МОДУЛЬ C · Инструменты инвестора    invest.myuno.app/tools
МОДУЛЬ D · Investor Dashboard       invest.myuno.app/portfolio
МОДУЛЬ E · Путь сделки              invest.myuno.app/deals
```

**Модуль A · Каталог.** Две вертикали: off-plan (прямые отношения с застройщиками, ClearView Badge) и resale (верифицированная история через PM Platform). Обязательные поля карточки: застройщик, локация + FloodScore, статус строительства, дата сдачи, ценовой диапазон (THB/USD), foreign quota, право собственности, ClearView Badge, rental program, контакт — Павел/консьерж (не агент третьей стороны). Объекты под управлением myUNO PM получают **Privileged Data Badge** — 12-месячная верифицированная история yield/occupancy.

**Модуль B · Knowledge Hub.** Восемь тематических блоков (правовая основа, титулы и Chanote, due diligence, процесс сделки, налоги, доходность, управление, exit). Каждый блок — pillar + 5–12 кластерных статей. Назначение — предпродажный образовательный слой, не блог. Каждая статья заканчивается **одним конкретным CTA** на релевантный объект или инструмент.

**Модуль C · Инструменты.** Бесплатно: ROI Calculator, Purchase Costs Calculator, FET Guide, Mortgage Estimator, Jurisdiction Compare. Premium (Investor Pro ฿990/мес): District Heatmap, Stress Test ROI, Portfolio Tracker. Принцип честности: используются реальные benchmark из PM Platform, не прогнозы застройщиков.

**Модуль D · Investor Dashboard.** Личный кабинет на `invest.myuno.app/portfolio`. Портфель объектов с AVM, PM-объекты с yield/occupancy, активные сделки, ClearView alerts, документы (SPA, Title Deed, FET), FX tracking. Не financial advisory — операционный инструмент управления информацией о конкретных активах.

**Модуль E · Путь сделки.** Семь этапов: DISCOVERY → ANALYSIS → OFFER → RESERVATION → TRANSACTION → OWNERSHIP → EXIT. На каждом этапе: один CTA, статус прогресса, следующий шаг. Каждое событие логируется в CRM как lead event.

---

## 3 · IPP как мини-ERP агентства

IPP существует в двух режимах. Для инвестора — аналитический стол и путь к сделке. Для агентства — **операционный центр: инвентарь, пайплайн, комиссии, отношения с застройщиками, прогноз выручки**. Разделение «инвесторский фронтенд» и «агентский бэкенд» — ложное: одна запись о сделке обновляется с обеих сторон.

**Lead events → CRM (фрагмент):**

| Событие | Балл |
|---|---|
| Просмотр карточки 3+ раз | +15 |
| ClearView Summary | +20 |
| ClearView Full Report (฿4,900) | +50 |
| ROI Calculator | +25 |
| Watchlist add | +30 |
| Comparison | +20 |
| Reservation | +100 |
| SPA signed | +200 |
| Deal closed | commission trigger |

**Pipeline CRM:** `NEW_LEAD → QUALIFIED → PROPERTY_MATCHED → ANALYSIS → OFFER_SENT → NEGOTIATION → RESERVATION → SPA → TRANSFER → CLOSED`.

**Агентские модули (admin.myuno.app):**
- **Developer Relations Manager** — карточка застройщика, агентское соглашение, ClearView track record
- **Project Inventory Manager** — все юниты проекта с ценой/статусом, sync с Developer Portal
- **Commission Ledger** — append-only, ожидаемая vs полученная комиссия, прогноз на квартал
- **Price Stage Journal** — история изменений цен по каждому off-plan проекту

**PMS → IPP data feed (ежемесячно):** Gross Rental Income, Occupancy Rate, ADR, Net Yield, Vacancy calendar. Эти данные питают: карточки (Privileged Data Badge), ROI Calculator (реальные benchmark), District Heatmap.

---

## 4 · Модуль инвестиционного анализа (differentiator)

Ядро конкурентного преимущества. Ни один портал Пхукета (DDProperty, FazWaz, Dot Property) не даёт инструменты этого уровня.

**A · Advanced Filters.** Восемь групп фильтров: право собственности, финансовые, объект, застройщик, строительство, доходность, риски, портфель myUNO. Двенадцать параметров сортировки включая Net Yield, ClearView Score, Entry Uplift, Capital Appreciation Potential, Скидка к AVM.

**B · Сегменты объектов.** Economy (до ฿3.5M) · Standard (฿3.5–8M) · Premium (฿8–18M) · Luxury (฿18–50M) · Ultra-luxury (>฿50M). Каждый класс — своя страница (`/buy/off-plan/luxury`), свои benchmark, своя целевая персона (P8 → Economy/Standard; P9 → Luxury+; P11 → Premium/Luxury).

**C · Price Stage Tracker.** Страница `/buy/[id]/price-stages` — timeline с привязкой к строительным вехам: Pre-launch (−10–15%) → Launch → Foundation (+5–8%) → Frame (+5–10%) → Finishing (+5–8%) → Completion (+10–15%). Entry Uplift Potential = (Forecast Completion Price − Current) / Current × 100%.

**D · Project Comparison Engine.** 2–5 объектов, 32 параметра в сравнительной таблице (идентификация, финансовые, инвестиционные, характеристики объекта, юридические, операционные из PM data). URL shareable в WhatsApp: `invest.myuno.app/compare?ids=...`. Лучшие значения — зелёные, риск-индикаторы — красные. Математика, не субъективная оценка.

**E · Investment Thesis Builder.** PDF-меморандум 1–2 страницы для HNW-клиентов: Investment Case (3 аргумента), Risk Factors (3 риска), Financial Model (STR базовый + LTR консервативный), Exit Strategy (L1–L5), Disclaimer.

**F · Market Intelligence Dashboard.** Публичный SEO-актив `invest.myuno.app/market`: Phuket Price Index, ClearView Market Distribution, New Launches Calendar, Transaction Activity, Rental Market Benchmark.

**G · Deal Room.** Закрытый `invest.myuno.app/mandate` для P9 клиентов Ignatev Capital с мандатом. First Look объекты, клубные сделки, структурированные предложения. White-glove для 20–50 клиентов с портфелем $500K+.

---

## 5 · Монетизация: пять потоков

**Stream 1 — Транзакционная комиссия (70%+ выручки IPP):**

| Тип | Диапазон | Типичная | Источник |
|---|---|---|---|
| Off-plan condo | 5–10% | 7% | Застройщик |
| Off-plan villa | 3–8% | 5% | Застройщик |
| Resale condo | 3–5% | 4% | Продавец (или split) |
| Resale villa | 3–5% | 4% | Продавец (или split) |

Year 1 проекция при 10–15 сделках: ฿6.5–9.75M (~$185–280K) выручки от комиссий.

**Stream 2 — ClearView Reports.** Developer Assessment ฿350–600K · Premium Investor Report ฿2,900 · Full Investor Report ฿4,900 · Quarterly Monitoring ฿15,000.

**Stream 3 — Developer Listing Fee.** ฿120–180K/год за проект (валидируется).

**Stream 4 — Premium Tools.** Investor Pro ฿990/мес или ฿8,900/год.

**Stream 5 — Data API.** ฿5–15K/мес за организацию (банки, оценщики, страховщики).

**Чего нет в монетизации:** рекламы, affiliate-программ, «плати за лида», подписки как барьера входа для инвестора. Barrier to entry = 0. Доверие монетизируется через сделку.

---

## 6 · URL-структура

```
invest.myuno.app/
├── /                          Dashboard (auth) / Лендинг (guest)
├── /for/[persona]             Persona landing (новое — см. M10b)
├── /projects                  Каталог: все объекты
│   ├── /off-plan/[district]
│   ├── /off-plan/[class]
│   ├── /resale/[district]
│   └── /[id]
│       ├── /clearview
│       ├── /dd
│       ├── /price-stages
│       └── /reserve
├── /compare?ids=...           Comparison Engine
├── /market                    Market Intelligence (public)
├── /tools                     Калькуляторы
├── /portfolio                 Investor Dashboard (auth)
├── /deals/[deal-id]           Путь сделки (auth)
├── /reports                   ClearView + market briefs
└── /mandate                   Deal Room (invite-only)
```

Knowledge Hub: `myuno.app/guides/[category]/[slug]`.

---

## 7 · Технические требования

**Схема данных** (расширения к существующей из `09-data-schema.md`):

Существующие таблицы — добавить поля:
- `properties`: `listing_type`, `property_class`, `managed_by_myuno`, `privileged_data_badge`, `clearview_assessment_id`, `current_price_stage`, `foreign_quota_remaining_pct`
- `lead_scores`: `re_engaged_at`
- `transactions`: `show_anonymized`
- `users`: `persona_code` (P1–P25), `lifecycle_stage`, `economic_role` — для journey routing

Новые таблицы (append-only где указано):
- `price_stage_history` (append-only) · `comparison_sessions` · `pm_yield_data` · `commission_ledger` (append-only) · `investment_thesis`

Все новые таблицы с `ENABLE ROW LEVEL SECURITY` и соответствующими RLS-политиками.

**Performance:** LCP < 2.5s, INP < 200ms, CLS < 0.1 на `/buy/off-plan/*` и `/guides/*`. SSR/ISR для публичных страниц. schema.org: Article / Product / Offer / BreadcrumbList.

**Multilingual:** i18n (next-intl), URL на английском, контент по Accept-Language или myUNO ID настройке. Knowledge Hub: `content_ru` и `content_en` в таблице `knowledge_articles`.

**Mobile-first:** минимум 375px. Инвесторы из России, Монголии, СНГ работают преимущественно с мобильных.

---

## 8 · Метрики

**Transaction-critical (главные):** сделок/месяц (off-plan + resale отдельно), средний чек, конверсия Reservation→Closed, время first-touch→closed (median).

**Engagement (ведут к сделке):** ClearView Report purchases/мес, ROI Calculator sessions, Watchlist adds, Knowledge Hub → `/buy/[id]` conversion.

**Anti-metrics (избегаем как KPI):** organic traffic без конверсии, количество статей, размер базы без активных сделок.

---

# PART II · CUSTOMER JOURNEY MAPS

## 9 · Семь персон, которых касается недвижимость

Из 25 персон myUNO недвижимость является **первичной или ключевой вторичной** вертикалью для семи. Каждой персоне соответствует собственная точка входа, собственный journey, собственная monetization path.

| Код | Персона | Фаза | Роль | Чек | Приоритет IPP |
|---|---|---|---|---|---|
| **P5** | ❄️ Snowbird | snowbird | consumer → investor-passive | $150–300K | Средний — естественный путь к покупке |
| **P6** | 🏡 Русскоязычный экспат | settler | resident-user → investor-passive | $100–250K | Средний — покупает после адаптации |
| **P8** | 📊 Пассивный инвестор | absentee | investor-passive | $150–500K | **Критический — основной объём** |
| **P9** | 🏦 HNW-инвестор | resident/absentee | investor-active | $500K–5M+ | **Критический — максимальный чек** |
| **P10** | 🏨 STR/PM оператор | resident | operator | — (ops fees) | Средний — retention, not sales |
| **P11** | 🇲🇳 Монгольский инвестор | scout/investor-active | investor-active | $200–800K | Высокий — недооценённый сегмент |
| **P22** | 🏗️ Застройщик | resident | provider | B2B | Критический — inventory supply |

**Принцип journey mapping.** Каждая персона видит **не весь IPP**, а **свою дверь в IPP**. Один инструмент (например, ROI Calculator) присутствует в journey нескольких персон, но с разными default values, tooltips и следующим шагом.

**Структура каждой карты.** Для каждой персоны: (1) snapshot и драйверы решения, (2) точки входа — откуда приходит, (3) journey stages — 6–7 шагов от первого контакта до сделки/активации, (4) ключевые friction points, (5) success metric.

---

## 10 · P5 · Snowbird → Owner Journey

**Snapshot.** Возраст 50+, EU/RU/DE. Проводит на Пхукете 1–6 месяцев/год второй сезон подряд. Виза METV или DTV. Couple или retiree. Изначально пришёл через `stay.myuno.app` (аренда сезонная). Решение о покупке вызревает за 2–3 сезона.

**Драйверы решения:**
- Устал платить $3–6K/мес за аренду виллы в сезон
- Привык к конкретному району (Раваи / Най Харн / Банг Тао)
- Ищет объект «для себя» + STR в несезон
- Чек: $150–300K, чаще freehold condo или leasehold villa

**Точки входа:**
1. `stay.myuno.app` → баннер «Love this place? Own it.» после 2-го бронирования
2. Email после 60+ дней проживания: «Рассчитать стоимость владения vs аренды»
3. WhatsApp от персонального консьержа Stay: «У вас второй сезон — посмотрим объекты в Раваи?»

**Journey stages:**

```
1. DISCOVERY
   stay.myuno.app/trips/[booking-id]
   → CTA «Own vs Rent calculator» (новый — простой ROI с его данными)
   → /tools/rent-vs-own?nights=90&rate=USD150
   Существующий компонент: ROI Calculator (Модуль C)
   Consolidation task: добавить режим «rent vs own» в существующий калькулятор

2. EDUCATION
   myuno.app/guides/buying/buying-property-thailand
   → Прочитал pillar + 2 кластерных статьи (leasehold vs freehold, foreign quota)
   Существующий компонент: Knowledge Hub (Модуль B)
   Consolidation task: контекстный CTA «Я уже арендую здесь — показать варианты» для авторизованного snowbird

3. LOCAL EXPLORATION
   invest.myuno.app/projects/off-plan/rawai (или ravai resale)
   → Фильтр автоматически установлен на «мой район из Stay»
   Существующий компонент: каталог off-plan/resale (Модуль A)
   Consolidation task: pre-filter каталога по last_stay_district из Stay данных

4. SHORTLIST
   Watchlist: 3–5 объектов
   Trigger: 30-day re-engagement (M10c) — если тишина, WhatsApp с updates по watchlist
   Существующий компонент: Watchlist + Alerts
   Consolidation task: persona-aware re-engagement copy (не «инвестиция», а «ваш будущий дом»)

5. COMPARISON
   invest.myuno.app/compare?ids=...
   → Сравнение 2–3 объектов, акцент: «расходы владения vs аренда»
   Существующий компонент: Comparison Engine (§4D)
   Consolidation task: persona-aware default parameters (показать total cost of ownership по сезонам)

6. HUMAN CONTACT
   WhatsApp от Павла (trigger: lead score > 80 или возврат на объект 3+ раз)
   → Личное сообщение на языке пользователя, предложение видеозвонка на объекте
   Существующий компонент: AI-консьерж → escalation (M9e / 08-ai-prompts-library.md)
   Consolidation task: P5-specific template: не «инвестиция», а «дом на вашу зиму»

7. TRANSACTION
   invest.myuno.app/deals/[deal-id]
   → Полный flow: reservation → SPA → FET → transfer
   Существующий компонент: Путь сделки (Модуль E)
   Consolidation task: inline объяснение каждого шага (snowbird не знает юридических терминов)
```

**Key friction points to remove:**
- **Friction 1:** Snowbird не знает, что он может стать владельцем (считает «только для богатых»). → Решение: «Own vs Rent calculator» как первый CTA в Stay.
- **Friction 2:** Страх юридической сложности. → Решение: Knowledge Hub pillar на его языке + Павел в WhatsApp.
- **Friction 3:** Нет личного контакта → не доверяет. → Решение: escalation по lead score + история его Stay-бронирований у консьержа.

**Success metric:** конверсия Snowbird (2+ сезона) → Owner = 3–5%/сезон. Средний чек $180K → комиссия 7% = $12.6K/сделка.

---

## 11 · P6 · Русскоязычный экспат → Local Investor Journey

**Snapshot.** Возраст 30–45, переехал с семьёй на Пхукет 6–24 месяца назад. Виза DTV / Non-B / Retirement. Школа для детей (UWC, BIS, HeadStart). Арендует виллу $2–5K/мес. Зарабатывает дистанционно (IT/консалтинг/бизнес в РФ). Период адаптации пройден, теперь думает «не пора ли купить».

**Драйверы решения:**
- Стабильность для детей (школа на 3–5 лет — значит жить здесь долго)
- Устал платить аренду, которая растёт
- Друзья купили → FOMO + social proof
- Чек: $100–250K, чаще condo freehold или small villa leasehold

**Точки входа:**
1. `app.myuno.app` (личный кабинет resident-user) → widget «Your rent vs buying»
2. Telegram-сообщество русских экспатов Пхукета (referral)
3. Статья в Knowledge Hub: «Когда экспату покупать недвижимость в Таиланде»

**Journey stages:**

```
1. DISCOVERY
   app.myuno.app (resident dashboard)
   → Widget «You've been renting 18 months. Calculate own vs rent.»
   Существующий компонент: личный кабинет
   Consolidation task: добавить real-estate widget в resident dashboard (M10c)

2. PEER VALIDATION
   Knowledge Hub: /guides/returns/rent-vs-buy-expat
   → Статья с конкретными кейсами (обезличенные данные из транзакций myUNO)
   Существующий компонент: Knowledge Hub
   Consolidation task: создать pillar-страницу rent-vs-buy специально для settlers

3. DEEP DIVE INTO JURISDICTION
   /guides/ownership/freehold-vs-leasehold
   /guides/taxes/rental-income-tax (как резидент думает о налогах)
   Существующий компонент: Knowledge Hub Блоки 1, 5
   Consolidation task: создать «Settler track» — reading sequence для этой персоны

4. BROWSE & SAVE
   /projects/off-plan/[district] (обычно район, где он уже живёт)
   Watchlist 5–10 объектов, смотрит по вечерам
   Существующий компонент: каталог
   Consolidation task: «Your district» shortcut — фильтр по текущему району из Stay/profile

5. ROI MODELING
   /tools/roi — но режим «live here + rent out when travel»
   → Гибридный сценарий: живу 8 мес, сдаю STR 4 мес
   Существующий компонент: ROI Calculator
   Consolidation task: preset «Live-in + partial STR» для P6

6. LOCAL MEETUP
   Trigger: lead score > 60 + 2+ объекта в watchlist
   → Приглашение на встречу с Павлом лично (уже на Пхукете)
   Существующий компонент: calendar invite через event_create_v1 или CRM
   Consolidation task: persona-aware trigger для офлайн-встречи (у P6 она возможна, у P8 — нет)

7. TRANSACTION
   /deals/[deal-id]
   → Плюс: POA не нужен (P6 может сам приехать в Land Office)
   Существующий компонент: Путь сделки
   Consolidation task: skip POA шаг для P6 (он резидент), показать только релевантные шаги
```

**Key friction points:**
- **Friction 1:** «Я пока не резидент налоговый» — страх 183 дней и автоматического резидентства. → Решение: статья про TIDES и DTT, калькулятор налоговых последствий.
- **Friction 2:** Не знает, что можно купить на себя как иностранца без company. → Решение: Condominium Act pillar первым в Settler track.
- **Friction 3:** Русскоязычные «агенты из чатиков» с плохой репутацией. → Решение: ClearView + omnipresent «контакт только с Павлом».

**Success metric:** конверсия Settler (6+ мес в app.myuno.app) → Owner = 8–12%/год. Средний чек $150K → комиссия 7% = $10.5K/сделка.

---

## 12 · P8 · Passive Investor Journey (critical mass)

**Snapshot.** Возраст 35–55, живёт в РФ/EU/CN, посещает Пхукет 0–2 раза в год. Зарабатывает $80–250K/год в home country. Ищет «рабочие деньги» — объект, который приносит $800–2000/мес пассивно. Не планирует переезд. Первый раз покупает зарубежную недвижимость — боится всего.

**Драйверы решения:**
- Диверсификация (рубли/евро → доллары/tied to Asia growth)
- Currency hedging
- Доходность выше европейских депозитов (8–10% vs 3–4%)
- Потенциальная миграция детей в MBA / expat track
- Чек: $150–500K, чаще off-plan condo под rental program

**Точки входа:**
1. **SEO:** «купить квартиру в Таиланде для инвестиций» → Knowledge Hub pillar `/guides/buying-property-thailand`
2. **Referral:** сарафан от существующих клиентов myUNO или тг-каналов
3. **Paid (limited):** Meta/YouTube ads на русскоязычный investment audience
4. **WhatsApp:** прямой запрос Павлу после внешней рекомендации

**Journey stages:**

```
1. DISCOVERY (SEO entry)
   myuno.app/guides/buying-property-thailand
   → Прочитал pillar, понял базу
   Существующий компонент: Knowledge Hub
   Consolidation task: в конце pillar — CTA «Посмотреть объекты с доходностью 7%+»

2. TRUST BUILDING
   clearview.myuno.app — публичное распределение рейтингов по рынку
   → Понял, что есть институциональная методология
   Существующий компонент: ClearView (M8)
   Consolidation task: из Knowledge Hub — inline ссылки на ClearView объяснение

3. CATALOGUE BROWSE
   invest.myuno.app/for/investor (новый persona landing — M10b)
   → Сразу видит: доходность, ClearView, entry uplift, Privileged Data Badge
   Существующий компонент: каталог
   Consolidation task: create /for/investor landing с transaction-first framing

4. TOOLS: ROI + Compare
   /tools/roi с default investor preset (100% STR-rental, no live-in)
   /compare 3 объекта по доходности и ClearView
   Существующий компонент: ROI Calculator + Comparison Engine
   Consolidation task: preset «Pure Investor» vs «Live-in + Rent» в ROI tool

5. PROOF & DEEP VERIFICATION
   Покупает ClearView Full Report (฿4,900) на top объект из compare
   Запускает DueDiligence AI
   Существующий компонент: ClearView + DueDiligence AI
   Consolidation task: в Comparison Engine — CTA «Get Full ClearView for winner»

6. WHATSAPP CONTACT (pivotal)
   Trigger: ClearView Full Report purchased OR lead score > 100
   → Павел пишет персонально с ответами на DD-findings и предложением видеозвонка
   Существующий компонент: CRM escalation
   Consolidation task: P8 template — «investor-grade tone», не warm и не холодный, деловой

7. RESERVATION REMOTE
   /deals/[deal-id]/reservation
   → POA оформляется дистанционно (критично для P8 absentee)
   → FET процесс с пошаговым объяснением
   Существующий компонент: Transaction Suite
   Consolidation task: «Remote buyer track» — весь flow без обязательного visit, видеозвонки на каждом этапе

8. OWNERSHIP HANDOFF
   /portfolio + автоматический перевод в PM Platform для STR
   Существующий компонент: Owner Dashboard + PM Platform
   Consolidation task: seamless переход /deals/[id]/closed → /portfolio/[property-id]
```

**Key friction points:**
- **Friction 1:** Страх «не приеду — меня обманут». → Решение: ClearView методология + escrow объяснение + видео-туры + Privileged Data Badge + Павел как single point of contact (а не цепочка агентов).
- **Friction 2:** Не понимает тайские налоги и FET. → Решение: Knowledge Hub Блок 5 + inline объяснения в Путь сделки + WhatsApp Q&A.
- **Friction 3:** Сомневается в доходности (застройщики всегда врут). → Решение: Privileged Data Badge с 12M треком от PM Platform = «это не прогноз, это факт».

**Success metric:** конверсия качественного P8 лида (ClearView Full Report purchased) → сделка = 15–25% за 60 дней. Средний чек $220K → комиссия 7% = $15.4K/сделка. **P8 = основной драйвер выручки IPP.**

---

## 13 · P9 · HNW Investor Journey

**Snapshot.** Возраст 40–65, net worth $3M+, уже владеет 2–5 объектами в разных юрисдикциях. Ищет портфельный подход, diversification, trophy asset, иногда buyback-структуру. Не ищет в Google — ищет через private network. Цена входа как признак серьёзности — не как preference.

**Драйверы решения:**
- Portfolio allocation в Asian real estate
- Legacy / наследование детям (LTR Visa plan)
- Trophy villa или branded residence
- Access к deals, которых нет на открытом рынке
- Чек: $500K–5M+, villa Luxury/Ultra-luxury или branded condo penthouse

**Точки входа:**
1. **Личная рекомендация** (Павел напрямую, Ignatev Capital mandate)
2. **LinkedIn outbound** (Павел пишет лично)
3. **Реферал от клиента уровня P9**

**Journey stages:**

```
1. DISCOVERY via Network
   Private WhatsApp / LinkedIn DM от Павла или existing client
   → Приглашение на обзорный звонок
   Существующий компонент: нет public entry — это по замыслу
   Consolidation task: CRM tag «HNW_pending_intro» со специальным workflow

2. INITIAL CALL
   30–45 минут с Павлом: понимание mandate (buyback? trophy? yield? legacy?)
   → В конце: приглашение в Deal Room
   Существующий компонент: CRM + calendar
   Consolidation task: mandate intake template в CRM с 7 ключевыми вопросами

3. DEAL ROOM ACCESS
   invest.myuno.app/mandate (invite-only)
   → Видит 3–7 First Look объектов + структурированные предложения
   Существующий компонент: Deal Room (§4G)
   Consolidation task: personalize Deal Room по типу mandate (buyback vs trophy vs yield)

4. DEEP ANALYSIS
   Investment Thesis Builder на 2–3 top объекта
   → PDF на 1–2 страницы, чтобы показать family office / finance advisor
   Существующий компонент: Investment Thesis Builder (§4E)
   Consolidation task: persona-aware thesis template для HNW (emphasis on capital preservation, not yield)

5. SITE VISIT (critical)
   Личный визит Павла с кандидатом на виллу / пентхаус
   → Если живёт далеко — видео-тур + возможен Zoom call с архитектором застройщика
   Существующий компонент: CRM event scheduling
   Consolidation task: pre-visit brief PDF с fin-data, post-visit follow-up template

6. STRUCTURING
   Negotiation: payment schedule, buyback clauses, yield guarantee, developer bonuses
   → Павел vs застройщик, клиент получает готовое предложение
   Существующий компонент: CRM negotiation tracking
   Consolidation task: deal_terms JSONB поле в deals для кастомных структур

7. TRANSACTION (assisted end-to-end)
   /deals/[deal-id] — но 80% работы делает Павел, клиент только подписывает
   → FET, POA, escrow, Land Office — через партнёрских юристов
   Существующий компонент: Transaction Suite
   Consolidation task: HNW track = polished version с white-glove messaging

8. PORTFOLIO ONBOARDING
   invest.myuno.app/portfolio → добавление в Ignatev Capital mandate
   → Quarterly review call (включает все объекты клиента, не только новый)
   Существующий компонент: Owner Dashboard
   Consolidation task: HNW dashboard с aggregated view + mandate notes
```

**Key friction points:**
- **Friction 1:** Не доверяет публичным платформам — предпочитает личный контакт. → Решение: Deal Room не показывается публично, access только через личное приглашение; массовое `invest.myuno.app` для него — «public face», не main experience.
- **Friction 2:** Сложность налоговых структур на $2M+ (тайская company? BVI? leasehold 90 лет?). → Решение: партнёрский налоговый юрист в составе mandate, счета оплачиваются myUNO из комиссии.
- **Friction 3:** Нет «быстрых сделок», решение — месяцы. → Решение: CRM long-cycle nurturing (квартальные emails с market intelligence), не push для быстрого закрытия.

**Success metric:** 2–4 HNW сделки/год. Средний чек $1.2M → комиссия 5% = $60K/сделка. **P9 — до 30% годовой выручки IPP при малом количестве сделок.**

---

## 14 · P10 · Operator Journey (retention-focused)

**Snapshot.** Владеет 1–5 объектами на Пхукете (часто купленными через myUNO). Управляет через STR/LTR, хочет оптимизации доходности. Не новый покупатель сегодня — но через 2–3 года покупает **второй или третий** объект. Главная метрика — retention, не новая conversion.

**Драйверы решения для расширения:** доволен доходностью первого объекта → покупает второй; diversification по типу/району; видит good deal в ClearView alerts по watchlist; upsize.

**Точки входа (не «входа» — «возврата»):**
1. Ежемесячный yield report (email) — видит performance, thinks «maybe another one»
2. Quarterly Market Intelligence brief от Павла
3. ClearView alert по watchlist
4. **Distressed deal match** (см. §17) — объект по его criteria появляется со скидкой

**Journey stages (loop, не линейный):**

```
1. MONTHLY OPERATIONS
   owner.myuno.app/dashboard
   → Yield, occupancy, issues
   Существующий компонент: Owner Dashboard + PM Platform
   Consolidation task: в monthly report — «Market insight: similar objects yielding X%»

2. EXPANSION TRIGGER
   Widget «Ready for the next one?» в dashboard
   Trigger: good performance 12+ мес + FX favourable
   Consolidation task: expansion trigger logic + UI widget (M10f)

3. SECOND-OBJECT BROWSE
   /projects?filter=diversification (исключает категорию первого объекта)
   Consolidation task: «Not like my current» filter по портфельному контексту

4. PM-VERIFIED COMPARISON
   /compare с акцентом на реальные yield из PM Platform
   Consolidation task: P10-column «Your current property» для сравнения

5. FAST-TRACK PURCHASE
   /deals/[deal-id] — «Returning buyer» track: 50% шагов pre-filled из прошлой сделки
   Consolidation task: reuse POA template, FET data, banking details

6. PORTFOLIO SCALE
   /portfolio aggregate view → auto-prompt Investor Pro upgrade при 2-м объекте
```

**Key friction points:** «ещё один зачем?» → market opportunity signals; PM issues → negative expansion → fast SLA resolution.

**Success metric:** retention P10 >90%; second-buyer в год 2+ = 15–20%. Средний чек $180K → комиссия 7% = $12.6K.

---

## 15 · P11 · Mongolian Investor Journey (undervalued)

**Snapshot.** Возраст 35–55, UB-based, предприниматель/профессионал. MNT volatility → diversification в ЮВА. Multigenerational decision-making (family council). Often RU-speaking.

**Драйверы:** защита капитала от MNT volatility, международный базис для детей, trust network (referrals критичны), чек $200–800K — Premium condo или entry Luxury villa.

**Точки входа:**
1. Community referral от существующих монгольских клиентов
2. UB-based delegation scout visit (5–7 дней)
3. Russian-language channel (часто preferable)

**Journey stages:**

```
1. SCOUT VISIT
   Contact Павла через mutual connection
   Consolidation task: P11 intake — family structure, decision-makers

2. FAMILY COUNCIL MATERIAL
   Bundle: 3 объекта × Full ClearView Report + comparison + thesis, EN+RU
   Consolidation task: P11 bundle auto-generator

3. REMOTE DECISION (2–4 недели, multi-stakeholder)
   Multiple family members задают вопросы через AI-консьерж или WhatsApp
   Consolidation task: multi-stakeholder deal tracking в CRM

4. RETURN VISIT + site viewings
   Павел сопровождает 2–3 финалиста
   Consolidation task: pre-visit briefing PDF

5. RESERVATION (in-person preferred)
   Family представитель подписывает, остальное через POA
   Consolidation task: Mongolian banking partnership (XacBank, Khan Bank)

6. FUNDS TRANSFER (MNT → USD → THB, 2–4 недели)
   Consolidation task: P11-specific FET guide со шагами Mongolian banking

7. TRANSACTION + FAMILY ONBOARDING
   Multi-user ownership в Owner Dashboard (family share access)
   Consolidation task: multi-user permissions на уровне properties
```

**Key friction points:** family council slow (2–6 недель) → quarterly nurturing; MNT→THB транзакции сложные → pre-negotiated FX; language barrier → legal docs в EN+RU+MN.

**Success metric:** 3–5 P11 сделок/год. Средний чек $350K → комиссия 6% = $21K. **High-cheque, low-competition сегмент с strong referral loop.**

---

## 16 · P22 · Developer Journey (B2B supply-side)

**Snapshot.** Девелоперская компания (Thai, CN, RU), 1–10 активных проектов. Нужен sales channel для off-plan inventory. myUNO — один из агентов, но с differentiated tooling (ClearView, investor analytics, qualified база).

**Драйверы:** cash flow (sell off-plan faster), ClearView как маркетинговый актив (AA/AAA badge = selling point), доступ к качественной investor базе, visibility & analytics.

**Точки входа:**
1. Outbound от Павла после ClearView market research
2. Заявка через `developers.myuno.app/contact`
3. Industry referral

**Journey stages:**

```
1. INITIAL INTRO
   Intro call, понимание проектов и sales challenges
   Consolidation task: intake form с 7 questions (projects, pricing stages, competing agents, target buyer)

2. CLEARVIEW ASSESSMENT (paid, ฿350–600K)
   Rating AA/AAA/A + full report с strong points / improvement areas
   Existing: ClearView (M8)
   Consolidation task: developer-side dashboard процесса assessment

3. AGENCY AGREEMENT
   Exclusive/co-exclusive, commission rate согласован (5–10%)
   Consolidation task: digital agreement signing + commission tracker

4. INVENTORY UPLOAD
   developers.myuno.app/inventory — units, pricing, floor plans, bulk CSV
   Existing: Developer Portal inventory
   Consolidation task: bi-directional sync с /invest каталогом, bulk upload

5. LISTING LIVE + MARKETING
   Listing в каталоге → SEO + Market Intelligence feature
   Consolidation task: automatic featured placement для paying listing fee subscribers

6. ANALYTICS & DEMAND SIGNALS
   developers.myuno.app/analytics — просмотры, watchlist adds, comparisons, inquiries
   Consolidation task: demand dashboard с anonymized investor signals

7. DEAL FLOW
   Reservations, SPA, payments через /deals на стороне инвестора
   Developer видит: units sold/reserved, payment milestones, expected commission
   Consolidation task: unified deal status для обеих сторон (developer + investor)

8. QUARTERLY REVIEW
   Павел + developer review: inventory burndown, next stages, pricing adjustments
   Price Stage Journal updates
   Consolidation task: calendar automation для recurring reviews
```

**Key friction points:** developer уже работает с multiple агентами → differentiation через ClearView + analytics + quality investor база; resistance to price transparency → приватные inventory данные, публичные только когда готовы к listing.

**Success metric:** 3–5 активных developer partnerships. Каждое партнёрство = 10–20 units/год через myUNO. B2B revenue: ClearView assessments (฿350–600K × 5–8/год) + listing fees (฿120–180K × 5–10 проектов).

---

## 17 · Distressed / Quick Sale Vertical (structural arbitrage)

### 17.1 Почему это критически важный отдельный vertical

На Пхукете **нет единой точки, куда приходят distressed сделки**. Объекты с жизненно важной срочностью продажи (default по платежу застройщику, развод, переезд, банкротство, emergency медицинские) рассеяны по десяткам WhatsApp-чатов агентов, Facebook-групп, закрытых expat-каналов. Seller не знает, где найти serious buyer быстро. Buyer не знает, где найти real discount.

Это **структурный arbitrage gap**:
- **Для buyer'а:** -15% до -30% к AVM = мгновенная equity при покупке
- **Для seller'а:** возможность закрыть в 14–30 дней вместо 6 месяцев
- **Для myUNO:** высокая комиссия (seller готов платить за скорость), жёсткий defensible moat (deal flow строится со временем)

Этот vertical **включается сразу** — не требует новых технологий, только concentration existing deal flow + правильная discovery/matching/workflow архитектура.

### 17.2 Позиционирование

**Что это:** верифицированная витрина объектов на Пхукете, продающихся ниже рыночной стоимости по объективной причине срочности. **URL:** `invest.myuno.app/urgent` (investor-facing) + `myuno.app/sell/quick` (seller intake).

**Что это НЕ:**
- Не «scам» и не «fire sale» — тональность строго `myuno_tone_of_voice.md`: достоинство, не эксплуатация чужого несчастья
- Не доска объявлений — каждый объект **проверен** (цена реально ниже AVM, distress trigger задокументирован)
- Не «быстрые деньги» для buyer — путь сделки ускорен, но DD не сокращён

### 17.3 Типы distressed триггеров

| Триггер | Описание | Типичный discount к AVM |
|---|---|---|
| **Developer default** | Собственник off-plan не может внести следующий транш, застройщик готов аннулировать контракт | −20% до −40% |
| **Life event** | Развод, переезд, смерть в семье, emergency медицинское | −15% до −25% |
| **Relocation** | Собственник уезжает из Таиланда, не хочет managing удалённо | −10% до −20% |
| **Business distress** | Банкротство/ликвидность бизнеса собственника в home country | −15% до −30% |
| **Portfolio exit** | Operator выходит из рынка, продаёт несколько объектов пакетом | −15% до −25% (пакетная скидка) |
| **Tax / legal pressure** | Thai tax обязательства, структурные issues (foreign quota exhausted) | −10% до −20% |

**Threshold для публикации:** минимум **−15% к AVM** или **−10% к последнему market comparable в том же проекте/районе**. Ниже порога — обычный resale, не distressed.

### 17.4 Seller Journey (supply side)

**Snapshot seller'а.** Это не отдельная персона — это **situational state** любого существующего владельца (часто P8-absentee, P10-operator, P5-snowbird, иногда даже P22-developer с unsold inventory).

**Точки входа seller'а:**
1. `myuno.app/sell/quick` — public form, discoverable через SEO и header menu
2. Direct WhatsApp к Павлу (existing clients)
3. AI-консьерж intent «I need to sell quickly» / «продать срочно»
4. Trigger в Owner Dashboard: widget «Circumstances changed? Let's talk.» — для существующих clients

**Seller journey stages:**

```
1. INTAKE (form)
   /sell/quick — 6-field form:
   (1) Тип объекта + адрес
   (2) Trigger для срочности (из §17.3 list)
   (3) Желаемая цена + обоснование
   (4) Timeline (14 дней / 30 дней / 60 дней)
   (5) Документы готовы? (Chanote, если off-plan — SPA + payment history)
   (6) Contact + preferred language
   Consolidation task: create /sell/quick route + Supabase table distressed_listings

2. VALIDATION (24–48 часов, admin workflow)
   Павел проверяет:
   - AVM check: цена действительно < −15% к рынку? Если нет — redirect в обычный resale flow
   - Distress trigger реальный? (документы подтверждающие, если применимо)
   - Юридическая чистота (Chanote, no liens, SPA status если off-plan)
   Outcome: ACCEPTED / REJECTED / NEEDS_MORE_INFO
   Consolidation task: admin workflow в admin.myuno.app с AVM integration

3. PRICING AGREEMENT
   Commission rate: 5–7% (выше обычного resale 3–4%, т.к. скорость)
   Exclusive listing на 30–60 дней
   Consolidation task: digital agreement + signature

4. DISCRETE LISTING
   Объект публикуется в /urgent с:
   - «Urgent» badge
   - Discount % к AVM (прозрачно)
   - Countdown до deadline (если есть)
   - Reason category (без раскрытия деталей: «Life event», «Portfolio exit»)
   - Contact ONLY через Павла — никакой прямой связи buyer-seller
   Consolidation task: специальный PropertyCard variant для distressed

5. MATCHING
   Automatic matching: investors с criteria в watchlist совпадающих → instant WhatsApp alert
   Plus manual push: Павел знает HNW клиентов в Deal Room, которые ищут этот тип
   Consolidation task: matching engine (see §17.6)

6. FAST-TRACK TRANSACTION
   Сокращение сроков: reservation → closing за 14–30 дней (vs 60–90 обычно)
   Ускоренная DD, pre-approved юристы, параллельная работа streams
   Consolidation task: «Fast track» modifier на /deals flow

7. CLOSED
   Higher commission для myUNO, seller closes urgently, buyer gets discount
   Consolidation task: attribution в commission_ledger как distressed source
```

**Key friction points:**
- **Friction 1 seller:** «боюсь что разнесут по рынку что я в беде» → Решение: «Discrete Listing» — никаких персональных деталей публично, только reason category.
- **Friction 2:** «агенты обманут, продадут ниже реальной цены» → Решение: AVM-based pricing прозрачно показан, seller утверждает дисконт.
- **Friction 3:** «юридические issues с распроданной off-plan инвестицией» → Решение: partner legal team включён в fast-track, стоимость в commission.

### 17.5 Buyer Journey (demand side)

**Snapshot buyer'а.** Это **не отдельная персона** — это mode любого existing investor persona (P8, P9, P10, P11). Но с повышенной готовностью действовать быстро.

**Точки входа buyer'а:**
1. `invest.myuno.app/urgent` — публичный каталог distressed listings
2. **Private alert** — если buyer в watchlist/deal-room matches criteria нового distressed объекта, получает WhatsApp push
3. **AI-консьерж intent** «deals with discount» / «срочные продажи»
4. **Featured** на главной `invest.myuno.app` — «Today's opportunities» секция
5. **Header navigation** — отдельный пункт «Urgent» рядом с «Buy»

**Buyer journey stages:**

```
1. DISCOVERY
   /urgent — список всех active distressed objects
   Фильтры: район, тип, discount %, timeline deadline
   Consolidation task: /urgent catalogue с urgency-specific filters

2. ACCESS VERIFICATION (optional gating)
   Некоторые объекты — только для авторизованных и/или pre-qualified
   (например, proof of funds для Luxury tier)
   Consolidation task: access_tier enum для distressed_listings

3. FAST ANALYSIS
   Компактный view: price vs AVM, ClearView grade (если есть), reason category, deadline
   ClearView Full Report (฿4,900) + DueDiligence AI запускаются в сжатом формате
   Consolidation task: distressed-specific DD template — акцент на title clean, liens, payment status

4. INTEREST SIGNAL
   «Request more info» — не sale без verified intent
   Buyer подтверждает: готов действовать в timeline, proof of funds
   Consolidation task: interest_request table с buyer vetting

5. VERIFIED OFFER
   Если serious — Павел организует direct call, детализация условий
   Соглашение confidential (NDA если needed)
   Consolidation task: deal_terms JSONB для custom urgency structures

6. FAST-TRACK RESERVATION
   Depozit 5–10% в 48 часов (выше обычных 1–3%), чтобы lock-in
   Consolidation task: reservation flow с flexible deposit

7. CLOSING 14–30 DAYS
   Параллельная работа: юр DD + FET + Land Office подача
   Consolidation task: fast-track workflow template для /deals
```

**Key friction points buyer:**
- **Friction 1:** «это scam — слишком хороший discount» → Решение: AVM comparison прозрачно, ClearView (если есть), history of PM performance (если object under management), reason category verified.
- **Friction 2:** не готов действовать в 14–30 дней → Решение: access_tier — самые urgent deals показываются только pre-qualified buyers.
- **Friction 3:** юридическая сложность при distressed (developer default, leasehold issues) → Решение: legal partner включён в comission, buyer получает готовое DD.

### 17.6 Matching Engine (core technical component)

**Что делает.** Когда новый distressed object валидирован и опубликован — automatic matching с existing watchlist / investor criteria → instant push alert качественным buyer'ам.

**Данные:**
- `investor_criteria` (новая таблица): user_id, budget_min, budget_max, districts[], types[], grades[], min_yield_pct, max_timeline_days, active (boolean)
- `distressed_listings` (новая таблица): property_id, reason_category, discount_to_avm_pct, deadline_date, commission_pct, access_tier, status

**Matching алгоритм (pseudo-SQL):**

```sql
-- При INSERT в distressed_listings (после admin validation):
WITH new_listing AS (
  SELECT * FROM distressed_listings WHERE id = NEW.id
)
SELECT c.user_id
FROM investor_criteria c
JOIN properties p ON p.id = (SELECT property_id FROM new_listing)
WHERE c.active = true
  AND p.price_thb BETWEEN c.budget_min AND c.budget_max
  AND (c.districts IS NULL OR p.district = ANY(c.districts))
  AND (c.types IS NULL OR p.property_type = ANY(c.types))
  AND (c.grades IS NULL OR p.clearview_grade = ANY(c.grades));
-- → trigger WhatsApp alert для каждого match
```

**WhatsApp template (matched alert):**

```
[Проект/Район] · Срочная продажа
Цена: ฿X (—Y% к оценке рынка)
Тип: [condo/villa] · ClearView: [grade]
Deadline: [N] дней · Reason: [category]

Подробнее: [link]
Есть вопросы — пишите.
```

**Privacy:** ни одному buyer не показывается список других matched investors; seller не видит кто получил alert.

### 17.7 Data schema для distressed

```sql
-- Подача distressed объекта (seller intake)
CREATE TABLE distressed_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  seller_id UUID REFERENCES users(id),
  reason_category TEXT CHECK (reason_category IN (
    'developer_default', 'life_event', 'relocation',
    'business_distress', 'portfolio_exit', 'tax_legal'
  )),
  reason_details TEXT, -- private, не показывается публично
  requested_price_thb DECIMAL(12,2) NOT NULL,
  avm_estimate_thb DECIMAL(12,2),
  discount_to_avm_pct DECIMAL(5,2), -- computed
  timeline_days INTEGER NOT NULL,
  deadline_date DATE,
  commission_pct DECIMAL(4,2) NOT NULL, -- higher than resale typical
  exclusive BOOLEAN DEFAULT true,
  access_tier TEXT CHECK (access_tier IN ('public', 'authenticated', 'prequalified')),
  status TEXT CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected',
    'active', 'matched', 'reserved', 'closed', 'expired'
  )) DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ
);

-- RLS: seller видит свои, admin видит все, public видит только status='active'
ALTER TABLE distressed_listings ENABLE ROW LEVEL SECURITY;

-- Investor criteria для matching engine
CREATE TABLE investor_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  budget_min_thb DECIMAL(12,2),
  budget_max_thb DECIMAL(12,2),
  districts TEXT[],
  types TEXT[],
  grades TEXT[],
  min_yield_pct DECIMAL(5,2),
  max_timeline_days INTEGER,
  distressed_alerts BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investor_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_criteria ON investor_criteria
FOR ALL TO authenticated USING (user_id = auth.uid());

-- Match events (append-only для audit)
CREATE TABLE distressed_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES distressed_listings(id),
  user_id UUID REFERENCES users(id),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  notification_sent_at TIMESTAMPTZ,
  notification_channel TEXT, -- whatsapp / email / push
  response TEXT CHECK (response IN ('none', 'interested', 'passed')),
  responded_at TIMESTAMPTZ
);
ALTER TABLE distressed_matches ENABLE ROW LEVEL SECURITY;
-- Append-only: no UPDATE/DELETE policies
```

### 17.8 Monetization

- **Commission:** 5–7% (vs 3–4% обычный resale) — premium за скорость и verification
- **Seller success fee** (optional): flat ฿50,000 upfront listing fee чтобы seller был commited (returned as commission credit при closing)
- **Fast-track legal fee:** ฿30–80K из commission идёт partner legal team

**Unit economics:** при 10–15 distressed deals/год, средний чек ฿8M, commission 6% = **฿4.8–7.2M добавочной выручки**. Это не заменяет основной off-plan business — это **additional layer** поверх.

### 17.9 Discoverability распределение

Distressed должно быть **видимо, но не доминировать**. Правила:

1. **Header navigation:** пункт «Urgent» рядом с «Buy» (может быть с маленькой red dot когда есть active listings)
2. **Home /invest:** секция «Today's opportunities» — 2–3 top distressed cards
3. **Каталог /projects:** toggle «Show urgent only»
4. **Каждая property card** другого объекта: если есть distressed в том же районе — «3 urgent deals in [district]»
5. **AI-консьерж:** intent handler «distressed» / «со скидкой»
6. **Knowledge Hub:** cross-link «When distressed sales are legit and when they're not»

---

## 18 · Discoverability & Connectivity Architecture

Существующая функциональность real estate разрознена. Пользователь может зайти на `invest.myuno.app`, не увидеть релевантный для него content; зайти на `myuno.app/guides`, не понимать что делать после статьи; иметь активную сделку, но не найти Urgent-раздел. Блок недвижимости должен быть **обнаруживаемым отовсюду** и **связным на каждом шаге**.

### 18.1 Принцип обнаружимости: Seven Doors

**У каждой persona должна быть своя дверь в IPP.** Не одна главная страница для всех, а семь persona-specific landing pages + дополнительные entry points из других вертикалей myUNO.

**Формула entry point:** `myuno.app/for/[persona]` или inline-widget в релевантной вертикали.

| Дверь | URL / Location | Для кого | Primary message |
|---|---|---|---|
| Snowbird door | `invest.myuno.app/for/snowbird` + widget в `stay.myuno.app` | P5 | «Own your winter home» |
| Settler door | `app.myuno.app` widget + `invest.myuno.app/for/expat` | P6 | «From renting to owning in Phuket» |
| Investor door | `invest.myuno.app/for/investor` (main) | P8 | «Transparent Phuket property investment» |
| HNW door | `invest.myuno.app/mandate` (invite-only) | P9 | — |
| Operator door | `owner.myuno.app` widget | P10 | «Expand your portfolio» |
| Mongolian door | `invest.myuno.app/for/mongolia` + RU/MN | P11 | «Phuket diversification for Mongolian families» |
| Developer door | `developers.myuno.app` | P22 | «ClearView-certified inventory listing» |
| Urgent door | `invest.myuno.app/urgent` + header nav | Any investor | «Verified quick-sale opportunities» |
| Sell-quick door | `myuno.app/sell/quick` | Any owner in distress | «List your urgent sale confidentially» |

### 18.2 Cross-domain entry points (где блок real estate появляется за пределами invest.)

**На `myuno.app` (main):**
- Global header: пункт «Buy» и «Urgent» всегда видимы
- Home page: секция «Investment» с 3 card types — Market Intelligence, Featured Off-plan, Urgent Opportunities
- Knowledge Hub `/guides/*`: каждая статья заканчивается контекстным CTA на релевантный объект или tool

**На `stay.myuno.app`:**
- После 2-го booking'а: email «Love it here? Own it.» с link на `/for/snowbird`
- В `/trips/[booking-id]` dashboard: widget «Own vs Rent calculator»

**На `app.myuno.app` (resident dashboard):**
- Widget «Phuket property investment» для всех residents с 6+ мес usage
- Если rent agreement в системе — widget «Rent-to-own calculator»

**На `owner.myuno.app` (Owner Portal):**
- Monthly yield report — footer «Expand portfolio: 3 matching opportunities»
- Dashboard widget «Ready for #2?» при 12+ мес good performance
- Distressed match alerts когда criteria совпадают

**На `clearview.myuno.app` (public ratings):**
- Каждый rating entry → CTA «Invest in AA-rated projects»
- Footer: list of myUNO-curated AAA/AA проектов

**Global SOS kind visibility:** Urgent и Buy должны быть в **mobile bottom nav** при наличии active listings (subtle red indicator).

### 18.3 Deep cross-linking между модулями

**Проблема:** Knowledge Hub статья рассказывает про foreign quota, но не ведёт к конкретному объекту с available quota. Каталог показывает объект, но не объясняет почему этот leasehold срок опасен. Disconnect между education и transaction.

**Решение: contextual CTA matrix.**

| Из | В | Пример |
|---|---|---|
| Knowledge Hub article | Каталог с filter | `/guides/ownership/foreign-quota` → «Объекты с available quota в Раваи» |
| Property card | Knowledge Hub article | Badge «Leasehold 30Y» → click → `/guides/ownership/leasehold-risks` |
| Comparison Engine | Investment Thesis | После comparison — «Generate Thesis PDF for winner» |
| ROI Calculator | Property card | Calculator result → «3 properties matching this ROI» |
| Market Intelligence | Filtered catalogue | Chart «Prices up 8% in Bang Tao» → click → `/projects/off-plan/bang-tao` |
| Distressed listing | AVM comparison | Discount claim → click → side-by-side AVM vs asking |
| Investor Dashboard | Urgent listings | Sidebar «2 matches in your criteria» |
| Owner Portal | Catalogue | «Expand portfolio» CTA → filtered by diversification |

**Правило:** каждая страница имеет **минимум 3 следующих шага**, из них минимум 1 — транзакционный (ведёт к property card или deal action).

### 18.4 Unified Search (cross-content)

**Проблема:** пользователь не знает, искать ли объект, статью или инструмент. В текущем виде поиск разделён по вертикалям.

**Решение:** единый search bar на `invest.myuno.app` и `myuno.app`, который возвращает:
- **Properties** (from catalogue)
- **Knowledge Hub articles**
- **Tools** (calculator matching query)
- **Districts** (map view)
- **Developers** (if query matches developer name)

Query «Раваи yield» возвращает: 5 свойств в Раваи с yield > 6%, 2 статьи о Раваи, ROI Calculator preset, District Heatmap view Раваи.

Minimal implementation: PostgreSQL full-text search поверх существующих таблиц + weighted ranking (property > article > tool).

### 18.5 Navigation hierarchy (intuitive mental model)

Текущее меню IPP (из `07-information-architecture.md`) — хорошо, но для real estate нужен **второй уровень navigation внутри `invest.myuno.app`**:

```
invest.myuno.app/ TOP NAV (authenticated):
┌────────────────────────────────────────────────────────────────────┐
│  myUNO Invest  [Home]  [Buy ▼]  [Urgent●]  [Tools ▼]  [Portfolio]  │
└────────────────────────────────────────────────────────────────────┘

[Buy ▼ dropdown]:
  · Off-plan
    └─ By district / By class / By yield
  · Resale
    └─ By district / Managed by myUNO / Privileged data
  · Compare saved

[Urgent ●] — red dot if active listings

[Tools ▼ dropdown]:
  · ROI Calculator
  · Purchase Costs
  · FET Guide
  · Compare Projects
  · District Heatmap (Pro)
  · Investment Thesis (Pro)

[Portfolio] — investor's own assets + alerts
```

**Mobile bottom nav:**

```
┌──────────────────────────────────────────────┐
│  [🏠Home] [🔍Browse] [⚡Urgent] [💬AI] [👤Me] │
└──────────────────────────────────────────────┘
```

Urgent занимает постоянное место — обеспечивает discoverability distressed deals.

### 18.6 AI-консьерж как универсальный router

AI-консьерж должен стать **единой точкой входа во весь IPP** для любого пользователя, который не уверен куда идти. Intent routing:

| Intent (пользователь пишет) | Роутинг |
|---|---|
| «сколько стоит квартира в Раваи» | `/projects/off-plan/rawai` + list top 3 |
| «как купить кондо как иностранцу» | `/guides/buying/buying-property-thailand` preview + CTA |
| «что такое Chanote» | `/guides/titles/chanote-verification` |
| «хочу инвестировать $200K» | 4-question flow → shortlist через edge function (из M9e) |
| «хочу срочно продать» | `/sell/quick` intake form |
| «нужна скидка, есть distressed?» | `/urgent` + filtering по criteria |
| «yield в Банг Тао» | District Heatmap Bang Tao + sample properties |
| «сравни эти два проекта» | Comparison Engine + 2 property IDs |
| «какие новые launches» | Market Intelligence New Launches Calendar |
| «у меня вопрос по моей сделке» | Route to `/deals/[active-deal]` + escalate to Pavel |

Intent routing реализуется в existing AI-концьерж (из `08-ai-prompts-library.md`) как extension, не replacement.

---

# PART III · CONSOLIDATION PROTOCOL M10

## 19 · Философия M10: CONNECT BEFORE CREATE

### 19.1 Главное правило

> **Прежде чем создать что-либо новое, AI-инженер обязан доказать, что связка между существующими компонентами — не лучшее решение.**

Real estate функциональность почти вся уже реализована. То, что пользователь воспринимает как «пропуск фичи» — в 90% случаев **disconnect между существующими компонентами**: каталог есть, ROI калькулятор есть, но карточка объекта не ведёт на калькулятор с preloaded-данными; Knowledge Hub статья есть, но не заканчивается CTA на релевантный объект; Owner Dashboard есть, но не показывает expansion opportunities.

M10 — это protocol **consolidation, UX и discoverability**, не protocol нового функционала. Новые модули добавляются только когда consolidation невозможна (например, Distressed vertical — это новый модуль, потому что нужна новая матчинг-логика и seller intake flow, которых нет).

### 19.2 Четыре принципа

**Принцип 1 · Journey First.** Любая задача формулируется через призму конкретного customer journey (из PART II). «Улучшить каталог» — плохая задача. «Снизить friction для P8 на шаге Shortlist» — правильная задача.

**Принцип 2 · Connect Before Create.** Перед созданием нового компонента проверь: (а) существует ли нужный компонент где-то, (б) можно ли его подключить/переиспользовать, (в) будет ли связка быстрее нового кода. Только при отрицательном ответе на (в) — создавай новое.

**Принцип 3 · Audit Disconnect.** Регулярный аудит: что существует, но не видно релевантной persona? Это gap discoverability, не gap фичи.

**Принцип 4 · One Concern per PR.** Сохраняется из M9: один PR — одна задача консолидации. Не «заодно» рефакторить, не смешивать улучшения разных journey.

### 19.3 Структура вех M10

```
M10a · JOURNEY AUDIT (обязательный первый шаг)
   │
   ├─► M10b · Persona Landing Pages (/for/[persona]) — 7 страниц
   │
   ├─► M10c · Dashboard Personalization (persona-aware widgets)
   │
   ├─► M10d · Navigation & Discoverability Consolidation
   │
   ├─► M10e · AI-консьерж Journey Router (расширение из M9e)
   │
   ├─► M10f · Cross-journey CTAs & Smart Connections
   │
   ├─► M10g · Distressed Vertical (новый модуль — §17)
   │
   └─► M10h · Unified Search
```

- **M10a блокирует всё.** Без journey audit невозможно принять решения.
- **M10b–M10f можно параллелить** после M10a.
- **M10g — отдельный workstream** (новый модуль, не просто consolidation), можно параллельно с M10b–f.
- **M10h — последний** (нужны данные о том, что уже связано).

**Критический путь:** 7–10 дней AI-инженера при последовательном выполнении; 4–5 дней при правильной параллелизации.

---

## 20 · M10a · JOURNEY AUDIT

### 20.1 Цель

Создать карту: для каждой из 7 персон (P5, P6, P8, P9, P10, P11, P22) + 2 situational flows (distressed seller, distressed buyer) — зафиксировать **какие компоненты уже существуют** на каждом этапе journey и **какие связки между ними отсутствуют**.

Без этой карты M10b–M10h — угадывание.

### 20.2 Prompt

```
ЗАДАЧА M10a · JOURNEY AUDIT для IPP consolidation.

ВАЖНО: Это задача на чтение, анализ и документирование. Ни одной строки
нового кода до завершения.

ШАГ 1. Прочитай canonical документы:
- /docs/canonical/IPP.md (этот файл, PART II — journey maps)
- /docs/canonical/myuno_segmentation_framework.md
- /docs/canonical/07-information-architecture.md
- /docs/canonical/09-data-schema.md

ШАГ 2. Для каждой journey (P5, P6, P8, P9, P10, P11, P22 + distressed_seller,
distressed_buyer) — пройди каждую journey stage и зафиксируй:

## Journey: [PERSONA_CODE]
### Stage 1: [STAGE_NAME]
- Существующий компонент: [точный путь к файлу / роуту]
- Статус: реализован / stub / отсутствует
- Связан ли со следующим stage? да / нет / частично
- Gap: если gap есть — описание

ШАГ 3. Специальные проверки для каждой journey:

3.1. P5 Snowbird:
- Существует ли связка stay.myuno.app → invest.myuno.app?
- Есть ли widget «Own vs Rent» в Stay?
- Можно ли pre-filter каталог по last_stay_district?

3.2. P6 Settler:
- Есть ли widget про real estate в app.myuno.app (resident dashboard)?
- Существует ли pillar «rent vs buy expat»?
- Настроен ли persona_code в users table?

3.3. P8 Passive Investor:
- Есть ли /for/investor landing?
- Настроен ли ClearView Full Report как lead scoring trigger?
- Работает ли remote-buyer deal flow (без обязательного visit)?

3.4. P9 HNW:
- Существует ли Deal Room (/mandate)?
- Есть ли investment_thesis таблица?
- Настроен ли mandate intake template в CRM?

3.5. P10 Operator:
- Существует ли widget «Ready for #2?» в Owner Dashboard?
- Есть ли «Returning buyer» fast-track в deal flow?
- Работает ли «Not like my current» filter?

3.6. P11 Mongolian:
- Есть ли MN language option в i18n?
- Настроены ли Mongolian banking partnerships (XacBank, Khan Bank)?
- Есть ли multi-stakeholder deal tracking?

3.7. P22 Developer:
- Существует ли developers.myuno.app (от M9 аудита)?
- Настроен ли bi-directional sync inventory между dev portal и каталогом?
- Работает ли analytics dashboard для developer?

3.8. Distressed:
- Существует ли /sell/quick route?
- Есть ли таблица distressed_listings?
- Настроен ли matching engine?
- Есть ли /urgent catalogue view?

ШАГ 4. Создай файл /docs/canonical/m10a-journey-audit.md:

## M10a Journey Audit Report — [дата]

### Executive Summary
- Общее количество проверенных stages: [N]
- Fully connected (no gap): [X] stages
- Partially connected (gap в UX или cross-link): [Y] stages
- Disconnected (missing связка): [Z] stages
- Missing components (нужно создать): [W] компонентов

### Journey-by-journey detail
[подробно по каждой из 9 journey]

### Critical gaps (prioritized by impact)
1. [gap 1]: impact = [high/med/low], effort = [high/med/low]
2. ...

### Components to create (not connect)
- [component 1]: обоснование почему connect не работает
- ...

### Recommendations for M10b–M10h
- M10b landing pages: приоритет по persona [order]
- M10c dashboard widgets: какие виджеты в каком dashboard
- M10d navigation changes: конкретный список
- M10e AI-концьерж: intent handlers (добавить к M9e)
- M10f cross-journey CTAs: matrix пар «из → в»
- M10g distressed: новый модуль, scope clarifications
- M10h unified search: indexing scope

ЧТО НЕ ДЕЛАТЬ:
- Не писать код
- Не предлагать рефакторинг вне зоны real estate
- Не делать допущений — только то, что реально нашёл в файлах
```

### 20.3 Acceptance

- [ ] `/docs/canonical/m10a-journey-audit.md` создан
- [ ] Все 9 journey (7 персон + 2 distressed flows) проаудированы
- [ ] Critical gaps приоритизированы по impact × effort
- [ ] Список компонентов to create (не connect) с обоснованием
- [ ] Ни одной строки нового кода

---

## 21 · M10b · PERSONA LANDING PAGES

### 21.1 Цель

Каждая из 7 персон должна иметь собственную точку входа `/for/[persona]`, показывающую релевантный ей subset IPP-функциональности, написанный её языком.

### 21.2 Prompt

```
ЗАДАЧА M10b · СОЗДАНИЕ 7 PERSONA LANDING PAGES.

ПРЕРЕКВИЗИТ: M10a выполнен. Прочитай m10a-journey-audit.md
и IPP.md PART II.

ШАГ 1. Проверь маршрут /for/[slug] — существует ли динамический роут
в /apps/web/app/for/[slug]/page.tsx? Если нет — создай минимальный.

ШАГ 2. Создай 7 landing pages (каждая — одна страница, не отдельное app):

/for/snowbird         — P5
/for/expat            — P6
/for/investor         — P8 (основная, SEO-критичная)
/for/mandate          — P9 (invite-only teaser, reveal только по link)
/for/owner            — P10 (authenticated-only)
/for/mongolia         — P11 (RU/MN first)
/for/developer        — P22 (redirect to developers.myuno.app)

ШАГ 3. Структура каждой страницы (одинаковая, разный content):

Section 1: Hero
- H1 с persona-specific message (из IPP.md PART II)
- Primary CTA: релевантный первый шаг journey (не «contact us»)

Section 2: Problem statement (в их словах)
- 3 frictions из журney этой persona
- Чем это отличается от альтернатив (PropertyGuru, FazWaz)

Section 3: Relevant tools/products
- 3–5 модулей IPP с короткими description
- Каждый link ведёт на соответствующий модуль

Section 4: Proof
- Anonymized deal cards (если status='completed' в transactions)
- ClearView methodology teaser
- Privileged Data Badge explanation

Section 5: Next step CTA
- ОДИН clear CTA (не «contact us or read blog or calculator»)
- Для P8: «Browse investment catalogue»
- Для P5: «Calculate rent vs own»
- Для P6: «See properties in your area»
- Для P9: «Request mandate intake»
- Для P10: «Expansion dashboard» (auth required)
- Для P11: «Schedule family intro call» (RU/MN form)
- Для P22: «Apply for ClearView assessment»

ШАГ 4. Все страницы:
- Mobile-first 375px
- i18n с RU/EN как default, CN/DE/MN для соответствующих персон
- schema.org WebPage + BreadcrumbList
- Meta description per 10-semantic-core.md

ШАГ 5. В main navigation (invest.myuno.app header) добавь dropdown
«For you» с links на персональные landing. Persistent на всех страницах.

ЧТО НЕ ДЕЛАТЬ:
- Не создавать 7 разных apps — это 7 страниц в существующем app
- Не дублировать контент между страницами (ссылайся на общие модули)
- Не делать длинных scroll-walls — максимум 5 sections
- Не писать маркетинговый текст — тональность по myuno_tone_of_voice.md
```

### 21.3 Acceptance

- [ ] Роут `/for/[slug]` существует и работает
- [ ] 7 persona landing pages опубликованы с правильным content
- [ ] Dropdown «For you» в main nav с ссылками
- [ ] Каждая страница имеет один primary CTA
- [ ] Mobile 375px проверен, SEO meta присутствует

---

## 22 · M10c · DASHBOARD PERSONALIZATION

### 22.1 Цель

Dashboard каждого authenticated пользователя должен показывать **релевантные именно ему** widgets на основе его `persona_code`, `lifecycle_stage`, `economic_role`. Сейчас, предположительно, все видят одно и то же.

### 22.2 Prompt

```
ЗАДАЧА M10c · PERSONA-AWARE DASHBOARD WIDGETS.

ПРЕРЕКВИЗИТ: M10a выполнен.

ШАГ 1. Проверь наличие полей в users table:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('persona_code', 'lifecycle_stage', 'economic_role');

Если отсутствуют — добавь миграцию:
ALTER TABLE users
ADD COLUMN IF NOT EXISTS persona_code TEXT, -- P1-P25
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT, -- scout/tourist/snowbird/...
ADD COLUMN IF NOT EXISTS economic_role TEXT; -- consumer/investor-passive/...

ШАГ 2. Создай компонент <PersonalizedDashboard />, который:
- Получает current user's persona_code
- Рендерит список widgets из конфигурации, соответствующей persona

Конфигурация widgets (по persona):

P5 Snowbird widgets:
- StayBookingsSummary
- RentVsOwnCalculator (preloaded с их Stay data)
- FeaturedDistrictProperties (их last_stay_district)
- SeasonalAffordabilityForecast

P6 Settler widgets:
- RentToOwnWidget (их текущая аренда vs ownership)
- FamilyFriendlyProperties (near schools if family modifier)
- SettlerReadingTrack (Knowledge Hub curated)
- ExpansionOpportunities (если уже owner)

P8 Passive Investor widgets:
- Watchlist
- ClearView alerts
- ROI-highlighted properties
- Distressed matches (если есть)
- Remote-ready properties (с good FET documentation)

P9 HNW widgets:
- Mandate status
- Deal Room preview
- Investment Thesis history
- Portfolio aggregate view
- Quarterly Market Intelligence

P10 Operator widgets:
- Current portfolio performance
- «Ready for #2?» (expansion trigger)
- Benchmark vs district
- Distressed matches
- PM issues priority

P11 Mongolian widgets:
- Family council material generator
- FX MNT/THB tracker
- Mongolian banking guide
- Multi-stakeholder deal status

P22 Developer widgets:
- Inventory burndown
- Investor signals (views, watchlists, inquiries)
- ClearView status
- Commission forecast

ШАГ 3. Default widgets (для users без persona_code — cold start):
- Watchlist
- Featured Properties
- Knowledge Hub top articles
- ROI Calculator

ШАГ 4. Persona detection logic:
- Если persona_code установлен — используй его
- Если нет — infer из lifecycle_stage + economic_role + behaviour:
  * Booked через stay.myuno.app — P5 lean
  * Resides 6+ мес в app.myuno.app + rent agreement — P6
  * Absentee + high lead score — P8
  * Multi-property owner — P10
  * Mongolian country of origin — P11
- Запиши inferred persona_code обратно в users table (с флагом inferred=true)

ШАГ 5. Widget system:
- Каждый widget — React component с единым интерфейсом <Widget persona={P} />
- Widgets могут hide/show на основе feature flags
- Drag-and-drop reordering для authenticated users (saved in user_preferences)

ЧТО НЕ ДЕЛАТЬ:
- Не создавать отдельный dashboard для каждой persona — один component,
  разный content
- Не хардкодить persona-specific logic внутри widgets — config-driven
- Не показывать widget без данных (если watchlist пуст — не рендерить)
```

### 22.3 Acceptance

- [ ] `users.persona_code`, `lifecycle_stage`, `economic_role` поля существуют
- [ ] `<PersonalizedDashboard />` component работает
- [ ] Persona inference logic функционирует для users без явного `persona_code`
- [ ] Widgets рендерятся по conf на основе persona
- [ ] Empty-state грейсfully обработан

---

## 23 · M10d · NAVIGATION & DISCOVERABILITY CONSOLIDATION

### 23.1 Prompt

```
ЗАДАЧА M10d · КОНСОЛИДАЦИЯ НАВИГАЦИИ И DISCOVERABILITY.

ПРЕРЕКВИЗИТ: M10a выполнен.

ШАГ 1. Обнови main navigation header invest.myuno.app per IPP.md §18.5:
- [Home] [Buy ▼] [Urgent ●] [Tools ▼] [Portfolio (auth)]
- Dropdown «For you» с ссылками на /for/[persona]
- Language switcher с RU/EN/CN/DE/MN

ШАГ 2. Обнови mobile bottom nav:
[🏠Home] [🔍Browse] [⚡Urgent] [💬AI] [👤Me]
Urgent badge с red dot если есть active distressed listings.

ШАГ 3. Добавь cross-domain entry points:

На myuno.app (main):
- Home page: секция «Investment» с 3 card types
- Knowledge Hub: contextual CTAs в конце каждой статьи (§18.3 matrix)

На stay.myuno.app:
- После 2-го booking: email trigger «Love it here? Own it.»
- trips/[booking-id] dashboard widget «Own vs Rent calculator»

На app.myuno.app:
- Widget «Phuket property investment» для residents 6+ мес

На owner.myuno.app:
- Monthly yield report footer с «Expand portfolio» section
- Dashboard widget «Ready for #2?» при 12+ мес good performance

ШАГ 4. Implement contextual CTA matrix из §18.3:
Для каждой пары «из → в» — создай reusable <ContextualCTA /> component
с ссылкой, релевантной source context.

ШАГ 5. Breadcrumbs на всех страницах глубже 2 уровней.

ЧТО НЕ ДЕЛАТЬ:
- Не создавать 6-й пункт в mobile bottom nav
- Не менять URL-структуру существующих страниц (SEO-risk)
- Не добавлять dropdown глубже 2 уровней
```

### 23.2 Acceptance

- [ ] Main nav обновлён (desktop + mobile)
- [ ] Cross-domain entry points работают на 4 субдоменах
- [ ] Contextual CTA matrix реализован
- [ ] Breadcrumbs присутствуют везде глубже 2 уровней

---

## 24 · M10e · AI-КОНСЬЕРЖ JOURNEY ROUTER

### 24.1 Prompt

```
ЗАДАЧА M10e · РАСШИРЕНИЕ AI-КОНСЬЕРЖА КАК JOURNEY ROUTER.

ПРЕРЕКВИЗИТ: M9e выполнен (investment intent handling), M10a выполнен.
Это расширение, не переписывание.

ШАГ 1. Прочитай существующий system prompt консьержа.

ШАГ 2. Добавь новую секцию (НЕ переписывай весь промпт):

## JOURNEY ROUTING

Определи intent пользователя по таблице §18.6 IPP.md и маршрутизируй:

[вставь таблицу intent routing из IPP.md §18.6]

При detection distressed intent («продать срочно», «нужна скидка»,
«distressed», «quick sale»):
1. Если продаёт: route на /sell/quick intake form
2. Если покупает: route на /urgent, показать top 3 matches
   по criteria (если есть) или prompt установить criteria

При detection persona (из messages):
- Auto-update user.persona_code если не установлен
- Route на /for/[persona] если первый визит

ШАГ 3. Escalation triggers (дополнительно к M9e):
- Distressed seller intake — always escalate Pavel
- HNW-level inquiry (бюджет >$500K) — escalate Pavel с высоким приоритетом
- Any deal with developer default trigger — escalate Pavel

ШАГ 4. Multi-language:
- Detect language of user's message
- Respond в том же языке
- Route URLs остаются на английском, но описания — на языке user

ЧТО НЕ ДЕЛАТЬ:
- Не создавать нового AI-агента
- Не переписывать existing escalation logic
- Не обещать конкретный доход или скидку
- Не обрабатывать distressed intents без validation workflow
```

### 24.2 Acceptance

- [ ] Intent routing по всей таблице §18.6 работает
- [ ] Distressed intent handling корректно routing
- [ ] Persona auto-detection функционирует
- [ ] Multi-language response работает

---

## 25 · M10f · CROSS-JOURNEY CTAs & SMART CONNECTIONS

### 25.1 Prompt

```
ЗАДАЧА M10f · УСТАНОВКА SMART CONNECTIONS МЕЖДУ МОДУЛЯМИ.

ПРЕРЕКВИЗИТ: M10a выполнен.

ШАГ 1. Реализуй contextual CTA matrix (IPP.md §18.3):

Для каждой страницы-источника — добавь relevant <ContextualCTA />:

Knowledge Hub article → filtered catalogue
- Hook: в конце статьи compute relevant properties (tags/categories match)
- Render: «N relevant properties in [district/class]» с link

Property card → Knowledge Hub article
- Hook: для каждого поля объекта (leasehold, foreign quota) — map на relevant article
- Render: inline badge с «?» icon → hover/click → article preview

Comparison Engine → Investment Thesis
- После comparison session с 2+ объектами — footer CTA
- «Generate Investment Thesis for [winner]» (Pro tier)

ROI Calculator → Property card
- После calculator session — «N properties matching this ROI»

Market Intelligence → filtered catalogue
- Каждый chart element clickable → filtered catalogue view

Distressed listing → AVM comparison
- В карточке distressed — inline «Why this discount» expand
- Raw AVM vs asking side-by-side

Investor Dashboard → Urgent listings
- Sidebar widget «N matches in your criteria» (if investor_criteria set)

Owner Portal → Catalogue
- Monthly report footer «Expand portfolio» CTA → filtered by diversification

ШАГ 2. Tracking:
Log каждый CTA click в lead_events table с:
- source_module, target_module, user_id, timestamp

Это feed для M10a future audits (какие connections работают).

ШАГ 3. Правило «3 следующих шага»:
Каждая страница real estate имеет минимум 3 clear next actions,
из них минимум 1 — transactional (property card / deal action).

ЧТО НЕ ДЕЛАТЬ:
- Не превращать страницы в walls of CTAs
- Не показывать CTAs если нет релевантных данных (empty matches)
- Не дублировать CTAs одинаковой intent
```

### 25.2 Acceptance

- [ ] Contextual CTAs implemented per matrix §18.3
- [ ] Tracking в lead_events работает
- [ ] Все real estate страницы имеют минимум 3 next actions

---

## 26 · M10g · DISTRESSED VERTICAL (новый модуль)

### 26.1 Prompt

```
ЗАДАЧА M10g · СОЗДАНИЕ DISTRESSED / QUICK SALE VERTICAL.

ПРЕРЕКВИЗИТ: M10a выполнен.

Это новый модуль, не consolidation. Обоснование: нет existing seller intake
flow для distressed; нет matching engine на distressed criteria;
нет отдельной каталог view с urgency badge.

ШАГ 1. Создай таблицы (IPP.md §17.7):
- distressed_listings (with RLS)
- investor_criteria (with RLS — users могут edit свои)
- distressed_matches (append-only, RLS)

ШАГ 2. SELLER INTAKE:
/sell/quick — public route на myuno.app
Form с 6 fields (IPP.md §17.4):
- Тип объекта + адрес
- Reason category (enum from §17.3)
- Requested price + обоснование
- Timeline
- Documents status
- Contact + language

On submit: INSERT в distressed_listings со status='submitted'.
Trigger notification Павлу через WhatsApp/email.

ШАГ 3. ADMIN VALIDATION WORKFLOW:
admin.myuno.app/distressed — list всех submitted listings.
Для каждого:
- AVM check (compare с market comparables) — visualize
- Documents verification checklist
- Actions: ACCEPT / REJECT / NEEDS_MORE_INFO
- На ACCEPT: status='active', property_id linked, discount_to_avm_pct computed

ШАГ 4. PUBLIC CATALOGUE:
/urgent — filtered view только distressed_listings WHERE status='active'
- PropertyCard variant с:
  * «Urgent» badge
  * Discount % к AVM (prominent)
  * Reason category (без details)
  * Countdown до deadline (если есть)
  * Contact-via-Pavel only

ШАГ 5. MATCHING ENGINE:
Database trigger на INSERT distressed_listings (status='active'):
- Run SQL matching query (§17.6)
- Для каждого match: INSERT в distressed_matches
- Send WhatsApp notification через existing sender с template §17.6

ШАГ 6. INVESTOR CRITERIA FORM:
/portfolio/criteria — investor устанавливает свои criteria.
Form с budget, districts, types, grades, min_yield, max_timeline.
UPSERT в investor_criteria.

ШАГ 7. FAST-TRACK TRANSACTION:
/deals/[deal-id] — modifier «fast_track=true» для distressed deals.
Шаги параллелизованы (DD + FET + legal одновременно).
Checklist с 14–30 day timeline.

ШАГ 8. DISCOVERABILITY:
- Header nav: «Urgent» permanent link + red dot если active > 0
- Home /invest: «Today's opportunities» section
- AI-консьерж: distressed intent routing (from M10e)
- Knowledge Hub: создать pillar «Distressed property deals in Thailand»

ЧТО НЕ ДЕЛАТЬ:
- Не публиковать listings без admin validation
- Не показывать seller's personal details публично
- Не разрешать direct buyer-seller contact — ONLY через Павла
- Не сокращать DD — сокращается только timeline, не depth
```

### 26.2 Acceptance

- [ ] 3 новых таблицы созданы с RLS
- [ ] /sell/quick intake работает
- [ ] Admin validation workflow в admin.myuno.app
- [ ] /urgent catalogue view публикует активные listings
- [ ] Matching engine отправляет alerts
- [ ] Fast-track deal flow существует
- [ ] Discoverability: nav, home, AI, Knowledge Hub

---

## 27 · M10h · UNIFIED SEARCH

### 27.1 Prompt

```
ЗАДАЧА M10h · UNIFIED SEARCH ПО ВСЕМ REAL ESTATE CONTENT.

ПРЕРЕКВИЗИТ: M10a, M10b, M10g выполнены.

ШАГ 1. Установи PostgreSQL full-text search индексы:
- properties: name, description, district, developer_name
- knowledge_articles: title, content_ru, content_en
- tools: name, description
- districts: name, aliases

ШАГ 2. Edge function /functions/unified-search:
Input: query string
Output: grouped results
- properties (top 5)
- articles (top 3)
- tools (top 2)
- districts (top 2)

Weighted ranking: property-match weight 3, article 2, tool/district 1.

ШАГ 3. Search UI:
Single search bar в header (invest.myuno.app + myuno.app).
Dropdown with grouped results типа Algolia.
Keyboard: ↑↓ navigate, ⏎ select, ⌘K open.

ШАГ 4. Query suggestions:
Auto-suggest на основе popular queries из последних 30 дней.

ШАГ 5. Tracking:
Log search queries в search_events с user_id, query, clicked_result.
Feed для future relevance tuning.

ЧТО НЕ ДЕЛАТЬ:
- Не делать отдельный search page — inline dropdown достаточно
- Не индексировать приватные данные (deals, внутренние комиссии)
- Не показывать results, которые user не имеет права видеть (RLS-aware)
```

### 27.2 Acceptance

- [ ] Full-text indexes created
- [ ] Edge function работает, возвращает grouped results
- [ ] Search bar интегрирован в header
- [ ] Tracking в search_events работает

---

## 28 · Общая проверка M10

### 28.1 SQL-аудит

```sql
-- Все новые таблицы имеют RLS
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'distressed_listings', 'investor_criteria',
  'distressed_matches', 'user_preferences', 'search_events'
)
AND tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
);
-- Результат должен быть пустым

-- Distressed listings: no direct access к seller details
SELECT policyname FROM pg_policies
WHERE tablename = 'distressed_listings'
AND cmd = 'SELECT'
AND qual LIKE '%status%active%';
-- Должна существовать

-- persona_code установлен для значимой части users
SELECT COUNT(*) FILTER (WHERE persona_code IS NOT NULL) * 100.0 / COUNT(*)
FROM users WHERE created_at < NOW() - INTERVAL '30 days';
-- Должно быть > 50%
```

### 28.2 UX-тесты (manual)

Для каждой persona — smoke test journey:
- [ ] P5: `stay.myuno.app/trips/[id]` → CTA «Own vs Rent» → calculator работает
- [ ] P6: `app.myuno.app` dashboard → real estate widget viable → click → `/for/expat`
- [ ] P8: `/for/investor` → catalogue → compare → ClearView → thesis
- [ ] P9: invite link → `/mandate` → preview без auth leak
- [ ] P10: owner dashboard → «Ready for #2» widget с relevant offer
- [ ] P11: AI-консьерж на RU → routes correctly → material generator работает
- [ ] P22: developers.myuno.app → inventory upload → sync to /invest catalogue
- [ ] Distressed seller: `/sell/quick` → form → admin notification → validation
- [ ] Distressed buyer: `/urgent` → match → WhatsApp alert → fast-track deal

### 28.3 Final acceptance M10

- [ ] m10a-journey-audit.md создан, все 9 journeys проаудированы
- [ ] 7 persona landing pages работают
- [ ] Dashboard widgets рендерятся per persona
- [ ] Navigation консолидирован, cross-domain entries работают
- [ ] AI-консьерж routes на full intent matrix
- [ ] Contextual CTAs работают per matrix §18.3
- [ ] Distressed vertical live: /sell/quick, /urgent, matching engine
- [ ] Unified search работает на minimum 4 content types
- [ ] Mobile 375px проверен везде
- [ ] Lighthouse LCP < 2.5s, CLS < 0.1 на всех публичных страницах

---

## 29 · Общий мастер-промпт для AI-инженера (Lovable / Cursor / Claude Code)

Если нужно запустить весь блок M10 одной командой:

```
Ты AI-инженер на проекте myUNO. У нас есть единый канонический документ
IPP.md (этот файл) — он содержит architecture (PART I), customer journey
maps для 7 персон + distressed vertical (PART II) и protocol консолидации
M10 (PART III).

ЗАДАНИЕ. Выполнить вехи M10a → M10h в последовательности, указанной в §19.3.

КЛЮЧЕВОЙ ПРИНЦИП: CONNECT BEFORE CREATE. Real estate функциональность почти
вся уже реализована. 90% работы — соединить existing компоненты через UX,
навигацию и персонализацию. 10% — точечные доработки (главное новое —
distressed vertical M10g).

ПРАВИЛА.
1. Каждая веха — отдельный PR.
2. Перед началом вехи — выполняешь AUDIT шаг, результат в PR comment.
3. Следуешь PROMPT вехи пошагово.
4. Каждый шаг — отдельный коммит с conventional commit message.
5. После всех шагов — проверяешь ACCEPTANCE чек-лист вехи.
6. Если что-то противоречит IPP.md или другим canonical docs —
   ОСТАНАВЛИВАЕШЬСЯ и пишешь вопрос в PR.
7. Между вехами — ждёшь merge предыдущего PR в main.

СТАРТ. Начни с M10a. Когда M10a PR будет смёржен — M10b, M10c, M10d
можно параллелить. M10g (distressed) — отдельный workstream, можно
параллельно с M10b-f. M10e зависит от M10a. M10h — последний.

ТРИГГЕРЫ ОСТАНОВКИ. Если в процессе любой вехи обнаруживаешь:
- Нарушение одной из констант проекта (public schema, TS strict,
  mobile-first, bilingual, append-only)
- Риск breaking change в продакшене
- Противоречие в canonical-документах
- Неочевидный технический выбор
- Необходимость создать новую сущность без обоснования
— ОСТАНАВЛИВАЕШЬСЯ и задаёшь вопрос в PR с тегом @Pavel.

Не беги вперёд. Не делай «заодно». Не оптимизируй лишнего.
Принцип: одна веха — один PR — один мёрдж — следующая веха.
CONNECT BEFORE CREATE — всегда.
```

---

## 30 · Что делать прямо сейчас — минимальное действие

1. Положить этот файл (`IPP.md`) в `/docs/canonical/` репозитория myUNO
2. Открыть Lovable / Cursor / Claude Code в репозитории
3. Прикрепить `IPP.md` + `09-data-schema.md` + `07-information-architecture.md` + `myuno_segmentation_framework.md`
4. Вставить мастер-промпт из §29
5. Получить `m10a-journey-audit.md` — это карта: что уже есть, что disconnected, что missing
6. Читать audit, проверять, мёрджить
7. Давать команды параллельно на M10b/M10c/M10d/M10g

**M10a — не код. M10a — карта существующего ландшафта и план консолидации. Без карты любая следующая веха — угадывание.**

---

*Документ v2.1 объединяет architecture, customer journey maps и consolidation protocol в единый эталон для AI-инженера. Переход от «build new IPP» (v2.0) к «consolidate existing + add distressed vertical + journey-specific entry points» (v2.1).*

*Owner: Pavel Ignatev. AI-исполнитель: Lovable / Cursor / Claude Code. Принцип: PART I определяет архитектуру, PART II определяет journey для каждой persona, PART III определяет как соединить существующее без дубликатов. CONNECT BEFORE CREATE.*
