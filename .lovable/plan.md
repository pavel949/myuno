

# Аудит и исправление процесса добавления объекта + карта + UX

## Обнаруженные баги

### BUG 1: Поля `title` и `description` дублируются в destructuring
В `useCreateOwnerProperty` (строка 187) title/title_ru/description/description_ru извлекаются из `data`, но они уже были переименованы в `submitPayload` при отправке из `usePropertyWizard`. В `insertData` они маппятся в `title_en`/`description_en`, но исходные `title`/`description` из `...cleanRest` тоже попадают в insert. Это приводит к тому, что и `title`, и `title_en` заполняются, что не является ошибкой БД, но создает путаницу.

### BUG 2: `images` хранится некорректно -- cover_image отделяется от images
В `PhotosStep`, cover_image = images[0], а images = остальные. При сохранении в БД `images` не содержит cover_image. Но в `PropertyMapView` и `PropertyCard` images используется для отображения. Если загружено 1 фото, images будет пустым массивом, а cover_image заполнен.

### BUG 3: Объекты не отображаются на карте после создания
Основная проблема: `PropertyMapView` в `OwnerProperties.tsx` (строка 507-517) передает `p.lat` и `p.lng`, но большинство объектов создаются без координат, потому что LocationStep не является обязательным. Нет визуального индикатора "без координат" в списке и нет подсказки пользователю.

### BUG 4: Шаг Location не подсвечивает важность координат
Пользователь может пропустить выбор точки на карте. Адрес обязателен, но координаты -- нет. Без координат объект не будет на карте.

### BUG 5: В `handleSaveDraft` (строка 578-619) destructuring не включает `seasonal_pricing`
`seasonal_pricing` не извлекается при save draft, что может привести к попытке записать его как есть, хотя в handleSubmit он обрабатывается.

### BUG 6: Навигация после успешного создания ведет на `/mc/properties`, но кнопка "Добавить" тоже ведет на `/mc/properties/new`
Это корректно, но после создания нет кнопки "Открыть созданный объект" -- только "Мои объекты" и "Добавить ещё".

### BUG 7: `previewData` не передает все поля для LivePropertyPreview
В `usePropertyWizard` (строка 547-561) `previewData` не включает `floor`, `unitNumber`, `totalFloors`, `plotSizeSqm`, `poolType`, `gardenType`, `parkingType`, `viewType`, `furnishingLevel`, `equipment`. Превью показывает неполные данные.

### BUG 8: Yandex Static Maps может не работать
Превью карты на десктопе использует Yandex Static Maps API, который может быть заблокирован или требовать API-ключ. При ошибке изображение просто скрывается без fallback.

---

## План исправлений

### 1. Исправить previewData -- передавать все поля
Файл: `src/hooks/usePropertyWizard.ts`, строки 547-561.
Добавить в `previewData`: `floor`, `unitNumber: unit_number`, `totalFloors: total_floors`, `plotSizeSqm: plot_size_sqm`, `poolType: pool_type`, `gardenType: garden_type`, `parkingType: parking_type`, `viewType: view_type`, `furnishingLevel: furnishing_level`, `equipment`.

### 2. Исправить handleSaveDraft -- добавить seasonal_pricing
Файл: `src/hooks/usePropertyWizard.ts`, строка 578.
Добавить `seasonal_pricing` в destructuring и обработать как в `handleSubmit`.

### 3. Добавить подсказку о координатах в LocationStep
Файл: `src/components/owner/property-wizard/steps/LocationStep.tsx`.
Если координаты не установлены, показать warning badge "Без координат объект не появится на карте".

### 4. Добавить кнопку "Открыть объект" на экране успеха
Файл: `src/components/owner/PropertySubmissionSuccess.tsx`.
Добавить кнопку навигации на `/mc/properties/{propertyId}/editor` если propertyId доступен.

### 5. Заменить Yandex Static Maps на Mapbox Static Images
Файл: `src/pages/owner/AddProperty.tsx`, строки 219-233.
Использовать Mapbox Static Images API с уже имеющимся токеном вместо Yandex.

### 6. Улучшить PhotosStep -- cover_image включать в images при сохранении
Файл: `src/hooks/usePropertyWizard.ts`.
В submitPayload и draftPayload объединять `cover_image` + `images` в единый массив `images`, а `cover_image` ставить = images[0].

### 7. Показывать иконку "нет координат" в списке объектов
Файл: `src/pages/owner/OwnerProperties.tsx`.
Рядом с картой объекта без lat/lng показать маленькую иконку-предупреждение.

### 8. UX: Sticky bottom navigation на мобильном
Навигационные кнопки "Назад / Далее" уже sticky, но проверить что они не перекрываются системным навбаром на iOS.

---

## Технические детали

### Файлы для изменения:
1. `src/hooks/usePropertyWizard.ts` -- previewData, handleSaveDraft, images merge
2. `src/components/owner/property-wizard/steps/LocationStep.tsx` -- координатное предупреждение
3. `src/components/owner/PropertySubmissionSuccess.tsx` -- кнопка "Открыть объект"
4. `src/pages/owner/AddProperty.tsx` -- замена Yandex на Mapbox static
5. `src/pages/owner/OwnerProperties.tsx` -- badge "нет координат"

### Никаких миграций БД не требуется
Все поля уже существуют в таблице `properties`.

