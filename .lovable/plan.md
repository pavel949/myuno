

# План унификации форм ввода данных на платформе

## Цель
Обеспечить единообразие данных, вводимых администраторами, вендорами и собственниками, через централизованные таксономии и стандартизированные компоненты.

---

## Часть 1: Унификация районов (Districts)

### Проблема
- `propertyTaxonomy.ts` содержит 22 района
- `AddProperty.tsx` (Owner) — только 13 районов  
- `LocationStep.tsx` (Wizard) — только 13 районов
- `PropertyConsultation.tsx` — только 10 районов

### Решение
Заменить локальные массивы на импорт `PHUKET_DISTRICTS` из `propertyTaxonomy.ts`:

**Файлы для изменения:**
- `src/pages/owner/AddProperty.tsx`
- `src/pages/owner/EditProperty.tsx`  
- `src/components/owner/property-wizard/steps/LocationStep.tsx`
- `src/pages/property/PropertyConsultation.tsx`
- `src/lib/leadVerticalConfig.ts`

---

## Часть 2: Унификация типов недвижимости и удобств

### Проблема
- Admin форма использует 6 типов и 12 удобств
- Vendor форма использует канонические 8 типов и 36 удобств

### Решение
В `AdminProperties.tsx` заменить локальные массивы на импорты:
- `PROPERTY_TYPES` (8 типов)
- `ALL_AMENITIES` (36 удобств по категориям)

---

## Часть 3: Унификация форм товаров (Products)

### Проблема
| Поле | Admin | Vendor |
|------|-------|--------|
| unit_value, unit_measure | ✅ | ❌ |
| pack_quantity | ✅ | ❌ |
| is_shippable_international | ❌ | ✅ |
| Загрузка изображений | ❌ URL только | ✅ Базовая |

### Решение
1. Добавить в `VendorProducts.tsx`: unit_value, unit_measure, pack_quantity
2. Добавить в `AdminMarketplaceProducts.tsx`: is_shippable_international, AirbnbStyleImageUpload

---

## Часть 4: Унификация загрузки изображений

### Текущее состояние
| Форма | Компонент |
|-------|-----------|
| AdminProperties | AirbnbStyleImageUpload ✅ |
| Owner AddProperty | AirbnbStyleImageUpload ✅ |
| VendorProperties | ImageUpload базовый ❌ |
| VendorProducts | ImageUpload базовый ❌ |
| AdminMarketplaceProducts | Только URL ❌ |

### Решение
Заменить на `AirbnbStyleImageUpload` во всех формах для единообразия:
- Drag & Drop
- Импорт из облака (Google Drive, Dropbox)
- Сжатие в WebP
- Редактирование изображений

---

## Часть 5: Добавление internal_name

Добавить поле "Внутреннее название" в:
- `VendorProperties.tsx` (сейчас отсутствует)
- Формы товаров (как SKU или внутренний код)

---

## Порядок реализации

### Шаг 1: Таксономии районов (5 файлов)
```
AddProperty.tsx → импорт PHUKET_DISTRICTS
EditProperty.tsx → импорт PHUKET_DISTRICTS  
LocationStep.tsx → импорт PHUKET_DISTRICTS
PropertyConsultation.tsx → импорт PHUKET_DISTRICTS
leadVerticalConfig.ts → импорт PHUKET_DISTRICTS
```

### Шаг 2: Admin Properties (1 файл)
```
AdminProperties.tsx → импорт PROPERTY_TYPES, ALL_AMENITIES
```

### Шаг 3: Формы товаров (2 файла)
```
VendorProducts.tsx → добавить unit поля + AirbnbStyleImageUpload
AdminMarketplaceProducts.tsx → добавить shipping + AirbnbStyleImageUpload
```

### Шаг 4: Vendor Properties (1 файл)
```
VendorProperties.tsx → AirbnbStyleImageUpload + internal_name
```

---

## Итоговая таблица изменений

| Файл | Изменение |
|------|-----------|
| `src/pages/owner/AddProperty.tsx` | PHUKET_DISTRICTS, PROPERTY_TYPES |
| `src/pages/owner/EditProperty.tsx` | PHUKET_DISTRICTS, PROPERTY_TYPES |
| `src/components/owner/property-wizard/steps/LocationStep.tsx` | PHUKET_DISTRICTS |
| `src/pages/property/PropertyConsultation.tsx` | PHUKET_DISTRICTS |
| `src/lib/leadVerticalConfig.ts` | PHUKET_DISTRICTS |
| `src/pages/admin/AdminProperties.tsx` | PROPERTY_TYPES, ALL_AMENITIES |
| `src/pages/vendor/VendorProducts.tsx` | unit поля, AirbnbStyleImageUpload |
| `src/pages/admin/AdminMarketplaceProducts.tsx` | shipping, AirbnbStyleImageUpload |
| `src/pages/vendor/VendorProperties.tsx` | AirbnbStyleImageUpload, internal_name |

---

## Ожидаемый результат

После реализации:
- Все 22 района Пхукета доступны во всех формах
- Все 8 типов недвижимости и 36 удобств доступны везде
- Товары имеют единую структуру полей
- Единый UX загрузки фото во всех формах
- Фильтры работают корректно с нормализованными данными

