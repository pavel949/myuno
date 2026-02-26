

# Рефакторинг Property Editor: полноценная карточка объекта с UnifiedMediaUploader

## Проблема

Текущий PropertyEditor (`src/pages/owner/PropertyEditor.tsx`) -- это **1237-строчный монолит** с собственной реализацией формы, который:

1. Использует устаревший `ImageUpload` вместо `UnifiedMediaUploader` (без drag-and-drop сортировки, без импорта из облака, без AI-анализа качества фото)
2. Дублирует логику, которая уже реализована в `CanonicalPropertyForm` (используется в Admin)
3. Не показывает все 7 вкладок (Utilities, Services, Admin) -- только 4 базовые + свои кастомные Rooms/Calendar/Rules/Team
4. Не использует возможности импорта данных из внешних источников

## Решение

Заменить кастомную 1237-строчную реализацию PropertyEditor на `CanonicalPropertyForm` в режиме `owner` с расширенным набором вкладок, сохранив при этом уникальные фичи текущего редактора (Rooms, Calendar, Team, Preview, Draft restoration).

## Изменения

### 1. Расширить CanonicalPropertyForm для Owner-режима

Файл: `src/components/property/canonical-form/CanonicalPropertyForm.tsx`

- Добавить вкладки Rooms, Calendar, Team в owner-режим (сейчас только admin имеет расширенные вкладки)
- Включить все 7+ вкладок: Basic, Location, Photos, Pricing, Utilities, Services, Rules, Rooms, Calendar, Team
- PhotosStep уже использует `UnifiedMediaUploader` с drag-and-drop, импортом из облака и AI-анализом качества

### 2. Переписать PropertyEditor как тонкую обертку

Файл: `src/pages/owner/PropertyEditor.tsx`

Вместо 1237 строк кастомной формы:
- Загрузка данных через `useOwnerProperty(id)` (уже работает)
- Маппинг в `CanonicalPropertyFormData` 
- Рендер `CanonicalPropertyForm` с `mode="owner"` и `initialData`
- Сохранение Draft Restoration и Preview sidebar
- Добавление вкладок Rooms, Calendar и Team

Итоговый файл -- ~150-200 строк вместо 1237.

### 3. Обновить Photos tab

Файл: `src/components/owner/property-wizard/steps/PhotosStep.tsx`

PhotosStep уже использует `UnifiedMediaUploader` в GalleryMode с:
- Drag-and-drop сортировкой (dnd-kit)
- Импортом из облака (`enableCloudImport`)
- Импортом по URL (`enableUrlImport`)
- Редактированием и обрезкой (`enableEditing`)
- AI-анализом качества (`enableQualityTips`)

Это уже корректно -- никаких изменений не нужно.

### 4. Расширить CanonicalPropertyForm до полного набора owner-вкладок

Добавить в owner-режим вкладки:
- **Utilities** (электричество, вода, интернет) -- уже есть компонент `UtilitiesStep`
- **Services** (уборка, трансфер, доп. услуги) -- уже есть `ServicesStep`  
- **Rules** (правила проживания) -- собрать из `HouseRulesSection` + `CancellationPolicySection`
- **Rooms** -- `PropertyRooms` компонент
- **Calendar** -- `PropertyCalendar` + `SeasonalPricing`
- **Team** -- `PropertyTeamTab`

## Технические детали

### Изменяемые файлы

1. **`src/components/property/canonical-form/CanonicalPropertyForm.tsx`**
   - Добавить props: `propertyId`, `onCalendarChange`, `rooms/calendar/team` tabs
   - Расширить `tabs` для owner-режима: вместо 4 вкладок показывать 9-10
   - Добавить поддержку `extraTabs` prop для инъекции кастомных вкладок (Rooms, Calendar, Team)

2. **`src/pages/owner/PropertyEditor.tsx`**
   - Сократить до ~200 строк: загрузка данных, маппинг, рендер CanonicalPropertyForm
   - Сохранить: Draft restoration banner, Preview sidebar, Submit/Save logic
   - Передавать `initialData` из загруженного property, `mode="owner"`, все вкладки

3. **`src/components/owner/property-wizard/steps/index.ts`**
   - Экспортировать `HouseRulesSection` и `CancellationPolicySection` если еще не экспортируются

### Что сохраняется

- Draft auto-save и restoration (localStorage)
- Live Preview sidebar с PropertyPreviewCard
- Property Team tab
- Rooms и Calendar управление
- Все текущие поля формы (30+ полей)
- Маппинг данных из/в формат properties таблицы

### Что улучшается

- Фото: UnifiedMediaUploader вместо старого ImageUpload (drag-and-drop, импорт из облака/URL, AI качество)
- Единая кодовая база формы с Admin (CanonicalPropertyForm)
- Все 10 вкладок доступны Owner: Basic, Location, Photos, Pricing, Utilities, Services, Rules, Rooms, Calendar, Team
- Код сокращается с 1237 строк до ~200

