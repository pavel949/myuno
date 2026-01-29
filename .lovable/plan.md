
# План реализации: Admin Marketplace Management

## Обзор

Добавление полноценного раздела управления маркетплейсом в админ-панель UNO. Включает CRUD-операции для товаров, категорий, подкатегорий и вендоров.

```text
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN SIDEBAR                              │
├─────────────────────────────────────────────────────────────────┤
│  Operations                                                     │
│  └── Dashboard, Moderation, Leads...                           │
│                                                                 │
│  Catalog (services)                                            │
│  └── Properties, Yachts, Tours...                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🆕 MARKETPLACE (новая группа)                           │   │
│  │    ├── Products (200)     - Товары маркетплейса         │   │
│  │    ├── Categories (12)    - Категории                   │   │
│  │    ├── Subcategories (114)- Подкатегории                │   │
│  │    └── Vendors (20)       - Продавцы                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Health & Home, Services & Shops, Analytics, System            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Этап 1: Создание хуков для админ-операций

### `src/hooks/useAdminMarketplace.ts`

Единый файл с хуками для всех сущностей маркетплейса:

**useAdminMarketplaceProducts**
- CRUD для таблицы `marketplace_products`
- Фильтрация по категории, вендору, статусу
- Поиск по названию

**useAdminMarketplaceCategories**
- CRUD для таблицы `marketplace_categories`
- Управление sort_order, is_active
- Загрузка изображений

**useAdminMarketplaceSubcategories**
- CRUD для таблицы `marketplace_subcategories`
- Привязка к parent category

**useAdminMarketplaceVendors**
- CRUD для таблицы `marketplace_vendors`
- Верификация вендоров
- Статистика по товарам

---

## Этап 2: Страница управления товарами

### `src/pages/admin/AdminMarketplaceProducts.tsx`

Функционал:
- Таблица товаров с пагинацией
- Фильтры: категория, вендор, статус (in_stock, is_active)
- Поиск по названию
- Диалог создания/редактирования с полями:
  - Название EN/RU
  - Описание EN/RU
  - Категория (select из marketplace_categories)
  - Подкатегория (select, фильтруется по категории)
  - Цена, старая цена
  - Вендор (select из marketplace_vendors)
  - Изображения (cover + gallery)
  - Флаги: is_popular, is_new, in_stock, is_active
  - Теги
  - Вес, единицы измерения

```text
┌────────────────────────────────────────────────────────────────┐
│ Products                                           [+ Add]     │
├────────────────────────────────────────────────────────────────┤
│ [Search...] [Category ▼] [Vendor ▼] [Status ▼]                 │
├────────────────────────────────────────────────────────────────┤
│ ┌──────┬──────────────────┬──────────┬────────┬──────┬─────┐  │
│ │ Img  │ Name             │ Category │ Price  │Stock │ ⋮   │  │
│ ├──────┼──────────────────┼──────────┼────────┼──────┼─────┤  │
│ │ 🖼   │ Organic Mangoes  │ Fruits   │ ฿150   │ ✓    │ ⋮   │  │
│ │ 🖼   │ Thai Coffee      │ Beverages│ ฿320   │ ✓    │ ⋮   │  │
│ └──────┴──────────────────┴──────────┴────────┴──────┴─────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Этап 3: Страница управления категориями

### `src/pages/admin/AdminMarketplaceCategories.tsx`

Функционал:
- Список категорий с drag-and-drop для сортировки
- Поля редактирования:
  - Slug (уникальный идентификатор)
  - Название EN/RU
  - Описание EN/RU
  - Иконка (icon name или emoji)
  - Изображение
  - Gradient (CSS градиент для карточки)
  - Category group
  - is_active

```text
┌────────────────────────────────────────────────────────────────┐
│ Categories                                        [+ Add]      │
├────────────────────────────────────────────────────────────────┤
│ ┌──────┬────────────────┬──────────────┬────────┬──────┬─────┐│
│ │ ≡    │ Icon + Name    │ Slug         │ Items  │Active│ ⋮   ││
│ ├──────┼────────────────┼──────────────┼────────┼──────┼─────┤│
│ │ ≡    │ 🍎 Groceries   │ groceries    │ 45     │ ✓    │ ⋮   ││
│ │ ≡    │ 🏠 Home        │ home         │ 23     │ ✓    │ ⋮   ││
│ │ ≡    │ 👶 Baby        │ baby         │ 18     │ ✓    │ ⋮   ││
│ └──────┴────────────────┴──────────────┴────────┴──────┴─────┘│
└────────────────────────────────────────────────────────────────┘
```

---

## Этап 4: Страница управления подкатегориями

### `src/pages/admin/AdminMarketplaceSubcategories.tsx`

Функционал:
- Фильтр по родительской категории
- Поля:
  - Parent category (select)
  - Slug
  - Название EN/RU
  - Иконка
  - sort_order
  - is_active

---

## Этап 5: Страница управления вендорами

### `src/pages/admin/AdminMarketplaceVendors.tsx`

Функционал:
- Список всех вендоров маркетплейса
- Статистика: количество товаров, рейтинг, отзывы
- Верификация вендоров (verified badge)
- Поля редактирования:
  - Slug
  - Название EN/RU
  - Описание EN/RU
  - Логотип, cover image
  - Контакты (phone, email, website)
  - Адрес EN/RU
  - verified, is_active

```text
┌────────────────────────────────────────────────────────────────┐
│ Vendors                                           [+ Add]      │
├────────────────────────────────────────────────────────────────┤
│ ┌──────┬────────────────┬──────────┬────────┬────────┬─────┐  │
│ │ Logo │ Name           │ Products │ Rating │Verified│ ⋮   │  │
│ ├──────┼────────────────┼──────────┼────────┼────────┼─────┤  │
│ │ 🏪   │ Fresh Farm     │ 45       │ ⭐ 4.8 │ ✓      │ ⋮   │  │
│ │ 🏪   │ Thai Organics  │ 23       │ ⭐ 4.5 │ -      │ ⋮   │  │
│ └──────┴────────────────┴──────────┴────────┴────────┴─────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Этап 6: Обновление AdminSidebar

### `src/components/admin/AdminSidebar.tsx`

Добавление новой группы "Marketplace" между "Services & Shops" и "Analytics & Finance":

```typescript
{
  label: 'Marketplace',
  labelRu: 'Маркетплейс',
  defaultOpen: false,
  items: [
    { title: 'Products', titleRu: 'Товары', path: '/admin/marketplace/products', icon: Package },
    { title: 'Categories', titleRu: 'Категории', path: '/admin/marketplace/categories', icon: Grid },
    { title: 'Subcategories', titleRu: 'Подкатегории', path: '/admin/marketplace/subcategories', icon: List },
    { title: 'Vendors', titleRu: 'Продавцы', path: '/admin/marketplace/vendors', icon: Store },
  ],
}
```

---

## Этап 7: Регистрация роутов

### `src/components/layout/AnimatedRoutes.tsx`

Добавление lazy imports и роутов:

```typescript
// Lazy imports
const AdminMarketplaceProducts = lazy(() => import('@/pages/admin/AdminMarketplaceProducts'));
const AdminMarketplaceCategories = lazy(() => import('@/pages/admin/AdminMarketplaceCategories'));
const AdminMarketplaceSubcategories = lazy(() => import('@/pages/admin/AdminMarketplaceSubcategories'));
const AdminMarketplaceVendors = lazy(() => import('@/pages/admin/AdminMarketplaceVendors'));

// Routes внутри AdminRouteLayout
<Route path="/admin/marketplace/products" element={<AdminMarketplaceProducts />} />
<Route path="/admin/marketplace/categories" element={<AdminMarketplaceCategories />} />
<Route path="/admin/marketplace/subcategories" element={<AdminMarketplaceSubcategories />} />
<Route path="/admin/marketplace/vendors" element={<AdminMarketplaceVendors />} />
```

---

## Файловая структура

```text
src/
├── hooks/
│   └── useAdminMarketplace.ts      [NEW]  - Все CRUD хуки
├── pages/admin/
│   ├── AdminMarketplaceProducts.tsx     [NEW]
│   ├── AdminMarketplaceCategories.tsx   [NEW]
│   ├── AdminMarketplaceSubcategories.tsx [NEW]
│   └── AdminMarketplaceVendors.tsx      [NEW]
├── components/admin/
│   └── AdminSidebar.tsx            [MODIFY] - Добавить Marketplace группу
└── components/layout/
    └── AnimatedRoutes.tsx          [MODIFY] - Добавить роуты
```

---

## Переиспользуемые компоненты

Все страницы будут использовать существующие компоненты:

- `PageContainer`, `PageHeader` - layout
- `Card`, `Button`, `Input`, `Textarea` - UI
- `Dialog`, `DialogContent` - модальные окна
- `Select`, `Switch`, `Label` - формы
- `DropdownMenu` - действия
- `AlertDialog` - подтверждение удаления
- `ImageUpload`, `MultiImageUpload` - загрузка изображений
- `Skeleton` - loading states
- `ScrollArea` - скролл в диалогах

---

## Результат

После реализации админ получит полный контроль над маркетплейсом:

1. **Товары** - создание, редактирование, удаление, управление наличием
2. **Категории** - структура каталога, сортировка, изображения
3. **Подкатегории** - детальная классификация товаров
4. **Вендоры** - управление продавцами, верификация

Паттерн реализации идентичен существующим админ-страницам (AdminStores, AdminYachts), что обеспечивает консистентный UX.
