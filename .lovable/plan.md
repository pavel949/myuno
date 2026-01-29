
# План реализации: Унифицированный Vendor Dashboard (Услуги + Товары)

## Обзор проблемы

В текущей архитектуре существует дуализм систем вендоров:

```text
┌─────────────────────────────────────────────────────────────────┐
│                   ТЕКУЩАЯ АРХИТЕКТУРА                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐       ┌─────────────────────┐         │
│  │     providers       │       │ marketplace_vendors │         │
│  │  (для услуг)        │       │  (для товаров)      │         │
│  └─────────────────────┘       └─────────────────────┘         │
│           │                            │                        │
│           ▼                            ▼                        │
│  ┌─────────────────────┐       ┌─────────────────────┐         │
│  │  vendor_services    │       │ marketplace_products│         │
│  │  yachts, tours...   │       │                     │         │
│  └─────────────────────┘       └─────────────────────┘         │
│                                                                 │
│            ❌ НЕТ СВЯЗИ МЕЖДУ СИСТЕМАМИ                        │
└─────────────────────────────────────────────────────────────────┘
```

## Решение: Unified Vendor System

```text
┌─────────────────────────────────────────────────────────────────┐
│                   ЦЕЛЕВАЯ АРХИТЕКТУРА                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    providers                             │   │
│  │  + marketplace_vendor_id (FK → marketplace_vendors)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│            ┌─────────────┼─────────────┐                       │
│            ▼             ▼             ▼                       │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │  services   │ │   yachts    │ │  products   │              │
│   └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│            ✅ ЕДИНАЯ СИСТЕМА ПОСТАВЩИКА                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Этап 1: Миграция базы данных

Добавление связи между providers и marketplace_vendors:

1. Добавить колонку `marketplace_vendor_id` в таблицу `providers`
2. Автоматически создавать запись в `marketplace_vendors` при онбординге вендора (если выбраны товары)
3. RLS политики для безопасного доступа

---

## Этап 2: Обновление Vendor Sidebar

Добавление раздела "Мои товары" в навигацию:

**Текущая структура:**
- Main: Dashboard, Bookings, Services, Locations
- Finance: Analytics, Payouts, Subscription
- Verticals: Properties, Yachts, Transport...
- Services: Beauty, Fitness, Clinics...

**Новая структура:**
- Main: Dashboard, Bookings, Services, **Products**, Locations
- Products становится ссылкой на `/vendor/products`

---

## Этап 3: Создание страницы управления товарами

Новый файл: `src/pages/vendor/VendorProducts.tsx`

Архитектура идентична VendorYachts / VendorServices:

- Wizard-форма с 4 шагами: Basic Info → Details → Photos → Review
- Draft-система (useFormDraft)
- CRUD операции через useVendorProducts hook
- CardPreview в реальном времени
- Интеграция с marketplace_products и marketplace_categories

**Шаги wizard-формы:**

1. **Basic Info**: Название (EN/RU), Описание, Категория
2. **Details**: Цена, Наличие, Единицы измерения, Теги
3. **Photos**: Cover image + галерея
4. **Review**: Превью карточки товара

---

## Этап 4: Создание hook для товаров вендора

Новый файл: `src/hooks/useVendorProducts.ts`

```text
useVendorProducts(vendorId)
├── products: MarketplaceProduct[]
├── isLoading: boolean
├── createProduct(data) → Promise
├── updateProduct(id, data) → Promise
├── deleteProduct(id) → Promise
└── refetch() → Promise
```

---

## Этап 5: Интеграция с Vendor Dashboard

Добавление переключателя режимов на Dashboard:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Vendor Dashboard                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Org Header: Business Name, Verified Badge]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┬─────────────────┐                         │
│  │    УСЛУГИ       │    ТОВАРЫ       │  ← ContentModeToggle    │
│  └─────────────────┴─────────────────┘                         │
│                                                                 │
│  [Контент адаптируется под выбранный режим]                    │
│                                                                 │
│  Услуги:                  Товары:                              │
│  - Revenue (services)     - Revenue (products)                 │
│  - Orders (bookings)      - Orders (marketplace)               │
│  - Recent Bookings        - Recent Product Orders              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Файловая структура изменений

```text
src/
├── pages/vendor/
│   ├── VendorProducts.tsx          [NEW]  - Управление товарами
│   ├── VendorDashboard.tsx         [MODIFY] - Добавить toggle
│   └── VendorOnboarding.tsx        [MODIFY] - Выбор: услуги/товары/оба
├── hooks/
│   └── useVendorProducts.ts        [NEW]  - CRUD для товаров
├── components/vendor/
│   ├── VendorSidebar.tsx           [MODIFY] - Добавить Products
│   ├── VendorProductCard.tsx       [NEW]  - Карточка товара в списке
│   └── dashboard/
│       └── VendorDashboardContent.tsx [NEW] - Условный контент
└── App.tsx                         [MODIFY] - Route /vendor/products
```

---

## Изменения в базе данных

**1. Миграция для связи providers → marketplace_vendors:**

```sql
-- Добавить связь с marketplace_vendors
ALTER TABLE providers 
ADD COLUMN marketplace_vendor_id UUID REFERENCES marketplace_vendors(id);

-- Индекс для быстрого поиска
CREATE INDEX idx_providers_marketplace_vendor 
ON providers(marketplace_vendor_id);
```

**2. RLS политика для marketplace_products:**

```sql
-- Вендор может управлять только своими товарами
CREATE POLICY "Vendors manage own products" 
ON marketplace_products
FOR ALL
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);
```

---

## Поток создания товара

```text
Vendor Dashboard
     │
     ▼
/vendor/products
     │
     ├── [+ Добавить товар]
     │         │
     │         ▼
     │    VendorFormWizard
     │         │
     │         ├── Step 1: Basic Info
     │         │   - name_en, name_ru
     │         │   - description
     │         │   - category_slug (из marketplace_categories)
     │         │
     │         ├── Step 2: Details
     │         │   - price, original_price
     │         │   - in_stock, is_new, is_popular
     │         │   - unit, weight_kg
     │         │   - tags[]
     │         │
     │         ├── Step 3: Photos
     │         │   - cover_image
     │         │   - images[]
     │         │
     │         └── Step 4: Review
     │             - CardPreview (product type)
     │             - Submit → marketplace_products
     │
     └── [Список товаров]
               │
               ├── Edit → VendorFormWizard (prefilled)
               └── Delete → Confirmation → Remove
```

---

## Результат реализации

После внедрения:

1. **Единый Vendor Dashboard**
   - Поставщик может продавать и услуги, и товары
   - Toggle для переключения контекста
   - Общая статистика с разбивкой по типам

2. **Раздел "Мои товары"**
   - Wizard-форма идентичная услугам
   - Автосохранение черновиков
   - Интеграция с marketplace_products

3. **Онбординг**
   - Выбор типа бизнеса: Услуги / Товары / Оба
   - Автоматическое создание marketplace_vendor при выборе товаров

4. **Консистентный UX**
   - Единый паттерн создания (wizard)
   - Одинаковые компоненты для всех типов листингов
   - Draft-система работает везде
