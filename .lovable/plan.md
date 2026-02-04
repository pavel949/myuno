

# План: Супермаркет услуг myUNO — E2E редизайн

## Цель
Трансформировать `/discover` в премиальный маркетплейс услуг уровня Klook/Airbnb с:
- Выезжающим каталогом категорий (как в `/market`)
- Полным E2E checkout-flow с 4 способами оплаты
- Данными исключительно из БД (0 хардкода)
- Канонической дизайн-системой myUNO

---

## Текущее состояние vs Цель

| Элемент | Сейчас | Цель |
|---------|--------|------|
| CategoryDrawer | ❌ Нет | ✅ Полный каталог как в Market |
| Promo Carousel | ❌ Статика | ✅ Баннеры из БД |
| Quick Icons | ❌ Нет | ✅ Сетка 4x2 категорий |
| Featured Providers | ❌ Нет | ✅ Карусель топ-исполнителей |
| Recently Viewed | ❌ Нет | ✅ LocalStorage история |
| Checkout | ⚠️ Cash/Wallet | ✅ Cash/Wallet/Card/Advance |
| Данные | ⚠️ Частично хардкод | ✅ 100% из БД |

---

## Архитектура новой страницы

```text
┌─────────────────────────────────────────────────┐
│  STICKY HEADER (MiniAppLayout + Search)         │
├─────────────────────────────────────────────────┤
│  FILTER RIBBON (📋 Каталог | 🔥 Акции | ⭐ Топ | ✨ Новые)
├─────────────────────────────────────────────────┤
│  SERVICE PROMO CAROUSEL (баннеры из БД)         │
│  [🧹 Уборка -30%] [❄️ Кондиционеры ฿500] [🏊 Бассейн]│
├─────────────────────────────────────────────────┤
│  QUICK SERVICE ICONS (2x4 grid)                 │
│  🔧 Ремонт  🧹 Уборка  🚿 Сантехник  ⚡ Электрик │
│  🏊 Бассейн 🌱 Сад  📦 Переезд  🐜 Дезинсекция   │
├─────────────────────────────────────────────────┤
│  FEATURED PROVIDERS (⭐ Топ мастера)            │
│  [ProviderCard] [ProviderCard] [ProviderCard]   │
├─────────────────────────────────────────────────┤
│  POPULAR SERVICES (🔥 Популярные услуги)        │
│  [ServiceCard] [ServiceCard] [ServiceCard] →    │
├─────────────────────────────────────────────────┤
│  CATEGORY SECTIONS (по группам из БД)           │
│  🏠 Home & Services [Card] [Card] →             │
│  💼 Professional [Card] [Card] →                │
├─────────────────────────────────────────────────┤
│  RECENTLY VIEWED (👀 Недавно смотрели)          │
├─────────────────────────────────────────────────┤
│  ALL PROVIDERS GRID                             │
├─────────────────────────────────────────────────┤
│  CROSS-SELL SECTION                             │
└─────────────────────────────────────────────────┘
```

---

## Фаза 1: ServiceCategoryDrawer — Выезжающий каталог

### Новые компоненты (по образцу Market)

| Файл | Описание |
|------|----------|
| `src/components/services/drawer/index.ts` | Экспорт |
| `src/components/services/drawer/ServiceCategoryAccordion.tsx` | Аккордеон категорий из `category_groups` + `categories` |
| `src/components/services/drawer/ServiceQuickAccess.tsx` | Быстрый доступ: Акции, Топ, Избранное |
| `src/components/services/drawer/ProviderSection.tsx` | Секция "Стать исполнителем" |
| `src/components/services/drawer/ServiceDrawerFooter.tsx` | Футер с языком и версией |
| `src/components/services/ServiceCategoryDrawer.tsx` | Основной Sheet-компонент |

### Источники данных (каноничные)

```typescript
// Использует существующий useCategories hook
const { groups, getName } = useCategories();

// groups структура из БД:
// - Lifestyle & Leisure (beauty-spa, restaurants, events...)
// - Health & Care (medical, fitness, pharmacy...)
// - Home & Services (cleaning, plumbing, electrical, ac-repair...)
// - Professional (legal, insurance...)
// - Quick Services (flowers, transport, transfers...)
// - Expat Services (banking, visa, veterinary...)
```

---

## Фаза 2: Главная страница Discover — Полный редизайн

### Изменения в `src/pages/Discover.tsx`

```tsx
// БЫЛО: ThematicSections (хардкод)
// СТАНЕТ: Динамический маркетплейс как MarketIndex

import { ServiceCategoryDrawer } from '@/components/services/ServiceCategoryDrawer';
import { ServicePromoCarousel } from '@/components/services/ServicePromoCarousel';
import { QuickServiceIcons } from '@/components/services/QuickServiceIcons';
import { FeaturedProvidersCarousel } from '@/components/services/FeaturedProvidersCarousel';
import { PopularServicesSection } from '@/components/services/PopularServicesSection';
import { RecentlyViewedServices } from '@/components/services/RecentlyViewedServices';
import { CategoryServicesSection } from '@/components/services/CategoryServicesSection';

// Использование канонических компонентов:
<MiniAppLayout ...>
  <UnifiedFilterRibbon 
    leadingAction={<ServiceCategoryDrawer />}
    items={quickActionItems}
    ...
  />
  
  <ServicePromoCarousel />
  <QuickServiceIcons groups={groups} />
  <FeaturedProvidersCarousel providers={topProviders} />
  <PopularServicesSection services={popularServices} />
  
  {groups.map(group => (
    <CategoryServicesSection key={group.id} group={group} />
  ))}
  
  <RecentlyViewedServices />
  <AllProvidersGrid providers={providers} />
  <CrossSellSection currentVertical="services" />
</MiniAppLayout>
```

### Новые компоненты для главной страницы

| Файл | Описание |
|------|----------|
| `src/components/services/ServicePromoCarousel.tsx` | Hero-баннеры для услуг (из БД) |
| `src/components/services/QuickServiceIcons.tsx` | Сетка 4x2 иконок категорий |
| `src/components/services/FeaturedProvidersCarousel.tsx` | Карусель топ-провайдеров |
| `src/components/services/PopularServicesSection.tsx` | Популярные услуги (по рейтингу) |
| `src/components/services/CategoryServicesSection.tsx` | Секция по группе категорий |
| `src/components/services/RecentlyViewedServices.tsx` | История просмотров |
| `src/components/services/AllProvidersGrid.tsx` | Грид всех провайдеров |
| `src/components/services/ServiceCard.tsx` | Карточка услуги (как ProfessionalProductCard) |

---

## Фаза 3: База данных — Промо-баннеры

### Новая таблица: `service_promotions`

```sql
CREATE TABLE service_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  image_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-amber-500/80 to-orange-500/60',
  link_path TEXT NOT NULL,
  category_slug TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON service_promotions 
  FOR SELECT USING (true);

-- Начальные данные
INSERT INTO service_promotions (title_en, title_ru, subtitle_en, subtitle_ru, image_url, link_path, gradient) VALUES
('Deep Cleaning -30%', 'Генуборка -30%', 'Professional cleaning', 'Профессиональная уборка', 
 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', '/cleaning', 'from-emerald-500/80 to-teal-500/60'),
('AC Service ฿500', 'Сервис кондиционеров ฿500', 'Beat the heat', 'Подготовка к сезону', 
 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', '/services?category=ac-repair', 'from-blue-500/80 to-cyan-500/60'),
('Pool Care from ฿800', 'Бассейн от ฿800', 'Weekly service', 'Еженедельно', 
 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800', '/services?category=pool', 'from-sky-500/80 to-blue-500/60');
```

### Новый хук: `useServicePromotions.ts`

```typescript
export function useServicePromotions() {
  return useQuery({
    queryKey: ['service-promotions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_promotions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
    ...CACHE_PROFILES.STATIC,
  });
}
```

---

## Фаза 4: E2E Checkout — Унификация

### Проблема текущего ServiceBooking.tsx
- Хардкод массива `services` (строки 28-33)
- Только 2 способа оплаты (cash/wallet)
- Нет BookingStepProgress
- Нет Concierge Advance
- Нет Stripe

### Изменения в `src/pages/services/ServiceBooking.tsx`

```tsx
// ДОБАВИТЬ:
import { BookingStepProgress, serviceBookingSteps } from '@/components/booking';
import { useConciergeAdvance, ConciergeAdvanceOption } from '@/hooks/useConciergeAdvance';
import { useStripeServiceCheckout } from '@/hooks/useStripeServiceCheckout';

// ЗАГРУЗКА УСЛУГ ИЗ БД (не хардкод!)
const { services: providerServices, isLoading } = useServicesByProvider(id);

// Определение текущего шага
const getCurrentStep = () => {
  if (paymentMethod) return 2;
  if (selectedServices.length > 0 && date && time && address) return 1;
  return 0;
};

// JSX после PageHeader:
<BookingStepProgress 
  steps={serviceBookingSteps} 
  currentStep={getCurrentStep()} 
/>

// Payment section:
<BookingPaymentSelect
  selected={paymentMethod}
  onSelect={setPaymentMethod}
  amount={totalAmount}
  currency="THB"
  showCard      // ← ДОБАВИТЬ Stripe
  showWallet
  showCash
/>

{paymentMethod === 'concierge_advance' && (
  <ConciergeAdvanceOption
    isSelected={true}
    onSelect={() => setPaymentMethod('concierge_advance')}
    baseAmount={totalAmount}
    feePercent={feePercent}
    currency="THB"
  />
)}

// handleSubmit с routing:
const handleSubmit = async () => {
  // 1. Card → Stripe redirect
  if (paymentMethod === 'card') {
    await createServiceCheckout({ ... });
    return;
  }
  
  // 2. Concierge Advance
  if (paymentMethod === 'concierge_advance') {
    const result = await createBooking({ status: 'pending' });
    await createAdvanceRequest({ orderId: result.booking_id, ... });
    navigateToAdvanceRequested(...);
    return;
  }
  
  // 3. Wallet/Cash → standard flow
  await createBooking({ ... });
};
```

### Новые файлы для Checkout

| Файл | Описание |
|------|----------|
| `supabase/functions/create-service-checkout/index.ts` | Stripe Checkout для услуг |
| `src/hooks/useStripeServiceCheckout.ts` | Хук для вызова edge function |
| `src/hooks/useServicesByProvider.ts` | Загрузка услуг провайдера из БД |

### Edge Function: create-service-checkout

```typescript
// Аналогично create-flowers-checkout и create-market-checkout
// Принимает:
// - services: Array<{ id, name, price, duration_minutes }>
// - service_fee: number
// - total_amount: number
// - scheduled_at: string
// - address: string
// - contact: { name, phone, email }
// - provider_id, provider_name

// Возвращает:
// - url: Stripe Checkout URL
// - sessionId: string
```

---

## Фаза 5: Карточка услуги — ServiceCard

### Новый компонент: `ServiceCard.tsx`

Аналог `ProfessionalProductCard` для услуг:

```tsx
interface ServiceCardProps {
  service: Service;
  onBook?: () => void;
  onAddToCart?: () => void;
  onClick?: () => void;
  compact?: boolean;
  variant?: 'default' | 'featured' | 'horizontal';
}

// Отображает:
// - Изображение услуги (16:9 или 4:3)
// - Название (EN/RU)
// - Цена + длительность
// - Рейтинг провайдера
// - Бейджи: Verified, Languages
// - CTA: "Записаться" / "В корзину"
```

---

## Фаза 6: Recently Viewed — История просмотров

### Новый хук: `useRecentlyViewedServices.ts`

```typescript
// Аналогично useRecentlyViewedProducts
// Сохраняет в localStorage: 'recentlyViewedServices'
// Структура: { id, viewedAt, name, image, price, providerId }
// Лимит: 10 последних
```

### Компонент: `RecentlyViewedServices.tsx`

```tsx
// Использует UnifiedScrollSection
// Показывает карточки из localStorage
// Кликабельные ссылки на провайдера/услугу
```

---

## Источники данных (БД → UI)

```text
┌─────────────────┐       ┌─────────────────┐
│ category_groups │◄──────│   categories    │
│ (8 групп)       │       │ (30+ категорий) │
└─────────────────┘       └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
          ┌─────────────────┐            ┌─────────────────┐
          │    providers    │◄───────────│    services     │
          │ (17 активных)   │            │ (97+ услуг)     │
          └─────────────────┘            └─────────────────┘
                    ▲
                    │
          ┌─────────────────┐
          │service_promotions│ ← НОВАЯ
          │ (промо-баннеры) │
          └─────────────────┘
```

---

## Порядок реализации

### День 1: Drawer + Структура
1. Миграция: создать таблицу `service_promotions`
2. `ServiceCategoryDrawer` — выезжающий каталог
3. `ServiceCategoryAccordion` — аккордеон из useCategories
4. Рефакторинг `Discover.tsx` — базовая структура

### День 2: Визуальные секции
5. `useServicePromotions` — хук для промо
6. `ServicePromoCarousel` — hero-баннеры
7. `QuickServiceIcons` — сетка 4x2
8. `FeaturedProvidersCarousel` — топ исполнители

### День 3: Контент-секции
9. `ServiceCard` — карточка услуги
10. `PopularServicesSection` — популярные услуги
11. `CategoryServicesSection` — по группам
12. `RecentlyViewedServices` — история

### День 4: E2E Checkout
13. `useServicesByProvider` — услуги провайдера из БД
14. Рефакторинг `ServiceBooking.tsx` — удаление хардкода
15. `create-service-checkout` edge function
16. `useStripeServiceCheckout` — Stripe хук
17. Интеграция Concierge Advance

### День 5: Полировка
18. Тестирование E2E flow
19. Оптимизация производительности
20. Проверка mobile UX (scroll, swipe)

---

## Файлы для создания

| Файл | Описание |
|------|----------|
| `src/components/services/drawer/index.ts` | Экспорт drawer |
| `src/components/services/drawer/ServiceCategoryAccordion.tsx` | Аккордеон категорий |
| `src/components/services/drawer/ServiceQuickAccess.tsx` | Быстрый доступ |
| `src/components/services/drawer/ProviderSection.tsx` | Для исполнителей |
| `src/components/services/drawer/ServiceDrawerFooter.tsx` | Футер |
| `src/components/services/ServiceCategoryDrawer.tsx` | Главный drawer |
| `src/components/services/ServicePromoCarousel.tsx` | Промо-баннеры |
| `src/components/services/QuickServiceIcons.tsx` | Сетка иконок |
| `src/components/services/FeaturedProvidersCarousel.tsx` | Топ провайдеры |
| `src/components/services/PopularServicesSection.tsx` | Популярные услуги |
| `src/components/services/CategoryServicesSection.tsx` | По группам |
| `src/components/services/RecentlyViewedServices.tsx` | История просмотров |
| `src/components/services/AllProvidersGrid.tsx` | Грид провайдеров |
| `src/components/services/ServiceCard.tsx` | Карточка услуги |
| `src/hooks/useServicePromotions.ts` | Промо из БД |
| `src/hooks/useServicesByProvider.ts` | Услуги провайдера |
| `src/hooks/useRecentlyViewedServices.ts` | LocalStorage история |
| `src/hooks/useStripeServiceCheckout.ts` | Stripe хук |
| `supabase/functions/create-service-checkout/index.ts` | Edge function |

## Файлы для редактирования

| Файл | Изменения |
|------|-----------|
| `src/pages/Discover.tsx` | Полный редизайн структуры |
| `src/pages/services/ServiceBooking.tsx` | Удаление хардкода, добавление Stripe + Advance |
| `src/components/services/index.ts` | Новые экспорты |
| `src/components/booking/BookingStepProgress.tsx` | Добавить `serviceBookingSteps` |

---

## Канонические элементы (используем существующие)

- `MiniAppLayout` — обёртка страницы
- `UnifiedFilterRibbon` — лента фильтров
- `UnifiedSectionHeader` — заголовок секции
- `UnifiedScrollSection` — горизонтальный скролл
- `HomeServiceProviderCard` — карточка провайдера
- `BookingStepProgress` — прогресс бронирования
- `BookingPaymentSelect` — выбор оплаты
- `BookingContactForm` — контактные данные
- `ConciergeAdvanceOption` — кредитование
- `CrossSellSection` — кросс-продажи

---

## Результат

- **Единый UX** между товарами и услугами (Klook/Airbnb quality)
- **Выезжающий каталог** с категориями из БД
- **0 хардкода** — всё из `categories`, `providers`, `services`, `service_promotions`
- **E2E checkout** с 4 способами оплаты: Cash, Wallet, Card (Stripe), Concierge Advance
- **Hero-баннеры** для промо-акций услуг
- **Recently Viewed** для персонализации
- **Топ-мастера** для повышения доверия
- **Mobile-first** с правильным scroll/swipe

