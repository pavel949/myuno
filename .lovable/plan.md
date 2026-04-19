

## План: полная интеграция Commercial RE & Land в блок Недвижимость

### Цель
Сделать коммерческую недвижимость и земельные участки **полноценной частью** Property Hub: видимыми на лендинге, в навигации, в публикации, в поиске — для ролей **Business** и **Investor**.

### Текущее состояние (что уже есть после Phase 1–2)
- Таблица `properties` расширена `asset_class` + 15 полей.
- Карточки `CommercialPropertyCard`, `LandPlotCard`, фильтры, hooks.
- Страницы `/property/commercial`, `/property/land` + детальные.
- Гейтинг табов в `PropertyHub` по personas (business/investor).

### Что не доделано (gap)
1. **PropertyLanding** — нет карточек Commercial/Land в seeker-секции (видны только Rent/Buy/Offplan/Resale/Invest).
2. **Property creation wizard** (`/mc/properties/new`, owner flow) — нельзя выбрать `asset_class = commercial | land`, поля не публикуются.
3. **Глобальный `/search` и `/map`** — не индексируют commercial/land (отдельные пины + фильтр по asset_class).
4. **Bottom nav / quick actions** — для роли Investor/Business нет shortcut'а.
5. **i18n** — ключи `propertyHub.landing.commercial.*` и `.land.*` отсутствуют.
6. **Cross-links** в `PropertyHubTabs` визуально не выделяют новые табы (нужен бейдж "Pro").

---

### Phase 3 — Полная интеграция (этот PR)

#### 1. Лендинг `/property` (`PropertyLanding.tsx`)
Добавить **третью секцию** между Seekers и Pros — `sectionCapital` ("Для бизнеса и инвесторов"), persona-gated (видна если `business`/`investor` активны, иначе — collapsed teaser "Включить роль Бизнес/Инвестор → откроются разделы"):
- Карточка **Commercial** → `/property/commercial` (icon `Building2`, "Офисы, ритейл, склады, F&B")
- Карточка **Land** → `/property/land` (icon `Trees`, "Земельные участки — rai/ngan/wah, Chanote")
- Карточка **Investment-grade** → `/property/commercial?intent=sale&minCap=6` (icon `TrendingUp`)

Если persona не активна — показываем 1 inline-карту-приглашение с CTA `togglePersona('investor')`.

#### 2. Property creation wizard
Файлы: `src/pages/owner/PropertyCreatePage.tsx` (или эквивалент) + `src/components/owner/property-wizard/*`.

Добавить **Step 0: Asset Class** (3 крупные карточки: Residential / Commercial / Land). Выбор управляет:
- Какие property_type показывать (residential | COMMERCIAL_TYPES | LAND_TYPES из `commercialTaxonomy.ts`).
- Какие шаги wizard'а отображать: для commercial/land скрыть bedrooms/bathrooms, показать `floor_area_sqm`, `cap_rate_pct`, `noi_annual_thb`, `title_deed_type`, `permitted_uses`, `electricity_load_kw`, `zoning`.
- Для land: `land_size_sqm` с автопересчётом в rai/ngan/wah (используя `formatLandSize`).
- При сохранении: пишем `asset_class` в БД.

#### 3. MC Properties list
`src/pages/mc/MCPropertiesPage.tsx` — добавить фильтр-таб **Все / Жилая / Коммерческая / Земля** (по `asset_class`). Карточки в списке используют существующую `CommercialPropertyCard`/`LandPlotCard` для соответствующих asset_class.

#### 4. Global Search & Map
- `useGlobalSearch.ts` — расширить запрос `properties`: убрать неявный фильтр на residential, добавить поле `asset_class` в результат, иконка/цвет пина зависит от него.
- `/map` (`UniversalMapPage.tsx`) — добавить toggle "Коммерческая" / "Земля" в legend; pin colors:
  - residential: emerald (как сейчас)
  - commercial: gold (`hsl(var(--warning))`)
  - land: brown (`hsl(35 40% 45%)`)
- Search filter chip `asset_class` доступен всем (без persona-gating — поиск открыт).

#### 5. Bottom nav / Quick actions для Investor
`AdaptiveBottomNav.tsx` — для активной роли Investor/Business добавить shortcut "Commercial" в "Property" submenu (без увеличения видимых пунктов).

#### 6. PropertyHubTabs — визуальные бейджи
Добавить маленький бейдж `Pro` рядом с табами Commercial/Land (используя существующий Badge компонент из shadcn).

#### 7. i18n keys (RU/EN)
Добавить в `src/i18n/{en,ru}/propertyHub.ts`:
- `landing.sectionCapital`, `landing.commercial.{title,desc}`, `landing.land.{title,desc}`, `landing.investmentGrade.{title,desc}`
- `landing.personaPrompt.{title,enableBusiness,enableInvestor}`
- `wizard.assetClass.{title,residential,commercial,land}`

#### 8. Версия
`appVersion.ts` → `3.41.2`.

---

### Файлы

**Modify:**
- `src/pages/property/PropertyLanding.tsx` — третья секция Capital + persona prompt
- `src/pages/owner/PropertyCreatePage.tsx` (+ wizard steps) — asset_class step + conditional fields
- `src/pages/mc/MCPropertiesPage.tsx` — asset_class filter + card switching
- `src/components/layout/AdaptiveBottomNav.tsx` — investor shortcut
- `src/hooks/useGlobalSearch.ts` — return asset_class
- `src/pages/UniversalMapPage.tsx` (или `/map`) — pin colors + legend toggle
- `src/pages/property/PropertyHub.tsx` — Pro badges
- `src/i18n/en/propertyHub.ts`, `src/i18n/ru/propertyHub.ts`
- `src/lib/appVersion.ts`

**Create (если нужно):**
- `src/components/property/commercial/PersonaPromptCard.tsx` (extract из PersonaGatePrompt для landing)
- `src/components/owner/property-wizard/AssetClassStep.tsx`
- `src/components/owner/property-wizard/CommercialFieldsStep.tsx`
- `src/components/owner/property-wizard/LandFieldsStep.tsx`

---

### Приоритеты внутри PR
1. **Лендинг** (критично — пользователь это видит первым) ← блокирующее
2. **i18n** ← блокирующее
3. **MC list filter + wizard asset_class step** ← high
4. **Global search/map** ← medium (можно отдельным PR если объём большой)
5. **Bottom nav + Pro badges** ← polish

### Открытые вопросы
| # | Вопрос | Default |
|---|--------|---------|
| 1 | Делать ли persona prompt **collapsible card** или сразу **выпадающую** секцию при переключении роли? | Collapsible card с кнопкой "Включить роль" |
| 2 | Wizard для Commercial/Land — оставить тот же `/mc/properties/new` или отдельный `/mc/properties/new?type=commercial`? | Тот же URL, Step 0 решает |
| 3 | Map: нужен ли визуальный кластер commercial vs residential или один общий? | Раздельные toggleable layers |

