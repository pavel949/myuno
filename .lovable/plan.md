
# План: Поддержка загрузки файлов с Yandex Disk

## Проблема

Yandex Disk (`disk.yandex.ru`) - это облачное хранилище с динамическим JavaScript-контентом. Текущий метод парсинга HTML через Firecrawl не работает, потому что:
1. Yandex Disk загружает изображения через JavaScript после загрузки страницы
2. Публичные ссылки (типа `https://disk.yandex.ru/d/xxxxx`) требуют API-вызов для получения прямой ссылки на скачивание
3. Firecrawl возвращает пустой HTML без реальных изображений

## Решение

Создать отдельный обработчик для Yandex Disk, который использует их публичный API для получения прямых ссылок на файлы.

### Как это будет работать

```text
Пользователь вставляет ссылку
         ↓
┌─────────────────────────────────┐
│  Определение типа ссылки        │
│  disk.yandex.ru? → Yandex API   │
│  Другой сайт? → Firecrawl       │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Yandex Disk API                │
│  GET /public/resources?         │
│  public_key=URL                 │
│  → Список файлов + превью       │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Отображение файлов             │
│  с превью и возможностью        │
│  выбора для импорта             │
└─────────────────────────────────┘
```

### Изменения

**1. Обновить Edge Function `extract-images-from-url`**

Добавить специальную обработку для Yandex Disk:
- Определять URL Yandex Disk по домену
- Использовать публичный API Yandex Disk (не требует токена для публичных папок)
- Получать список файлов с превью

**2. Yandex Disk Public API**

Для публичных ссылок API не требует авторизации:
- Endpoint: `https://cloud-api.yandex.net/v1/disk/public/resources`
- Параметр: `public_key` - публичная ссылка
- Возвращает: список файлов с `preview` (превью) и `file` (ссылка для скачивания)

---

## Техническая секция

### Файлы для изменения

**`supabase/functions/extract-images-from-url/index.ts`**

### Логика обработки Yandex Disk

```typescript
// Определить тип ссылки
const isYandexDisk = formattedUrl.includes('disk.yandex.ru') || 
                     formattedUrl.includes('yadi.sk');

if (isYandexDisk) {
  // Использовать Yandex Disk API
  const apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(formattedUrl)}&limit=100`;
  
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  // Извлечь изображения из ответа
  const images = [];
  
  // Если это папка - получить список файлов
  if (data._embedded?.items) {
    for (const item of data._embedded.items) {
      if (item.media_type === 'image' && item.preview) {
        // Получить ссылку на скачивание
        const downloadUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(formattedUrl)}&path=${encodeURIComponent(item.path)}`;
        const downloadResp = await fetch(downloadUrl);
        const downloadData = await downloadResp.json();
        
        images.push({
          preview: item.preview,
          download: downloadData.href,
          name: item.name
        });
      }
    }
  }
  // Если это один файл
  else if (data.media_type === 'image') {
    const downloadUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(formattedUrl)}`;
    const downloadResp = await fetch(downloadUrl);
    const downloadData = await downloadResp.json();
    
    images.push({
      preview: data.preview,
      download: downloadData.href,
      name: data.name
    });
  }
  
  return images;
}
```

### Обновить компонент `ImagePickerFromUrl`

Адаптировать для работы с новым форматом ответа:
- Отображать превью из `preview`
- При выборе использовать `download` ссылку для импорта

### Структура ответа API

**Для папки:**
```json
{
  "name": "Фотографии",
  "type": "dir",
  "_embedded": {
    "items": [
      {
        "name": "photo1.jpg",
        "media_type": "image",
        "preview": "https://...",
        "path": "/photo1.jpg"
      }
    ]
  }
}
```

**Для файла:**
```json
{
  "name": "photo.jpg",
  "media_type": "image",
  "preview": "https://..."
}
```

### Итоговый алгоритм

```text
1. Получить URL от пользователя
2. Проверить: это Yandex Disk?
   ├── ДА → Yandex Disk API
   │   ├── Получить метаданные публичного ресурса
   │   ├── Если папка → получить список файлов
   │   ├── Фильтровать только изображения
   │   └── Для каждого получить download ссылку
   │
   └── НЕТ → Firecrawl (текущая логика)

3. Вернуть список изображений с превью и ссылками
4. Пользователь выбирает нужные
5. Импорт по download-ссылкам
```
