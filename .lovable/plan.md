
# Аудит производительности и стабильности загрузки мини-приложений

## Резюме

Проведён комплексный анализ системы загрузки мини-приложений с главной страницы. Выявлены **критические проблемы производительности** и зоны для оптимизации.

---

## 📊 Текущие метрики Web Vitals

| Метрика | Значение | Статус | Целевое значение |
|---------|----------|--------|------------------|
| **FCP** (First Contentful Paint) | 5280-6680 ms | ❌ POOR | < 1800 ms |
| **LCP** (Largest Contentful Paint) | 6680 ms | ❌ POOR | < 2500 ms |
| **TTFB** (Time to First Byte) | 575-1046 ms | ⚠️ NEEDS IMPROVEMENT | < 800 ms |
| **CLS** (Cumulative Layout Shift) | 0.039 | ✅ GOOD | < 0.1 |
| **INP** (Interaction to Next Paint) | 592 ms | ❌ POOR | < 200 ms |

---

## 🔍 Выявленные проблемы

### 1. КРИТИЧЕСКАЯ: Избыточные сетевые запросы ("Query Storm")

**Проблема**: При загрузке главной страницы происходит 30+ параллельных запросов к базе данных, включая дублирующиеся запросы:
- `tours` — запрашивается 4-5 раз
- `properties` — запрашивается 3-4 раза  
- `events` — запрашивается 3-4 раза
- `water_activities` — запрашивается 3 раза
- `cities` — запрашивается 3 раза

**Время запросов**: 200-1400 ms на каждый запрос (суммарная задержка до 5+ секунд)

**Причина**: Разные компоненты на главной странице независимо запрашивают одни и те же данные:
- `RecommendedCarousel` → tours
- `useRecommendations` → tours, properties, events, water_activities
- `ForYouSection` → tours, properties
- `SmartWidget` → events
- `PrefetchProvider` → categories, cities, featured content

### 2. КРИТИЧЕСКАЯ: Предупреждение о forwardRef

**Проблема**: В консоли появляется предупреждение:
```
Warning: Function components cannot be given refs.
Check the render method of `ItemCard` → OptimizedImage
```

**Последствие**: Потенциальная нестабильность анимаций и передачи ref между компонентами.

### 3. УМЕРЕННАЯ: Отсутствие приоритизации запросов

**Проблема**: Все запросы выполняются параллельно без приоритизации критического контента:
- Hero-изображения загружаются с тем же приоритетом, что и второстепенные данные
- Нет staggered loading для карточек ниже fold

### 4. УМЕРЕННАЯ: Неоптимизированный код-сплиттинг для мини-приложений

**Текущее состояние**: 
- Все страницы мини-приложений используют `React.lazy` ✅
- Но при переходе происходит загрузка JS-чанка + данных последовательно, а не параллельно

### 5. НИЗКАЯ: Консольные предупреждения

- Deprecated `apple-mobile-web-app-capable` meta tag
- CORS warnings от postMessage
- Manifest.json не загружается

---

## 🏗 Архитектурный анализ

### Текущая архитектура загрузки данных

```text
┌──────────────────────────────────────────────────────────────┐
│                        Index.tsx                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useMarketplaceProducts() → marketplace_products (8)     │ │
│  │ SmartWidget → events, user context                      │ │
│  │ RecommendedCarousel → useTours() → tours                │ │
│  │ ForYouSection → useRecommendations()                    │ │
│  │   └── tours, properties, events, water_activities       │ │
│  │ PrefetchProvider (idle) → categories, cities, featured  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ↓
        30+ параллельных запросов к Supabase
```

### Паттерны, требующие улучшения

| Компонент | Проблема |
|-----------|----------|
| `useRecommendations` | Жёстко закодированные запросы к 4 таблицам без учёта кеша |
| `RecommendedCarousel` | Дублирует запрос к tours, который уже есть в recommendations |
| `usePrefetch` | Запросы во время idle-time не координируются с основными запросами |
| `useSupabaseQuery` | Не использует TanStack Query (работает напрямую с useState) |

---

## ✅ Положительные аспекты текущей реализации

1. **Lazy Loading страниц** — все мини-приложения используют `React.lazy`
2. **Централизованные профили кеширования** — `CACHE_PROFILES` в queryConfig.ts
3. **OptimizedImage** — ленивая загрузка изображений с IntersectionObserver
4. **Мемоизация** — фильтрация данных использует `useMemo`
5. **Skeleton-плейсхолдеры** — есть состояния загрузки
6. **requestIdleCallback** — префетч выполняется во время простоя

---

## 📋 План оптимизации

### Этап 1: Устранение Query Storm (Приоритет: ВЫСОКИЙ)

**1.1. Миграция хуков на TanStack Query**

Переписать ключевые хуки для использования централизованного кеша:

| Хук | Изменение |
|-----|-----------|
| `useRecommendations` | Использовать `useQuery` с `queryKeys.recommendations` |
| `useTours` | Использовать `useQuery` с `queryKeys.tours` |
| `useVehicles` | Аналогично |

**Пример преобразования**:
```typescript
// До (useState + useEffect)
export function useVehicles() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch... }, []);
  return { vehicles: data };
}

// После (TanStack Query)
export function useVehicles() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: fetchVehicles,
    ...CACHE_PROFILES.SEMI_STATIC,
  });
  return { vehicles: data ?? [], isLoading };
}
```

**1.2. Дедупликация запросов на главной странице**

Создать единый хук `useHomePageData` для координированной загрузки:

```typescript
export function useHomePageData() {
  const queries = useQueries({
    queries: [
      { queryKey: ['featured-tours'], queryFn: fetchFeaturedTours },
      { queryKey: ['featured-properties'], queryFn: fetchFeaturedProperties },
      { queryKey: ['upcoming-events'], queryFn: fetchUpcomingEvents },
    ],
  });
  // Возвращает объединённый результат
}
```

### Этап 2: Оптимизация LCP (Приоритет: ВЫСОКИЙ)

**2.1. Priority hints для Hero-изображений**

```typescript
// В MiniAppHero.tsx
<OptimizedImage
  src={heroImage}
  priority={true}  // ← уже поддерживается, но не везде используется
  fetchPriority="high"
/>
```

**2.2. Preload критических изображений**

```typescript
// В Index.tsx
useCriticalImagePreload([
  'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800',
]);
```

### Этап 3: Исправление forwardRef (Приоритет: СРЕДНИЙ)

**Исправить OptimizedImage для поддержки ref:**

```typescript
// optimized-image.tsx
export const OptimizedImage = memo(forwardRef<HTMLDivElement, Props>(
  function OptimizedImage(props, ref) {
    return (
      <div ref={ref} ...>
        ...
      </div>
    );
  }
));
```

### Этап 4: Оптимизация INP (Приоритет: СРЕДНИЙ)

**4.1. Добавить `React.memo` для карточек в списках**

```typescript
const MemoizedItemCard = React.memo(ItemCard);
```

**4.2. Использовать виртуализацию для длинных списков**

Проект уже имеет `@tanstack/react-virtual` — внедрить для списков > 20 элементов.

### Этап 5: Улучшение навигации к мини-приложениям (Приоритет: НИЗКИЙ)

**5.1. Параллельный prefetch кода и данных при hover**

```typescript
// В QuickActionsGrid.tsx
onMouseEnter={() => {
  // Prefetch код
  import('@/pages/yachts/YachtsIndex');
  // Prefetch данные
  prefetchRoute('/yachts');
}}
```

---

## 📁 Файлы для изменения

| Файл | Тип изменения | Сложность |
|------|---------------|-----------|
| `src/hooks/useRecommendations.ts` | Рефакторинг на useQuery | Средняя |
| `src/hooks/useTours.ts` | Рефакторинг на useQuery | Низкая |
| `src/hooks/useVehicles.ts` | Рефакторинг на useQuery | Низкая |
| `src/hooks/usePetServices.ts` | Рефакторинг на useQuery | Низкая |
| `src/hooks/useSupabaseQuery.ts` | Добавить обёртку для useQuery | Средняя |
| `src/components/ui/optimized-image.tsx` | Добавить forwardRef | Низкая |
| `src/pages/Index.tsx` | Добавить useHomePageData | Средняя |
| `src/components/miniapp/MiniAppHero.tsx` | Priority image loading | Низкая |
| `src/components/home/QuickActionsGrid.tsx` | Prefetch при hover | Низкая |

---

## 📈 Ожидаемые улучшения

После внедрения оптимизаций:

| Метрика | Текущее | Ожидаемое | Улучшение |
|---------|---------|-----------|-----------|
| FCP | 5280-6680 ms | < 2000 ms | ~70% |
| LCP | 6680 ms | < 2500 ms | ~65% |
| INP | 592 ms | < 200 ms | ~65% |
| Сетевых запросов (главная) | 30+ | 8-12 | ~70% |
| Время загрузки мини-приложения | 800-1400 ms | 200-400 ms | ~70% |

---

## 🔧 Технические детали

### Новый хук useHomePageData

```typescript
// src/hooks/useHomePageData.ts
export function useHomePageData() {
  const featuredTours = useQuery({
    queryKey: ['home', 'featured-tours'],
    queryFn: () => supabase.from('tours')
      .select('id, title_en, title_ru, cover_image, rating, price')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(8),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  const recommendations = useQuery({
    queryKey: ['home', 'recommendations'],
    queryFn: fetchRecommendations,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return {
    tours: featuredTours.data ?? [],
    recommendations: recommendations.data ?? [],
    isLoading: featuredTours.isLoading || recommendations.isLoading,
  };
}
```

### Миграция useSupabaseQuery на TanStack Query

```typescript
// Обёртка для совместимости
export function useSupabaseQuery<T>(options: QueryOptions<T>) {
  return useQuery({
    queryKey: [options.table, options.filters],
    queryFn: () => executeSupabaseQuery(options),
    staleTime: options.staleTime ?? TIME.MINUTES(1),
  });
}
```

---

## ⏱ Оценка времени

| Этап | Время |
|------|-------|
| Этап 1: Query Storm | 2-3 часа |
| Этап 2: LCP оптимизация | 30 мин |
| Этап 3: forwardRef | 15 мин |
| Этап 4: INP оптимизация | 1 час |
| Этап 5: Prefetch навигации | 30 мин |
| **Итого** | **4-5 часов** |

---

## Рекомендуемый порядок действий

1. ✅ Исправить forwardRef в OptimizedImage (быстрый fix)
2. ✅ Миграция useRecommendations на useQuery
3. ✅ Создать useHomePageData для координации запросов
4. ✅ Добавить priority loading для Hero-изображений
5. ✅ Добавить prefetch при hover на категории
6. ⏳ Виртуализация длинных списков (отложенно)

