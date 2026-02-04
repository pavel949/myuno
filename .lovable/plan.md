
# Детальный план миграции Hardcoded → Database

## Результаты глубокого аудита

### Текущее состояние системы

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         КАРТА HARDCODED ДАННЫХ                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  КРИТИЧЕСКИЙ HARDCODE (требует миграции):                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. intakeVerticals.ts (728 строк)                                      │ │
│  │    └─ 25+ вертикалей для AI Intake Agent                               │ │
│  │    └─ keywords, requiredFields, optionalFields, fieldLabels            │ │
│  │    └─ ДУБЛИКАТ в Edge Function intake-listing-agent (строки 10-35)!    │ │
│  │                                                                         │ │
│  │ 2. leadVerticalConfig.ts (664 строки)                                   │ │
│  │    └─ 12+ вертикалей для Universal Lead Form                           │ │
│  │    └─ requestTypes, fields (с типами и options)                        │ │
│  │    └─ popularityScore, ctaText                                         │ │
│  │                                                                         │ │
│  │ 3. ContentCreatorMenu.tsx (CONTENT_TYPES)                               │ │
│  │    └─ 14 типов контента с роутами                                      │ │
│  │    └─ Связь type.id → route → целевая страница                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ГИБРИДНЫЕ ДАННЫЕ (частично мигрированы):                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ • taxonomy_definitions: 30 записей, 5 с metadata_schema                │ │
│  │ • lookup_values: 200+ записей по 20+ типам                             │ │
│  │ • Fallback к статическим файлам через useTaxonomyWithFallback          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  DB-DRIVEN (масштабируемо):                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ✓ ai_agents (AI Agent Farm)                                            │ │
│  │ ✓ system_settings (курсы валют, платформенные настройки)               │ │
│  │ ✓ provider_contracts (условия сотрудничества)                          │ │
│  │ ✓ Основные бизнес-таблицы (12 вертикалей)                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Анализ рисков

### Риск 1: Дублирование данных
**Проблема:** Edge Function `intake-listing-agent` содержит локальный массив `VERTICALS` (строки 10-35), который НЕ синхронизирован с `intakeVerticals.ts`.

**Последствия:** При добавлении новой вертикали нужно править ДВА места. Забыть — AI не будет распознавать новые категории.

**Решение:** Миграция в БД устраняет дублирование — Edge Function будет читать из той же таблицы.

### Риск 2: Сломанные формы при неполной миграции
**Проблема:** `UniversalLeadForm.tsx` рендерит поля динамически из `LEAD_VERTICALS[].fields`. Если БД вернёт неполные данные — форма сломается.

**Решение:** Гибридный подход с fallback к статическим файлам на время миграции.

### Риск 3: Потеря AI-функциональности
**Проблема:** `intake-listing-agent` использует `keywords` для детекции вертикали. Некорректная миграция — AI перестанет понимать тексты.

**Решение:** Атомарная миграция с тестированием каждой вертикали.

### Риск 4: Несовместимость схем
**Проблема:** `TaxonomySchemaEditor` создан для `taxonomy_definitions.metadata_schema`, но структура отличается от `intakeVerticals.fieldLabels`.

**Решение:** Расширить схему редактора или создать специализированные редакторы.

---

## Решение: Поэтапная миграция с нулевым простоем

### Фаза 0: Подготовка (без изменения поведения)

**Шаг 0.1: Новые таблицы конфигурации**

```sql
-- Таблица для конфигов AI Intake
CREATE TABLE sys_intake_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id TEXT UNIQUE NOT NULL,      -- 'yachts', 'properties', etc.
  target_table TEXT NOT NULL,             -- 'yachts', 'properties', etc.
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT,                              -- emoji
  keywords TEXT[] NOT NULL DEFAULT '{}',  -- для AI-детекции
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  optional_fields TEXT[] NOT NULL DEFAULT '{}',
  field_labels JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {field: {en, ru, type, enumValues}}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица для конфигов Lead Form
CREATE TABLE sys_lead_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id TEXT UNIQUE NOT NULL,       -- 'properties', 'yachts', 'legal'
  icon TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  short_desc_en TEXT,
  short_desc_ru TEXT,
  cta_text_en TEXT,
  cta_text_ru TEXT,
  popularity_score INTEGER DEFAULT 50,
  request_types JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{value, labelEn, labelRu}]
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,         -- [{key, type, labelEn, labelRu, options, required}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_intake_configs_vertical ON sys_intake_configs(vertical_id);
CREATE INDEX idx_lead_configs_vertical ON sys_lead_configs(vertical_id);
CREATE INDEX idx_intake_configs_active ON sys_intake_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_lead_configs_active ON sys_lead_configs(is_active) WHERE is_active = true;
```

**Шаг 0.2: Миграция данных (INSERT из статических файлов)**

Создать Edge Function `migrate-intake-configs` для одноразового импорта данных из `intakeVerticals.ts` и `leadVerticalConfig.ts` в новые таблицы.

---

### Фаза 1: Гибридные хуки (чтение из БД с fallback)

**Шаг 1.1: Создать useIntakeConfigs.ts**

```typescript
// src/hooks/useIntakeConfigs.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { INTAKE_VERTICALS, VerticalConfig } from '@/lib/intakeVerticals'; // fallback

export function useIntakeConfigs() {
  return useQuery({
    queryKey: ['intake-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sys_intake_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error || !data || data.length === 0) {
        // Fallback к статическому файлу
        console.warn('Using static intake configs fallback');
        return INTAKE_VERTICALS;
      }
      
      // Маппинг БД → интерфейс VerticalConfig
      return data.map(row => ({
        id: row.vertical_id,
        table: row.target_table,
        nameEn: row.name_en,
        nameRu: row.name_ru,
        icon: row.icon,
        keywords: row.keywords,
        requiredFields: row.required_fields,
        optionalFields: row.optional_fields,
        fieldLabels: row.field_labels,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 минут кеша
  });
}
```

**Шаг 1.2: Создать useLeadConfigs.ts** (аналогично)

**Шаг 1.3: Обновить компоненты-потребители**

| Компонент | Текущий импорт | Новый импорт |
|-----------|----------------|--------------|
| IntakeItemEditor.tsx | `INTAKE_VERTICALS` | `useIntakeConfigs()` |
| IntakeVerticalBadge.tsx | `INTAKE_VERTICALS` | `useIntakeConfigs()` |
| UniversalLeadForm.tsx | `LEAD_VERTICALS` | `useLeadConfigs()` |
| AdminConsultations.tsx | `LEAD_VERTICALS` | `useLeadConfigs()` |

---

### Фаза 2: Синхронизация Edge Function

**Шаг 2.1: Обновить intake-listing-agent**

Удалить локальный массив `VERTICALS` (строки 10-35) и читать из БД:

```typescript
// intake-listing-agent/index.ts
async function getVerticalConfigs(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('sys_intake_configs')
    .select('vertical_id, target_table, keywords')
    .eq('is_active', true);
  
  return data || [];
}
```

---

### Фаза 3: Админ-интерфейс редактирования

**Шаг 3.1: IntakeConfigEditor** (новый компонент)

Страница `/admin/settings/intake-configs` для редактирования:
- Список вертикалей с drag-and-drop сортировкой
- Редактирование keywords (AI-детекция)
- Редактирование полей с типами
- Preview формы

**Шаг 3.2: LeadConfigEditor** (новый компонент)

Страница `/admin/settings/lead-configs` для редактирования:
- Типы запросов (requestTypes)
- Поля формы с визуальным редактором
- Preview лид-формы

---

### Фаза 4: Очистка (после стабильной работы)

**Через 2 недели стабильной работы:**
1. Удалить fallback логику из хуков
2. Пометить статические файлы как `@deprecated`
3. Через 1 месяц — удалить файлы полностью

---

## Файлы для создания/изменения

| Действие | Файл | Описание |
|----------|------|----------|
| CREATE | SQL миграция | Таблицы `sys_intake_configs`, `sys_lead_configs` |
| CREATE | `src/hooks/useIntakeConfigs.ts` | Гибридный хук с fallback |
| CREATE | `src/hooks/useLeadConfigs.ts` | Гибридный хук с fallback |
| CREATE | `supabase/functions/migrate-intake-configs/` | Одноразовый импорт данных |
| UPDATE | `src/components/admin/intake/IntakeItemEditor.tsx` | Использовать useIntakeConfigs |
| UPDATE | `src/components/admin/intake/IntakeVerticalBadge.tsx` | Использовать useIntakeConfigs |
| UPDATE | `src/components/leads/UniversalLeadForm.tsx` | Использовать useLeadConfigs |
| UPDATE | `supabase/functions/intake-listing-agent/index.ts` | Читать из БД вместо локального массива |
| CREATE | `src/pages/admin/AdminIntakeConfigs.tsx` | UI редактирования |
| CREATE | `src/pages/admin/AdminLeadConfigs.tsx` | UI редактирования |

---

## Критерии успеха (метрики)

| Метрика | До | После | Как измерить |
|---------|-----|-------|--------------|
| Время добавления вертикали | ~2ч (deploy) | ~5 мин (UI) | Секундомер |
| Синхронизация Frontend/Edge | Ручная | Автоматическая | Аудит кода |
| Риск рассинхронизации | Высокий (2 места) | Нулевой (1 источник) | Code review |
| Downtime при изменениях | ~5 мин (deploy) | 0 (hot reload) | Мониторинг |

---

## Порядок выполнения

```text
Неделя 1:
├── День 1-2: Фаза 0 (таблицы + миграция данных)
├── День 3-4: Фаза 1 (гибридные хуки)
└── День 5: Тестирование fallback

Неделя 2:
├── День 1-2: Фаза 2 (Edge Function)
├── День 3-4: Фаза 3 (Админ-UI)
└── День 5: E2E тестирование

Неделя 3-4:
└── Мониторинг, сбор метрик, планирование Фазы 4
```

---

## Гарантии безопасности

1. **Zero Downtime**: Fallback к статическим файлам при любых проблемах с БД
2. **Атомарность**: Каждая фаза независима — можно остановиться на любом этапе
3. **Откат**: Если БД пустая — система работает как раньше
4. **Тестирование**: Перед каждой фазой — полный прогон AI Intake и Lead Form

---

## Что НЕ трогаем (оставляем как есть)

1. **TaxonomySchemaEditor** — уже работает для lookup_values
2. **providerTaxonomy.ts** — используется для CanonicalListingWizard, отдельная миграция
3. **ContentCreatorMenu** — CONTENT_TYPES мигрировать позже (низкий приоритет)
4. **geography.ts, contacts.ts** — статические конфиги, не критично
