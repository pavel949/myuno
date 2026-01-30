

# Data Import Hub — Инструмент Массового Импорта Контента

## Бизнес-Цель

Создать профессиональный **Admin Data Import Center** для быстрого наполнения платформы реальным контентом из различных источников. Инструмент предназначен для команды UNO и позволяет импортировать данные о провайдерах, товарах, услугах из Excel, Google Sheets, сайтов партнёров и облачных хранилищ.

## Поддерживаемые Источники Данных

| Источник | Метод обработки | Приоритет |
|----------|----------------|-----------|
| Excel (.xlsx, .xls) | File upload + xlsx parser | Высокий |
| CSV | File upload + native parsing | Высокий |
| Google Sheets | Public link parsing | Высокий |
| Partner Websites | Firecrawl scraping | Средний |
| Google Drive links | Direct file fetch | Средний |
| Dropbox links | Direct file fetch | Средний |

## Целевые Таблицы для Импорта

1. **providers** — Поставщики услуг
2. **marketplace_products** — Товары маркетплейса
3. **marketplace_vendors** — Продавцы маркетплейса
4. **services** — Услуги
5. **restaurants** — Рестораны
6. **salons** — Салоны красоты
7. **yachts** — Яхты
8. **tours** — Туры

## Архитектура Решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DATA IMPORT HUB                        │
│                   /admin/data-import                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ File Upload  │  │ URL Import   │  │ Web Scraper  │          │
│  │ Excel/CSV    │  │ GDrive/Box   │  │ Firecrawl    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                     DATA PROCESSOR                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Parse → 2. Map Fields → 3. Validate → 4. Preview   │    │
│  └────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     TARGET SELECTOR                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Providers│ │ Products │ │ Services │ │Restaurants│           │
│  └─────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                     IMPORT ACTIONS                              │
│  [ Preview ] [ Validate ] [ Import All ] [ Import Selected ]   │
└─────────────────────────────────────────────────────────────────┘
```

## Компоненты

### 1. Главная Страница `/admin/data-import`

**AdminDataImport.tsx** — центр управления импортом:
- Выбор целевой таблицы (Providers, Products, Services и т.д.)
- Tabs для разных методов импорта (File Upload / URL / Scraper)
- История импортов с логами

### 2. Компонент FileImporter

**FileImporter.tsx** — загрузка и парсинг файлов:
- Drag-n-drop зона для файлов
- Поддержка .xlsx, .xls, .csv
- Парсинг через библиотеку `xlsx` (SheetJS)
- Preview первых 10 строк

### 3. Компонент FieldMapper

**FieldMapper.tsx** — маппинг колонок:
- Автоматическое определение колонок (name → name_en, цена → price)
- Ручной маппинг через dropdowns
- Сохранение mapping-пресетов для повторного использования

### 4. Компонент ImportPreview

**ImportPreview.tsx** — превью и валидация:
- Таблица с предпросмотром данных
- Подсветка ошибок валидации
- Возможность редактирования перед импортом
- Чекбоксы для выборочного импорта

### 5. Edge Function `bulk-import`

**supabase/functions/bulk-import/index.ts:**
- Приём batch-данных
- Валидация по схеме целевой таблицы
- Bulk upsert с обработкой конфликтов
- Логирование результатов

### 6. Web Scraper (опционально)

**WebScraper.tsx** — интеграция с Firecrawl:
- Ввод URL партнёрского сайта
- Scrape и парсинг структурированных данных
- AI-извлечение (название, цена, описание) через Lovable AI

## Структура Файлов

```text
src/
├── pages/admin/
│   └── AdminDataImport.tsx        # Главная страница
├── components/admin/data-import/
│   ├── FileImporter.tsx           # File upload + parsing
│   ├── FieldMapper.tsx            # Column mapping UI
│   ├── ImportPreview.tsx          # Preview table
│   ├── ImportHistory.tsx          # Import logs
│   ├── UrlImporter.tsx            # Google Drive/Dropbox
│   ├── WebScraper.tsx             # Firecrawl integration
│   └── ImportTargetSelector.tsx   # Target table selector
├── hooks/
│   └── useDataImport.ts           # Import logic hook
└── lib/
    └── importTemplates.ts         # Field mappings per table

supabase/functions/
└── bulk-import/
    └── index.ts                   # Batch insert endpoint
```

## Схемы Маппинга (примеры)

### Для marketplace_products:
```typescript
const productMapping = {
  'name': 'name_en',
  'название': 'name_ru',
  'price': 'price',
  'цена': 'price',
  'category': 'category_slug',
  'description': 'description_en',
  'описание': 'description_ru',
  'image': 'cover_image',
  'stock': 'in_stock',
  'vendor': 'vendor_id', // требует lookup
};
```

### Для providers:
```typescript
const providerMapping = {
  'name': 'name',
  'phone': 'phone',
  'email': 'email',
  'address': 'address',
  'category': 'business_category',
  'website': 'website',
};
```

## Технические Детали

### Зависимости (добавить)
```bash
npm install xlsx
```

### Парсинг Excel
```typescript
import * as XLSX from 'xlsx';

const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      resolve(json);
    };
    reader.readAsArrayBuffer(file);
  });
};
```

### Bulk Insert Edge Function
```typescript
// supabase/functions/bulk-import/index.ts
const { table, records } = await req.json();

const { data, error } = await supabase
  .from(table)
  .upsert(records, { 
    onConflict: 'id',
    ignoreDuplicates: false 
  });
```

## UX Flow

1. **Выбор цели** → Admin выбирает таблицу (Products, Providers, etc.)
2. **Загрузка** → Drag-n-drop файла или вставка URL
3. **Маппинг** → Система предлагает автоматический маппинг, admin корректирует
4. **Preview** → Предпросмотр с валидацией, можно редактировать
5. **Import** → Массовый импорт с прогресс-баром
6. **Результат** → Отчёт (успешно/ошибки/пропущено)

## Интеграция с Firecrawl (для сайтов)

Если требуется scraping партнёрских сайтов:
1. Подключить Firecrawl через коннектор (уже доступен в workspace)
2. Создать edge function `scrape-partner-site`
3. Использовать Lovable AI для извлечения структурированных данных из markdown

## План Реализации

### Фаза 1: Базовый импорт (1-2 часа)
1. Создать `AdminDataImport.tsx` с выбором таблицы
2. Создать `FileImporter.tsx` для Excel/CSV
3. Добавить xlsx зависимость
4. Добавить роут в админку

### Фаза 2: Маппинг и Preview (1 час)
5. Создать `FieldMapper.tsx` с автоопределением
6. Создать `ImportPreview.tsx` с редактированием
7. Добавить валидацию по схеме таблицы

### Фаза 3: Edge Function и Импорт (1 час)
8. Создать `bulk-import` edge function
9. Реализовать batch upsert
10. Добавить логирование и историю

### Фаза 4: URL и Scraping (опционально)
11. Подключить Firecrawl коннектор
12. Создать `UrlImporter.tsx` для GDrive/Dropbox
13. Создать `WebScraper.tsx` для сайтов

## Преимущества Решения

- **Унифицированный интерфейс** — один инструмент для всех типов данных
- **Гибкий маппинг** — работает с любой структурой Excel
- **Валидация** — ошибки видны ДО импорта
- **Скорость** — batch-импорт 1000+ записей за секунды
- **Логирование** — история всех импортов
- **Масштабируемость** — легко добавить новые таблицы

