

# План улучшения: Реалистичные единицы и фото товаров маркетплейса

## Обзор проблемы

Сейчас в маркетплейсе:
- Единицы измерения слишком общие: "pack", "kg", "bottle"
- Нужно точное указание: "500g", "1L", "250g pack"
- Поле `images[]` для галереи пустое (только `cover_image`)
- Вес товаров унифицирован (0.30 кг для всех)

## Решение

### Этап 1: Расширение схемы данных

Добавить новые колонки в `marketplace_products`:

```sql
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS
  unit_value NUMERIC,           -- 500 (для "500g")
  unit_measure TEXT,            -- 'g', 'kg', 'ml', 'L', 'pc'
  pack_quantity INTEGER;        -- количество в упаковке (например, 6 яиц)
```

Это позволит формировать понятные единицы:
- `unit_value: 500, unit_measure: 'g'` → "500g"
- `unit_value: 1, unit_measure: 'L'` → "1L"  
- `pack_quantity: 6, unit_measure: 'pc'` → "6 шт"

### Этап 2: Обновление типов TypeScript

Расширить интерфейс `MarketplaceProduct`:

```typescript
interface MarketplaceProduct {
  // ... existing fields
  unit_value: number | null;
  unit_measure: string | null;
  pack_quantity: number | null;
}
```

### Этап 3: Хелпер для форматирования единиц

Создать `src/utils/formatProductUnit.ts`:

```typescript
function formatProductUnit(product, language) {
  // "500g" / "500г"
  // "1L" / "1л"
  // "6 pcs" / "6 шт"
  // "250g × 4" / "250г × 4"
}
```

### Этап 4: Обновление карточек товаров

Изменить `ProfessionalProductCard` и `ProductCard`:
- Использовать новый хелпер для отображения единиц
- Показывать точный вес/объем рядом с ценой

```text
Сейчас:                      После:
┌─────────────────┐         ┌─────────────────┐
│ [Фото]          │         │ [Фото]          │
│ Organic Butter  │         │ Organic Butter  │
│ pack            │         │ 250g            │
│ ฿145            │         │ ฿145 / 250g     │
└─────────────────┘         └─────────────────┘
```

### Этап 5: Обновление страницы деталей товара

В `ProductDetailPage.tsx` добавить:
- Секцию "Информация о продукте" с точными характеристиками
- Отображение веса/объема в понятном формате
- Расчет цены за единицу (например, ฿580/kg)

### Этап 6: Миграция данных

SQL-скрипт для заполнения реалистичных данных:

```sql
-- Пример: обновить товары категории "organic"
UPDATE marketplace_products SET
  unit_value = 250, unit_measure = 'g', weight_kg = 0.25
WHERE name_en = 'Organic Butter';

UPDATE marketplace_products SET
  unit_value = 1, unit_measure = 'L', weight_kg = 1.05
WHERE name_en = 'Organic Milk';

UPDATE marketplace_products SET
  pack_quantity = 10, unit_measure = 'pc', weight_kg = 0.65
WHERE name_en = 'Free Range Eggs';
```

### Этап 7: Обновление Admin-панели

Добавить поля в форму редактирования товаров (`AdminMarketplaceProducts.tsx`):
- Точный вес/объем (unit_value)
- Единица измерения (unit_measure) - select с опциями
- Количество в упаковке (pack_quantity)
- Галерея изображений (images[])

### Этап 8: Обновление Vendor-панели

Добавить те же поля в форму создания товаров (`VendorProducts.tsx`):
- Step 2 (Details): unit_value, unit_measure, pack_quantity
- Step 3 (Photos): возможность загрузить несколько фото в gallery

---

## Файловая структура изменений

```text
src/
├── utils/
│   └── formatProductUnit.ts       [NEW]  - Хелпер форматирования
├── types/
│   └── marketplace.ts             [MODIFY] - Новые поля
├── components/market/
│   ├── ProfessionalProductCard.tsx [MODIFY] - Новый формат единиц
│   ├── ProductCard.tsx            [MODIFY] - Новый формат единиц
│   └── ProductUnitDisplay.tsx     [NEW]  - Компонент отображения единиц
├── pages/market/
│   └── ProductDetailPage.tsx      [MODIFY] - Секция характеристик
├── pages/admin/
│   └── AdminMarketplaceProducts.tsx [MODIFY] - Новые поля формы
├── pages/vendor/
│   └── VendorProducts.tsx         [MODIFY] - Новые поля wizard
└── hooks/
    └── useMarketplace.ts          [MODIFY] - Типы
```

---

## Примеры реалистичных единиц

| Товар | unit_value | unit_measure | pack_qty | Отображение |
|-------|------------|--------------|----------|-------------|
| Organic Butter | 250 | g | - | 250g |
| Organic Milk | 1 | L | - | 1L |
| Free Range Eggs | - | pc | 10 | 10 шт |
| Dried Mango | 200 | g | - | 200g pack |
| Coconut Oil | 500 | ml | - | 500ml |
| Thai Basil | 100 | g | - | 100g bunch |
| Rice | 5 | kg | - | 5kg bag |
| Mineral Water | 500 | ml | 6 | 6×500ml |

---

## Результат

После реализации:

1. **Карточки товаров** показывают точные единицы: "250g", "1L", "6 шт"
2. **Страница товара** содержит детальные характеристики
3. **Админ-панель** позволяет задавать точные параметры
4. **Vendor-панель** позволяет создавать товары с правильными единицами
5. **Галерея фото** поддерживает несколько изображений

Покупатель видит реальные показатели: сколько граммов, литров или штук он получит за указанную цену.

