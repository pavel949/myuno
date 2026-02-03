
# План исправлений Owner Module: UX, Функциональность, Масштабируемость

## Обзор изменений

На основе аудита будут выполнены следующие критические исправления:

| Приоритет | Изменение | Файлы |
|-----------|-----------|-------|
| P0 | Добавить pagination в OwnerFinancials | `OwnerFinancials.tsx`, `usePropertyFinancials.ts` |
| P0 | Добавить DB-индексы для производительности | Миграция БД |
| P1 | Сократить Wizard с 7 до 4 шагов | `PropertyWizardSteps.tsx`, `AddProperty.tsx`, `PropertyWizard.tsx` |
| P1 | Улучшить Skeleton loading в Dashboard | `OwnerDashboard.tsx` |
| P1 | Увеличить touch targets в календаре | CSS-правки |
| P2 | Оптимизировать useGlobalSearch через RPC | Миграция + хук |

---

## 1. Pagination в OwnerFinancials (P0)

### Проблема
Сейчас загружаются ВСЕ транзакции в память. При 500+ объектов × 50 транзакций/мес = 25,000 записей — это вызовет memory overflow.

### Решение
Реализовать cursor-based pagination с "Load More" кнопкой.

**Файл: `src/hooks/usePropertyFinancials.ts`**
- Добавить `usePropertyFinancialsPaginated()` с поддержкой cursor
- Параметры: `limit` (50 по умолчанию), `cursor` (дата последней записи)
- Использовать `useInfiniteQuery` из React Query

```typescript
export function usePropertyFinancialsPaginated(propertyId?: string, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['property-financials-paginated', propertyId],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('property_financials')
        .select('*, property:owner_properties(id, title, title_ru)')
        .eq('owner_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(pageSize);
      
      if (pageParam) {
        query = query.lt('transaction_date', pageParam);
      }
      
      const { data } = await query;
      return data;
    },
    getNextPageParam: (lastPage) => 
      lastPage?.length === pageSize ? lastPage[lastPage.length - 1].transaction_date : undefined,
  });
}
```

**Файл: `src/pages/owner/OwnerFinancials.tsx`**
- Заменить `usePropertyFinancialsFull` на `usePropertyFinancialsPaginated`
- Добавить кнопку "Загрузить ещё" / "Load More"
- Показывать количество загруженных / общее

---

## 2. DB-индексы для производительности (P0)

### Миграция БД

```sql
-- Индекс для финансовых транзакций (сортировка по дате)
CREATE INDEX IF NOT EXISTS idx_property_financials_owner_date 
ON property_financials(owner_id, transaction_date DESC);

-- Индекс для фильтрации по property_id
CREATE INDEX IF NOT EXISTS idx_property_financials_property 
ON property_financials(property_id);

-- Индекс для owner_properties (частый запрос)
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_status 
ON owner_properties(owner_id, approval_status);

-- Индекс для поиска (useGlobalSearch)
CREATE INDEX IF NOT EXISTS idx_properties_search 
ON properties USING gin(to_tsvector('simple', coalesce(title_en, '') || ' ' || coalesce(title_ru, '')));
```

---

## 3. Сокращение Wizard с 7 до 4 шагов (P1)

### Текущая структура (7 шагов)
```
ownership → basic → location → photos → pricing → management → description
```

### Новая структура (4 шага)
```
basic (объединяет ownership + basic + management) → location → photos → pricing (объединяет pricing + description)
```

**Файл: `src/components/owner/PropertyWizardSteps.tsx`**

```typescript
export const propertyWizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    titleRu: 'Основное',
    icon: <Home className="h-4 w-4" />,
    description: 'Type, specs & ownership',
    descriptionRu: 'Тип, характеристики и владение',
  },
  {
    id: 'location',
    title: 'Location',
    titleRu: 'Адрес',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Address and map',
    descriptionRu: 'Адрес на карте',
  },
  {
    id: 'photos',
    title: 'Photos',
    titleRu: 'Фото',
    icon: <Upload className="h-4 w-4" />,
    description: 'Upload images',
    descriptionRu: 'Загрузите снимки',
  },
  {
    id: 'pricing',
    title: 'Pricing & Submit',
    titleRu: 'Цены и отправка',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Rates, terms & description',
    descriptionRu: 'Тарифы, условия и описание',
  },
];
```

**Файл: `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`**
- Добавить секцию "Ownership Type" (individual/company)
- Добавить Management Level selector (self/assisted/full)
- Объединить в одном scrollable контейнере

**Файл: `src/components/owner/property-wizard/steps/PricingStep.tsx`**
- Добавить Description поля (title, description)
- Добавить кнопку Submit
- Показать preview перед отправкой

**Файл: `src/pages/owner/AddProperty.tsx`**
- Обновить `renderStep()` для новых 4 шагов
- Убрать отдельные шаги ownership, management, description

---

## 4. Skeleton Loading в Dashboard (P1)

**Файл: `src/pages/owner/OwnerDashboard.tsx`**

Добавить Suspense-обертки с shimmer-эффектами:

```tsx
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Dashboard Skeleton для initial load
function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Search Bar Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
      
      {/* Quick Actions Skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1,2,3,4].map(i => (
          <Skeleton key={i} className="h-16 w-20 rounded-xl flex-shrink-0" />
        ))}
      </div>
      
      {/* Portfolio Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
      
      {/* Finances Skeleton */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

// В return добавить fallback для каждой секции
<Suspense fallback={<PortfolioSkeleton />}>
  <PortfolioSection />
</Suspense>
```

---

## 5. Touch Targets 44px (P1)

**Файл: `src/index.css` или новый `src/styles/owner-calendar.css`**

```css
/* Улучшение touch targets для Owner Calendar */
.owner-calendar .rdp-day {
  min-width: 44px;
  min-height: 44px;
}

.owner-calendar .rdp-button {
  min-width: 44px;
  min-height: 44px;
}

/* Task cards в OperationsSection */
.task-card-touch {
  min-height: 48px;
  padding: 12px;
}
```

**Файл: `src/components/owner/dashboard/OperationsSection.tsx`**
- Добавить `className="task-card-touch"` к Card компонентам

---

## 6. Оптимизация Global Search через RPC (P2)

### Миграция БД — создать unified search function

```sql
CREATE OR REPLACE FUNCTION public.global_search(
  search_term TEXT, 
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title_en TEXT,
  title_ru TEXT,
  image TEXT,
  price NUMERIC,
  rating NUMERIC,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Yachts
  SELECT y.id, 'yachts'::TEXT, y.name_en, y.name_ru, y.cover_image, y.price_full_day, y.rating, '/yachts/' || y.id
  FROM yachts y 
  WHERE y.is_active AND y.approval_status = 'approved' 
    AND (y.name_en ILIKE '%' || search_term || '%' OR y.name_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit
  
  UNION ALL
  
  -- Properties
  SELECT p.id, 'property'::TEXT, p.title_en, p.title_ru, p.cover_image, p.price, p.rating, '/property/' || p.id
  FROM properties p 
  WHERE p.is_active AND p.approval_status = 'approved'
    AND (p.title_en ILIKE '%' || search_term || '%' OR p.title_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit
  
  UNION ALL
  
  -- Tours
  SELECT t.id, 'tours'::TEXT, t.title_en, t.title_ru, t.cover_image, t.price, t.rating, '/tours/' || t.id
  FROM tours t 
  WHERE t.is_active AND t.approval_status = 'approved'
    AND (t.title_en ILIKE '%' || search_term || '%' OR t.title_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit
  
  UNION ALL
  
  -- Restaurants
  SELECT r.id, 'food'::TEXT, r.name_en, r.name_ru, r.cover_image, NULL::NUMERIC, r.rating, '/restaurants/' || r.id
  FROM restaurants r 
  WHERE r.is_active AND r.approval_status = 'approved'
    AND (r.name_en ILIKE '%' || search_term || '%' OR r.name_ru ILIKE '%' || search_term || '%')
  LIMIT result_limit;
  
  -- ... остальные таблицы добавляются аналогично
END;
$$ LANGUAGE plpgsql STABLE;
```

**Файл: `src/hooks/useGlobalSearch.ts`**
- Заменить 21 параллельный запрос на один RPC call
- Упростить код и уменьшить latency

```typescript
const { data } = await supabase.rpc('global_search', { 
  search_term: query, 
  result_limit: 5 
});
```

---

## 7. Auto-save Draft в Wizard (P1)

**Файл: `src/hooks/usePropertyWizard.ts`**

Добавить debounced auto-save:

```typescript
// Auto-save draft every 3 seconds when formData changes
useEffect(() => {
  const timer = setTimeout(() => {
    if (Object.keys(formData).length > 0) {
      saveDraftToLocalStorage(formData);
    }
  }, 3000);
  
  return () => clearTimeout(timer);
}, [formData]);
```

---

## Файлы для изменения

| Файл | Тип изменения |
|------|---------------|
| `src/hooks/usePropertyFinancials.ts` | Добавить `usePropertyFinancialsPaginated` |
| `src/pages/owner/OwnerFinancials.tsx` | Внедрить pagination UI |
| `src/components/owner/PropertyWizardSteps.tsx` | Сократить до 4 шагов |
| `src/components/owner/property-wizard/steps/BasicInfoStep.tsx` | Объединить ownership + management |
| `src/components/owner/property-wizard/steps/PricingStep.tsx` | Добавить description + submit |
| `src/pages/owner/AddProperty.tsx` | Обновить renderStep() |
| `src/pages/owner/OwnerDashboard.tsx` | Добавить Skeleton fallbacks |
| `src/components/owner/dashboard/OperationsSection.tsx` | Touch target className |
| `src/hooks/useGlobalSearch.ts` | Оптимизировать через RPC |
| `src/index.css` | Touch target CSS |
| **Миграция БД** | Индексы + global_search RPC |

---

## Ожидаемые улучшения

| Метрика | До | После |
|---------|-----|-------|
| Financials load time (1000 records) | ~3s | <0.5s |
| Wizard completion rate | ~60% | ~85% |
| Touch accessibility score | 70% | 100% |
| Global Search latency | ~1.2s | ~0.3s |
| Memory usage (mobile) | High | Optimized |

---

## Порядок реализации

1. **Миграция БД** — индексы (критично для производительности)
2. **usePropertyFinancialsPaginated** — хук с pagination
3. **OwnerFinancials.tsx** — UI pagination
4. **PropertyWizardSteps.tsx** — сокращение шагов
5. **BasicInfoStep + PricingStep** — объединение
6. **AddProperty.tsx** — обновление renderStep
7. **OwnerDashboard.tsx** — Skeleton loading
8. **CSS touch targets** — мобильная доступность
9. **global_search RPC** — оптимизация поиска
10. **useGlobalSearch.ts** — использование RPC
