
# План: Улучшение формы добавления объектов в Админ-панели

## Цель
Привести форму добавления объектов в `/admin/properties` к единообразию с формой собственника, добавить расширенную загрузку фото и поле "Внутреннее название".

---

## Часть 1: Добавление поля "Внутреннее название"

### 1.1 Миграция базы данных
Добавить новую колонку `internal_name` в обе таблицы:

```sql
-- properties table (для marketplace/vendor)
ALTER TABLE properties ADD COLUMN internal_name TEXT;

-- owner_properties table (для собственников)
ALTER TABLE owner_properties ADD COLUMN internal_name TEXT;
```

### 1.2 Обновление типов
Добавить `internal_name?: string` в:
- `src/types/property.ts` → `VendorProperty` и `OwnerProperty`

---

## Часть 2: Замена компонента загрузки фото в Admin

### 2.1 Изменения в `AdminProperties.tsx`

**Текущее состояние (строки 500-516):**
```tsx
<ImageUpload value={formData.cover_image} ... />
<MultiImageUpload value={formData.images} ... />
```

**Новое состояние:**
```tsx
<AirbnbStyleImageUpload
  value={formData.cover_image 
    ? [formData.cover_image, ...formData.images] 
    : formData.images}
  onChange={(urls) => {
    if (urls.length === 0) {
      setFormData(prev => ({ ...prev, cover_image: '', images: [] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        cover_image: urls[0], 
        images: urls.slice(1) 
      }));
    }
  }}
  folder="properties"
  maxImages={20}
/>
```

Это добавит:
- Drag & Drop загрузку файлов
- Перетаскивание для изменения порядка (первое фото = обложка)
- Импорт из Google Drive / Dropbox (через ссылки)
- Импорт с любого сайта по URL
- Сжатие в WebP
- Редактирование изображений (поворот, обрезка)

### 2.2 Добавление поля "Внутреннее название"

Добавить новое поле в форму администратора после Provider Selector:

```tsx
<div className="space-y-2">
  <Label>{isRussian ? 'Внутреннее название' : 'Internal Name'}</Label>
  <Input
    value={formData.internal_name}
    onChange={(e) => setFormData(prev => ({ ...prev, internal_name: e.target.value }))}
    placeholder={isRussian ? 'Для внутреннего использования' : 'For internal use only'}
  />
  <p className="text-xs text-muted-foreground">
    {isRussian 
      ? 'Не отображается клиентам. Например: "Вилла Петровых"' 
      : 'Not shown to customers. E.g.: "Villa Petrov Family"'}
  </p>
</div>
```

---

## Часть 3: Синхронизация форм Owner и Admin

### 3.1 Добавление поля internal_name в форму собственника

В `AddProperty.tsx` добавить поле в секцию "Basic Information":

```tsx
<div className="space-y-2">
  <Label>{isRu ? 'Внутреннее название' : 'Internal Name'}</Label>
  <Input
    value={formData.internal_name}
    onChange={(e) => setFormData(prev => ({ ...prev, internal_name: e.target.value }))}
    placeholder={isRu ? 'Только для вас (не публикуется)' : 'Private note (not published)'}
  />
</div>
```

---

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/pages/admin/AdminProperties.tsx` | Заменить ImageUpload на AirbnbStyleImageUpload, добавить internal_name |
| `src/pages/owner/AddProperty.tsx` | Добавить поле internal_name |
| `src/types/property.ts` | Добавить internal_name в типы |
| **Миграция БД** | Добавить колонку internal_name в properties и owner_properties |

---

## Техническая часть

### Возможности AirbnbStyleImageUpload:
1. **Drag & Drop** — перетащите файлы прямо в область
2. **Облако** — Google Drive, Dropbox через копирование ссылки
3. **С сайта** — извлечение изображений с любого URL (Yandex Disk, сайты застройщиков)
4. **Сортировка** — перетаскивание для изменения порядка, первое фото = обложка
5. **Редактирование** — поворот, обрезка изображений
6. **Сжатие** — автоматическая конвертация в WebP, уменьшение размера

### Зависимости:
- `@dnd-kit/core` и `@dnd-kit/sortable` — уже установлены
- `browser-image-compression` — уже установлен
- Компоненты `CloudStoragePicker`, `ImagePickerFromUrl`, `ImageEditor` — уже реализованы
