

# Аудит дизайна приложений myUNO — Layout, Filters, Typography, Headers

## Обнаруженные проблемы

### 1. ТРИ разных Layout-архитектуры для каталогов (критично)

Каталоги используют **3 несовместимых подхода** к Layout + Header:

| Подход | Файлы | Header | Filter | Grid |
|--------|-------|--------|--------|------|
| **MiniAppLayout** (стандарт) | Yachts, Flowers, Restaurants, Beauty, Fitness, Events, Cleaning, Education, Pets, Pharmacy, Experiences, Medical | `UnifiedHeader` | `UniversalFilter` + `FilterChip` | `grid-cols-2 sm:3 lg:4` |
| **AppLayout + CatalogHeader** | Insurance, Classifieds | `CatalogHeader` (другой компонент) | Кастомные фильтры | `grid-cols-1` / `grid-cols-2` |
| **NewbuildsLayout** | NewbuildsCatalog | Полностью кастомный (nb-theme) | inline `<select>` + manual state | `grid-cols-1 md:2 lg:3` |
| **AppLayout + PageHeader** | Delivery | `PageHeader` (третий вариант) | Нет | Кастомный layout |

**Insurance и Classifieds** — не используют `MiniAppLayout`, что ломает визуальную согласованность (другой header, другая навигация, другой ribbon).

**Delivery** — полностью кастомный layout без единого паттерна (использует `AppLayout` + `PageContainer` + `PageHeader`).

### 2. Inconsistent Grid Columns (medium)

| Vertical | Grid | Gap |
|----------|------|-----|
| Yachts, Experiences, Restaurants | `grid-cols-2 sm:3 lg:4 gap-x-4 gap-y-6` | Разный gap |
| Flowers, Beauty, Cleaning, Education, Fitness, Pets | `grid-cols-2 sm:3 lg:4 gap-4` | Единый gap-4 |
| Market | `grid-cols-2 sm:2 md:3 lg:4 xl:5 gap-4 md:gap-5` | 5 колонок на xl |
| Classifieds | `grid-cols-2 gap-3` | Нет responsive breakpoints |
| Insurance | `grid-cols-1` | Вообще нет grid |

**Проблема**: Market использует 5 колонок и `max-w-[1800px]` вместо стандартных `max-w-[1536px]`. Classifieds не масштабируется на desktop.

### 3. Filter-система: 3 параллельных реализации

- **UniversalFilter** (Sheet/Drawer) — используется в Flowers, Yachts (через MiniAppLayout)
- **CatalogHeader categories** — Classifieds, Insurance (ribbon внутри другого компонента)
- **Inline custom selects** — Newbuilds (native `<select>` с кастомным стилем)
- **Кастомные FilterChip** — Restaurants (area filter через raw `<button>`)

При этом `showFilter={false}` стоит на **12 из 14** вертикалей, что означает: большинство каталогов вообще не имеют фильтрации, хотя `UniversalFilter` + `FilterConfig` уже реализованы. Только **Flowers** полноценно использует фильтры (по цвету, стилю, типу цветов, цене).

### 4. Typography: font-display не применяется в каталогах

- `font-display` (Syne) используется только в home screen и landing pages
- **Ни один** каталог Index не использует `font-display` для заголовков
- `UnifiedHeader` использует `text-lg font-bold` без `font-display`
- `CatalogHeader` тоже использует generic font
- **Newbuilds** использует `nb-display` (Cormorant Garamond) — свой отдельный шрифт

### 5. Newbuilds — полная изоляция от DS2.0

NewbuildsCatalog использует:
- `nb-theme` CSS class с собственными переменными (`--nb-gold`, `--nb-surface`, `--nb-text`)
- inline `style={{ color: 'hsl(var(--nb-gold))' }}` вместо Tailwind-классов
- native HTML `<select>` вместо `UniversalFilter`
- `max-w-7xl` (1280px) вместо `max-w-[1536px]`
- Нет `UnifiedHeader`, нет `BackButton` (кастомный Link с ChevronLeft)

**Это архитектурно допустимо** (editorial luxury theme), но нарушает навигационные паттерны (нет стандартного BackButton, нет sticky header).

### 6. Professional Layouts: согласованы

Admin, MC, Vendor layouts **все 3** используют идентичный паттерн:
- `SidebarProvider` + `SidebarInset`
- Ctrl+B shortcut для toggle sidebar
- `min-h-screen flex w-full bg-background`
- Mobile bottom nav

Это **единственная** зона, где architecture полностью согласована.

### 7. Монетизация: отсутствие conversion-элементов

- **0 из 14** каталогов имеют CTA "Request a call" или "Get a quote" для high-ticket services
- **Yachts** (high-margin) — нет sticky CTA, нет "Instant Book" filter visible by default
- **Insurance** — нет price comparison table, нет "Get Quote" button per plan
- **Newbuilds** — нет "Schedule Viewing" CTA на уровне каталога
- **Cross-sell**: только Yachts, Restaurants, Flowers используют `CrossSellSection`

---

## План исправлений

### Phase 1: Унификация Layout (Critical — 4 файла)

1. **Мигрировать Insurance** на `MiniAppLayout` + `CatalogCard`
2. **Мигрировать Classifieds** на `MiniAppLayout` (с FAB поверх)
3. **Мигрировать Delivery** на `MiniAppLayout`
4. **Newbuilds** — оставить `NewbuildsLayout`, но добавить стандартный `BackButton` и sticky header pattern

### Phase 2: Стандартизация Grid (8 файлов)

Единый grid-стандарт для всех каталогов:
```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5
```
- Исправить: Yachts, Experiences, Restaurants (gap-x/gap-y → gap-4)
- Исправить: Market (убрать xl:5, выровнять max-w)
- Исправить: Classifieds (добавить sm:3 lg:4)

### Phase 3: Активировать фильтры (5 файлов)

Включить `UniversalFilter` (уже готов!) на вертикалях с высоким intent:
- **Yachts**: по цене, capacity, booking_flow (instant/request)
- **Restaurants**: по price_level, delivery/dine-in, rating
- **Experiences**: по duration, price, difficulty
- **Medical**: по specialty, language, 24h, insurance accepted
- **Events**: по date range, event type, price

### Phase 4: Typography (1 файл)

Обновить `UnifiedHeader` — добавить `font-display` для title:
```
<h1 className="text-lg font-bold font-display truncate">
```
Это автоматически применит Syne ко всем 14+ каталогам через единую точку.

### Phase 5: Conversion CTA (3 файла)

Добавить monetization-элементы на high-ticket вертикали:
- **Yachts**: sticky "Book Now" bar снизу (аналог StickyCartBar)
- **Newbuilds**: "Schedule Viewing" CTA на каждой карточке
- **Insurance**: "Get Free Quote" button per provider card

### Порядок реализации

| Phase | Файлов | Impact |
|-------|--------|--------|
| 1. Layout унификация | 4 | Critical — навигация и UX consistency |
| 2. Grid стандартизация | 8 | High — визуальная гармония |
| 3. Фильтры | 5 | High — conversion + UX |
| 4. Typography | 1 | Medium — brand identity |
| 5. Conversion CTA | 3 | High — монетизация |

Рекомендую начать с **Phase 1 + 4** (максимальный системный эффект при минимуме изменений), затем Phase 2 + 3.

