
# Intake Listing Agent — Полная реализация для всех вертикалей

## Обзор решения

Создаём **Intake Listing Agent** — систему для автоматизации создания листингов из произвольных данных с поддержкой **22+ вертикалей** и **bulk-обработки**.

---

## Архитектура

```text
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN INTAKE PAGE                              │
│                    /admin/intake                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Режим: [Single] [Bulk]                                    │  │
│  │                                                            │  │
│  │  📝 Textarea (произвольный текст, ссылки)                 │  │
│  │  📁 Upload (Excel/CSV с множественными объектами)         │  │
│  │  📷 Drag-drop фото                                        │  │
│  │  🔗 Bulk URLs (список ссылок)                            │  │
│  │                                                            │  │
│  │  [🤖 AI Analyze]                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: intake-listing-agent                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Parse input → detect mode (single/bulk)             │ │
│  │ Step 2: Detect URLs → Firecrawl scrape each                 │ │
│  │ Step 3: Detect vertical (22+ supported tables)              │ │
│  │ Step 4: AI extraction → structured fields + confidence      │ │
│  │ Step 5: Generate bilingual descriptions (EN/RU)             │ │
│  │ Step 6: Return array of IntakeItem objects                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                 INTAKE QUEUE / REVIEW UI                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📋 Item 1: Yacht "Azimut 55" - 85% confidence              │ │
│  │     ⚠️ Missing: price_per_day                               │ │
│  │     [Edit] [✅ Approve] [❌ Discard]                        │ │
│  │                                                             │ │
│  │  📋 Item 2: Villa in Rawai - 92% confidence                 │ │
│  │     ✓ All fields complete                                   │ │
│  │     [Edit] [✅ Approve] [❌ Discard]                        │ │
│  │                                                             │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │  [✅ Approve All Selected] [💾 Save as Drafts]              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│   INSERT в соответствующую таблицу                               │
│   approval_status = 'pending'                                    │
│   created_by_uno_team = true                                     │
│   uno_team_creator_id = admin.id                                 │
│   → Появляется на /admin/moderation                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Поддерживаемые вертикали (22+)

AI автоматически определит категорию по контенту:

| Вертикаль | Таблица | Ключевые признаки |
|-----------|---------|-------------------|
| 🚤 Яхты | `yachts` | яхта, катер, лодка, charter, boat, yacht |
| 🏠 Недвижимость | `properties` | квартира, вилла, кондо, аренда, rent, apartment |
| 🏡 Owner Properties | `owner_properties` | (для собственников) |
| 🗺️ Туры | `tours` | тур, экскурсия, trip, excursion, tour |
| 🏄 Водные развлечения | `water_activities` | diving, snorkeling, jet ski, parasailing |
| 🍽️ Рестораны | `restaurants` | ресторан, кафе, бар, menu, cuisine |
| 💇 Салоны | `salons` | salon, spa, массаж, маникюр, beauty |
| 🏥 Клиники | `clinics` | clinic, hospital, doctor, medical |
| 🏋️ Фитнес | `gyms` | gym, fitness, тренажёрный, yoga |
| 🚗 Транспорт | `vehicles` | car, мотобайк, скутер, rental, авто |
| 🎉 События | `events` | event, мероприятие, концерт, party |
| 👶 Няни | `babysitters` | babysitter, няня, nanny |
| 🧹 Клининг | `cleaning_services` | cleaning, уборка, maid |
| ⚖️ Юридические | `legal_services` | lawyer, адвокат, visa, legal |
| 🐕 Питомцы | `pet_services` | pet, vet, grooming, питомец |
| 🎓 Образование | `education_providers` | school, курсы, education, tutor |
| 💊 Аптеки | `pharmacies` | pharmacy, аптека, medicine |
| 🛡️ Страхование | `insurance_providers` | insurance, страховка |
| 💐 Цветы | `flower_shops` | flowers, цветы, bouquet |
| 🏪 Магазины | `stores` | store, shop, магазин |
| 📍 Локации вендоров | `vendor_locations` | location, филиал, branch |
| 📦 Товары | `marketplace_products` | product, товар, item |
| 🛒 Вендоры маркетплейса | `marketplace_vendors` | vendor, seller, продавец |
| 👔 Провайдеры | `providers` | provider, компания, service |

---

## Реализация

### 1. База данных

**Новая таблица: `ai_intake_sessions`**

```sql
CREATE TABLE public.ai_intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Input
  input_mode TEXT NOT NULL,  -- 'single', 'bulk_text', 'bulk_file', 'bulk_urls'
  raw_input TEXT,
  file_name TEXT,
  uploaded_images TEXT[],
  
  -- Detected items
  items_count INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]',  -- Array of IntakeItem objects
  
  -- Status
  status TEXT DEFAULT 'processing',  -- 'processing', 'ready', 'partial', 'failed', 'completed'
  processed_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  discarded_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: только админы и uno_team
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage intake sessions" ON public.ai_intake_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Index for quick lookup
CREATE INDEX idx_ai_intake_sessions_admin ON public.ai_intake_sessions(admin_id);
CREATE INDEX idx_ai_intake_sessions_status ON public.ai_intake_sessions(status);
```

### 2. Подключение Firecrawl

Firecrawl коннектор доступен в workspace, но не подключен. Подключение даст API ключ для парсинга внешних ссылок.

**Новый edge function: `firecrawl-scrape`**

```typescript
// supabase/functions/firecrawl-scrape/index.ts
// Парсит внешние ссылки через Firecrawl API
// Input: { urls: string[] }
// Output: { results: ScrapedContent[] }
```

### 3. Основной Edge Function: `intake-listing-agent`

```typescript
// supabase/functions/intake-listing-agent/index.ts

interface IntakeRequest {
  mode: 'single' | 'bulk_text' | 'bulk_file' | 'bulk_urls';
  rawText?: string;
  fileData?: ParsedFileData;  // From useDataImport
  urls?: string[];
  images?: string[];
  forceVertical?: string;
  sessionId?: string;  // For continuing existing session
}

interface IntakeItem {
  id: string;
  status: 'pending' | 'approved' | 'discarded' | 'created';
  
  // Source
  sourceUrl?: string;
  sourceText?: string;
  sourceImages?: string[];
  
  // AI Analysis
  detectedVertical: VerticalType;
  verticalConfidence: number;
  extractedFields: Record<string, {
    value: any;
    confidence: number;
    source: 'text' | 'scraped' | 'image' | 'inferred';
  }>;
  
  // Generated content
  suggestedTitle: { en: string; ru: string };
  suggestedDescription: { en: string; ru: string };
  
  // Validation
  missingRequiredFields: string[];
  warnings: string[];
  overallConfidence: number;
  
  // After approval
  createdListingId?: string;
  createdListingTable?: string;
}

interface IntakeResponse {
  sessionId: string;
  status: 'ready' | 'partial' | 'failed';
  items: IntakeItem[];
  summary: {
    total: number;
    byVertical: Record<string, number>;
    avgConfidence: number;
    readyToApprove: number;
    needsReview: number;
  };
}
```

**Логика работы:**

1. **Детекция ссылок в тексте**
   ```typescript
   const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
   ```

2. **Разбиение bulk text на отдельные items**
   ```typescript
   const ITEM_SEPARATORS = [
     /^---+$/m,           // ---
     /^===+$/m,           // ===
     /^#{2,}\s/m,         // ## Header
     /^\d+\.\s/m,         // 1. Numbered list
   ];
   ```

3. **Firecrawl scraping** (если есть ссылки)
   - Rate limiting: max 5 URLs параллельно
   - 1 секунда между батчами

4. **AI анализ через Gemini**
   - Определение вертикали
   - Извлечение полей по схеме вертикали
   - Генерация описаний EN/RU
   - Confidence scoring

### 4. Конфигурация вертикалей

**Новый файл: `src/lib/intakeVerticals.ts`**

```typescript
export interface VerticalConfig {
  id: string;
  table: string;
  nameEn: string;
  nameRu: string;
  icon: string;
  keywords: string[];
  requiredFields: string[];
  optionalFields: string[];
  fieldLabels: Record<string, { en: string; ru: string; type: string }>;
}

export const INTAKE_VERTICALS: VerticalConfig[] = [
  {
    id: 'yachts',
    table: 'yachts',
    nameEn: 'Yachts',
    nameRu: 'Яхты',
    icon: '🚤',
    keywords: ['yacht', 'яхта', 'boat', 'лодка', 'катер', 'charter', 'чартер'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price_per_day', 'capacity', 'length', 'cover_image'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      price_per_day: { en: 'Price per Day', ru: 'Цена за день', type: 'number' },
      capacity: { en: 'Capacity', ru: 'Вместимость', type: 'number' },
      length: { en: 'Length (m)', ru: 'Длина (м)', type: 'number' },
      // ...
    }
  },
  // ... 22+ verticals
];
```

### 5. Frontend: `/admin/intake`

**Новые компоненты:**

| Компонент | Описание |
|-----------|----------|
| `IntakePageLayout.tsx` | Основной layout страницы |
| `IntakeModeSelector.tsx` | Переключатель Single/Bulk |
| `IntakeInputForm.tsx` | Форма ввода (textarea + drag-drop + file upload) |
| `IntakeQueue.tsx` | Таблица/карточки извлечённых объектов |
| `IntakeItemCard.tsx` | Карточка отдельного item с confidence |
| `IntakeItemEditor.tsx` | Модальное окно редактирования |
| `IntakeVerticalBadge.tsx` | Бейдж с иконкой вертикали |
| `IntakeConfidenceBar.tsx` | Визуализация confidence |
| `IntakeBulkActions.tsx` | Массовые действия (Approve All, Discard) |

**Страница `/admin/intake`:**

```tsx
// src/pages/admin/AdminIntake.tsx
export default function AdminIntake() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [session, setSession] = useState<IntakeSession | null>(null);
  
  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title="Intake Listings" />
        
        <IntakeModeSelector mode={mode} onChange={setMode} />
        
        {!session && (
          <IntakeInputForm 
            mode={mode} 
            onAnalyze={handleAnalyze} 
          />
        )}
        
        {session && (
          <IntakeQueue 
            session={session}
            onApprove={handleApprove}
            onDiscard={handleDiscard}
            onEdit={handleEdit}
            onApproveAll={handleApproveAll}
          />
        )}
      </PageContainer>
    </AppLayout>
  );
}
```

### 6. Навигация

Добавить в `AdminSidebar.tsx`:

```typescript
// Новый пункт меню
{ 
  title: 'Intake', 
  titleRu: 'Приём листингов', 
  path: '/admin/intake', 
  icon: Inbox, // или FileInput
  description: 'AI-assisted listing creation',
  descriptionRu: 'AI-создание листингов'
}
```

Добавить в роутинг:
```tsx
<Route path="/admin/intake" element={<AdminIntake />} />
```

---

## Интеграция с существующими компонентами

### Переиспользуем:
- `useDataImport` — парсинг Excel/CSV файлов
- `importTemplates.ts` — схемы полей для вертикалей
- `AITextExtractor.tsx` — логика извлечения полей
- `AIPhotoAnalyzer.tsx` — анализ фото
- `bulk-import` edge function — для финальной вставки
- `useContentModeration` — типы вертикалей

### Создаём новое:
- `intake-listing-agent` edge function
- `firecrawl-scrape` edge function (утилита)
- `useIntakeAgent` hook
- `intakeVerticals.ts` конфигурация
- UI компоненты для Intake страницы

---

## Безопасность (AI Boundary Contract)

| Действие | Разрешено | Комментарий |
|----------|-----------|-------------|
| Парсить внешние ссылки | ✅ | Через Firecrawl (read-only) |
| Извлекать данные из текста | ✅ | AI анализирует, не модифицирует |
| Анализировать фото | ✅ | Определение типа объекта |
| Генерировать описания | ✅ | EN/RU тексты |
| Создавать листинги | ✅ | С `approval_status = 'pending'` |
| Авто-публикация | ❌ | Только через модерацию |
| Изменять существующие | ❌ | Только создание новых |
| Прямая запись в БД | ❌ | Только через bulk-import |

---

## План реализации (7 дней)

### День 1: Инфраструктура
- [ ] Подключить Firecrawl connector
- [ ] Создать `firecrawl-scrape` edge function
- [ ] Применить миграцию `ai_intake_sessions`

### День 2: Вертикали конфигурация
- [ ] Создать `intakeVerticals.ts` с полными схемами для 22+ вертикалей
- [ ] Расширить `importTemplates.ts` недостающими вертикалями

### День 3: Core Agent
- [ ] Создать `intake-listing-agent` edge function
- [ ] Логика детекции вертикали
- [ ] Интеграция с Firecrawl
- [ ] AI extraction через Gemini

### День 4: Frontend - Single Mode
- [ ] Страница `/admin/intake`
- [ ] Single mode форма ввода
- [ ] Интеграция с edge function
- [ ] Preview извлечённых данных

### День 5: Frontend - Bulk Mode
- [ ] Bulk text input (с разделителями)
- [ ] Bulk file upload (Excel/CSV)
- [ ] Bulk URL list
- [ ] Progress индикаторы

### День 6: Queue & Review
- [ ] IntakeQueue компонент
- [ ] IntakeItemEditor модалка
- [ ] Bulk actions (approve/discard)
- [ ] Интеграция с bulk-import

### День 7: Polish & Testing
- [ ] Edge cases (невалидные URL, таймауты)
- [ ] Error handling
- [ ] Mobile responsive
- [ ] End-to-end testing

---

## Технические детали

### Обновление bulk-import для поддержки всех вертикалей

Расширить `ALLOWED_TABLES` в `bulk-import/index.ts`:

```typescript
const ALLOWED_TABLES = [
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'restaurants',
  'salons',
  'yachts',
  'tours',
  'services',
  'properties',
  'owner_properties',
  'water_activities',
  'clinics',
  'gyms',
  'vehicles',
  'events',
  'babysitters',
  'cleaning_services',
  'legal_services',
  'pet_services',
  'education_providers',
  'pharmacies',
  'insurance_providers',
  'flower_shops',
  'stores',
  'vendor_locations',
];
```

### AI Prompt для вертикальной классификации

```text
Analyze this content and determine the most appropriate listing category.

Available categories:
${INTAKE_VERTICALS.map(v => `- ${v.id}: ${v.keywords.join(', ')}`).join('\n')}

Content to analyze:
"""
${combinedContent}
"""

Return the category ID with highest confidence.
```

### Confidence scoring

- **High (>80%)**: Все обязательные поля найдены, явные ключевые слова
- **Medium (50-80%)**: Часть полей найдена, неявный контекст
- **Low (<50%)**: Много пропущенных полей, требует ручной проверки

---

## KPIs

| Метрика | Цель |
|---------|------|
| Время создания 1 листинга | < 2 мин vs 10+ мин вручную |
| Время обработки 10 листингов (bulk) | < 5 мин |
| Точность определения вертикали | > 90% |
| Точность извлечения полей | > 70% без правок |
| Использование | > 50 листингов/неделю |

---

## Примеры использования

### Сценарий 1: WhatsApp сообщение

```
Новая яхта на чартер:
Azimut 55, 2020 год, 16 метров
Вместимость: 8 человек + 2 экипаж
Цена: $2,500/день
Контакт: +66 89 123 4567
Фото: [3 вложения]
```

→ Копируешь в Intake → AI определяет: **yachts**
→ Извлекает: name_en="Azimut 55", length=16, capacity=8, price_per_day=2500
→ Прикрепляешь фото
→ [Approve] → Листинг уходит на модерацию

### Сценарий 2: Список ссылок от партнёра

```
https://yacht-charter-phuket.com/vessel/azimut-55
https://yacht-charter-phuket.com/vessel/princess-62
https://phuket-villas.com/property/ocean-view-villa
https://tour-operator.com/island-hopping-trip
```

→ Вставляешь в Bulk URLs
→ AI обходит все страницы через Firecrawl
→ Получаешь: 2 яхты + 1 вилла + 1 тур
→ [Approve All] → 4 листинга на модерации

### Сценарий 3: Excel от риелтора

```
properties_january.xlsx
| Title | District | Beds | Price | Type |
| Villa A | Rawai | 3 | 85000 | rent |
| Condo B | Patong | 1 | 35000 | rent |
| House C | Kamala | 4 | 4500000 | sale |
```

→ Upload в Bulk File
→ AI определяет: **properties** для всех строк
→ Генерит описания EN/RU для каждого
→ 3 property в очереди
→ [Approve All] → Листинги на модерации

