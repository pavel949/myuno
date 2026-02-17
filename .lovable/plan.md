

## Аудит и оптимизация структуры Property-вертикали

### Проблема сейчас

Всё, что связано с недвижимостью, разбросано по **5 отдельным корневым маршрутам**:

```text
/property         -- Аренда и покупка (Airbnb-стиль каталог)
/offplan           -- Новостройки (отдельная страница)
/developers        -- Застройщики (отдельная страница)
/complexes         -- ЖК/проекты (отдельная страница)
/invest            -- Инвестиции (отдельная страница + дашборд)
/company/:slug     -- УК (отдельная страница)
/owner             -- Управление (портал владельца)
/rent-phuket       -- SEO-лендинг аренды
```

Пользователь видит кашу: «Жильё», «Новостройки», «Инвестиции», «Купить» — как будто это разные продукты, хотя всё это **один домен — Недвижимость**.

### Предлагаемая структура: Property Hub

Объединить всё под `/property` с вкладками/разделами. Пользователь попадает в единый хаб с понятными интентами:

```text
/property                    -- Property Hub (точка входа)
  Tabs: Stays | Buy | Off-Plan | Invest | My Property

/property?mode=rent          -- Аренда (текущий PropertyIndex, режим rent)
/property?mode=buy           -- Покупка (текущий PropertyIndex, режим buy)
/property/:id                -- Детальная страница объекта
/property/search             -- Расширенный поиск
/property/map                -- Карта

/property/offplan            -- Новостройки (бывший /offplan)
/property/offplan/:id        -- Детали проекта
/property/developers         -- Застройщики (бывший /developers)
/property/developers/:id     -- Профиль застройщика
/property/projects           -- ЖК/комплексы (бывший /complexes)
/property/project/:id        -- Существующий маршрут (без изменений)

/property/invest             -- Инвестиционный хаб (бывший /invest)
/property/invest/:id         -- Детали инвестиции
/property/invest/dashboard   -- Инвестор-дашборд

/company/:slug               -- УК (оставить на верхнем уровне — cross-vertical)

/owner                       -- Управление (оставить — это портал, не каталог)
```

### Визуальная структура Property Hub

```text
+-----------------------------------------------+
|  [< Back]   Property Hub         [Map] [Search]|
+-----------------------------------------------+
|  [ Stays ]  [ Buy ]  [ Off-Plan ]  [ Invest ] |
+-----------------------------------------------+
|                                                |
|  (контент зависит от выбранной вкладки)        |
|                                                |
+-----------------------------------------------+
```

### Что даёт:
- **1 точка входа** вместо 5 для всего, что связано с недвижимостью
- Пользователь переключается между интентами (аренда/покупка/новостройки/инвестиции) одним тапом
- SEO: `/property/offplan` понятнее, чем `/offplan` в контексте SuperApp
- Навигация упрощается: из QuickActions всегда `/property`, а внутри хаба пользователь сам выбирает

### Что НЕ трогаем:
- `/owner` — это рабочий портал владельца, НЕ каталог. Остаётся отдельно.
- `/company/:slug` — УК обслуживают не только property. Остаётся на верхнем уровне.
- `/rent-phuket`, `/new-developments` — SEO-лендинги с редиректами. Остаются.
- `/transfer`, `/flower-delivery` — другие SEO-лендинги.

### Навигационные изменения

| Текущий маршрут | Новый маршрут | Тип |
|---|---|---|
| `/offplan` | `/property/offplan` | Перенос + legacy redirect |
| `/offplan/:id` | `/property/offplan/:id` | Перенос + legacy redirect |
| `/developers` | `/property/developers` | Перенос + legacy redirect |
| `/developers/:id` | `/property/developers/:id` | Перенос + legacy redirect |
| `/complexes` | `/property/projects` | Перенос + legacy redirect |
| `/invest` | `/property/invest` | Перенос + legacy redirect |
| `/invest/:id` | `/property/invest/:id` | Перенос + legacy redirect |
| `/invest/dashboard` | `/property/invest/dashboard` | Перенос + legacy redirect |
| `/invest/raise` | `/property/invest/raise` | Перенос + legacy redirect |

### План реализации

**Шаг 1**: Создать `PropertyHub.tsx` — обёртка с табами (Stays/Buy/Off-Plan/Invest), которая рендерит текущий PropertyIndex или вложенные страницы в зависимости от выбранного таба/маршрута.

**Шаг 2**: Обновить `AnimatedRoutes.tsx` — перенести маршруты offplan, developers, complexes, invest под `/property/*`. Добавить legacy-redirectы для старых путей.

**Шаг 3**: Обновить `routes.ts` — перенести константы маршрутов и добавить legacy-redirectы.

**Шаг 4**: Обновить навигационные ссылки по всему приложению:
- `QuickActionsGrid.tsx` — INVESTOR_ACTIONS: `/invest` -> `/property/invest`, `/offplan` -> `/property/offplan`
- `LifeSituationsGrid.tsx` — ссылки на offplan/invest
- `LifeOSStatusBlock.tsx` — контекстные ссылки инвестора
- `DiscoveryCarousel.tsx` — offplan-ссылки
- `OffplanCTASection.tsx` — CTA-кнопки
- `verticalGroups.ts` — без изменений (property остаётся property)

**Шаг 5**: Обновить `LEGACY_REDIRECTS` для обратной совместимости:
```
'/offplan' -> '/property/offplan'
'/developers' -> '/property/developers'
'/complexes' -> '/property/projects'
'/invest' -> '/property/invest'
'/new-developments' -> '/property/offplan'
```

### Технические детали

- `PropertyHub.tsx` — новый компонент-обёртка с `react-router-dom` `Outlet` или условным рендерингом по pathname
- Все существующие страницы (OffplanIndex, DevelopersIndex, InvestmentIndex и др.) переиспользуются без изменений — меняется только маршрутизация
- Табы в хабе реализуются через Radix `Tabs` или простые `NavLink`-кнопки
- Текущий `PropertyIndex` с rent/buy переключателем интегрируется как tab-контент "Stays" и "Buy"
- ~15-20 файлов потребуют обновления ссылок (grep по `/offplan`, `/invest`, `/developers`, `/complexes`)

