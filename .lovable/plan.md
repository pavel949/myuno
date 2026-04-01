

# Канонический формат мини-аппа: аудит и унификация

## Проблема

Сейчас в проекте **два параллельных стандарта** layout и **6 разных форматов карточек**:

### Layout (обёртка страницы)
| Страница | Обёртка | Header | Ширина контента |
|----------|---------|--------|-----------------|
| Experiences, Market, Invest | `MiniAppLayout` | `UnifiedHeader` + sticky ribbon | `max-w-[1536px] px-4` |
| Yachts, Flowers, Restaurants, Pets | `AppLayout` + `CatalogHeader` | Свой sticky header | `max-w-[1536px] mx-auto px-4` |
| Transport | `AppLayout` + custom hero search | Полностью custom | `container max-w-[1536px]` |
| Landing pages | `AppLayout` + raw HTML | BackButton + custom hero | Разная ширина |

### Карточки (листинги)
| Вертикаль | Компонент | Aspect ratio | Рейтинг | Цена | Badges |
|-----------|-----------|-------------|---------|------|--------|
| Yachts | Inline `YachtCard` | 4:3 | Star warning fill | `formatPrice()` | Instant/Request, Featured |
| Experiences | Inline `ExperienceCard` | 4:3 | Star warning fill | `formatPrice()` | Tour/Activity type |
| Transport | `VehicleCard` | 4:3 | Нет | Raw `toLocaleString()` | Year, Verified, Available |
| Flowers | Inline card | **3:4** (портрет) | Нет | Raw `฿` hardcode | Popular, Box type, Scarcity |
| Pets | Inline card | 4:3 | Star foreground fill | `formatPrice()` | Verified |
| Insurance/Legal | `ItemCard` | 1:1 horizontal | Star primary fill | `formatPrice()` | New, Featured |

**Итого: 6 разных карточек, 3 формата layout, несогласованные цены, рейтинги и badges.**

## Решение

### 1. Создать `CatalogCard` — единую карточку для grid-каталогов

Один компонент для **всех** вертикальных grid-каталогов (Yachts, Experiences, Transport, Flowers, Pets). Не заменяет `ItemCard` (он для horizontal list view), а стандартизирует vertical grid cards.

```text
┌──────────────────────┐
│  [image aspect-[4/3]]│  ← configurable: 4:3 | 3:4 | 1:1
│  ┌badges─┐  ┌─right─┐│
│  │NEW    │  │Instant││
│  └───────┘  └───────┘│
│  ┌─social proof──────┐│
│  └───────────────────┘│
├──────────────────────┤
│ ★ 4.8 (23) · 12 чел  │  ← meta row
│ Yacht Name            │  ← title, font-semibold text-sm
│ 📍 Chalong            │  ← location (optional)
│ ฿15,000 /day          │  ← formatPrice() always
└──────────────────────┘
```

Props interface:
- `image`, `title`, `onClick` — обязательные
- `aspectRatio?: '4:3' | '3:4' | '1:1'` (default `4:3`)
- `badges?: Badge[]` (top-left stack)
- `statusBadge?: Badge` (top-right)
- `socialProof?: string` (bottom overlay)
- `rating?`, `reviewCount?`, `meta?: {icon, label}[]`
- `location?`
- `price?` (uses `formatPrice()` always)
- `pricePrefix?`, `priceSuffix?`

**Файл**: `src/components/miniapp/CatalogCard.tsx`

### 2. Мигрировать все inline-карточки на `CatalogCard`

| Файл | Что убираем | Что добавляем |
|------|-------------|---------------|
| `YachtsIndex.tsx` | Inline `YachtCard` (60 строк) | `<CatalogCard>` + adapter |
| `ExperiencesIndex.tsx` | Inline `ExperienceCard` (70 строк) | `<CatalogCard>` + adapter |
| `FlowersIndex.tsx` | Inline card (65 строк) | `<CatalogCard aspectRatio="3:4">` |
| `PetsIndex.tsx` | Inline card (40 строк) | `<CatalogCard>` |
| `VehicleCard.tsx` | Custom component | Адаптировать или заменить на `CatalogCard` |

Для каждой вертикали создать тонкий **adapter** (маппер из domain entity в `CatalogCardProps`), по аналогии с существующими `mapYachtToCardProps`, `mapVehicleToCardProps`.

### 3. Мигрировать layout: `CatalogHeader` → `MiniAppLayout`

Перевести **все каталожные Index-страницы** на единый `MiniAppLayout`:

| Страница | Сейчас | После |
|----------|--------|-------|
| `YachtsIndex` | `AppLayout` + `CatalogHeader` | `MiniAppLayout` |
| `FlowersIndex` | `AppLayout` + `CatalogHeader` | `MiniAppLayout` |
| `RestaurantsIndex` | `AppLayout` + `CatalogHeader` | `MiniAppLayout` |
| `PetsIndex` | `AppLayout` + `CatalogHeader` | `MiniAppLayout` |
| `TransportIndex` | `AppLayout` + custom hero | `MiniAppLayout` + hero slot |

Это даст единый sticky header, search, filter ribbon, max-width, padding на **всех** страницах.

### 4. Стандартизировать Landing Pages

Создать `LandingLayout` — обёртку для Relocate, Wedding, Kids, Nomad:
- Hero section с gradient + BackButton
- Max-width `max-w-3xl mx-auto` для контента
- Стандартный footer с CTA
- WhatsApp button

**Файл**: `src/components/miniapp/LandingLayout.tsx`

### 5. Адаптеры (mappers)

Обновить/создать в `src/lib/adapters/`:
- `mapExperienceToCatalogCard.ts`
- `mapFlowerToCatalogCard.ts`
- `mapPetServiceToCatalogCard.ts`
- Существующие `mapYachtToCardProps`, `mapVehicleToCardProps` — адаптировать к CatalogCard interface

## Порядок реализации

1. `CatalogCard` компонент
2. Adapters для каждой вертикали
3. Миграция карточек (Yachts → Experiences → Flowers → Pets → Transport)
4. Миграция layout (все Index → MiniAppLayout)
5. `LandingLayout` + миграция лендингов
6. Удаление deprecated inline cards и `CatalogHeader` (если больше не используется)

~12 файлов изменить, ~3 создать. Сокращение кода: ~300 строк inline-карточек заменяются на 1 компонент + 5 адаптеров.

