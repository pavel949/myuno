
# План: Унификация загрузчиков в стиле Airbnb

## Текущие проблемы

### 1. Критические несоответствия Airbnb-стилю

| Проблема | Где встречается | Airbnb-стандарт |
|----------|-----------------|-----------------|
| Классический спиннер (`LoadingSpinner`) | TourDetail, Bookings, Profile, BookingDetail, Admin | **Skeleton**, имитирующий структуру контента |
| `animate-pulse` анимация | Базовый Skeleton компонент | **Shimmer** (переливающийся градиент слева направо) |
| Разные радиусы скругления | `rounded-md`, `rounded-lg`, `rounded-xl` | Единый `rounded-2xl` для карточек |
| Несогласованные размеры | Разные aspect-ratio в скелетонах | Фиксированные пропорции по типу контента |

### 2. Дублирование компонентов

В проекте **5 разных реализаций** скелетонов:
1. `src/components/ui/skeleton.tsx` — базовый с `animate-pulse`
2. `src/components/ui/skeleton-card.tsx` — варианты карточек
3. `src/components/ui/ContentSkeleton.tsx` — списки, таблицы
4. `src/components/uno/SkeletonCard.tsx` — с попыткой shimmer
5. `src/pages/Index.tsx` — локальные скелетоны главной страницы

### 3. Страницы с устаревшей загрузкой (спиннеры)

```text
❌ TourDetail.tsx      → LoadingSpinner (строка 21)
❌ Profile.tsx         → LoadingState (строка 53-58)
❌ Bookings.tsx        → LoadingState (строка 151-157)
❌ BookingDetail.tsx   → LoadingState (строка 194-200)
❌ YachtDetail.tsx     → Ручная пульсация (строки 26-38)
```

---

## Решение: Airbnb-подобная система загрузчиков

### Фаза 1: Обновление базового Skeleton с Shimmer-эффектом

Заменить `animate-pulse` на `animate-shimmer` с градиентным фоном:

```typescript
// src/components/ui/skeleton.tsx (обновление)
const Skeleton = React.forwardRef<...>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-muted relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      style={{ backgroundSize: '200% 100%' }}
      {...props}
    />
  );
});
```

### Фаза 2: Создание унифицированных скелетонов страниц

Новый файл: `src/components/ui/page-skeletons.tsx`

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. DetailPageSkeleton                                       │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ [████████████ Hero Image ████████████] aspect-video │  │
│    ├─────────────────────────────────────────────────────┤  │
│    │ [████████] Title                                    │  │
│    │ [████] Subtitle      [███] Badge                    │  │
│    │                                                     │  │
│    │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │  │
│    │ │ Stat  │ │ Stat  │ │ Stat  │ │ Stat  │ 4-col grid │  │
│    │ └───────┘ └───────┘ └───────┘ └───────┘            │  │
│    │                                                     │  │
│    │ [██████████████████████████████] Description       │  │
│    │ [████████████████████████]                         │  │
│    └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 2. ListPageSkeleton                                         │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ [████████] Header                                   │  │
│    │                                                     │  │
│    │ ┌──────────────┐  ┌──────────────┐                  │  │
│    │ │ [Image 4:3]  │  │ [Image 4:3]  │ 2-col grid      │  │
│    │ │ Title        │  │ Title        │                  │  │
│    │ │ Subtitle     │  │ Subtitle     │                  │  │
│    │ └──────────────┘  └──────────────┘                  │  │
│    │ ┌──────────────┐  ┌──────────────┐                  │  │
│    │ │ [Image 4:3]  │  │ [Image 4:3]  │                  │  │
│    │ │ ...          │  │ ...          │                  │  │
│    │ └──────────────┘  └──────────────┘                  │  │
│    └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 3. BookingListSkeleton                                      │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ ┌──────┐ [████████████] Title     [████] Badge     │  │
│    │ │ Icon │ [████████] Subtitle      [████] Price     │  │
│    │ └──────┘                                            │  │
│    │ ─────────────────────────────────────────────────── │  │
│    │ ┌──────┐ [████████████] Title     [████] Badge     │  │
│    │ │ Icon │ [████████] Subtitle      [████] Price     │  │
│    │ └──────┘                                            │  │
│    └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 4. ProfileSkeleton                                          │
│    ┌─────────────────────────────────────────────────────┐  │
│    │       ┌────────────┐                                │  │
│    │       │  Avatar    │ w-24 h-24 rounded-full        │  │
│    │       │ [████████] │                                │  │
│    │       └────────────┘                                │  │
│    │       [████████████] Name                           │  │
│    │       [████████] Email                              │  │
│    │                                                     │  │
│    │ ┌─────────────────────────────────────────────────┐ │  │
│    │ │ [Icon] [████████████████████████████████] ▶     │ │  │
│    │ │ [Icon] [████████████████████████████████] ▶     │ │  │
│    │ │ [Icon] [████████████████████████████████] ▶     │ │  │
│    │ └─────────────────────────────────────────────────┘ │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Фаза 3: Миграция страниц на скелетоны

| Страница | Текущее | Новое |
|----------|---------|-------|
| `TourDetail.tsx` | `LoadingSpinner` | `DetailPageSkeleton` |
| `YachtDetail.tsx` | Ручная пульсация | `DetailPageSkeleton` |
| `ExperienceDetail.tsx` | Спиннер | `DetailPageSkeleton` |
| `Profile.tsx` | `LoadingState` | `ProfileSkeleton` |
| `Bookings.tsx` | `LoadingState` | `BookingListSkeleton` |
| `BookingDetail.tsx` | `LoadingState` | `DetailPageSkeleton` (variant="booking") |

### Фаза 4: Консолидация компонентов

**Удалить дубликаты:**
- `src/components/uno/SkeletonCard.tsx` → мигрировать на `skeleton-card.tsx`
- Локальные скелетоны в `Index.tsx` → вынести в общий модуль

**Единая точка входа:**
```typescript
// src/components/ui/skeletons/index.ts
export { Skeleton } from './skeleton';
export { SkeletonCard, SkeletonGrid, SkeletonList } from './skeleton-card';
export { DetailPageSkeleton, ListPageSkeleton, ProfileSkeleton, BookingListSkeleton } from './page-skeletons';
```

---

## Технические изменения

### Файлы для создания
| Файл | Описание |
|------|----------|
| `src/components/ui/page-skeletons.tsx` | Унифицированные скелетоны страниц |

### Файлы для обновления
| Файл | Изменение |
|------|-----------|
| `src/components/ui/skeleton.tsx` | Shimmer-анимация вместо pulse |
| `src/pages/tours/TourDetail.tsx` | Заменить спиннер на DetailPageSkeleton |
| `src/pages/yachts/YachtDetail.tsx` | Заменить ручной скелетон на DetailPageSkeleton |
| `src/pages/Profile.tsx` | Заменить LoadingState на ProfileSkeleton |
| `src/pages/Bookings.tsx` | Заменить LoadingState на BookingListSkeleton |
| `src/pages/BookingDetail.tsx` | Заменить LoadingState на DetailPageSkeleton |

### Файлы для удаления/рефакторинга
| Файл | Действие |
|------|----------|
| `src/components/uno/SkeletonCard.tsx` | Удалить (дубликат) |
| `src/components/uno/LoadingSpinner.tsx` | Обновить LoadingState → использовать скелетоны |

---

## Airbnb-стандарты для соблюдения

### 1. Shimmer-анимация
```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
animation: shimmer 2s infinite linear;
```

### 2. Единые радиусы
- Карточки: `rounded-2xl` (16px)
- Мелкие элементы: `rounded-full` или `rounded-lg`
- Кнопки в скелетонах: `rounded-xl`

### 3. Пропорции изображений
- Детальная страница (Hero): `aspect-video` (16:9)
- Карточки в сетке: `aspect-[4/3]`
- Продукты: `aspect-square`
- Аватары: `rounded-full w-10 h-10`

### 4. Контрастность
- Цвет скелетона: `bg-muted` (низкий контраст с фоном)
- Shimmer overlay: `via-white/10` (очень мягкий)

---

## Ожидаемый результат

1. **Единообразие**: Все загрузчики выглядят как Airbnb
2. **Нет спиннеров**: Пользователь видит структуру контента до загрузки
3. **Плавность**: Shimmer-эффект создаёт ощущение активности
4. **Меньше CLS**: Layout Shift минимизирован благодаря правильным пропорциям
5. **Чистый код**: Один источник истины для всех скелетонов
