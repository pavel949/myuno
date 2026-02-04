
# План системного исправления навигации, устаревших страниц и мобильной стабильности

## Выявленные проблемы

### 1. Критические 404 ошибки (Broken Links)
Обнаружено **15+ навигационных путей**, которые ведут на несуществующие маршруты:

| Источник | Некорректный путь | Проблема |
|----------|-------------------|----------|
| `PartnersPage.tsx` (строки 289, 374, 527) | `/provider/onboarding` | Старый путь, нужен `/vendor/onboarding` |
| `CleaningIndex.tsx` (строки 76-77) | `/services/booking/cleaning`, `/services/booking/laundry` | ID "cleaning" не существует в БД |
| `DeliveryIndex.tsx` (строки 146, 163, 203) | `/delivery/new` | Маршрут не зарегистрирован |
| `WaterSection.tsx`, `ToursSection.tsx` | `/water`, `/tours` | Legacy редиректы создают лишние циклы |

### 2. Hardcoded данные вместо БД (причина "устаревших дизайнов")
**12+ страниц** используют статические массивы вместо запросов к базе данных:

| Файл | Hardcoded данные |
|------|------------------|
| `ServiceBooking.tsx` | Услуги сантехника + "Alex Masters" |
| `ServiceProviderDetail.tsx` | Mock провайдер и отзывы |
| `ServicesMap.tsx` | Demo провайдеры для карты |
| `CleaningBooking.tsx` | Статический прайс уборки |
| `LegalBooking.tsx` | Юридические услуги |
| `BabysitterBooking.tsx` | Няни с фото |
| `FlowerShopDetail.tsx` | Mock магазин цветов |
| `EducationBooking.tsx` | Курсы и репетиторы |
| `FitnessBooking.tsx` | Типы абонементов |

### 3. Проблемы мобильной прокрутки
Остаточные проблемы с `touch-action` в некоторых компонентах, блокирующие вертикальную прокрутку.

---

## Системное решение

### Часть A: Централизованный Route Registry

Создать единый источник истины для всех маршрутов приложения:

```text
src/lib/config/
├── routes.ts          # Все маршруты приложения
├── routeValidation.ts # Runtime валидация ссылок
└── legacyRedirects.ts # Карта устаревших путей
```

**Содержимое `routes.ts`:**
```typescript
export const APP_ROUTES = {
  // Onboarding
  VENDOR_ONBOARDING: '/vendor/onboarding',
  
  // Services
  SERVICES: '/services',
  SERVICE_PROVIDER: (id: string) => `/services/provider/${id}`,
  SERVICE_BOOKING: (id: string) => `/services/booking/${id}`,
  
  // Cleaning (использует services вертикаль)
  CLEANING: '/cleaning',
  CLEANING_DETAIL: (id: string) => `/cleaning/${id}`,
  CLEANING_BOOKING: (id: string) => `/cleaning/${id}/book`,
  
  // Experiences (единый хаб для tours + water)
  EXPERIENCES: '/experiences',
  EXPERIENCE_DETAIL: (id: string) => `/experiences/${id}`,
  
  // Delivery
  DELIVERY: '/delivery',
  // DELIVERY_NEW не существует - нужно создать или удалить ссылки
} as const;

// Deprecated routes → New routes
export const LEGACY_REDIRECTS = {
  '/provider/onboarding': '/vendor/onboarding',
  '/tours': '/experiences?type=tour',
  '/water': '/experiences?type=activity',
  '/become-provider': '/become-partner',
} as const;
```

### Часть B: Рефакторинг Booking страниц

Заменить hardcoded данные на динамические хуки:

**Пример для `ServiceBooking.tsx`:**
```typescript
// БЫЛО (hardcoded)
const services = [
  { id: "s1", nameEn: "Faucet installation", price: 1500 },
  // ...
];
const provider = { name: "Alex Masters" };

// СТАНЕТ (динамически)
import { useProviderServices } from '@/hooks/useProviderServices';
import { useProviderDetails } from '@/hooks/useProviderDetails';

const { services, isLoading } = useProviderServices(providerId);
const { provider } = useProviderDetails(providerId);
```

**Новый хук `useProviderServices.ts`:**
```typescript
export function useProviderServices(providerId: string) {
  return useQuery({
    queryKey: ['provider-services', providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!providerId,
  });
}
```

### Часть C: Исправление сломанных ссылок

| Файл | Изменение |
|------|-----------|
| `PartnersPage.tsx` | `/provider/onboarding` → `/vendor/onboarding` (3 места) |
| `CleaningIndex.tsx` | Навигация на `/cleaning/:providerId/book` вместо `/services/booking/cleaning` |
| `DeliveryIndex.tsx` | Временно скрыть кнопку `/delivery/new` или создать страницу |
| `WaterSection.tsx` | `/water` → `/experiences?type=activity` (прямая ссылка без редиректа) |
| `ToursSection.tsx` | `/tours` → `/experiences?type=tour` (прямая ссылка) |

### Часть D: Создание отсутствующих страниц

**Опция 1: Создать `/delivery/new`**
```typescript
// src/pages/delivery/DeliveryNew.tsx
export default function DeliveryNew() {
  // Форма создания заказа на доставку
}
```

**Опция 2: Интеграция в существующий `/delivery`**
Добавить модальное окно создания заказа в `DeliveryIndex.tsx`.

### Часть E: Мобильная стабильность

Создать утилиту для проверки `touch-action` во всех карусельных компонентах:

```typescript
// src/lib/scrollUtils.ts
export const HORIZONTAL_SCROLL_CLASSES = 
  'overflow-x-auto snap-x snap-mandatory touch-pan-y scrollbar-hide';

// Использование:
<div className={cn("flex gap-3", HORIZONTAL_SCROLL_CLASSES)}>
```

---

## Порядок исправления

1. **Фаза 1: Route Registry**
   - Создать `src/lib/config/routes.ts`
   - Добавить все маршруты из `AnimatedRoutes.tsx`
   - Создать функцию `validateRoute()` для dev-режима

2. **Фаза 2: Критические 404**
   - Исправить `PartnersPage.tsx` (3 ссылки)
   - Исправить `CleaningIndex.tsx` (2 ссылки)
   - Решить проблему `DeliveryIndex.tsx`

3. **Фаза 3: Динамические данные**
   - Создать `useProviderServices` хук
   - Рефакторить `ServiceBooking.tsx`
   - Рефакторить `ServiceProviderDetail.tsx`
   - Рефакторить остальные booking страницы

4. **Фаза 4: Оптимизация legacy**
   - Обновить `WaterSection.tsx` и `ToursSection.tsx`
   - Удалить редиректы где возможно
   - Обновить `routePrefetch.ts`

5. **Фаза 5: Мобильная стабильность**
   - Аудит всех `touch-action` стилей
   - Стандартизация через `HORIZONTAL_SCROLL_CLASSES`

---

## Технические детали

### Файлы для создания
- `src/lib/config/routes.ts` - Registry маршрутов
- `src/hooks/useProviderServices.ts` - Хук для услуг провайдера
- `src/pages/delivery/DeliveryNew.tsx` - Страница создания доставки (опционально)

### Файлы для редактирования
- `src/pages/info/PartnersPage.tsx` - 3 ссылки на onboarding
- `src/pages/cleaning/CleaningIndex.tsx` - 2 ссылки booking
- `src/pages/delivery/DeliveryIndex.tsx` - 3 ссылки на /new
- `src/pages/services/ServiceBooking.tsx` - Убрать hardcode
- `src/pages/services/ServiceProviderDetail.tsx` - Убрать hardcode
- `src/components/home/WaterSection.tsx` - Прямая ссылка
- `src/components/home/ToursSection.tsx` - Прямая ссылка
- `src/lib/routePrefetch.ts` - Обновить legacy пути

### Оценка объёма
- ~400 строк нового кода
- ~200 строк изменений
- 15-20 файлов затронуто
