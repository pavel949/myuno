

# Редизайн главной страницы Маркетплейса myUNO

## Визия
Трансформировать текущий MarketIndex в **премиальный e-commerce хаб** уровня Ozon/Amazon с учётом дизайн-стиля UNO (градиенты, rounded-2xl, микро-анимации, trust-первый подход).

---

## Текущие проблемы

| Проблема | Описание |
|----------|----------|
| Слабый визуальный вход | FeaturedBanner статичен, нет "wow-эффекта" |
| Категории спрятаны | Ribbon слишком текстовый, нет визуальных превью |
| Нет срочности | Отсутствует блок "Успей купить" / Flash Deals |
| Однообразие секций | Все карусели выглядят одинаково |
| Нет персонализации | Нет "Недавно просмотренные" / рекомендации |
| Нет доверия вендорам | Вендоры не показаны как бренды |

---

## Новая структура (сверху вниз)

```text
┌─────────────────────────────────────────────────┐
│  STICKY HEADER (search + cart)                  │ ← MiniAppLayout
├─────────────────────────────────────────────────┤
│  FILTER RIBBON (Каталог | Акции | Хиты | Новинки)│ ← Sticky
├─────────────────────────────────────────────────┤
│  HERO PROMO CAROUSEL                            │ ← Новый!
│  [Story-banner 1] [Story-banner 2] [Banner 3]   │
├─────────────────────────────────────────────────┤
│  QUICK CATEGORY GRID (2x4 icons)                │ ← Вместо текстового ribbon
│  🥬 Овощи  🥛 Молочка  🥩 Мясо  🦐 Морепродукты │
│  🥖 Выпечка 🥤 Напитки  🍿 Снеки  🌿 Органик    │
├─────────────────────────────────────────────────┤
│  FLASH DEALS (⚡ Успей за 2:34:15)              │ ← Новый! Countdown
│  [Card] [Card] [Card] [Card] →                  │
├─────────────────────────────────────────────────┤
│  BESTSELLERS (🔥 Хиты продаж)                   │
│  [Card] [Card] [Card] [Card] →                  │
├─────────────────────────────────────────────────┤
│  FEATURED VENDORS (✓ Проверенные продавцы)     │ ← Новый!
│  [VendorCard] [VendorCard] [VendorCard] →       │
├─────────────────────────────────────────────────┤
│  NEW ARRIVALS (✨ Новинки)                      │
│  [Card] [Card] [Card] [Card] →                  │
├─────────────────────────────────────────────────┤
│  CATEGORIES WITH PRODUCTS (Dynamic)             │
│  🥬 Овощи и фрукты [Card] [Card] →              │
│  🥛 Молочные продукты [Card] [Card] →           │
├─────────────────────────────────────────────────┤
│  RECENTLY VIEWED (👀 Недавно смотрели)         │ ← Новый! LocalStorage
├─────────────────────────────────────────────────┤
│  ALL PRODUCTS GRID                              │
│  [Grid 2x2 / 3x3 / 4x4]                         │
├─────────────────────────────────────────────────┤
│  CROSS-SELL SECTION                             │
└─────────────────────────────────────────────────┘
```

---

## Новые компоненты

### 1. PromoCarousel (Hero Story-banners)
**Файл:** `src/components/market/PromoCarousel.tsx`

```text
┌─────────────────────────────────────┐
│  🎉 MEGA SALE -50%                  │
│  на все морепродукты               │
│  [Смотреть →]                       │
│  ▄▄▄ ▃ ▃ ▃   ← pagination dots     │
└─────────────────────────────────────┘
```

- Полноэкранная ширина, aspect-ratio 16:9
- Автоматическая смена (5 сек)
- Gradient overlay для читаемости текста
- Источник: таблица `marketplace_promotions` (новая)

### 2. QuickCategoryIcons
**Файл:** `src/components/market/QuickCategoryIcons.tsx`

- Сетка 4x2 с круглыми иконками (как в Amazon App)
- Эмодзи в центре, название под ним
- Размер: w-16 h-16 с эффектом lift on hover

### 3. FlashDealsSection
**Файл:** `src/components/market/FlashDealsSection.tsx`

- Заголовок с **живым countdown-таймером**
- Красный акцент `bg-destructive`
- Карточки с прогресс-баром "Осталось 23%"
- Источник: товары с `is_flash_deal: true`

### 4. FeaturedVendorsCarousel
**Файл:** `src/components/market/FeaturedVendorsCarousel.tsx`

- Карточки вендоров: логотип, имя, рейтинг, кол-во товаров
- Бейдж "Проверен myUNO"
- Источник: таблица `marketplace_vendors`

### 5. RecentlyViewedSection
**Файл:** `src/components/market/RecentlyViewedSection.tsx`

- Хранение в LocalStorage (последние 10 товаров)
- Показывать только если есть история

---

## Изменения в существующих компонентах

### MarketIndex.tsx — Полная реструктуризация

```tsx
// Новая структура
<MiniAppLayout>
  <FilterRibbon />           {/* существует */}
  
  <PromoCarousel />           {/* НОВЫЙ */}
  <QuickCategoryIcons />      {/* НОВЫЙ */}
  <FlashDealsSection />       {/* НОВЫЙ */}
  <BestsellersSection />      {/* рефакторинг */}
  <FeaturedVendorsCarousel /> {/* НОВЫЙ */}
  <NewArrivalsSection />      {/* рефакторинг */}
  <CategoriesWithProducts />  {/* существует */}
  <RecentlyViewedSection />   {/* НОВЫЙ */}
  <AllProductsGrid />         {/* существует */}
  <CrossSellSection />        {/* существует */}
</MiniAppLayout>
```

### ProfessionalProductCard — Дополнения

- Добавить **"Купили 100+ раз"** (social proof)
- Добавить **Quick View** overlay при hover
- Добавить сохранение в `recentlyViewed` при клике

---

## Миграция базы данных

### Новая таблица: `marketplace_promotions`

```sql
CREATE TABLE marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  image_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-primary/80 to-primary/60',
  link_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Новые поля в `marketplace_products`

```sql
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_deal_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;
```

---

## Дизайн-токены UNO (применение)

| Элемент | Токен |
|---------|-------|
| Hero Carousel | `rounded-2xl`, `shadow-xl`, gradient overlays |
| Category Icons | `rounded-full`, `bg-primary/10 hover:bg-primary/20`, lift effect |
| Flash Badge | `bg-destructive`, `animate-pulse` |
| Vendor Card | `rounded-2xl`, `shadow-sm → shadow-md on hover` |
| Section Headers | `UnifiedSectionHeader` с иконками |

---

## Порядок выполнения

### Фаза 1: Визуальные улучшения (без БД)
1. `QuickCategoryIcons.tsx` — сетка иконок категорий
2. `RecentlyViewedSection.tsx` — LocalStorage
3. Рефакторинг секций в MarketIndex

### Фаза 2: Динамический контент (с БД)
4. Миграция: таблица `marketplace_promotions`
5. `PromoCarousel.tsx` — hero carousel
6. `useMarketplacePromotions.ts` — хук

### Фаза 3: Продвинутые фичи
7. Миграция: поля `is_flash_deal`, `purchase_count`
8. `FlashDealsSection.tsx` — countdown + progress
9. `FeaturedVendorsCarousel.tsx` — вендоры

---

## Результат

- Визуальный WOW-эффект с первого экрана
- Путь до товара: 1 клик (Quick Icons)
- Срочность покупки (Flash Deals)
- Доверие к вендорам (Verified Badges)
- Персонализация (Recently Viewed)
- Полное соответствие дизайн-системе UNO

---

## Файлы для создания

| Файл | Описание |
|------|----------|
| `src/components/market/PromoCarousel.tsx` | Hero story-banners |
| `src/components/market/QuickCategoryIcons.tsx` | Сетка 4x2 иконок |
| `src/components/market/FlashDealsSection.tsx` | Таймер + акции |
| `src/components/market/FeaturedVendorsCarousel.tsx` | Карусель вендоров |
| `src/components/market/RecentlyViewedSection.tsx` | Недавно смотрели |
| `src/hooks/useRecentlyViewed.ts` | LocalStorage хук |
| `src/hooks/useMarketplacePromotions.ts` | Хук для промо |

## Файлы для рефакторинга

| Файл | Изменения |
|------|-----------|
| `src/pages/market/MarketIndex.tsx` | Новая структура секций |
| `src/components/market/ProfessionalProductCard.tsx` | Social proof + Quick View |
| `src/components/market/FeaturedBanner.tsx` | Удалить (заменён на PromoCarousel) |

