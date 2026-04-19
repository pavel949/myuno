
## Аудит инвестиционной платформы myUNO

### Что уже есть (карта)
**Routes (`/property/invest/*`)** — Hub под Property Hub'ом:
- `InvestClusterPage` (`/invest`) — лендинг кластера: Property Search, Off-Plan, ROI, Developers, Consultation. **Полностью про недвижимость.**
- `InvestmentIndex` (`/property/invest`) — главная Hub'а: Hero, чипсы категорий (11 шт.), карусели Hot/RealEstate/Business, CTA "Привлечь инвестиции".
- `InvestmentHubShell` (`/market`, `/deals`, `/network`, `/execution`) — 4 зоны с табами, JTBD/scope/monetization/KPI карточки.
- `InvestmentDetail` — карточка проекта, `InterestForm`, `InvestorLeadForm`.
- `RaiseFunding` — 3-step wizard → пишет в `consultation_requests` (request_type='investment_raise').
- `InvestorDashboard` — личный кабинет инвестора.

**Data:** таблица `investment_projects` (RE-centric поля + `project_type` enum), `investment_opportunities` + `intro_requests` (multi-asset Hub schema), 11 категорий в `INVESTMENT_CATEGORIES` (RE off-plan/rental, hospitality, restaurant, retail, yacht, marine, wellness, tech, franchise, agriculture).

---

### Что хорошо
1. **Multi-asset schema уже заложена** — `INVESTMENT_CATEGORIES` покрывает не только RE, есть `investment_opportunities` с `asset_class` и `zone`.
2. **Hub Shell с зонами** (Market/Deals/Network/Execution) — правильный концептуальный каркас buy-side/sell-side/advisory/execution.
3. **JTBD по ролям** (investor/owner/advisor/operator) уже описаны.
4. **Monetization rules + KPI** задокументированы (intro fee, success fee, premium DD room).
5. **Bilingual RU/EN/TH**, muUNO Score, due diligence framing.
6. **Raise Funding flow** работает end-to-end (через consultation_requests).

---

### Что плохо (gaps vs. цель пользователя)
1. **Дисконнект между уровнями**: `InvestClusterPage` показывает только RE-сервисы, `InvestmentIndex` показывает multi-asset. Пользователь, заходящий через "КУПИТЬ" кластер, **не увидит** F&B/restaurants/import-export.
2. **Нет import/export, trading, manufacturing** — отсутствуют в `INVESTMENT_CATEGORIES` (а это типичные ниши для русскоязычного капитала в Таиланде).
3. **Нет "Business for Sale" listings** — действующий бизнес на продажу (готовый ресторан, отель, барбершоп) отсутствует как отдельная сущность. Это ключевой запрос ЦА "хочу купить готовый бизнес в нише, где работал".
4. **Нет образовательного слоя** — нет статей/гайдов "Как открыть ресторан в Таиланде", "Структуры собственности для иностранцев", "BOI", "Work permit", "Налоги". ЦА приехала и не понимает как.
5. **Нет "Представитель интересов"** — нельзя оставить заявку "найди мне local nominee/lawyer/accountant/operator" как отдельный продукт. Только generic InterestForm.
6. **Нет industry discovery** — пользователь не знает с чего начать. Нужен квиз "Чем заняться" по бэкграунду + капиталу.
7. **Нет market intelligence по нишам** — средние тикеты, ROI, time-to-payback, риски по индустриям (а не по проектам).
8. **HubShell перегружен метой** — JTBD/Rollout/KPI карточки публично показываются user'у; это внутренние артефакты.
9. **Дублирование** — `InvestClusterPage` и `InvestmentIndex` решают похожие задачи без четкого разделения.
10. **Score breakdown только для RE** — `muuno_score` calibrated для девелопмента, не для F&B/retail/import.
11. **Нет deal flow для бизнес-сделок** — `intro_requests` есть, но UI/wizard заточены под RE.

---

### Целевая структура (предложение)

**Концепция:** Investment Hub = "Я приехал в Пхукет с капиталом X — что мне делать?". RE доминирует (~60% real estate в featured/hero), но платформа покрывает весь спектр "перемещения капитала + открытия бизнеса".

```text
/invest  (rebrand из InvestClusterPage в полноценный Investment Hub entry)
├─ HERO: "Капитал в Таиланде" + персональный квиз CTA
├─ DISCOVERY QUIZ: бэкграунд → капитал → ниши → персональная подборка
│
├─ ZONE 1: REAL ESTATE (доминирует, ~50% поверхности)
│   ├─ Off-Plan / Newbuilds (existing)
│   ├─ Rental Business / готовая сдача
│   ├─ Resale / Assignment
│   └─ ROI Calculator + Developers (existing)
│
├─ ZONE 2: BUSINESS OPPORTUNITIES (новая сильная зона)
│   ├─ Готовый бизнес на продажу (Business for Sale) ← НОВОЕ
│   │   └─ Restaurants / Hotels / Spa / Retail / Marine / Tech
│   ├─ Investment Projects (existing investment_projects)
│   ├─ Franchise Catalog (existing, расширить)
│   └─ Industry Briefs: F&B, Hospitality, Retail, Marine, Wellness,
│       Tech, Import/Export, Manufacturing, Agriculture ← ДОБАВИТЬ 2 категории
│
├─ ZONE 3: KNOWLEDGE BASE (новая зона — обязательно)
│   ├─ "Бизнес в Таиланде 101": структуры (Thai Ltd, BOI, Treaty of Amity)
│   ├─ Налоги, виза, work permit для собственника
│   ├─ Импорт/экспорт: customs, лицензии
│   ├─ Industry guides: как открыть ресторан/отель/spa/retail
│   ├─ Кейсы успешных сделок (с цифрами)
│   └─ FAQ / глоссарий
│
├─ ZONE 4: SERVICES (Capital advisory marketplace)
│   ├─ "Представляйте мои интересы" — найти Operating Partner / Nominee
│   ├─ Юристы / accountants / BOI consultants
│   ├─ Due Diligence as a service
│   ├─ Property Management для инвесторов
│   └─ M&A / Business Brokerage
│
└─ ZONE 5: I AM RAISING (sell-side, existing RaiseFunding расширить)
    ├─ Проект недвижимости
    ├─ Действующий бизнес (продажа доли / exit)
    └─ Стартап / новый бизнес
```

**Внутренние сущности (Market/Deals/Network/Execution Hub Shell)** — оставить, но **скрыть от обычного user'а** (это admin/operator view), вынести под `/invest/ops` или разрешения.

---

### Конкретные изменения

**Routes & Navigation**
- `/invest` (cluster page) → новый **Investment Hub Landing** с 5 зонами выше; старый InvestClusterPage удалить.
- `/property/invest` → редирект на `/invest` (или оставить как Real Estate sub-zone).
- `/invest/quiz` — discovery quiz.
- `/invest/business-for-sale` — каталог готовых бизнесов.
- `/invest/knowledge` — knowledge base hub.
- `/invest/services` — capital services marketplace.
- `/invest/raise` — sell-side (расширить).
- `/invest/ops` — гейт под admin для HubShell (Market/Deals/Network/Execution).

**Data model**
- Новая таблица `business_listings` (asset_class, monthly_revenue, ebitda, ask_price, lease_terms, staff_count, license_status, reason_for_sale).
- Новая таблица `industry_briefs` (asset_class, content_ru/en, avg_ticket, typical_roi, risks, regulations).
- Новая таблица `investment_articles` (knowledge base, slug, category, body, author).
- Новая таблица `capital_service_requests` (service_type: nominee/legal/operator/dd, brief, budget) → CRM.
- Расширить `INVESTMENT_CATEGORIES`: добавить `import_export`, `manufacturing`, `education`, `medical`.

**UI компоненты (новые)**
- `InvestmentDiscoveryQuiz` (5 шагов: background → capital → involvement → industries → timeline).
- `BusinessForSaleCard` + `BusinessForSaleDetail`.
- `IndustryBriefCard` (avg ticket / ROI / risk badges).
- `KnowledgeArticleCard` + reader view.
- `CapitalServiceRequestForm` ("Представляйте мои интересы").
- `InvestmentHubLanding` — новая главная.

**Cleanup**
- HubShell упростить: убрать JTBD/Monetization/KPI карточки из публичного view.
- Объединить `InvestClusterPage` + `InvestmentIndex` в одну landing.
- `RaiseFunding` расширить: типы — Real Estate Project / Operating Business / Startup / Looking for Co-Investor.
- `InterestForm` разделить на: "Запросить детали", "Запросить интро", "Запросить advisory".

---

### Phasing (рекомендация порядка работ)

1. **Phase 1 — Information Architecture rework** (1 PR): новая `/invest` landing с 5 зонами, скрыть HubShell-мету, объединить cluster+index, expand categories (+import/export, manufacturing).
2. **Phase 2 — Business for Sale**: таблица + админка + публичный каталог + детали + lead form.
3. **Phase 3 — Knowledge Base**: industry_briefs + articles, MD/MDX контент, SEO-friendly страницы.
4. **Phase 4 — Capital Services Marketplace**: nominee/legal/operator request flow → CRM pipeline.
5. **Phase 5 — Discovery Quiz** + персонализированный feed.
6. **Phase 6 — Business raise flow**: расширение RaiseFunding под operating business/M&A.

---

### Технические детали (для разработчика)
- Все новые таблицы — RLS: public read для published, owner/admin write.
- Новые категории добавить в `INVESTMENT_CATEGORIES` + миграция существующих `project_type` enum.
- `/invest` маршрут вынести из `/property/*`, чтобы Investment Hub был **первым уровнем** (он не подмножество property).
- Knowledge base — статичный контент в DB + react-markdown renderer; индексировать в Super Search.
- Discovery Quiz state — localStorage + опционально сохранение в `user_investment_profile`.
- Capital service requests — переиспользовать CRM pipeline (`crm_contacts` + новый `source='capital_services'`).
- Скрыть HubShell от non-admin: обернуть `<AdminGuard>` или фича-флаг `feature_flag:invest_ops_console`.

После одобрения плана — начну с **Phase 1** (IA rework) как самого высокоимпактного и наименее рискованного шага.
