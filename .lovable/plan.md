
# План: Унифицированный Airbnb-style загрузчик медиаматериалов

## ✅ РЕАЛИЗОВАНО (Этап 1 + Высокий приоритет)

### Созданные компоненты:
- `src/components/upload/UnifiedMediaUploader.tsx` - Главный компонент с 4 режимами
- `src/components/upload/modes/GalleryMode.tsx` - Фотогалерея с DnD
- `src/components/upload/modes/DocumentMode.tsx` - Документы с камерой
- `src/components/upload/modes/AvatarMode.tsx` - Круглый аватар
- `src/components/upload/modes/SingleImageMode.tsx` - Одиночное фото
- `src/components/upload/shared/UploadDropzone.tsx` - Универсальная dropzone
- `src/components/upload/shared/UploadProgress.tsx` - Индикатор прогресса
- `src/components/upload/shared/ImageCompressor.ts` - Утилита сжатия WebP
- `src/components/upload/shared/DocumentQualityTips.tsx` - Подсказки для документов

### Мигрированные страницы:
- ✅ `SellPhotosStep` - Marketplace wizard
- ✅ `MyDocuments` - Профиль пользователя  
- ✅ `PhotosStep` (listing-wizard) - Листинг
- ✅ `PhotosStep` (property-wizard) - Собственники

---

## Обзор

Создание единого компонента загрузки `UnifiedMediaUploader`, который заменит все разрозненные решения на платформе и обеспечит консистентный премиальный UX во всех вертикалях.

---

## Исходное состояние

| Компонент | Использование | Проблемы |
|-----------|--------------|----------|
| `AirbnbStyleImageUpload` | 4 места (Properties) | Только для изображений, нет режима документов |
| `ImageUpload` / `MultiImageUpload` | 40+ админ/вендор страниц | Нет сжатия, нет DnD, нет облачного импорта |
| `DocumentUpload` | Верификация собственности | Нет preview документов, нет OCR подсказок |
| `<input type="file">` | MyDocuments | Минимальный UX, нет прогресса, нет preview |
| `SellPhotosStep` | Marketplace wizard | Заглушки вместо реальной загрузки! |
| `AvatarUpload` | Профиль | Изолированная логика |

---

## Целевая архитектура

### Единый компонент `UnifiedMediaUploader`

```
src/components/upload/
├── UnifiedMediaUploader.tsx    ← НОВЫЙ: Главный компонент
├── modes/
│   ├── GalleryMode.tsx         ← Режим фотогалереи (на базе AirbnbStyleImageUpload)
│   ├── DocumentMode.tsx        ← Режим документов (паспорт, лицензии, чеки)
│   ├── AvatarMode.tsx          ← Режим аватара (круглый crop)
│   └── SingleImageMode.tsx     ← Режим одиночного фото (обложка)
├── shared/
│   ├── UploadDropzone.tsx      ← Универсальная dropzone
│   ├── UploadProgress.tsx      ← Индикатор прогресса
│   ├── ImageCompressor.ts      ← Утилита сжатия WebP
│   ├── QualityAnalyzer.tsx     ← Анализ качества (расширенный)
│   └── CloudImporter.tsx       ← Google Drive, Dropbox, Yandex Disk
├── AirbnbStyleImageUpload.tsx  ← DEPRECATED, re-export
├── ImageUpload.tsx             ← DEPRECATED, re-export
└── DocumentUpload.tsx          ← DEPRECATED, re-export
```

---

## Режимы работы

### 1. Gallery Mode (Фотогалерея)
**Использование**: Properties, Tours, Yachts, Events, Restaurants, Salons...

Функции:
- Drag-and-drop сортировка
- Выбор обложки (первое фото)
- WebP сжатие до 1MB
- Импорт с URL / облака
- Редактирование (поворот, обрезка, AI улучшение)
- Подсказки качества

```typescript
<UnifiedMediaUploader
  mode="gallery"
  value={images}
  onChange={setImages}
  folder="properties"
  maxItems={20}
/>
```

### 2. Document Mode (Документы)
**Использование**: MyDocuments, Guest Check-in, Vendor Verification, Ownership Proof

Функции:
- PDF + изображения
- Camera first на мобильных
- Preview документов (PDF viewer)
- OCR подсказки (проверка читаемости)
- Срок действия документа

```typescript
<UnifiedMediaUploader
  mode="document"
  value={documentUrl}
  onChange={setDocumentUrl}
  folder="documents"
  documentType="passport"
  showCamera={true}
  tips={['Уберите обложку паспорта', 'Избегайте бликов']}
/>
```

### 3. Avatar Mode (Аватар)
**Использование**: Profile, Vendor Profile, Provider Profile

Функции:
- Круглый crop
- Автоматическое центрирование лица
- Инициалы как fallback

```typescript
<UnifiedMediaUploader
  mode="avatar"
  value={avatarUrl}
  onChange={setAvatarUrl}
  name={userName}
/>
```

### 4. Single Image Mode (Одиночное фото)
**Использование**: Cover images в админке, категории, баннеры

```typescript
<UnifiedMediaUploader
  mode="single"
  value={coverImage}
  onChange={setCoverImage}
  aspectRatio={16/9}
/>
```

---

## Расширение анализа качества

Текущий `ImageQualityTips` проверяет:
- Разрешение
- Пропорции
- Яркость

Добавить для документов:
- **Edge detection**: Весь документ в кадре?
- **Blur check**: Читается ли текст?
- **Orientation**: Документ не перевёрнут?
- **Контекстные подсказки** по типу документа

---

## Места миграции (приоритет)

### Высокий приоритет
1. **SellPhotosStep** — сейчас заглушки!
2. **MyDocuments** — сырой input
3. **Listing Wizard PhotosStep** — базовый MultiImageUpload

### Средний приоритет
4. Все Admin страницы (Tours, Yachts, Events...)
5. Все Vendor страницы
6. Owner PropertyEditor

### Низкий приоритет
7. AvatarUpload → Avatar mode
8. IntakeFileUpload
9. ReceiptUploadWithOCR

---

## Структура миграции

### Этап 1: Создание UnifiedMediaUploader
- Базовый компонент с props для режимов
- Переиспользование логики из AirbnbStyleImageUpload
- Сохранение обратной совместимости

### Этап 2: Gallery Mode
- Рефакторинг AirbnbStyleImageUpload в режим
- Добавление в SellPhotosStep и ListingWizard

### Этап 3: Document Mode
- Новый режим для документов
- PDF preview, OCR tips
- Миграция MyDocuments

### Этап 4: Массовая миграция
- Замена ImageUpload во всех админ/вендор страницах
- Re-export для обратной совместимости

### Этап 5: Avatar Mode
- Миграция AvatarUpload
- Face detection для центрирования

---

## Новые файлы

| Файл | Описание |
|------|----------|
| `src/components/upload/UnifiedMediaUploader.tsx` | Главный компонент с mode switching |
| `src/components/upload/modes/GalleryMode.tsx` | Фотогалерея с DnD |
| `src/components/upload/modes/DocumentMode.tsx` | Документы с камерой |
| `src/components/upload/modes/AvatarMode.tsx` | Круглый аватар |
| `src/components/upload/modes/SingleImageMode.tsx` | Одиночное фото |
| `src/components/upload/shared/UploadDropzone.tsx` | Переиспользуемая dropzone |
| `src/components/upload/shared/QualityAnalyzer.tsx` | Расширенный анализ |
| `src/components/upload/shared/DocumentQualityTips.tsx` | Подсказки для документов |

---

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/sell-wizard/steps/SellPhotosStep.tsx` | Заменить заглушки на UnifiedMediaUploader |
| `src/pages/profile/MyDocuments.tsx` | Заменить raw input на Document mode |
| `src/components/listing-wizard/steps/PhotosStep.tsx` | Использовать UnifiedMediaUploader |
| `src/components/upload/ImageUpload.tsx` | Re-export UnifiedMediaUploader |
| `src/components/upload/AirbnbStyleImageUpload.tsx` | Re-export для совместимости |
| 40+ admin/vendor страниц | Постепенная миграция |

---

## Технические детали

### Props интерфейс

```typescript
interface UnifiedMediaUploaderProps {
  // Core
  mode: 'gallery' | 'document' | 'avatar' | 'single';
  value: string | string[];
  onChange: (value: string | string[]) => void;
  
  // Storage
  folder?: string;
  bucket?: string;
  
  // Limits
  maxItems?: number;
  maxSizeMB?: number;
  
  // Document mode
  documentType?: 'passport' | 'license' | 'insurance' | 'other';
  showCamera?: boolean;
  customTips?: string[];
  
  // Avatar mode
  name?: string;
  
  // Single mode
  aspectRatio?: number;
  
  // Features
  enableCloudImport?: boolean;
  enableUrlImport?: boolean;
  enableEditing?: boolean;
  enableQualityTips?: boolean;
  
  // UI
  className?: string;
  placeholder?: string;
}
```

### Сжатие по умолчанию

```typescript
const COMPRESSION_DEFAULTS = {
  gallery: { maxSizeMB: 1, maxWidthOrHeight: 2048, format: 'webp' },
  document: { maxSizeMB: 2, maxWidthOrHeight: 2400, format: 'webp' },
  avatar: { maxSizeMB: 0.5, maxWidthOrHeight: 512, format: 'webp' },
  single: { maxSizeMB: 1, maxWidthOrHeight: 2048, format: 'webp' },
};
```

---

## Ожидаемый результат

- **Консистентный UX** загрузки во всех частях платформы
- **Премиальное ощущение** как в Airbnb
- **Сжатие WebP** экономит хранилище на 60-80%
- **Подсказки качества** улучшают контент
- **Мобильный first** с камерой для документов
- **Облачный импорт** для удобства пользователей
