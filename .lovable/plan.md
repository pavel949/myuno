

# План: Премиальное стилистическое обновление иконок и карточек

## Проблема

На скриншоте видны ключевые визуальные проблемы:

1. **Категорийные чипы** — плоский `bg-muted/60` без глубины, выглядит дёшево
2. **Иконки аудиторий** (Tourists, Residents, Owners) — плоские Lucide иконки без контейнеров
3. **Trust badges** — серые, безликие, не привлекают внимание
4. **Отсутствие визуальной иерархии** — всё одинаково "плоское"

---

## Стилистическое решение: "Glassmorphism + Soft Containers"

Вдохновение: Apple iOS, Airbnb, Klook

### Принципы

1. **Soft Icon Containers** — иконки внутри мягких цветных контейнеров с inner glow
2. **Glass Effect** — `backdrop-blur` + полупрозрачные фоны для чипов
3. **Subtle Gradients** — градиенты вместо плоских цветов
4. **Micro-shadows** — мягкие тени для глубины

---

## Изменения в компонентах

### 1. Audience Cards (HeroBlock.tsx)

**Было:**
```
┌───────────────────┐
│  ✈️ (плоская)     │
│  Туристам         │
│  Туры • Транспорт │
└───────────────────┘
```

**Станет:**
```
┌───────────────────────────────┐
│  ┌────────────────┐           │
│  │    ✈️          │ ← soft    │
│  │  sky glow      │   container
│  └────────────────┘           │
│  Туристам                     │
│  Туры • Транспорт • Яхты      │
└───────────────────────────────┘
```

**Стили:**
| Аудитория | Icon Container | Glow Effect |
|-----------|----------------|-------------|
| Tourists | `bg-sky-500/20` | `shadow-sky-500/30` |
| Residents | `bg-emerald-500/20` | `shadow-emerald-500/30` |
| Owners | `bg-amber-500/20` | `shadow-amber-500/30` |

```typescript
// Новая структура audienceCards
{
  id: 'tourists',
  icon: Plane,
  iconColor: 'text-sky-500',
  iconBg: 'bg-gradient-to-br from-sky-500/20 to-blue-500/30',
  iconShadow: 'shadow-lg shadow-sky-500/20',
  gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
  borderColor: 'border-sky-500/20 hover:border-sky-500/40',
}
```

### 2. Category Chips (ContentPreviewRibbon.tsx)

**Было:**
```
[🔥 Popular]  ← bg-muted/60, скучный
```

**Станет:**
```
[🔥 Popular]  ← glass effect + emoji в цветном контейнере
```

**Новые стили:**
```typescript
// Glass chip style
className={cn(
  "flex items-center gap-2 px-3 py-2 rounded-xl",
  "bg-white/80 dark:bg-white/10",
  "backdrop-blur-md",
  "border border-white/50 dark:border-white/20",
  "shadow-sm hover:shadow-md",
  "transition-all duration-200"
)}

// Emoji container
<div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
  <span className="text-sm">🔥</span>
</div>
```

### 3. Trust Badges (HeroBlock.tsx)

**Было:**
```
[✓ Verified]  ← bg-card, серый, незаметный
```

**Станет:**
```
[✓ Verified]  ← gold tint + subtle glow
```

**Новые стили:**
```typescript
// Trust badge with gold tint
<div className={cn(
  "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
  "bg-gradient-to-r from-primary/10 to-amber-500/10",
  "border border-primary/20",
  "text-[11px] font-medium text-foreground/90",
  "shadow-sm"
)}>
  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
  <span>Verified</span>
</div>
```

---

## Новые Design Tokens

Добавить в `designTokens.ts`:

```typescript
// ============ Premium Icon Containers ============
export const ICON_CONTAINER_STYLES = {
  soft: {
    sky: 'bg-gradient-to-br from-sky-500/20 to-blue-500/30 shadow-lg shadow-sky-500/20',
    emerald: 'bg-gradient-to-br from-emerald-500/20 to-green-500/30 shadow-lg shadow-emerald-500/20',
    amber: 'bg-gradient-to-br from-amber-500/20 to-orange-500/30 shadow-lg shadow-amber-500/20',
    rose: 'bg-gradient-to-br from-rose-500/20 to-pink-500/30 shadow-lg shadow-rose-500/20',
    purple: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/30 shadow-lg shadow-purple-500/20',
  },
  solid: {
    sky: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30',
    emerald: 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/30',
    amber: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30',
  },
} as const;

// ============ Glass Effect Chips ============
export const CHIP_STYLES = {
  glass: cn(
    "bg-white/80 dark:bg-white/10",
    "backdrop-blur-md",
    "border border-white/50 dark:border-white/20",
    "shadow-sm hover:shadow-md",
    "transition-all duration-200"
  ),
  muted: "bg-muted/60 hover:bg-muted",
  active: cn(
    "bg-primary/10 border-primary/30",
    "text-primary font-medium"
  ),
} as const;
```

---

## Визуальное сравнение

### Audience Cards

```text
БЫЛО:                           СТАНЕТ:
┌─────────────┐                ┌─────────────────────┐
│ ✈️ plain    │                │ ┌─────────┐         │
│ Туристам    │       →        │ │ ✈️      │ glow   │
│ text...     │                │ └─────────┘         │
└─────────────┘                │ Туристам            │
                               │ Туры • Транспорт    │
                               └─────────────────────┘
                                ↑ gradient border
```

### Category Chips

```text
БЫЛО:                           СТАНЕТ:
┌────────────────┐             ┌────────────────────┐
│ 🔥 Popular     │    →        │ [🔥] Popular       │
│ bg-muted/60   │             │ glass + emoji box │
└────────────────┘             └────────────────────┘
```

### Trust Badges

```text
БЫЛО:                           СТАНЕТ:
┌──────────────┐               ┌──────────────────┐
│ ✓ Verified   │      →        │ ✓ Verified       │
│ gray, flat   │               │ gold tint + glow │
└──────────────┘               └──────────────────┘
```

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/lib/designTokens.ts` | Добавить `ICON_CONTAINER_STYLES`, `CHIP_STYLES` |
| `src/components/home/HeroBlock.tsx` | Обновить Audience Cards с soft containers |
| `src/components/home/ContentPreviewRibbon.tsx` | Glass effect для чипов + emoji containers |
| `src/components/shared/UnifiedFilterRibbon.tsx` | Унифицировать стили чипов |

---

## Ожидаемый результат

1. **Премиальный вид** — уровень iOS/Airbnb
2. **Визуальная иерархия** — иконки "выделяются", чипы "поддерживают"
3. **Глубина** — мягкие тени и glow-эффекты создают объём
4. **Консистентность** — единая система для всех иконок и чипов

