
# Аудит раздела «Инвестиции» и план реструктуризации UX

## 1. Что сейчас (карта поверхностей)

`/invest/*` содержит **23 страницы**, плюс пересекается с тремя соседними деревьями:
`/property/*` (PropertyHub, offplan, resale, commercial, land, hotels, developers, clearview),
`/newbuilds/*` (Landing, Map, Compare, Calculator, Areas, DueDiligence),
`/capital/*` (внутренний CRM для команды).

```
/invest
├── /              InvestmentHubLanding   ← лендинг #1 (5 zones)
├── /thailand      InvestInThailand       ← лендинг #2 «почему Таиланд»
├── /real-estate   InvestmentRealEstateZone → внутри сидит InvestmentIndex (лендинг #3)
├── /business      InvestmentBusinessZone
├── /knowledge     InvestmentKnowledgeZone
├── /services      InvestmentServicesZone
├── /quiz          InvestorQuiz
├── /dashboard     InvestorDashboard
├── /calculator    InvestmentCalculatorPage   ← калькулятор #1
├── /pitch         InvestmentPitch            ← raise-форма #1 (4 шага)
├── /raise         RaiseFunding               ← raise-форма #2
├── /submit        InvestmentSubmit           ← raise-форма #3 (5 шагов)
├── /deals         InvestmentDeals            ← публичная доска
├── /deal/:id      InvestmentDealPublicDetail
├── /project/:id   InvestmentDetail
├── /business/:slug InvestmentBusinessDetail
├── /articles      InvestmentArticles
├── /articles/:slug InvestmentArticleDetail
├── /capital-deal      CapitalDealIntake     ← advisory #1
├── /capital-advisory  CapitalAdvisoryLanding ← advisory #2
└── /ops/{market|deals|network|execution} InvestmentHubShell ← вторая, несовместимая IA-модель (4 zones)
```

## 2. Найденные конфликты

| # | Проблема | Доказательство |
|---|---|---|
| 1 | **Три лендинга-перекрытия** | `InvestmentHubLanding` (5 zones + featured rails) и `InvestmentIndex` (та же логика с подборкой) — последний даже рендерится внутри `InvestmentRealEstateZone`. На `/invest/real-estate` пользователь видит лендинг внутри лендинга. |
| 2 | **Две взаимоисключающие IA-модели** | `InvestmentHubLanding` строит мир из 5 зон (RE / Business / Knowledge / Services / Raise). `InvestmentHubShell` (`/invest/ops/*`) — из 4 (Market / Deals / Network / Execution). Это разные ментальные модели на одном дереве. |
| 3 | **Три формы «подать проект»** | `/invest/submit`, `/invest/raise`, `/invest/pitch` — все три собирают raise-заявки, но с разной таксономией (DEAL_INTENTS vs INVESTMENT_CATEGORIES vs BusinessListingType) и разными витринами. Лендинг отправляет CTA то в `/invest/submit`, то в `/invest/raise` — непредсказуемо. |
| 4 | **Два advisory-канала** | `/invest/capital-advisory` и `/invest/capital-deal`. Оба пишут в `capital_intro_requests`, отличаются только `request_type`. Пользователь не понимает разницы. |
| 5 | **Параллельный «каталог недвижимости» в трёх местах** | `/property` (PropertyHub с табами rent/buy/newbuild/resale), `/newbuilds` (themed hub с тулзами), `/invest/real-estate` (опять то же). Один и тот же offplan-каталог достижим тремя путями с разной обвязкой. |
| 6 | **Калькулятор × 2, Due Diligence × 2** | `/invest/calculator` ≠ `/newbuilds/calculator`. `/newbuilds/due-diligence` (чек-лист самопроверки) ≠ ClearView (`/property/clearview`, оплачиваемый отчёт). Семантика близкая, разделение неочевидно. |
| 7 | **Knowledge × 2** | `/invest/knowledge` (InvestmentKnowledgeZone) и `/invest/articles` — параллельные хабы статей. |
| 8 | **ClearView не виден из Invest** | ClearView — ключевой инвест-инструмент (8-критериальный рейтинг, AAA-CCC, моат #8), но живёт в `/property/clearview` и `/clearview/for-developers`. На `/invest` нет ни одной ссылки. |
| 9 | **Hero-CTA дублируются внутри одной страницы** | На `InvestmentHubLanding` кнопки «Список сделок» и «Подача проекта» нарисованы дважды (hero block + capital-marketplace card) подряд. |
| 10 | **Сегменты Operating Model не отражены в IA** | Core memory фиксирует 3 целевых сегмента (Investor $2M+ / Relocator $300–800K / Second-home $200–500K), но в IA нет персонализированных entry-точек — всё свалено в общую витрину. |

## 3. Целевая модель IA

Один принцип входа: **«Что я хочу сделать?» — а не «куда меня посадить?»**.

```text
/invest                  Single entry. Один лендинг.
├── Buy-side: «вложить капитал»
│   ├── /invest/real-estate    каталог RE-инвест-объектов (offplan + resale + commercial + land + hotels)
│   ├── /invest/business       каталог businesses-for-sale + franchises
│   └── /invest/advisory       Capital Advisory ($2M+ private mandate, единая воронка)
│
├── Sell-side: «привлечь капитал»
│   └── /invest/raise          ОДНА воронка с 1-м шагом выбора intent
│                              (developer_raise | inventory | business_sale | startup | operating_partner)
│                              — потом ветвится внутри
│
├── Tools: «разобраться / посчитать»
│   ├── /invest/knowledge      статьи + гайды + кейсы (мердж articles + knowledge)
│   ├── /invest/calculator     ROI / IRR / payback (единый, ре-юзается из /newbuilds)
│   ├── /invest/clearview      перенесённый лендинг + apply
│   └── /invest/quiz           Investor Quiz → редирект в advisory или каталог
│
├── Personal: «моё»
│   ├── /invest/dashboard      портфель + интересы + статусы заявок
│   └── /invest/deals          публичная доска (только для авторизованных, как сейчас)
│
└── Admin / Ops (скрыто за AdminGuard):
    └── /invest/ops/*          InvestmentHubShell остаётся, но не подаётся как user-IA
```

`/property/*` остаётся **жилым/арендным** хабом (Nightly, Monthly, Yearly, Buy). Новостройки и вторичка из инвест-контекста ходят через `/invest/real-estate`, из бытового — через `/property` с теми же deeplink'ами в `OffplanIndex` / `ResaleIndex`. Никаких новых top-level роутов.

`/newbuilds/*` оставляем как **тематический themed hub** для SEO/marketing (developer-funded), но Calculator и DueDiligence на нём становятся прокси к `/invest/calculator` и `/invest/clearview` (один источник правды).

## 4. План — три волны

### Wave 1. Дедупликация без смены URL (1 PR, низкий риск)

Цель: убрать «два лендинга в одном экране» и три дубля raise-формы.

1. **Лендинг**: оставить `InvestmentHubLanding` как единственный `/invest`. Удалить дублирующий «Capital marketplace card» в hero. Использовать `InvestmentHubLanding` напрямую — не вкладывать `InvestmentIndex` в зоны.
2. **Real Estate zone**: `InvestmentRealEstateZone` перестаёт рендерить `InvestmentIndex`. Внутри только: banner коммерческих активов + рельса featured RE-проектов + ссылки в `/property/offplan`, `/property/resale`, `/property/commercial`, `/property/land`, `/property/hotels`.
3. **Raise-формы**: каноничной становится `/invest/raise` (универсальная 5-step `InvestmentSubmit`). `/invest/pitch` и `/invest/submit` → 301-редиректы на `/invest/raise?intent=...`. Удалить `RaiseFunding` (старая 4-step форма) — она дублирует `InvestmentSubmit` и работает на другой таксономии.
4. **Advisory**: `/invest/capital-deal` → 301 на `/invest/capital-advisory`. Объединить в одну страницу с двумя вкладками: «Personal mandate ($2M+)» и «Single deal ($200K+)» — обе всё равно пишут в `capital_intro_requests`, отличается только `request_type`.
5. **Knowledge**: `/invest/articles` → 301 на `/invest/knowledge`. Сделать `InvestmentKnowledgeZone` контейнером с табами «Articles | Guides | Cases».
6. **CTA-кнопки в `InvestmentHubLanding`**: убрать дубли «Список сделок / Подача проекта» (сейчас два раза подряд) — оставить один primary блок.

Результат Wave 1: `/invest` — 1 лендинг, 1 raise-форма, 1 advisory, 1 knowledge-хаб, без визуальных дублей.

### Wave 2. Подключить ClearView и Calculator (1 PR)

1. Перенести точку входа ClearView в Invest: `/invest/clearview` — копия `ClearViewLanding` с теми же CTA. `/property/clearview` остаётся как алиас (SEO).
2. Перенести точку входа Calculator: `/invest/calculator` остаётся, `/newbuilds/calculator` рендерит тот же компонент (одна реализация в `src/components/invest/ROICalculator.tsx`).
3. В `InvestmentHubLanding` добавить блок «Tools»: ClearView, Calculator, Knowledge, Quiz — четыре карточки, единый layout.
4. На `InvestmentHubShell` (`/invest/ops/*`) добавить явный `AdminGuard` бейдж «Internal ops» и убрать из публичной навигации — это не user-IA.

### Wave 3. Persona-aware entry (1 PR, опциональный)

1. На `/invest` после hero — блок «Я …» с тремя карточками персон из Operating Model:
   - **Investor $2M+** → `/invest/capital-advisory`
   - **Relocator $300–800K** → `/invest/real-estate?segment=relocator`
   - **Second-home $200–500K** → `/invest/real-estate?segment=second-home`
2. `InvestorQuiz` (`/invest/quiz`) использовать как fallback для тех, кто не определился — на выходе квиза один из трёх роутов.
3. В `useInvestmentProjects` добавить фильтр `segment` (мапится на `capital_range` и `project_type` уже существующих полей).

## 5. Маппинг «было → стало»

| Сейчас | После | Действие |
|---|---|---|
| `/invest` (InvestmentHubLanding) | `/invest` | Чистка дублей CTA |
| `/invest/thailand` (InvestInThailand) | удалить из верхнего меню, оставить как `/invest/why-thailand` SEO-страницу | keep, depriority |
| `/invest/real-estate` + InvestmentIndex внутри | `/invest/real-estate` без InvestmentIndex | refactor |
| `/invest/submit`, `/invest/raise`, `/invest/pitch` | `/invest/raise` (единая) | merge + 2 redirects |
| `/invest/capital-deal`, `/invest/capital-advisory` | `/invest/capital-advisory` (с табами) | merge + 1 redirect |
| `/invest/knowledge`, `/invest/articles` | `/invest/knowledge` (с табами) | merge + 1 redirect |
| `/invest/calculator`, `/newbuilds/calculator` | `/invest/calculator` (SSOT), newbuilds-копия рендерит тот же компонент | dedupe component |
| `/property/clearview`, `/clearview/for-developers` | `/invest/clearview` (primary), старые — алиасы | add primary + keep aliases |
| `/invest/ops/*` | `/invest/ops/*` за AdminGuard, убран из user-меню | guard-only |

## 6. Контроль качества

- Все `APP_ROUTES.INVEST_*` сохраняем; редиректы — через `<Navigate replace>` в `AnimatedRoutes`.
- Тесты роутинга: `e2e/tests/navigation/home.spec.ts` + новый `e2e/tests/invest/ia.spec.ts` — проверка, что старые URL дают 301 на канонические.
- Guard-test, что в `src/lib/catalog/taxonomy.ts` кластер `invest` указывает только на канонические пути.
- В `mem://strategy/master-taxonomy-v1` зафиксировать решение о четырёх под-разделах Invest (Buy-side / Sell-side / Tools / Personal).

## 7. Что НЕ трогаем

- Detail-страницы (`InvestmentDetail`, `InvestmentBusinessDetail`, `InvestmentDealPublicDetail`) — это листы каталога, не дубли.
- `/capital/*` (CRM команды) — отдельное приложение для оператора, не пользовательская IA.
- `/developer-portal/*` — отдельный B2B-портал застройщика, ходит в Invest только через cross-link.
- DB-схему — все изменения чисто на уровне роутов и UI.

## 8. Рекомендация

**Рекомендую: Wave 1 + Wave 2.** Wave 1 убирает 80% путаницы без риска (только мерджи и редиректы), Wave 2 даёт пользователю явный «Tools»-блок и подключает ClearView к Invest, где он семантически и должен быть. Wave 3 (persona-aware) — отложить, пока не появится валидация на cohort-уровне, чтобы не строить дорогую персонализацию на гипотезе.

После принятия плана: иду Wave 1 за один PR (≈ 7 файлов: 3 удаления, 2 редиректа, 2 правки лендинга), затем Wave 2 отдельным PR.
