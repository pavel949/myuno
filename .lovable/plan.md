

## План: Финансовое планирование (Financial Planning) в MC → Финансы

### Что уже есть
- **Finance Overview** (`/owner/finance`) — обзор Net/Income/Expenses + KPI + bar-chart 6 мес
- **Transactions** (`/owner/financials`) — реестр доходов/расходов
- **Reports** (`/owner/reports`) — P&L, Owner Statement, Quarterly, Annual + Excel/PDF экспорт + email
- **Budget** (`/owner/budget`) — план/факт по категориям, помесячно, **только 1 объект, 1 месяц**
- **22+ категорий** (доходы 5 + расходы 17+) в `INCOME/EXPENSE_CATEGORIES`
- **`property_budgets`** таблица: property_id, budget_month, category, transaction_type, planned_amount
- **Excel экспорт** уже работает (ExcelJS lazy-loaded)

### Чего не хватает (для профессиональной финмодели)
1. **Многомесячное планирование** (12 мес forward) — сейчас только 1 месяц
2. **Драйверы аренды**: ADR, occupancy %, ночей доступно → автоматический расчёт revenue
3. **Сценарии** (Base / Optimistic / Pessimistic) — для стресс-тестов
4. **Уровень портфеля** — план для всего портфеля + drill-down
5. **CapEx & амортизация** — планирование крупных расходов вне обычной OpEx
6. **Cash flow** — отдельно от P&L (когда деньги придут/уйдут)
7. **NOI / GOP / Cap Rate / Cash-on-Cash / DSCR / Break-even** — профессиональные метрики
8. **Загрузка из шаблона / копирование с прошлого года** — для быстрого ввода
9. **Multi-sheet Excel модель** — Inputs / Drivers / Monthly P&L / Cash Flow / KPI Dashboard
10. **Tracking план vs факт по портфелю на дашборде**

---

### Новый раздел: `/mc/finance/planning` — "Финансовое планирование"

**Точка входа:** добавить в Finance группу sidebar после "Budget":
- `Financial Planning` / `Финансовое планирование` (icon `LineChart`, badge "Pro")

#### Структура страницы — 5 вкладок

**1. Обзор (Overview)**
- Селекторы: Объект (или весь портфель) + Год (default — текущий)
- 6 KPI карточек: Planned Revenue / Planned Expenses / Planned NOI / Cap Rate / Occupancy target / DSCR (если есть кредит)
- Линейный график: План vs Факт по 12 месяцам (revenue + NOI)
- Heatmap: занятость по месяцам (план vs факт)
- Кнопки: "Создать модель", "Скопировать с прошлого года", "Загрузить шаблон", "Скачать Excel"

**2. Драйверы (Drivers)** — основа модели
Для каждого объекта/месяца:
- ADR (средняя ставка) с месячной сезонностью
- Occupancy % (целевая загрузка)
- Available nights (по умолчанию = дни месяца)
- → автоматический расчёт **Revenue = ADR × Occupancy × Nights**
- Дополнительные доходы: cleaning fee per booking, доп. доходы (%)
- Drag-handle для копирования значения по всем месяцам

**3. P&L по месяцам (12-month P&L)** — Excel-like grid
- Строки: категории доходов + категории расходов (использовать существующие `INCOME/EXPENSE_CATEGORIES`)
- Колонки: 12 месяцев + Total + Avg/mo
- Footer строки (вычисляемые): **Gross Revenue, Total OpEx, NOI, GOP %, EBITDA, Net Income**
- Inline edit ячеек, автосохранение с debounce
- Цветовая подсветка: расходы > плана (красный), revenue ниже плана (янтарный)

**4. CapEx & Cash Flow**
- Список крупных вложений (мебель, ремонт, оборудование) с месяцем платежа и амортизацией (lifespan лет)
- Cash flow план: Operating CF + Investing CF + Financing CF (взносы по кредиту)
- Опциональные поля: loan principal, interest rate, monthly payment → автоподтяжка в P&L
- Метрики: **Cash-on-Cash Return, DSCR, Payback period**

**5. Сценарии (Scenarios)**
- 3 сценария: Base / Optimistic (+15% revenue, –5% costs) / Pessimistic (–20% revenue, +10% costs)
- Side-by-side: NOI / Net Income / Cap Rate в каждом
- Stress test: при какой загрузке выходим в 0 (break-even occupancy)
- Sensitivity table: NOI vs ADR/Occupancy

---

### Технические компоненты

**База данных** (новая миграция):
```sql
-- Расширить property_budgets для multi-month + сценариев
ALTER TABLE property_budgets ADD COLUMN scenario text DEFAULT 'base'; -- base|optimistic|pessimistic
ALTER TABLE property_budgets ADD COLUMN year int;

-- Новая таблица: финансовые модели (хранилище + driver inputs)
CREATE TABLE property_financial_models (
  id uuid PK,
  property_id uuid (nullable — для портфельной модели),
  company_id uuid,
  owner_id uuid,
  model_year int,
  scenario text DEFAULT 'base',
  drivers jsonb,        -- { months: [{ adr, occupancy, nights, ... }] }
  capex jsonb,          -- [{ name, amount, month, lifespan_years, category }]
  loans jsonb,          -- [{ principal, rate, term_months, monthly_payment }]
  assumptions jsonb,    -- { tax_rate, mgmt_fee_pct, ... }
  created_at, updated_at
);

-- RLS: owner_id или company member через has_company_membership()
```

**Хуки** (`src/hooks/useFinancialPlanning.ts`):
- `useFinancialModel(propertyId, year, scenario)` — fetch model
- `useSaveFinancialModel()` — upsert + debounced autosave
- `useFinancialModelComputed(model)` — derive monthly P&L, NOI, CF, KPIs
- `usePlanVsActual(propertyId, year)` — сравнить с `property_financials`

**Компоненты** (`src/components/owner/financial-planning/`):
- `FinancialPlanningPage.tsx` — обёртка с табами
- `PlanningOverview.tsx` — KPI cards + графики
- `DriversGrid.tsx` — редактируемая таблица драйверов (12 мес)
- `MonthlyPnLGrid.tsx` — Excel-like grid с inline edit
- `CapExCashFlow.tsx` — CapEx список + cash flow waterfall
- `ScenariosPanel.tsx` — side-by-side сравнение
- `FinancialModelExportButton.tsx` — multi-sheet Excel

**Excel экспорт** (расширить `exportFinancialsExcel.ts`):
Multi-sheet workbook:
1. **Cover** — название объекта, период, версия модели, дата
2. **Inputs & Drivers** — все драйверы (ADR, Occ, Nights, fees) — синие ячейки (input)
3. **Monthly P&L** — формулы с ссылками на Drivers (`=Drivers!B5*Drivers!B6*Drivers!B7`)
4. **Cash Flow** — operating/investing/financing
5. **CapEx Schedule** — амортизация по годам
6. **KPI Dashboard** — NOI, Cap Rate, Cash-on-Cash, DSCR, Break-even
7. **Scenarios** — Base/Opt/Pess в трёх колонках
- Цветовая схема: blue для inputs, black для формул, green для cross-sheet links
- Числа: `#,##0` (THB), проценты `0.0%`, multiples `0.0x`

**Routes** (`src/lib/config/routes.ts`):
```ts
MC_FINANCE_PLANNING: '/owner/finance/planning',
```

**Sidebar** (`MCSidebar.tsx`): добавить пункт после "Budget".

**Адаптивность:**
- Mobile (<640px): таблицы в "card view" (1 месяц = 1 свёрнутая карточка), горизонтальный скролл с sticky первой колонки
- Tablet (640–1024): grid 6 месяцев + scroll
- Desktop: вся 12-month grid + правая панель KPI

**i18n**: `propertyHub.planning.*` keys (RU/EN).

**Версия:** `appVersion.ts` → `3.42.0`.

---

### Файлы

**Create:**
- `src/pages/owner/FinancialPlanning.tsx` (route page с табами)
- `src/components/owner/financial-planning/PlanningOverview.tsx`
- `src/components/owner/financial-planning/DriversGrid.tsx`
- `src/components/owner/financial-planning/MonthlyPnLGrid.tsx`
- `src/components/owner/financial-planning/CapExCashFlow.tsx`
- `src/components/owner/financial-planning/ScenariosPanel.tsx`
- `src/hooks/useFinancialPlanning.ts`
- `src/lib/finance/financialModelMath.ts` — чистые функции расчётов (NOI, DSCR, Cap Rate, break-even)
- `src/utils/exportFinancialModelExcel.ts` — multi-sheet модель

**Modify:**
- `src/components/mc/MCSidebar.tsx` — пункт Financial Planning
- `src/lib/config/routes.ts` — `MC_FINANCE_PLANNING`
- `src/components/layout/AnimatedRoutes.tsx` + `pageRegistry.ts` — регистрация route
- `src/pages/owner/FinanceOverview.tsx` — карточка "Financial Planning" в quick links
- `src/i18n/en.ts`, `src/i18n/ru.ts` — keys
- `src/lib/appVersion.ts` → 3.42.0

**Migration:**
- ALTER `property_budgets` (scenario, year)
- CREATE `property_financial_models` + RLS

### Подход к реализации (фазы)
1. **Фаза А — Каркас + Drivers + P&L Grid + Excel export** (минимально жизнеспособная финмодель)
2. **Фаза Б — Scenarios + CapEx + Cash Flow** (профессиональный уровень)
3. **Фаза В — Plan vs Actual tracking + Portfolio rollup** (отслеживание исполнения)

Начну с Фазы А — она уже даёт работающую модель с экспортом. После твоего ОК продолжу Б и В в той же сессии.

