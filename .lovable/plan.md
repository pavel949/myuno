
# План: AI перевод + Автозаполнение данных проекта

## Обнаруженные проблемы

### 1. AI перевод — УЖЕ РАБОТАЕТ ✅
Компонент `TranslatableInput` уже поддерживает AI перевод через кнопку "Перевести". Edge function `ai-translate` настроена и работает.

**Используется в:**
- BasicInfoStep.tsx (название)
- DescriptionStep.tsx (описание)
- AddProperty.tsx (название, описание)

### 2. Загрузка фото — РАБОТАЕТ ✅
`UnifiedMediaUploader` в режиме `gallery` поддерживает:
- Drag & drop загрузку
- Drag & drop сортировку (dnd-kit)
- Импорт по URL
- Cloud Storage import
- WebP сжатие
- Редактирование изображений

### 3. Подтягивание данных проекта — НЕПОЛНОЕ ❌

**Сейчас при выборе проекта подтягиваются только:**
```typescript
setFormData(prev => ({ 
  ...prev, 
  project_id: projectId,
  address: project?.address || prev.address,
  district: project?.district || prev.district,
  lat: project?.lat ?? prev.lat,
  lng: project?.lng ?? prev.lng,
}));
```

**НЕ подтягиваются:**
- `description_en` / `description_ru` — описание проекта
- `amenities` — удобства территории
- `images` — фото проекта

---

## План реализации

### Этап 1: Расширить подтягивание данных проекта

**Файлы:** `src/pages/owner/AddProperty.tsx`, `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`

При выборе проекта:
1. Показать уведомление о загруженных данных
2. Опционально предложить использовать описание проекта как основу
3. Показать amenities проекта (справочно, не копировать)

```typescript
// Расширить onChange в ProjectSelector
onChange={(projectId, project) => {
  setSelectedProject(project || null);
  
  const updates: Partial<FormData> = { 
    project_id: projectId,
    address: project?.address || prev.address,
    district: project?.district || prev.district,
    lat: project?.lat ?? prev.lat,
    lng: project?.lng ?? prev.lng,
  };
  
  // Если у проекта есть описание и форма пустая — предложить использовать
  if (project?.description_en && !prev.description) {
    // Показать диалог: "Использовать описание проекта как основу?"
  }
  
  setFormData(prev => ({ ...prev, ...updates }));
  
  toast.success(isRu 
    ? `Загружены данные проекта "${project.name_ru || project.name_en}"` 
    : `Loaded data from project "${project.name_en}"`
  );
}}
```

### Этап 2: Добавить карточку информации о проекте

При выбранном проекте показывать `ProjectInfoCard` в свёрнутом виде с:
- Названием и фото проекта
- Адресом
- Amenities (для справки)
- Описанием (expandable)

### Этап 3: Опция "Использовать описание проекта"

Добавить кнопку в DescriptionStep:
```
[✨ Использовать описание проекта как основу]
```

При клике:
1. Копирует `project.description_en` → `formData.description`
2. Копирует `project.description_ru` → `formData.description_ru`
3. Показывает toast "Описание загружено. Отредактируйте под ваш объект."

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/pages/owner/AddProperty.tsx` | Расширить onChange проекта, добавить toast |
| `src/components/owner/property-wizard/steps/BasicInfoStep.tsx` | То же самое для визарда |
| `src/components/owner/property-wizard/steps/DescriptionStep.tsx` | Кнопка "Использовать описание проекта" |

---

## Техническая реализация

### 1. Изменения в BasicInfoStep.tsx

```typescript
// Добавить в onChange ProjectSelector
onChange={(projectId, project) => {
  setSelectedProject(project || null);
  
  updateFormData({ 
    project_id: projectId,
    address: project?.address || formData.address,
    district: project?.district || formData.district,
    lat: project?.lat ?? formData.lat,
    lng: project?.lng ?? formData.lng,
  });
  
  if (project) {
    toast.success(isRu 
      ? `Данные проекта "${project.name_ru || project.name_en}" загружены` 
      : `Project data loaded: "${project.name_en}"`
    );
  }
}}
```

### 2. Изменения в DescriptionStep.tsx

```typescript
interface DescriptionStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject?: PropertyProject | null; // Новый prop
}

// Добавить кнопку если есть проект с описанием
{selectedProject?.description_en && !formData.description && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => {
      updateFormData({
        description: selectedProject.description_en || '',
        description_ru: selectedProject.description_ru || '',
      });
      toast.success(isRu 
        ? 'Описание проекта загружено. Отредактируйте под ваш объект.' 
        : 'Project description loaded. Customize it for your property.'
      );
    }}
    className="gap-2"
  >
    <Sparkles className="h-4 w-4" />
    {isRu ? 'Использовать описание проекта' : 'Use project description'}
  </Button>
)}
```

### 3. Показать amenities проекта справочно

В DescriptionStep или отдельным компонентом:
```typescript
{selectedProject?.amenities?.length > 0 && (
  <div className="p-4 bg-muted/50 rounded-lg">
    <p className="text-sm font-medium mb-2">
      {isRu ? 'Удобства проекта (доступны вашим гостям):' : 'Project amenities (available to your guests):'}
    </p>
    <div className="flex flex-wrap gap-2">
      {selectedProject.amenities.map(amenity => (
        <Badge key={amenity} variant="secondary">{amenity}</Badge>
      ))}
    </div>
  </div>
)}
```

---

## Ожидаемый результат

1. **AI перевод** — уже работает через TranslatableInput ✅
2. **Загрузка фото** — полностью функциональна ✅
3. **При выборе проекта** будет подтягиваться:
   - Адрес, район, координаты (автоматически)
   - Описание (по кнопке, как основа для редактирования)
   - Amenities (справочно, для понимания что доступно гостям)
4. **Toast уведомления** о загруженных данных
5. **Единообразие** между AddProperty.tsx и PropertyWizard
