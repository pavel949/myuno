# ClearView™ · Canonical Methodology v1.0
## Институциональная система оценки off-plan проектов myUNO

> **⚠️ Master Taxonomy v1.0 (апрель 2026) расширила шкалу до AAA · AA · A · BBB · BB · B · CCC · unrated.** Везде, где этот документ упоминает «AAA–BB» (5 уровней) — это устаревшая версия V3. Канон шкалы — `docs/canonical/00-master-taxonomy.md` §4 и DB-enum `public.clearview_grade`. Также снято Y1-ограничение на brokered проекты — рейтинг ставится всем, дисклеймер только для unrated.
>
> **Статус:** эталонный для методологии (8 категорий, веса, maturity progression). Источник истины для всего, что касается ClearView™ — от развёртывания UI-бейджей до pitch застройщику, от RAG-базы AI-консьержа до PR-публикаций. **При расхождении по шкале — Master Taxonomy v1.0 побеждает.**
>
> **Версия методологии:** V3 (March 2025) · адаптация для canonical system: April 2026 · grade-scale extension: April 2026 (Master Taxonomy v1.0)
> **Основа:** Ignatev Estate Co., Ltd. · Plaza Del Mar, Cherngtalay, Phuket
> **Связанные документы:** `00-master-taxonomy.md` (canonical scale), `PROJECT.md` (моат 8, сделки 11–13), `01-segmentation-framework.md` (cluster D), `02-service-catalogue.md`, `03-tone-of-voice.md` (раздел 10.3)

---

## 1 · Что такое ClearView и почему это главный моат myUNO

### 1.1 · Одна фраза

ClearView — **публикуемая институциональная система рейтингов off-plan проектов Юго-Восточной Азии** (AAA–BB), которая превращает субъективное «хороший проект / плохой проект» в объективный score 0–100 на основе 8 взвешенных категорий, 5-ступенчатой maturity progression и audited score modifiers.

### 1.2 · Чем это отличается от других AI-инструментов платформы

| Инструмент | Тип | Кто платит | Кто видит |
|---|---|---|---|
| ContractAI | Личный анализ документа | Покупатель | Только заказчик |
| DueDiligence AI | Приватный отчёт по проекту | Покупатель | Только заказчик |
| FloodScore | Проверка одного risk-параметра | Покупатель | Только заказчик |
| **ClearView** | **Публикуемый рейтинг + сертификат** | **Застройщик** | **Рынок целиком** |

**Ключевое отличие:** ClearView — единственный продукт myUNO, где **плательщик один, а бенефициар рынок**. Это создаёт **market-wide effect**: рейтинг становится объективной data point, которую можно процитировать в Bangkok Post, включить в банковскую due diligence, показать в BOI-заявке, использовать в пресс-релизе.

### 1.3 · Почему это моат

ClearView — **Моат восьмой** в архитектуре PROJECT.md. Его нельзя воспроизвести, потому что:

1. **Методологическая зрелость** — V3 разработана за 2+ года, 50+ risk indicators, 8 категорий с точными весами, 5-уровневая maturity, 6 modifiers, 4 disqualification criteria. Конкуренту нужно 12–18 месяцев.
2. **Институциональная легитимность** — рейтинг выпускается структурой, близкой к омбудсмен-статусу Павла. Это не «мнение агентства», а «позиция института».
3. **First-mover moat** — как только первые 10 проектов получат ClearView certificate, застройщики, не имеющие рейтинга, будут проигрывать им в глазах иностранного покупателя. Формируется **social proof gravity**.
4. **Data compounding** — каждая новая оценка обогащает benchmark dataset, делая следующие оценки точнее. Через 2 года у ClearView будет крупнейшая база off-plan-проектов Пхукета — ценный актив сам по себе.
5. **Операционная интеграция** — ClearView встроен в myUNO Stay (buyer-side), myUNO Invest (CRM), Partner Portal (developer-side). Конкурент без платформы может выпускать рейтинги, но не может их использовать.

### 1.4 · Миссия

> **Для инвестора — clarity и safety.** Каждый score построен на комплексных данных: от legal compliance до developer track record, от construction quality до market demand. Цель — помочь принимать informed decisions, снижая uncertainty off-plan-инвестиций.
>
> **Для застройщика — показать value.** Высокий рейтинг — доказательство качества, прозрачности и способности выполнять обязательства. Это строит доверие и ускоряет продажи.
>
> **Для рынка — заменить guesswork на trust.** Единая ригорозная методология для каждого проекта делает Phuket off-plan market более надёжным и ликвидным.

---

## 2 · Место ClearView в архитектуре платформы

### 2.1 · Трансверсальная интеграция через 4 слоя

ClearView — не новая вертикаль. Это **трансверсальный слой**, проходящий через все четыре слоя платформы из PROJECT.md раздел 7.

```
СЛОЙ 1 · Привлечение
└─ Public Dashboard (clearview.myuno.app)
   Все оцененные проекты Пхукета с публичными score-ами.
   SEO-актив + first contact для инвесторов. Free.

СЛОЙ 2 · Доверие
├─ Score Badge (AAA/AA/A/BBB/BB) на карточке каждого проекта в PropertySearch
├─ Free Summary — 1 страница с общим score + top 3 strengths + top 3 risks
└─ Публикуемый Quarterly Report — PR-актив для Bangkok Post, Phuket News

СЛОЙ 3 · Отношения
├─ Просмотр ClearView Report +35 в lead scoring (аналогично просмотру объекта 3+ раз)
├─ Developer с AAA/AA-проектом → автоматический trigger для HNW-offering Павла
└─ Buyer, скачавший Full Report → WhatsApp-контакт от консьержа в течение 2 ч

СЛОЙ 4 · Транзакция
├─ Developer Assessment (B2B · $10–17K единоразово)
├─ Investor Report (B2C · ฿2,900–4,900 микротранзакция)
├─ Quarterly Monitoring (B2B retainer · ฿15K/квартал)
└─ Ускорение сделок через признанный рейтинг (косвенная выручка, усиливает ряд 1–10 из таблицы)
```

### 2.2 · Три типа пользователей ClearView

**Developer (B2B · P22 в segmentation framework)**
Платит за assessment, получает certificate, использует в sales & marketing. Peace of mind для него — третья-независимая валидация проекта.

**Investor / Buyer (B2C · P8, P9, P11 в segmentation framework)**
Потребляет публичный score бесплатно, покупает Premium/Full Report за ฿2,900–4,900, принимает более быстрое и уверенное решение о покупке.

**Market (институциональный стейкхолдер)**
Banking, BOI, журналисты, agencies — получают benchmark dataset для собственных решений. Цитируемость формирует авторитет платформы.

### 2.3 · Интеграция с существующими AI-агентами

| AI-агент | Как использует ClearView |
|---|---|
| AI-консьерж | При запросе «помоги выбрать проект» — фильтрует только AAA/AA/A-рейтинги по умолчанию |
| DueDiligence AI | Использует ClearView Score как baseline, фокусируется на персональных рисках поверх |
| Lead Scoring AI | +35 очков за просмотр ClearView Report, +50 за скачивание Full Report |
| Property Intelligence | Отображает тренд score по кварталам в OwnerDashboard |
| Market Intelligence | Агрегирует distribution ClearView-рейтингов → рыночный индикатор доверия |

---

## 3 · Методология: 8 категорий оценки

Финальный score — взвешенная сумма оценок по 8 категориям. Максимум — 100 баллов. Каждая категория имеет свой вес, отражающий его влияние на безопасность инвестиции.

| # | Категория | Вес | Суть |
|---|---|---|---|
| 1 | Legal & Regulatory Compliance | **20%** | Title, permits, foreign ownership structure, contracts |
| 2 | Developer Credibility & Financial Stability | **20%** | Track record, финансовая прочность, local experience |
| 3 | Construction Quality & Progress | **15%** | Contractors, QA/QC, timeline, technical compliance |
| 4 | Location & Market Dynamics | **15%** | Position, amenities, infrastructure, demand trends |
| 5 | Financial Structure & Payment Protection | **10%** | Escrow, guarantees, construction-linked schedule |
| 6 | Investment Return & Appreciation | **10%** | Yield, construction-stage uplift, long-term growth |
| 7 | Sales & Marketing Effectiveness | **5%** | Materials, absorption rate, market reach |
| 8 | Liquidity & Exit Strategy | **5%** | Secondary market, buy-back, exit flexibility |

**Итог: 20+20+15+15+10+10+5+5 = 100%**

Почему именно такое распределение? **40% веса — legal + developer** — потому что на off-plan-стадии физической валидации почти нет, и главный риск — «проект не будет достроен». **30% — construction + location** — как только эти два пункта решены, остальное становится финансовой оптимизацией. **30% — финансовая structure + returns + marketing + exit** — это «upside-слой», который важен, но не решает судьбу проекта.

---

## 4 · Детали каждой категории

### 4.1 · Legal & Regulatory Compliance (20%)

**Objective:** Оценить legal structure и compliance со Thai property law + специфическими требованиями Пхукета.

**Key Factors:**
- **Title Status** — легитимность land title, структура владения, compliance с foreign ownership
- **Development Approvals** — building permits, EIA, zoning
- **Ownership Structure** — legal framework для иностранного владения
- **Contractual Framework** — S&P agreements, buyer protections

**5-Level Maturity Progression:**

**Level 1 — High Legal Risk Profile**
- Unclear/problematic land title (pending title upgrade, ownership disputes, unclear history)
- Major regulatory gaps (missing key permits, no EIA, zoning issues)
- Weak foreign ownership structure (non-compliant company, questionable leasehold)
- Basic/incomplete contracts, no DD, missing approvals

**Level 2 — Basic Legal Compliance**
- Basic title verification (document available, некоторые issues pending)
- Partial regulatory compliance (basic permits, EIA in process)
- Standard ownership structure (basic company, standard leasehold)
- Basic legal framework (standard contracts, partial DD)

**Level 3 — Standard Legal Structure**
- Clear title status (verified document, clean history, minor processes pending)
- Good regulatory standing (major permits obtained, EIA approved, zoning confirmed)
- Compliant ownership structure
- Comprehensive legal framework (full contract suite)

**Level 4 — Strong Legal Foundation**
- Strong title position (fully verified, complete history, clear boundaries)
- Advanced regulatory compliance (all major permits, full EIA, complete zoning)
- Robust ownership structure (optimized company, enhanced lease terms)
- Superior legal framework (enhanced contracts, thorough DD, all approvals)

**Level 5 — Premium Legal Security**
- Premium title (fully secured, comprehensive verification, surveyed boundaries)
- Complete regulatory compliance (all permits finalized, full environmental clearance)
- Optimal ownership structure (enhanced foreign buyer protection)
- Comprehensive documentation + independent legal verification

**Scoring Components (для финального score):**
- Land Title Type: Chanote (5) / Nor Sor 3 Gor (3) / Other (2)
- Permits & Approvals: Fully Approved (5) / Partially (3) / Pending (1)

**Why It Matters:** Legal compliance — основа investment security в off-plan. Сильная legal structure защищает интересы покупателя и минимизирует риски disputes. В Phuket, где foreign ownership structures критичны, robust legal frameworks обязательны.

---

### 4.2 · Developer Credibility & Financial Stability (20%)

**Objective:** Оценить capability застройщика успешно доставить проект на основе track record, financial strength и local market experience.

**Key Factors:**
- **Development History** — completed projects (quality, timelines, satisfaction)
- **Financial Capability** — financial strength, funding sources, project financing
- **Local Experience** — Phuket market understanding, relationships с authorities
- **Organizational Strength** — management team, contractor relationships, operational systems

**5-Level Maturity Progression:**

**Level 1 — Emerging Developer Profile**
- No completed projects in Phuket · no track record
- High pre-sales reliance (>70%) · limited capital reserves · no guarantees
- New to Phuket market · limited local relationships
- Small team · limited expertise · no established processes

**Level 2 — Developing Builder Status**
- 1 completed project in Phuket · some delays · quality issues reported
- Significant pre-sale reliance (50–70%) · moderate capital · basic guarantees
- 1–2 years in Phuket · developing relationships
- Growing team · some expertise · basic processes

**Level 3 — Established Developer Position**
- 2–3 completed projects · minor delays · good quality
- Moderate pre-sale reliance (40–50%) · adequate reserves · strong guarantees
- 3–5 years in Phuket · strong relationships · full operations
- Experienced team · good expertise · established processes

**Level 4 — Premium Developer Standing**
- 4–5 completed projects · on-time delivery · high quality
- Lower pre-sale reliance (30–40%) · substantial reserves · comprehensive guarantees
- 5–10 years in Phuket · excellent relationships · advanced operations
- Expert team · comprehensive expertise · advanced processes

**Level 5 — Elite Developer Excellence**
- 5+ completed projects · consistent on-time delivery · premium quality
- Minimal pre-sale reliance (<30%) · large reserves · premium guarantees
- 10+ years in Phuket · market-leading position · extensive local network
- Multiple funding sources · professional management · industry recognition

**Scoring Components:**
- Track Record: 5+ Projects (5) / 3–4 (3) / 1–2 (1)
- Financial Health: Developer Equity >50% или Guarantees (5) / 30–50% или No Guarantees (3) / <30% (1)

---

### 4.3 · Construction Quality & Progress (15%)

**Objective:** Оценить construction execution quality, progress reliability, design specifications.

**Key Factors:**
- **Construction Oversight** — contractors, architects, project managers
- **Quality Management** — QA/QC processes, material standards, inspections
- **Progress Tracking** — advancement vs timeline, milestone achievements
- **Technical Compliance** — design specifications, building standards

**5-Level Maturity Progression:**

**Level 1 — Basic Construction Standards**
- Unproven main contractor · basic PM · no independent supervision
- No formal QA system · basic materials · limited documentation
- Significant delays (>6 months) · unclear timeline · no milestone tracking
- Basic spec adherence · limited testing

**Level 2 — Standard Construction Management**
- Known local contractor · standard PM · limited supervision
- Basic QA procedures · standard material testing · simple documentation
- Minor delays (3–6 months) · basic tracking · simple milestones
- Standard specifications · basic testing · regular documentation

**Level 3 — Professional Construction Execution**
- Established main contractor · professional PM · regular supervision
- Structured QA · regular testing · good documentation
- On schedule · clear timeline · regular milestone updates
- Full spec compliance · systematic testing · complete documentation

**Level 4 — Premium Construction Excellence**
- Top-tier contractor · expert PM · independent supervision
- Advanced QA/QC · premium material standards · detailed documentation
- Ahead of schedule · precise tracking · proactive milestones
- High-spec compliance · comprehensive testing · extensive documentation

**Level 5 — Elite Construction Standards**
- Industry-leading contractor · international PM · comprehensive supervision
- Best-in-class QA/QC · premium sourcing · international standards
- Significantly ahead of schedule · advanced tracking
- International standards · third-party certification · real-time monitoring

**Scoring Components:**
- Construction Standards: Premium (5) / Basic (3) / None (1)
- Timeline Progress: Ahead (5) / On Schedule (3) / Delayed (1)

---

### 4.4 · Location & Market Dynamics (15%)

**Objective:** Оценить investment potential локации — accessibility, amenities, market demand, future growth.

**Key Factors:**
- **Strategic Position** — distance к beaches, business centers, airport, transport hubs
- **Amenity Access** — hospitals, shopping, schools, entertainment
- **Infrastructure Development** — current + planned projects
- **Market Fundamentals** — supply-demand, absorption, price trends

**5-Level Maturity Progression:**

**Level 1 — Basic Location Profile**
- >2km от main roads/transport · limited amenities within 3km
- Poor/no beach access · underdeveloped infrastructure
- Low historical appreciation · weak rental demand
- No infrastructure development planned

**Level 2 — Developing Location**
- 1–2km от main roads · basic amenities within 2km
- Beach access within 3km · basic infrastructure
- Moderate appreciation · growing rental demand
- Some infrastructure improvements planned

**Level 3 — Established Location**
- Direct access к main roads · essential amenities within 1km
- Beach access within 2km · well-developed infrastructure
- Stable appreciation · consistent rental demand
- Clear development pipeline

**Level 4 — Premium Location**
- Strategic position on/close to main roads · amenities within 500m
- Beach access within 1km · advanced infrastructure · multiple transport
- Strong appreciation · high rental demand
- Major infrastructure improvements ongoing

**Level 5 — Ultra-Prime Location**
- Prime position с multiple access routes · immediate amenity access
- Direct beach access или premium views · state-of-the-art infrastructure
- Exceptional appreciation · premium rental demand
- Significant infrastructure investments completed/ongoing · established high-value area

**Scoring Components:**
- Distance to Key Amenities: <1km (5) / 1–2km (3) / >2km (1)
- Market Demand: High (>70% absorption) (5) / Moderate (30–70%) (3) / Low (<30%) (1)

---

### 4.5 · Financial Structure & Payment Protection (10%)

**Objective:** Оценить financial risk structure и payment terms для покупателей.

**Key Factors:**
- **Payment Structure** — distribution of payments across stages
- **Financial Securities** — bank guarantees, company guarantees
- **Construction Progress Linkage** — alignment payments с milestones
- **Default Protection** — mechanisms for delays/non-completion

**5-Level Maturity Progression:**

**Level 1 — High-Risk Payment Structure**
- Large upfront payment (>50% before foundation)
- No guarantees · fixed schedule regardless of construction
- No delay protection · no refund mechanism

**Level 2 — Basic Payment Terms**
- Substantial upfront (35–50% before foundation)
- Basic company guarantee · semi-flexible schedule
- Minimal delay compensation · basic refund terms

**Level 3 — Standard Market Terms**
- Moderate upfront (25–35% before foundation)
- Enhanced company guarantee · construction-linked schedule
- Standard delay compensation · clear refund policy
- Verified construction milestones

**Level 4 — Buyer-Favorable Terms**
- Lower upfront (<35% before foundation)
- Bank или strong corporate guarantee · flexible schedule
- Substantial delay compensation · quick refund guarantee
- Independent construction verification
- Developer track record of delivered projects

**Level 5 — Premium Buyer Protection**
- Minimal upfront (<20% before foundation)
- Premium bank/corporate guarantees · highly flexible (construction-linked, extended plans, early-payment discounts)
- Comprehensive delay compensation · guaranteed refund
- Third-party construction verification · clear funding structure

**Scoring Component:**
- Buyer Protections: Full (Escrow, Guarantees) (5) / Limited (3) / None (1)

---

### 4.6 · Investment Return & Appreciation (10%)

**Objective:** Оценить construction-stage appreciation + post-completion returns (rental + value growth).

**Key Factors:**
- **Early-Stage Value Growth** — launch → completion price appreciation
- **Rental Income** — achievable gross yields vs market rates
- **Post-Completion Growth** — long-term appreciation
- **Income Optimization** — rental programs, value-added services

**5-Level Maturity Progression:**

**Level 1 — Basic Return Profile**
- Construction-stage appreciation <10%
- Gross yield <5% · net yield <3%
- Post-completion annual appreciation <5%
- High operating costs (>40% of gross income)

**Level 2 — Moderate Return Profile**
- Construction-stage 10–15%
- Gross 5–6% · net 3–4%
- Post-completion 5–7%
- Standard operating costs (35–40%)

**Level 3 — Strong Return Profile**
- Construction-stage 15–20%
- Gross 6–7% · net 4–5%
- Post-completion 7–9%
- Optimized operating costs (30–35%) · professional rental program

**Level 4 — Premium Return Profile**
- Construction-stage 20–25%
- Gross 7–8% · net 5–6%
- Post-completion 10–12%
- Efficient operating costs (25–30%) · comprehensive rental program

**Level 5 — Exceptional Return Profile**
- Construction-stage >25%
- Gross >8% · net >6%
- Post-completion >10%
- Optimized costs (<25%) · professional asset management · multiple value-added services

**Scoring Component:**
- Return Potential: High (>7% yield или >10% appreciation) (5) / Moderate (5–7% yield или 5–10% appreciation) (3) / Low (<5% yield или <5% appreciation) (1)

---

### 4.7 · Sales & Marketing Effectiveness (5%)

**Objective:** Оценить sales/marketing capabilities — strategy, execution, market positioning.

**Key Factors:**
- **Marketing Quality** — professionalism, completeness, transparency of materials
- **Sales Performance** — velocity, pricing strategy, target achievement
- **Market Reach** — channels effectiveness, demographic reach
- **Brand Positioning** — market positioning, differentiation

**5-Level Maturity Progression (сокращённо):**

- **Level 1** — Basic brochures, below-market absorption, single language, no international
- **Level 2** — Standard brochures, average absorption, dual language, basic international
- **Level 3** — Professional brochures, good absorption, multi-language, active international
- **Level 4** — Premium materials, above-market absorption, diverse sales network, broad reach
- **Level 5** — World-class materials, market-leading absorption, global network, omni-channel

**Scoring Components:**
- Sales Status: 75% Units Sold (5) / 50–75% (3) / <50% (1)
- Marketing Reach: Global Multi-Channel (5) / Regional (3) / Local Only (1)

---

### 4.8 · Liquidity & Exit Strategy (5%)

**Objective:** Оценить ease of exit и liquidity characteristics.

**Key Factors:**
- **Market Liquidity** — transaction volume, time-to-sell
- **Property Characteristics** — unit size, price point vs market preferences
- **Secondary Market Viability** — resale market strength
- **Target Buyer Pool** — size, diversity (local, international, investors, end-users)

**5-Level Maturity Progression:**

- **Level 1** — No clear exit, time-to-sell >12 months, limited buyer pool
- **Level 2** — Limited liquidity, 9–12 months, limited diversity
- **Level 3** — Standard liquidity, 6–9 months, moderate diversity
- **Level 4** — Strong liquidity, 3–6 months, diverse pool, developer buy-back options
- **Level 5** — Premium liquidity, <3 months, extensive pool, guaranteed buy-back, international networks

**Scoring Component:**
- Liquidity: Strong Buyer Pool & Resale (5) / Moderate (3) / Weak (1)

---

## 5 · Scoring Formula

### 5.1 · Формула итогового счёта

```
Total Score = (LRC × 0.20) + (DCF × 0.20) + (CQP × 0.15) + (LMD × 0.15)
            + (FSP × 0.10) + (IRA × 0.10) + (LES × 0.05) + (SME × 0.05)
```

Где каждая категория оценивается по 5-балльной шкале (или по weighted sum компонентов), затем нормализуется к 0–100.

### 5.2 · Score Modifiers

**Positive Modifiers** (прибавляются к итоговому score)
- **Bank Guarantee**: +2 points
- **Clean Land Title**: +1 point
- **Construction Ahead of Schedule**: +1 point

**Negative Modifiers** (вычитаются)
- **Legal Disputes**: −2 points
- **High Pre-Sale Dependency** (>70%): −1 point
- **Significant Construction Delays** (>6 месяцев): −1 point

### 5.3 · Disqualification Modifiers

Следующие условия приводят к **дисквалификации** — проект не получает рейтинг до разрешения:

1. **Structural or Safety Deficiencies** — severe physical deterioration, health/safety risks
2. **Unresolved Legal Complications** — ongoing disputes, unclear titles, regulatory non-compliance
3. **Market or Regulatory Limitations** — zones с restrictions, moratoriums, commercial viability issues
4. **Data Incompleteness or Inaccuracy** — unreliable data (pricing, ownership, permits, structural plans)

Застройщику предоставляется **appeal and correction process** — можно устранить issue и повторно подать заявку.

---

## 6 · Rating Bands и их интерпретация

| Score | Grade | Интерпретация | Для кого подходит |
|---|---|---|---|
| **90–100** | **AAA** | **Prime Investment Grade** — top-tier project, robust legal structure, elite developer track record, strategic location, strong upside. | Institutional investors, family offices, UHNW, homebuyers ищущие maximum security |
| **80–89** | **AA** | **Strong Opportunity** — high-quality asset с minor concerns. Solid foundations, low-to-moderate risk. | Most investor profiles, сильные returns |
| **70–79** | **A** | **Moderate Risk** — acceptable fundamentals, требует targeted DD (e.g., construction, contract). | Mid-risk portfolios, moderate-risk investors |
| **60–69** | **BBB** | **Watchlist Tier** — borderline. Потенциальные concerns в legal, financial protection, construction. | Только при clear risk premiums (discounts, guarantees), tactical portfolios |
| **<60** | **BB** | **High-Risk Investment** — significant legal/financial/executional issues. | Только opportunistic investors с turnaround experience, deep discounting обязателен |

### Application Guidelines для myUNO-консьержа

**AAA/AA Scores** — default recommendation для P8 (Passive Investor) и P9 (HNW). Использовать в prime offerings.

**A Scores** — показывать moderate-risk инвесторам с explanation of specific DD needed. Pairs well с favorable pricing.

**BBB Scores** — показывать только если инвестор явно запрашивает emerging opportunities, с risk disclaimer.

**BB Scores** — **не показывать по умолчанию**. Доступны только по прямому запросу от opportunistic investor. Требуется custom risk briefing от Павла.

---

## 7 · 7-Step Assessment Process

Это официальная последовательность для каждого ClearView assessment. SLA: **3–4 недели** от initial submission до final certificate.

### Шаг 1 · Documentation Collection (неделя 1)

**Цель:** Formal project onboarding.

- Персонализированный checklist отправляется developer-у (см. Раздел 8)
- Submission через secure data room (myUNO Developer Portal)
- Обязательные категории: legal, technical, financial, marketing
- Minimum viable submission: land title, permits, ownership structure, floorplans, pricing, payment terms, construction schedule

### Шаг 2 · Documentation Review (неделя 1–2)

**Цель:** Verify legal structure, risk exposure, readiness.

- Legal DD: title deed, zoning, EIA, permits
- Financial structure: developer equity, pre-sale reliance, guarantees
- Contract clarity: S&P agreement, leasehold/freehold setup
- Gap identification + red flag documentation

### Шаг 3 · On-Site Validation & Physical Analysis (неделя 2)

**Цель:** Verify real-world conditions, physical integrity.

- Site inspection: access, utilities, construction status
- Quality assessment: materials, workmanship, infrastructure
- Location benchmarking: beaches, roads, schools, demand drivers
- Compliance check vs approved masterplan

### Шаг 4 · Structured Interview with Developer (неделя 2–3)

**Цель:** Assess credibility, capacity, alignment.

- Discussion с founder или project manager
- Review of timeline, funding, contractor relationships
- Assessment of delivery history и risk mitigation
- Clarification of strategic vision, target audience, exit model

### Шаг 5 · Market Research & Comparative Analysis (неделя 3)

**Цель:** Validate commercial logic, investor potential.

- Price comparison vs similar inventory
- Rental yield benchmarks, absorption rates
- Growth trends, infrastructure pipeline (airport, roads, hotels)
- Buyer segments, liquidity expectations

### Шаг 6 · Scoring, Reporting & Finalization (неделя 3–4)

**Цель:** Assign score, document rationale, issue report.

- Каждая из 8 категорий scored (weighted total 0–100)
- Modifiers applied
- **Internal peer review** by secondary analyst (обязательно — protects integrity)
- Scorecard + Executive Summary prepared
- **Final score shared с developer для factual accuracy check** (24 часа на возражения)
- После финализации: Official ClearView Rating + Certificate issued

### Шаг 7 · Post-Assessment Monitoring (ongoing)

**Цель:** Maintain integrity over time.

- Quarterly progress updates обязательны от developer
- Team reviews milestone adherence
- **Score adjustments** applied при material changes (delays, revised permits, sales milestones hit/missed)
- Investor alerts при upgrade/downgrade (opt-in)

---

## 8 · Documentation Checklist

Full list of documents required от developer для assessment. Submission через Developer Portal (`developers.myuno.app`).

### 8.1 · Legal & Regulatory Compliance (LRC)

**Land Title Documentation**
- [ ] Original land title deed (Chanote / Nor Sor 3 Gor / Other)
- [ ] Land ownership history (past 5 years)
- [ ] Land survey documentation
- [ ] Updated land department search results

**Development Permits**
- [ ] Building permit
- [ ] EIA approval (if required)
- [ ] Zoning compliance statement
- [ ] Local authority approvals

**Corporate Documentation**
- [ ] Company registration documents
- [ ] Shareholder structure
- [ ] Foreign business license (if applicable)
- [ ] Board resolutions approving development

### 8.2 · Developer Credibility & Financial Stability (DCF)

**Track Record**
- [ ] Portfolio of completed projects
- [ ] Completion certificates
- [ ] Sales records for previous projects
- [ ] Customer testimonials/references
- [ ] Awards and recognitions

**Financial**
- [ ] Audited financial statements (last 3 years)
- [ ] Project feasibility study
- [ ] Corporate guarantees
- [ ] Construction funding proof

### 8.3 · Construction Quality & Progress (CQP)

**Quality Control**
- [ ] Construction methodology statement
- [ ] QA protocols + statements
- [ ] Material specifications
- [ ] Testing protocols + certificates
- [ ] Third-party quality inspection reports
- [ ] Construction timeline + milestones

**Progress**
- [ ] Construction schedule
- [ ] Progress reports + photos
- [ ] Contractor agreements
- [ ] Site inspection reports
- [ ] Construction insurance policies

### 8.4 · Location & Market Analysis (LMD)

**Location**
- [ ] Area master plan
- [ ] Infrastructure maps
- [ ] Proximity analysis к amenities
- [ ] Transport accessibility study
- [ ] Future development plans for area

**Market**
- [ ] Market research reports
- [ ] Comparable property analysis
- [ ] Area transaction history
- [ ] Rental market analysis

### 8.5 · Financial Structure & Payment Protection (FSP)

- [ ] Payment schedule
- [ ] Bank guarantee documentation
- [ ] Escrow agreement (if applicable)
- [ ] Refund policy documentation
- [ ] Default protection mechanisms
- [ ] Payment milestone verification process

### 8.6 · Investment Returns (IRA)

- [ ] Rental yield analysis
- [ ] Capital appreciation projections
- [ ] Operating cost estimates
- [ ] Management fee structure
- [ ] Historical returns data (if available)
- [ ] Rental program details

### 8.7 · Sales & Marketing (SME)

- [ ] Sales velocity reports
- [ ] Reservation agreements
- [ ] Price lists + promotions
- [ ] Sales team structure
- [ ] Agency agreements
- [ ] Marketing materials

### 8.8 · Liquidity & Exit (LES)

- [ ] Secondary market analysis
- [ ] Resale procedures
- [ ] Buy-back terms (if applicable)
- [ ] Management transfer procedures
- [ ] Historical transaction data

### 8.9 · Требования к документам

- Все документы должны быть **текущие** (не старше 3 месяцев, если не указано иначе)
- Переводы для non-Thai/non-English документов (RU/EN обязательны)
- Digital и hard copy версии
- Обновления для time-sensitive документов
- **Third-party verification обязательна** для key documents

---

## 9 · Deliverables

Всё, что developer и investor получают по результатам assessment.

### 9.1 · Для Developer (B2B)

После Assessment:

1. **Full ClearView Scoring Report** (25–40 страниц)
   - Detailed breakdown по всем 8 категориям
   - Maturity level для каждой + rationale
   - Modifiers и их обоснование
   - Benchmark comparison с аналогичными проектами
   - Recommendations для улучшения score

2. **Executive Summary** (2–3 страницы)
   - Краткое описание проекта
   - Финальный score + rating band
   - Top 3 strengths + top 3 risks
   - Investment thesis в одном абзаце

3. **Visual Scorecard** (1 страница, graphic)
   - Radar chart 8 категорий
   - Score gauge
   - Rating band badge

4. **Official ClearView Rating Certificate** (1 страница, brandable)
   - Grade (AAA–BB) + Score
   - Date of issuance + expiration (12 месяцев)
   - Signature omega-Ignatev Estate
   - QR-код для verification (ведёт на публичную карточку проекта)

5. **Usage Rights**
   - Право публиковать certificate в marketing materials
   - Право цитировать score в брошюрах, сайте, press
   - Право использовать ClearView badge на проектных материалах
   - **Ограничения:** нельзя модифицировать score или visual, нельзя использовать после expiration без renewal

6. **Quarterly Monitoring (при подписке)**
   - Quarterly progress review
   - Updated score при material changes
   - Investor alerts (upgrade/downgrade)
   - Annual full re-assessment по упрощённой процедуре

### 9.2 · Для Investor (B2C)

**Free Tier (публичный)**

- Public Score Badge на карточке проекта в PropertySearch
- Rating band (AAA–BB)
- Rating date + expiration

**Premium Report (฿2,900)**

- 2–3 страницы Executive Summary
- Visual Scorecard с radar chart
- Top strengths + risks
- Basic recommendations для своего DD

**Full Report (฿4,900)**

- Полный Scoring Report (25–40 стр)
- Детальный breakdown по 8 категориям
- Сравнение с 3 аналогичными проектами
- Buyer-specific risk commentary

### 9.3 · Для Market (публичный)

- **Quarterly ClearView Report** — PDF с distribution рейтингов, топ-10 проектов, market trends
- **Public Dashboard** (`clearview.myuno.app`) — поисковый индекс всех оцененных проектов
- **API (B2B, по подписке для банков/оценщиков)** — доступ к scoring data (฿5,000/мес)

---

## 10 · Монетизация

### 10.1 · Три revenue streams

**Stream A — Developer Assessment Fee (B2B, direct)**

- Базовая цена: **฿350,000–600,000 за проект** (≈$10,000–17,000)
- Обоснование: 30–40% от сопоставимого institutional audit (Knight Frank/Colliers) — ฿1.2–1.8M
- Варианты:
  - **Standard**: ฿350K (стандартный проект ≤ 80 units)
  - **Premium**: ฿500K (large project, 80–200 units, complex structure)
  - **Enterprise**: ฿600K + custom (mega-project, 200+ units, multiple phases)

**Stream B — Investor Report (B2C, volume)**

- **Premium Report**: ฿2,900 (≈$85)
- **Full Report**: ฿4,900 (≈$140)
- Distribution: digital PDF via email, myUNO account, WhatsApp

**Stream C — Quarterly Monitoring Subscription (B2B, retainer)**

- ฿15,000/квартал/проект (≈$430)
- 4 квартальных reviews + score updates + investor alerts
- Annual renewal: ฿60,000 discounted (one month free)

### 10.2 · Год 1 · финансовая проекция в контексте $1M goal

Из PROJECT.md раздел 19: **Y1 target $1M, 70% = $700K real estate + invest**.

**Вклад ClearView в Y1:**

| Поток | Объём | Выручка | % от $1M |
|---|---|---|---|
| **A · Developer Assessments** | 8–12 × ฿350–600K | ฿3.5–6M = $100–170K | **10–17%** |
| **B · Investor Reports** | 300 Premium + 80 Full | ฿1.26M = $36K | **3.6%** |
| **C · Monitoring (часть клиентов)** | 4 проекта × ฿60K annual | ฿240K = $7K | **0.7%** |
| **Прямая выручка ClearView** | | **$143–213K** | **14–21%** |
| **Косвенно — ускорение real estate** | +4–6 сделок × $20K | +$80–120K | (усиливает 70%) |

**ClearView — самостоятельный revenue pillar** наравне с Estate PM ($120–180K). В сумме с ускорением real estate — **$223–333K годовая contribution** к таргету.

### 10.3 · Cost structure

**Direct costs на assessment:**
- Analyst time (3–4 недели × 60% FTE) = ฿40,000
- Site inspection + travel = ฿5,000
- Peer review (Павел, 4 часа) = ฿20,000
- Documentation + certificate design = ฿8,000
- **Total direct cost per assessment ≈ ฿73,000**

**Margin на Standard assessment (฿350K): 79%**
**Margin на Premium (฿500K): 85%**

Это **extremely high-margin product** — типичный для консалтинга.

### 10.4 · Scaling economics

По мере роста базы оцененных проектов:
- **Benchmark dataset улучшается** → assessment быстрее (2 недели вместо 4)
- **AI-автоматизация** → аналитик может делать 2 assessments в месяц вместо 1
- **Brand premium** → можно поднимать цены (Y2: ฿450–750K, Y3: ฿600K–1M)

Y3 projection: **40+ assessments/год = ฿18–25M = $500–700K** в одном только Stream A.

---

## 11 · Операционная модель

### 11.1 · Команда ClearView

**Y1 (текущий объём 8–12 assessments):**
- **Analyst (0.6 FTE)** — primary assessor, взаимодействие с developer, документы, site visits. Наём к месяцу 3.
- **Pavel (peer review, 10% времени)** — secondary review, quality gate, final sign-off на certificate
- **Technical writer (freelance)** — финализация reports (10 часов на report)

**Y3 (40+ assessments):**
- 2 analysts full-time
- 1 site inspector (specialist в quality & construction)
- Pavel выходит из operational role в governance (10% → 2%)

### 11.2 · Workflow через Supabase

Новая таблица `clearview_projects` с полями:
- project_id, developer_id, submission_date
- status (submitted / under_review / site_visit / scoring / final_review / published / monitoring)
- scores (jsonb) — по 8 категориям + final
- modifiers (jsonb) — positive/negative
- grade (enum: AAA, AA, A, BBB, BB, DISQUALIFIED)
- certificate_url, expiration_date, monitoring_subscribed (boolean)

RLS:
- Developer видит только свой проект
- Analyst видит все assigned проекты
- Pavel видит все
- Public видит только published + grade + high-level summary

### 11.3 · Developer Portal Flow

```
1. Developer заходит на developers.myuno.app
2. Заполняет intake form (15 min)
3. Оплачивает assessment fee (Stripe) — 50% upfront, 50% at delivery
4. Получает personalized document checklist + secure upload link
5. Analyst assigned, starts review (ETA 1 неделя на docs)
6. Site visit scheduled
7. Interview scheduled
8. Draft score shared для factual review (48 часов на возражения)
9. Peer review by Pavel
10. Certificate issued + PDF report + badge
11. Optional: enroll in quarterly monitoring
```

### 11.4 · Public Dashboard Flow

```
1. User заходит на clearview.myuno.app
2. Видит list/map всех оцененных проектов
3. Фильтры: grade, location, price range, developer
4. Клик на проект → public card (photo, grade, score, rating date)
5. CTA: "Premium Report — ฿2,900" или "Full Report — ฿4,900"
6. Оплата через Stripe → instant PDF delivery + email
```

---

## 12 · Tone of Voice для ClearView

ClearView — **самый строгий коммуникационный регистр** во всей платформе. Это позиция нотариуса, не продавца.

**Обязательные правила (дополняют `03-tone-of-voice.md`):**

- Score всегда приводится в полной нотации: «84 (AA)» — не «высокий» или «отличный»
- Modifiers всегда транспарентны: «84 (AA) · +2 bank guarantee · −1 pre-sale dependency»
- Weaknesses указываются наравне со strengths — «Что нас беспокоит: high pre-sale dependency (−1)»
- Никогда не использовать «лучший», «уникальный», «революционный» применительно к проекту
- **Никогда не гарантировать возврат инвестиций** — ClearView оценивает риск, не прогнозирует доход

### 12.1 · Эталонные примеры

**✅ Правильно:**

> **Rhom Bho Marina.** ClearView Score: 84 (AA).
> Legal compliance 18/20. Developer credibility 17/20. Construction quality 13/15. Location 12/15. Financial structure 8/10. Return potential 8/10. Liquidity 4/5. Marketing 4/5.
> Modifiers: +2 (bank guarantee), −1 (high pre-sale dependency). Final: 84.
>
> **Strengths:** Chanote title, подтверждённый track record застройщика (5+ projects), bank guarantee.
> **Что нас беспокоит:** pre-sale dependency 72% — риск задержки при замедлении продаж.
>
> Full Report: ฿4,900.

**❌ Неправильно:**

> Потрясающий проект Rhom Bho Marina с рейтингом AA! Один из лучших на рынке! Гарантированная доходность 8%, престижный застройщик, скорее инвестируйте!

### 12.2 · Disclaimer (обязателен на каждом отчёте)

> *The rankings and assessments provided are for informational purposes only and based on publicly available data, developer-provided information (unverified where indicated), and market analysis as of the publication date. They do not constitute professional financial, legal, or investment advice and should not be solely relied upon for investment decisions. Users should perform independent due diligence and seek professional advice.*

---

## 13 · Legal considerations

### 13.1 · Disclaimer (включается во все отчёты)

- **No Warranty or Guarantee** — accuracy not guaranteed, rankings subject to updates
- **No Liability** — не несём ответственности за damages из use/reliance
- **Not an Endorsement** — rankings не означают endorsement проекта/developer
- **Information Subject to Change** — rankings отражают data на момент evaluation
- **Risk Disclosure** — off-plan investment carries inherent risks
- **Appeal Process** — developers могут запросить review при inaccuracies

### 13.2 · Data Protection

- PDPA compliance (тайский GDPR) обязательна
- Developer documents хранятся в Supabase Storage с encryption at rest
- Доступ только для assigned analyst + Pavel (RLS-enforced)
- Retention: 7 лет после expiration certificate (audit trail)

### 13.3 · Conflicts of Interest

- ClearView не оценивает проекты, где Ignatev Group имеет equity stake
- ClearView не оценивает проекты, где Pavel персонально брокерит сделку >$500K (автоматический conflict)
- В таких случаях — **disclosure + assessment третьей стороной** (e.g., Knight Frank partnership)

---

## 14 · Key Differentiators

Что делает ClearView уникальным на рынке Phuket / SEA:

**1. Technology-Enhanced Scoring**
- AI-supported analysis + professional DD
- Standardized scoring across 50+ risk indicators
- Hybrid approach — objectivity + adaptability

**2. Comprehensive Risk Mitigation Framework**
- 8 weighted categories
- 5-level maturity progression
- Score modifiers + disqualification criteria

**3. Structured Documentation Standards**
- Full checklist (Раздел 8)
- Institutional-level documentation
- Third-party verification

**4. Continuous Project Monitoring**
- Quarterly updates
- Score adjustments при material changes
- Investor alerts

**5. Multi-Layered Validation**
- Не только paperwork
- Structured developer interviews
- On-site inspections by certified analysts
- **Scoring reflects ground truth, not marketing claims**

---

## 15 · Roadmap интеграции в платформу

### 15.1 · Milestone M8 · ClearView Product Integration

Это дополнение к вехам M1–M7 из `04-implementation-protocol.md`. Может запускаться параллельно с M4–M6.

**M8a · Data schema (1 день)**
- Таблицы: `clearview_projects`, `clearview_scores`, `clearview_modifiers`, `clearview_reports`, `clearview_monitoring`
- RLS policies
- Миграции в `/supabase/migrations/`

**M8b · Public Score Badge (0.5 дня)**
- Компонент `<ClearViewBadge grade={...} score={...} />` из design system
- Интеграция в карточку проекта в PropertySearch
- Clickable → public summary card

**M8c · Report PDF Generator (2 дня)**
- Template с брендингом myUNO
- Генерация через Edge Function (Deno + puppeteer / pdfkit)
- Storage в Supabase Storage с signed URLs

**M8d · Developer Self-Service Submission (2 дня)**
- Intake form (Typeform initially, custom UI later)
- Secure upload via Supabase Storage
- Email/WhatsApp notifications для status updates

**M8e · Payment Flow (1 день)**
- Stripe Connect: Assessment split payment (50/50)
- Investor Reports: instant checkout
- Quarterly Monitoring: recurring subscription

**M8f · Quarterly Alert System (1 день)**
- Cron job (Supabase Edge Function) — проверка expirations и milestone changes
- WhatsApp/email alerts для opted-in investors
- +35 lead scoring trigger при просмотре report

**Total M8: ~8 рабочих дней AI-инженера + content work**

### 15.2 · Content roadmap

**Месяцы 1–2:**
- 2 free pilot assessments для Sansiri + Rhom Bho (existing relationships)
- Первый Quarterly Report Q1 2026 (с 2 проектами, устанавливает baseline)
- PR-питч в Bangkok Post / Thaiger

**Месяцы 3–4:**
- 3–4 paid assessments
- Public Dashboard MVP
- Subscription для Quarterly Monitoring

**Месяцы 5–6:**
- 6–8 paid assessments
- Partnership с 1–2 банками (data licensing)
- First BOI / government presentation

**Месяцы 7–12:**
- Scaling до 12 assessments/год
- Knight Frank / Colliers partnership для third-party verification
- Expansion в Koh Samui (pilot)

---

## 16 · KPIs и метрики

### 16.1 · Leading indicators (Y1)

- **Assessments completed**: 8–12
- **Average revenue per assessment**: ฿420,000
- **Reports sold (Premium + Full)**: 380+
- **Monitoring subscribers**: 4+
- **Public Dashboard MAU**: 5,000+
- **Press mentions (цитирование score)**: 10+

### 16.2 · Lagging indicators (Y1)

- **Direct revenue от ClearView**: $143–213K
- **Revenue acceleration от real estate**: +$80–120K
- **Total contribution к Y1 $1M goal**: $223–333K (22–33%)

### 16.3 · Strategic indicators

- **Brand equity**: ClearView score упоминается в Bangkok Post / Thaiger как reference → measurable through media monitoring
- **Market coverage**: % всех активных off-plan проектов Phuket, имеющих рейтинг → target 15% к Y2, 30% к Y3
- **Institutional adoption**: партнёрства с банками, оценщиками, BOI → target 1–2 partnerships к Y2

---

## 17 · Что НЕ делает ClearView

Важно зафиксировать границы, чтобы избежать ожиданий, которые продукт не оправдывает.

- **Не гарантирует investment returns** — оценивает risk, не прогнозирует прибыль
- **Не заменяет персональную DD покупателя** — база, не полный ответ
- **Не оценивает resale/secondary market properties** — только off-plan
- **Не является regulatory approval** — BOI/EIA остаются за государством
- **Не даёт legal advice** — направляем к юристам
- **Не имитирует institutional ratings (S&P, Moody's)** — это private market tool, не securities rating

---

## 18 · Эволюция и управление

### 18.1 · Review cycle

- **Quarterly** — review методологии с analysts. Новые insights → V3.1, V3.2
- **Annually** — major review с внешним audit-партнёром (Knight Frank, Colliers)
- **On-event** — при major market shift (new regulation, flood event, etc.)

### 18.2 · Versioning

- V3 (March 2025) — current
- Изменения методологии → CHANGELOG в `/docs/canonical/CHANGELOG.md`
- Major changes (веса, rating bands) → V4, затрагивает все существующие certificates

### 18.3 · Owner

- **Methodology owner**: Pavel Ignatev (final approval on any changes)
- **Operational owner**: Lead Analyst (hired Month 3)
- **Product owner**: CTO (integration в платформу)

---

## 19 · Шаблон коммерческого питча для developer

Используется Павлом при первом разговоре с застройщиком. Следует `03-tone-of-voice.md`.

> «[Имя developer], ваш проект [X] — ваш главный актив. Но иностранный покупатель не может оценить его напрямую — он видит брошюру и слово брокера.
>
> ClearView — это институциональный рейтинг AAA–BB с сертификатом, выпускаемый Ignatev Estate — структурой, аффилированной с представителем Правительства Москвы в Таиланде. Методология V3, 8 категорий, audited peer review, quarterly monitoring.
>
> Стоимость — ฿[350K / 500K / 600K] в зависимости от scale проекта. Вы получаете:
> — Полный Scoring Report (30+ страниц)
> — Executive Summary для инвесторов
> — Official Certificate с QR-verification
> — Право использовать ClearView badge в marketing на 12 месяцев
> — Публикацию в Quarterly Report (PR-охват Bangkok Post)
>
> Ваш preliminary score на основе public data — [X]. Финальный может отличаться по результатам on-site validation.
>
> Готовы к assessment? Подписываем NDA сегодня, submission в течение 2 недель, сертификат через 3–4 недели.»

---

## 20 · Связанные артефакты

Для работы AI-инженеров и content-team при реализации:

- `PROJECT.md` — Моат 8, сделки 11–13
- `01-segmentation-framework.md` — персоны P8/P9 (инвесторы), P22 (developer)
- `02-service-catalogue.md` — ClearView-услуги в разделе Real Estate
- `03-tone-of-voice.md` — раздел 10.3 Real Estate + 12.1 этого файла
- `04-implementation-protocol.md` — M8 milestone
- `05-visual-design-system.md` — Badge component, certificate template

### 20.1 · Технические зависимости

- Supabase `public` schema (migrations)
- Stripe Connect (payment splits)
- Supabase Storage (documents, reports, certificates)
- Resend (email notifications)
- WhatsApp Cloud API (investor alerts)
- Claude Sonnet 4 (AI-assisted scoring draft — peer-reviewed by analyst)
- puppeteer/pdfkit (PDF generation)

### 20.2 · Content assets to create

- Certificate template (design + Figma file)
- Report template (25–40 pages, design + generator)
- Public Dashboard UI (clearview.myuno.app)
- Developer Portal intake flow
- Quarterly Report template (PR asset)
- Legal disclaimer (reviewed by Thai lawyer)

---

## 21 · Заключение

ClearView — не вспомогательный инструмент. Это **центральный моат платформы myUNO** — единственный продукт, превращающий субъективные оценки off-plan рынка в объективный, институциональный, публикуемый standard.

Через 3 года ClearView — крупнейшая база off-plan-рейтингов в Юго-Восточной Азии, цитируемая Bangkok Post, используемая банками при DD, обязательная для BOI-заявок в девелопменте.

Через 5 лет — самый ценный single asset внутри Ignatev Group (выше, чем Estate PM или Capital advisory), с операционной маржой 80%+, узнаваемостью бренда на уровне TREES/LEED для sustainability.

Это не product feature. Это **стратегическое позиционирование компании** как того самого «камертона рынка» из Тезиса второго PROJECT.md.

---

*ClearView™ Canonical Methodology · v1.0 · April 2026 · Pavel Ignatev · Ignatev Estate Co., Ltd.*
*Prepared by: Ignatev Estate Co., Ltd. · Plaza Del Mar, Office 115–116 · Pasak-Koktanod Rd · Cherngtalay · Thalang · Phuket 83110 · +66 92 240 7355 · info@ignatevestate.co.th*

*Источник методологии: V3 of ClearView Scoring Methodology (March 2025). Адаптация для canonical system myUNO: April 2026.*
