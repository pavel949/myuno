
# План: Полная консистентность данных форм и карточек

## Выявленные проблемы

### 1. Разрыв между формами и карточками

| Компонент | Проблема | Влияние |
|-----------|----------|---------|
| **VendorProducts.tsx** (строка 813-821) | `CardPreview type="service"` вместо `type="product"` | Ошибочное превью для товаров |
| **CardPreview.tsx** | Использует `rounded-xl`, карточки на сайте — `rounded-2xl` | Визуальное несоответствие |
| **HomeServiceProviderCard.tsx** | Показывает `provider_type`, `has_insurance`, `has_guarantee` | **Эти поля отсутствуют в AdminProviders.tsx** |
| **ProductCard.tsx** | Показывает атрибуты через `useProductAttributes` | **Vendor/Admin формы не имеют редактора атрибутов** |
| **VendorServices.tsx** | Форма: `name`, `name_ru` | Карточка ожидает: `name_en`, `name_ru` |

### 2. Несинхронизированные категории

| Файл | Категории | Проблема |
|------|-----------|----------|
| `AdminProviders.tsx` | 16 статичных категорий (`BUSINESS_CATEGORIES`) | Не синхронизированы с `homeServicesTaxonomy.ts` |
| `ServicesFilters.tsx` | Использует отдельные ID (`ac-service` vs `ac`) | Фильтры не работают |
| `useHomeServices.ts` | Другие ID (`hvac`, `tech`) | Запросы возвращают пустые результаты |

### 3. Отсутствующие поля в формах

**Для Providers (в карточке есть, в форме нет):**
- `provider_type` (individual/company)
- `response_time_minutes`
- `has_insurance`
- `has_guarantee`
- `languages`
- `service_domains[]`

**Для Products (в карточке есть, в форме нет):**
- Произвольные атрибуты (brand, origin, organic, material)
- Редактор для таблицы `marketplace_product_attributes`

---

## Как это делают глобальные маркетплейсы

### Amazon / Ozon
```text
┌─────────────────────────────────────────────┐
│  SELLER CENTER                              │
│  ┌─────────────────────────────────────────┐│
│  │ Title: [______________]                 ││
│  │ Category: [Electronics ▼]               ││
│  │ ─────────────────────────────────────── ││
│  │ CATEGORY-SPECIFIC FIELDS (динамически) ││
│  │ Brand: [______________]                 ││
│  │ Model: [______________]                 ││
│  │ Warranty: [12 months ▼]                 ││
│  │ ─────────────────────────────────────── ││
│  │ LIVE PREVIEW (точная копия карточки)   ││
│  │ ┌───────────────────────────────────┐  ││
│  │ │ [Та же карточка что и в каталоге] │  ││
│  │ └───────────────────────────────────┘  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Ключевые паттерны

1. **Single Source of Truth (SSoT)** — один TypeScript интерфейс для формы и карточки
2. **Live Preview** — превью в форме = реальная карточка каталога
3. **Registry-Driven Forms** — поля формы определяются схемой категории
4. **Centralized Adapters** — маппинг DB → UI в одном месте

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│  src/lib/adapters/contentAdapters.ts                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ mapProductToCard(product, lang) → UnifiedContentCardProps │ │
│  │ mapServiceToCard(service, lang) → UnifiedContentCardProps │ │
│  │ mapProviderToCard(provider, lang) → HomeServiceCardProps  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌───────────────────────┐  ┌───────────────────────────────┐  │
│  │ VendorProducts.tsx    │  │ MarketIndex.tsx              │  │
│  │ (Vendor Preview)      │  │ (Public Catalog)             │  │
│  │ ┌───────────────────┐ │  │ ┌─────────────────────────┐  │  │
│  │ │UnifiedContentCard │ │  │ │UnifiedContentCard       │  │  │
│  │ │{...mapProduct()}  │ │  │ │{...mapProduct()}        │  │  │
│  │ └───────────────────┘ │  │ └─────────────────────────┘  │  │
│  └───────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Файлы для изменения

### Новые файлы

| Файл | Назначение |
|------|------------|
| `src/lib/adapters/contentAdapters.ts` | Централизованный маппинг данных из БД в props карточек |
| `src/components/vendor/AttributeEditor.tsx` | Редактор произвольных атрибутов для товаров |

### Изменяемые файлы

| Файл | Изменения |
|------|-----------|
| **AdminProviders.tsx** | Добавить поля: `provider_type`, `has_insurance`, `has_guarantee`, `response_time_minutes`, `languages` |
| **VendorProducts.tsx** | Заменить `CardPreview type="service"` на `UnifiedContentCard` с адаптером, добавить редактор атрибутов |
| **VendorServices.tsx** | Использовать `UnifiedContentCard` для превью вместо `CardPreview` |
| **CardPreview.tsx** | Рефакторинг: обёртка вокруг `UnifiedContentCard` вместо дублирования стилей |

---

## Детальный план изменений

### Шаг 1: Создать централизованные адаптеры

```typescript
// src/lib/adapters/contentAdapters.ts

import { MarketplaceProduct } from '@/types/marketplace';
import { Service } from '@/hooks/useServices';
import { HomeServiceProviderData } from '@/components/services/HomeServiceProviderCard';

export function mapProductToCardProps(
  product: MarketplaceProduct, 
  language: string
): UnifiedContentCardProps {
  const isRu = language === 'ru';
  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;
    
  return {
    variant: 'product',
    title: isRu ? product.name_ru : product.name_en,
    subtitle: isRu ? product.vendor_name_ru : product.vendor_name,
    description: isRu ? product.description_ru : product.description_en,
    image: product.cover_image,
    price: `฿${product.price.toLocaleString()}`,
    originalPrice: product.original_price ? `฿${product.original_price.toLocaleString()}` : undefined,
    discount: discount > 0 ? discount : undefined,
    rating: product.rating,
    reviewCount: product.review_count,
    isNew: product.is_new,
    isPopular: product.is_popular,
  };
}

export function mapServiceToCardProps(
  service: Service,
  language: string
): UnifiedContentCardProps {
  const isRu = language === 'ru';
  return {
    variant: 'service',
    title: isRu ? service.name_ru : service.name_en,
    subtitle: service.provider?.name,
    description: isRu ? service.description_ru : service.description_en,
    image: service.images?.[0],
    price: service.price ? `฿${service.price.toLocaleString()}` : undefined,
    duration: service.duration_minutes ? `${service.duration_minutes} min` : undefined,
    rating: service.rating,
    reviewCount: service.review_count,
  };
}
```

### Шаг 2: Обновить AdminProviders.tsx

Добавить недостающие поля в форму:

```typescript
const [formData, setFormData] = useState({
  name: '',
  description_en: '',
  description_ru: '',
  business_category: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  is_active: true,
  is_verified: false,
  // Новые поля (синхронизация с HomeServiceProviderCard)
  provider_type: 'company' as 'individual' | 'company',
  response_time_minutes: '',
  has_insurance: false,
  has_guarantee: false,
  languages: [] as string[],
  service_domains: [] as string[],
});
```

Использовать `ALL_SERVICE_CATEGORIES` из `homeServicesTaxonomy.ts`:

```typescript
import { ALL_SERVICE_CATEGORIES, PROVIDER_TYPE_OPTIONS } from '@/lib/config/homeServicesTaxonomy';

// В форме:
<Select value={formData.business_category} onValueChange={...}>
  {ALL_SERVICE_CATEGORIES.map(cat => (
    <SelectItem key={cat.id} value={cat.id}>
      {cat.icon} {isRussian ? cat.labelRu : cat.labelEn}
    </SelectItem>
  ))}
</Select>
```

### Шаг 3: Создать AttributeEditor

Компонент для управления атрибутами товаров:

```typescript
// src/components/vendor/AttributeEditor.tsx

interface AttributeEditorProps {
  productId?: string;
  attributes: Array<{ key: string; value: string; valueRu: string }>;
  onChange: (attrs: Array<...>) => void;
}

// Предустановленные ключи атрибутов
const ATTRIBUTE_KEYS = ['brand', 'origin', 'organic', 'storage', 'material', 'color', 'size'];

export function AttributeEditor({ attributes, onChange }: AttributeEditorProps) {
  // Добавление/редактирование/удаление атрибутов
  // Автокомплит для ключей
  // Двуязычные значения (EN/RU)
}
```

### Шаг 4: Исправить VendorProducts.tsx

Заменить превью (строки 811-822):

```tsx
// Было:
<CardPreview 
  type="service"  // ❌ Ошибка!
  image={formData.cover_image}
  ...
/>

// Станет:
<UnifiedContentCard 
  {...mapProductToCardProps({
    name_en: formData.name_en,
    name_ru: formData.name_ru,
    price: parseFloat(formData.price) || 0,
    cover_image: formData.cover_image,
    is_new: formData.is_new,
    is_popular: formData.is_popular,
    // ... остальные поля
  }, language)}
  size="default"
/>
```

### Шаг 5: Рефакторинг CardPreview.tsx

Превратить в обёртку над реальными карточками:

```tsx
// Вместо собственной разметки — использовать реальные карточки
export function CardPreview(props: CardPreviewProps) {
  if (props.type === 'product') {
    return (
      <UnifiedContentCard 
        {...mapProductToCardProps(props.formData, props.language)} 
      />
    );
  }
  if (props.type === 'service') {
    return (
      <UnifiedContentCard 
        {...mapServiceToCardProps(props.formData, props.language)} 
      />
    );
  }
  // ... property type
}
```

---

## Порядок реализации

### Фаза 1: Инфраструктура адаптеров
1. Создать `src/lib/adapters/contentAdapters.ts`
2. Добавить маппинг-функции для всех типов контента

### Фаза 2: Синхронизация полей Providers
1. Обновить `AdminProviders.tsx` — добавить все поля из карточки
2. Импортировать категории из `homeServicesTaxonomy.ts`
3. Добавить UI для `provider_type`, `languages`, badges

### Фаза 3: Атрибуты товаров
1. Создать `AttributeEditor.tsx`
2. Интегрировать в `VendorProducts.tsx` и `AdminMarketplaceProducts.tsx`
3. Сохранение в `marketplace_product_attributes`

### Фаза 4: Унификация превью
1. Рефакторинг `CardPreview.tsx` → обёртка над `UnifiedContentCard`
2. Обновить все wizard'ы для использования нового превью
3. Удалить дублирующиеся стили

### Фаза 5: Валидация и тесты
1. Создать TypeScript тесты на соответствие интерфейсов
2. Проверить все формы создания/редактирования
3. Убедиться что превью = реальная карточка

---

## Ожидаемый результат

| Метрика | До | После |
|---------|-----|-------|
| Поля в форме Admin Providers | 10 | 16 (+ `provider_type`, `insurance`, `guarantee`, `response_time`, `languages`, `domains`) |
| Поля в форме Vendor Products | Базовые | + редактор атрибутов (brand, origin, etc.) |
| Соответствие превью и карточки | ~60% | 100% |
| Источников правды для категорий | 3+ | 1 (`homeServicesTaxonomy.ts`) |
| Радиус скругления превью vs карточки | `xl` vs `2xl` | `2xl` везде |

Этот план обеспечит полную консистентность между тем, что заполняет поставщик/админ, и тем, что видит пользователь — как это реализовано в Amazon, Ozon и Airbnb.
