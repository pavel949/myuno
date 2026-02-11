
# Единая форма редактирования в Intake

## Проблема
Сейчас в AI Intake (`/admin/intake`) при редактировании объекта открывается **простой диалог с текстовыми полями**, автоматически генерируемый из конфига вертикали. Это значит, что форма для недвижимости в Intake отличается от формы для собственника, а форма для услуг - от формы вендора. Данные вводятся через простые `Input`, без специфичных селекторов (тип недвижимости, карта, загрузка фото, ценовые модели и т.д.).

## Решение
Заменить generic-редактор `IntakeItemEditor` на **маршрутизатор канонических форм** по вертикали:

```text
IntakeItemEditor (маршрутизатор)
  |
  |-- vertical = "properties"  --> CanonicalPropertyForm
  |-- vertical = "products"    --> UnifiedVendorWizard (product mode)
  |-- vertical = "services"    --> CanonicalListingWizard (service schema)
  |-- vertical = "experiences" --> CanonicalListingWizard (experience schema)
  |-- vertical = "yachts"      --> CanonicalListingWizard (yacht schema)
  |-- ... другие вертикали     --> CanonicalListingWizard / UnifiedVendorWizard
  |-- fallback (неизвестная)   --> текущий generic редактор (как сейчас)
```

## Изменения

### 1. Рефакторинг `IntakeItemEditor` (маршрутизатор форм)
**Файл:** `src/components/admin/intake/IntakeItemEditor.tsx`

- Определить маппинг `detectedVertical` -> компонент формы
- Для `properties`: открывать `CanonicalPropertyForm` в режиме `admin`, передавая `extractedFields` как `initialData`
- Для остальных вертикалей: открывать `CanonicalListingWizard` с соответствующей `categorySchema`, передавая extracted данные как начальные значения
- Оставить текущий generic-редактор как fallback для неизвестных вертикалей

### 2. Маппинг данных Intake -> Canonical форма
**Новый файл:** `src/components/admin/intake/intakeToCanonicalMapper.ts`

- `mapIntakeToPropertyForm(item: IntakeItem)` -> `CanonicalPropertyFormData`
- `mapIntakeToListingData(item: IntakeItem)` -> данные для `CanonicalListingWizard`
- `mapCanonicalToIntakeItem(formData, originalItem)` -> обратный маппинг для сохранения в IntakeItem

### 3. Обновление IntakeQueue
**Файл:** `src/components/admin/intake/IntakeQueue.tsx`

- Передать в editor необходимые колбэки для сохранения через canonical формы
- При сохранении из canonical формы - конвертировать обратно в `IntakeItem.extractedFields`

## Техническая реализация

Ключевая логика маршрутизатора:
```typescript
// IntakeItemEditor.tsx
const PROPERTY_VERTICALS = ['properties', 'property', 'real_estate'];
const LISTING_VERTICALS = ['yachts', 'experiences', 'services', 'restaurants', ...];

if (PROPERTY_VERTICALS.includes(item.detectedVertical)) {
  return <CanonicalPropertyForm 
    initialData={mapIntakeToPropertyForm(item)} 
    onSubmit={handlePropertySave}
    mode="admin" 
  />;
}

if (LISTING_VERTICALS.includes(item.detectedVertical)) {
  return <CanonicalListingWizard
    initialData={mapIntakeToListingData(item)}
    vertical={item.detectedVertical}
    onSubmit={handleListingSave}
  />;
}

// Fallback: текущий generic editor
return <GenericIntakeFields ... />;
```

## Что это даёт
- Одна и та же форма для объекта при создании собственником, вендором, админом и через AI Intake
- Все специфичные селекторы (тип недвижимости, карта, фото-загрузчик, ценовые модели) доступны сразу
- AI заполняет поля, а пользователь дорабатывает в привычном интерфейсе
- Fallback гарантирует, что новые вертикали не ломают систему
