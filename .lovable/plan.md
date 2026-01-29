
# План: Профессиональный реестр поставщиков маркетплейса

## Обзор проблемы
Сейчас товары связаны с базой данных, но поставщики хранятся как простой текст (`vendor_name`). На ведущих маркетплейсах (Ozon, Wildberries, Amazon) каждый товар привязан к полноценной карточке продавца.

---

## Часть 1: База данных - Реестр поставщиков

### 1.1 Новая таблица `marketplace_vendors`
```
marketplace_vendors
- id (uuid, PK)
- slug (text, unique) - URL-friendly имя
- name_en, name_ru (text) - название
- description_en, description_ru (text) - описание
- logo_url (text) - логотип
- cover_image (text) - обложка
- phone, email (text) - контакты
- website (text) - сайт
- address, address_ru (text) - адрес
- rating (numeric) - рейтинг (1-5)
- review_count (integer) - количество отзывов
- verified (boolean) - верифицирован
- is_active (boolean)
- created_at, updated_at (timestamps)
```

### 1.2 Связь товаров с поставщиками
Добавить в `marketplace_products`:
- `vendor_id (uuid, FK -> marketplace_vendors.id)`

### 1.3 Seed Data: Создание поставщиков
Создать записи для всех существующих vendor_name:
- Thai Rice Co, Organic Farm, Coca-Cola, Red Bull...
- С логотипами, описаниями, контактами
- Связать существующие товары через vendor_id

---

## Часть 2: UI - Карточка поставщика

### 2.1 На странице товара
```
+------------------------------------------+
|  Продавец                                |
+------------------------------------------+
|  [Logo] Thai Rice Co.         ✓ Verified |
|  ⭐ 4.8 (156 отзывов)                    |
|  📦 125 товаров                          |
|  [Все товары продавца →]                 |
+------------------------------------------+
```

### 2.2 Страница продавца `/market/vendor/:slug`
- Баннер с логотипом и информацией
- Контакты и описание
- Все товары этого продавца
- Фильтры и сортировка

---

## Часть 3: Навигация

### 3.1 Клик на поставщика
- На карточке товара → страница продавца
- На странице товара → страница продавца
- Поиск по названию продавца

### 3.2 Фильтр по поставщику
В категориях добавить фильтр "По продавцу"

---

## Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `supabase/migrations/..._vendors.sql` | Новая таблица + seed |
| `src/types/marketplace.ts` | Добавить MarketplaceVendor |
| `src/hooks/useMarketplace.ts` | Хук useVendor, useVendorProducts |
| `src/pages/market/VendorPage.tsx` | Новая страница |
| `src/components/market/VendorCard.tsx` | Карточка продавца |
| `src/components/market/VendorInfo.tsx` | Блок на странице товара |
| `src/pages/market/ProductDetailPage.tsx` | Добавить VendorInfo |
| `src/components/layout/AnimatedRoutes.tsx` | Роут /market/vendor/:slug |

---

## Технические детали

### Новый тип
```typescript
interface MarketplaceVendor {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  logo_url: string | null;
  cover_image: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number;
  verified: boolean;
  product_count?: number;
}
```

### Запрос товара с поставщиком
```typescript
const { data } = await supabase
  .from('marketplace_products')
  .select(`
    *,
    vendor:marketplace_vendors(*)
  `)
  .eq('id', productId)
  .single();
```

---

## Результат
- Полноценный реестр 25+ поставщиков
- Карточки продавцов с рейтингом и верификацией
- Навигация по товарам каждого продавца
- Профессиональная структура как на Ozon/Wildberries
