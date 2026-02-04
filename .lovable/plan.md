
# Аудит и унификация премиального дизайна платформы

## Результаты технического аудита

### Централизованная дизайн-система (Source of Truth)
Платформа имеет хорошо структурированную систему токенов:

| Файл | Назначение | Статус |
|------|------------|--------|
| `src/lib/designTokens.ts` | Токены карточек, теней, бейджей | Эталон |
| `src/lib/motionPresets.ts` | Анимации и переходы | Эталон |
| `src/index.css` | CSS-переменные, типографика | Эталон |

**Канонические значения:**
- Радиус карточек: `rounded-2xl` (16px)
- Радиус компактных: `rounded-xl` (12px)
- Тень по умолчанию: `shadow-sm`
- Тень при наведении: `shadow-md`
- Подъём при наведении: `hover:-translate-y-0.5`
- Зум изображения: `group-hover:scale-[1.03]`

---

## Выявленные несоответствия

### 1. Рассинхрон теней (Shadow Drift)

| Компонент | Текущее | Каноническое | Проблема |
|-----------|---------|--------------|----------|
| `PropertyCard` (hero) | `hover:shadow-lg` | `hover:shadow-md` | Избыточная тень |
| `ServiceProviderCard` | `hover:shadow-xl` | `hover:shadow-md` | Слишком тяжёлая |
| `ProjectCard` (featured) | `hover:shadow-xl` | `hover:shadow-lg` | Допустимо для featured |

### 2. Разный "подъём" (Lift Effect)

| Компонент | Текущее | Каноническое |
|-----------|---------|--------------|
| `ServiceProviderCard` | `hover:-translate-y-1` | `hover:-translate-y-0.5` |
| `PropertyCard` | Отсутствует | `hover:-translate-y-0.5` |
| `ItemCard` | Отсутствует | `hover:-translate-y-0.5` |

### 3. Хардкод бейджей (Badge Hardcoding)

| Компонент | Проблема | Решение |
|-----------|----------|---------|
| `ProductCard` | `bg-blue-500`, `bg-red-500` | Использовать `BADGE_STYLES.new`, `BADGE_STYLES.discount` |
| `ProjectCard` | `bg-amber-500`, `bg-emerald-500` | Использовать `BADGE_SYSTEM.featured`, `BADGE_SYSTEM.new` |
| `ListCard` | `bg-success`, `bg-gold` | Допустимо (семантические токены) |

### 4. Отсутствие унификации вертикалей

| Вертикаль | Текущий компонент | Проблема |
|-----------|-------------------|----------|
| Яхты | `ItemCard` | Упрощённый дизайн, нет backdrop-blur |
| Транспорт | `ItemCard` | То же |
| Experiences | Inline в странице | Не переиспользуемый |

---

## План исправлений

### Фаза 1: Унификация теней и интерактивности

**Файл: `src/components/property/PropertyCard.tsx`**

```text
Строка 178: hover:shadow-lg → hover:shadow-md hover:-translate-y-0.5
Строка 277: hover:shadow-md → hover:shadow-md hover:-translate-y-0.5
Строка 471: hover:shadow-md → hover:shadow-md hover:-translate-y-0.5
```

**Файл: `src/components/services/ServiceProviderCard.tsx`**

```text
Строка 136: hover:shadow-xl hover:-translate-y-1 → hover:shadow-md hover:-translate-y-0.5
Строка 57-62: hover:shadow-lg → hover:shadow-md
```

**Файл: `src/components/property/ProjectCard.tsx`**

```text
Строка 44: hover:shadow-xl → hover:shadow-lg hover:-translate-y-0.5 (featured допускает lg)
Строка 144: hover:shadow-lg → hover:shadow-md hover:-translate-y-0.5
```

### Фаза 2: Централизация бейджей

**Файл: `src/components/market/ProductCard.tsx`**

```typescript
// Импорт в начало файла
import { BADGE_STYLES } from '@/lib/designTokens';

// Замены:
// Строка 53: bg-blue-500 → BADGE_STYLES.new
// Строка 58: bg-red-500 → BADGE_STYLES.discount
// Строки 139-153: аналогично
```

**Файл: `src/components/property/ProjectCard.tsx`**

```typescript
// Импорт
import { BADGE_SYSTEM } from '@/lib/designTokens';

// Замены:
// Строка 75: bg-amber-500 → BADGE_SYSTEM.featured
// Строка 164: bg-amber-500 → BADGE_SYSTEM.featured
// Строка 169: bg-emerald-500 → BADGE_SYSTEM.new
```

### Фаза 3: Улучшение ItemCard

**Файл: `src/components/miniapp/ItemCard.tsx`**

```typescript
// Добавить импорт
import { DESIGN_TOKENS, CARD_STYLES } from '@/lib/designTokens';

// Обновить классы карточек:
// Строка 89: добавить hover:-translate-y-0.5
// Строка 178-184: использовать CARD_STYLES.interactive
// Добавить backdrop-blur на бейджи
```

### Фаза 4: Вынести ExperienceCard в общие компоненты

**Новый файл: `src/components/experiences/ExperienceCard.tsx`**

Извлечь inline-компонент из `ExperiencesIndex.tsx` (строки 26-152) в отдельный файл с использованием `DESIGN_TOKENS`.

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/components/property/PropertyCard.tsx` | Тени + подъём |
| `src/components/services/ServiceProviderCard.tsx` | Тени + подъём |
| `src/components/property/ProjectCard.tsx` | Тени + бейджи |
| `src/components/market/ProductCard.tsx` | Бейджи из токенов |
| `src/components/miniapp/ItemCard.tsx` | Полная унификация |
| `src/components/miniapp/ListCard.tsx` | Добавить подъём |

## Новые файлы

| Файл | Назначение |
|------|------------|
| `src/components/experiences/ExperienceCard.tsx` | Вынесенная карточка впечатлений |

---

## Визуальный стандарт после унификации

```text
┌─────────────────────────────────────────────────────────────┐
│  КАНОНИЧЕСКАЯ КАРТОЧКА (Premium Standard)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Базовые классы:                                            │
│  bg-card border border-border rounded-2xl                   │
│  shadow-sm overflow-hidden group                            │
│                                                             │
│  Интерактивность:                                           │
│  hover:shadow-md hover:-translate-y-0.5                     │
│  active:scale-[0.98]                                        │
│  transition-all duration-200                                │
│                                                             │
│  Изображение:                                               │
│  group-hover:scale-[1.03] transition-transform duration-300 │
│                                                             │
│  Бейджи:                                                    │
│  BADGE_STYLES.new | .hot | .discount | .featured            │
│  backdrop-blur-sm shadow-sm                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Ожидаемый результат

После унификации:
- Все карточки на платформе будут иметь одинаковый "премиальный" отклик на взаимодействие
- Бейджи будут синхронизированы по цветовой палитре
- Вертикали Yachts, Transport, Experiences получат тот же уровень визуального качества, что и Property и Products
- Изменения токенов в одном месте автоматически применятся ко всем компонентам

**Риск регрессии:** Низкий - изменения касаются только hover-состояний и цветов бейджей
