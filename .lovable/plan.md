
# План: Unified Lead System (Единая система лидов по вертикалям)

## Проблема

Сейчас у платформы есть **критический разрыв** между:
- 19+ вертикалей в `INTAKE_VERTICALS` (яхты, туры, транспорт, юристы и т.д.)
- Форма консультации **только для недвижимости** (6 типов: vacation_rental, property_consultation...)
- Кнопка консультации **скрыта** на странице `/property/consultation`
- Лиды из разных источников хранятся в разных таблицах без связи

### Текущие таблицы лидов:

| Таблица | Назначение | Проблема |
|---------|------------|----------|
| `consultation_requests` | Property-focused лиды | Только 6 типов, все про недвижимость |
| `mcc_leads` | Marketing attribution | Нет привязки к вертикалям |
| `property_service_requests` | Заявки на сервис | Отдельная изоляция |

## Предлагаемое решение

### Архитектура "Universal Lead Hub"

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         UNIVERSAL LEAD HUB                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ UniversalFAB│   │ VerticalCTA │   │ QuickChat   │   │ ExternalAPI │       │
│  │   (global)  │   │(per page)   │   │  Widget     │   │ (partners)  │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │                 │              │
│         └────────────────┴─────────────────┴─────────────────┘              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              UniversalLeadForm (unified intake)                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Step 1: What do you need?                                       │ │   │
│  │  │ [🏠 Property] [🚤 Yacht] [🗺️ Tour] [🚗 Transport] [⚖️ Legal]... │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Step 2: Details (dynamic per vertical)                          │ │   │
│  │  │ - Dates / Budget / Location / Guests...                         │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Step 3: Contact info                                            │ │   │
│  │  │ Name / Phone / Preferred contact method                         │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   consultation_requests (extended)                    │   │
│  │  + vertical_id: string (from INTAKE_VERTICALS)                       │   │
│  │  + vertical_metadata: jsonb (flexible per-vertical data)             │   │
│  │  + lead_source: 'fab' | 'cta' | 'chat' | 'external' | 'organic'      │   │
│  │  + entry_point: string (page URL where lead was captured)            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Компоненты для реализации

### 1. Универсальная FAB-кнопка "Нужна помощь?"

**Файл:** `src/components/fab/UniversalHelpFAB.tsx`

Плавающая кнопка, видимая на всех страницах:
- Открывает шторку с выбором вертикали
- Определяет контекст по текущей странице (если на /yachts → предлагает яхты первыми)
- Показывает популярные запросы

Визуально:
```text
┌─────────────────────────────────────┐
│  [💬]  ← Floating button            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Чем можем помочь?            │  │
│  │  ───────────────────────────  │  │
│  │  🏠 Найти жильё               │  │
│  │  🚤 Арендовать яхту           │  │
│  │  🗺️ Организовать тур          │  │
│  │  🚗 Арендовать авто           │  │
│  │  ⚖️ Юридическая помощь        │  │
│  │  ... (+ еще 14 вертикалей)    │  │
│  │  ───────────────────────────  │  │
│  │  📞 Позвонить нам             │  │
│  │  💬 Написать в WhatsApp       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Универсальная форма заявки

**Файл:** `src/components/leads/UniversalLeadForm.tsx`

Многошаговая форма с динамическими полями:

| Шаг | Содержимое |
|-----|------------|
| 1. Вертикаль | Выбор из INTAKE_VERTICALS с иконками |
| 2. Детали | Динамические поля в зависимости от vertical_id |
| 3. Контакт | Имя, телефон, предпочтительный способ связи |
| 4. Подтверждение | Summary + отправка |

### 3. Расширение схемы consultation_requests

Добавить поля для универсальности:

```sql
ALTER TABLE consultation_requests 
ADD COLUMN vertical_id text,
ADD COLUMN vertical_metadata jsonb DEFAULT '{}',
ADD COLUMN entry_point text;

-- Update request_type to include all verticals
-- Existing types remain, new ones added:
-- 'yacht_charter', 'tour_booking', 'vehicle_rental', 
-- 'legal_consultation', 'medical_appointment', etc.
```

### 4. Конфигурация полей по вертикалям

**Файл:** `src/lib/leadVerticalConfig.ts`

```typescript
type LeadVerticalConfig = {
  id: string;  // matches INTAKE_VERTICALS.id
  requestTypes: string[];  // sub-types within vertical
  requiredFields: string[];
  optionalFields: string[];
  formSteps: FormStepConfig[];
};

const LEAD_VERTICALS: LeadVerticalConfig[] = [
  {
    id: 'yachts',
    requestTypes: ['yacht_charter', 'yacht_purchase', 'yacht_party'],
    requiredFields: ['dates', 'guests_count'],
    optionalFields: ['yacht_type', 'budget', 'duration'],
    // ...
  },
  // ... для каждой вертикали
];
```

### 5. Контекстный CTA на страницах вертикалей

**Файл:** `src/components/leads/VerticalCTA.tsx`

Компонент для встраивания на страницы вертикалей:

```tsx
<VerticalCTA 
  vertical="yachts"
  context="list"  // or 'detail', 'empty-results'
/>
```

Варианты отображения:
- `sticky` — прилипает к низу экрана
- `inline` — встраивается в контент
- `modal` — открывает модальное окно

## Порядок реализации

### Фаза 1: База (этот спринт)

1. **Миграция БД**
   - Добавить `vertical_id`, `vertical_metadata`, `entry_point` в `consultation_requests`
   - Добавить новые значения в `request_type` (или сделать text без ограничений)

2. **UniversalHelpFAB**
   - Плавающая кнопка на всех страницах
   - Sheet с выбором вертикали
   - Быстрые действия (позвонить, написать)

3. **UniversalLeadForm**
   - Многошаговая форма
   - Динамические поля по вертикали
   - Интеграция с useConsultationRequests

4. **VerticalCTA**
   - Обновить ConsultationCTA → VerticalCTA
   - Добавить на страницы: /yachts, /tours, /transport, /legal...

### Фаза 2: Интеграция (следующий спринт)

5. **AI Auto-routing**
   - AI определяет вертикаль по свободному тексту
   - Маршрутизация на нужного менеджера

6. **MCC Lead Hub Integration**
   - Единый дашборд для всех вертикалей
   - Фильтры по vertical_id
   - Статистика по источникам

7. **WhatsApp/Telegram Bot**
   - Приём заявок через мессенджеры
   - Сохранение в consultation_requests с lead_source='chat'

### Фаза 3: Оптимизация

8. **Smart Suggestions**
   - Предложения на основе истории просмотров
   - "Вы смотрели виллы в Раваи — нужна помощь с выбором?"

9. **Lead Scoring по вертикалям**
   - Разные веса для разных вертикалей
   - Приоритизация hot-leads

## Файлы для создания/изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `migration` | Создать | Расширение consultation_requests |
| `src/lib/leadVerticalConfig.ts` | Создать | Конфиг полей по вертикалям |
| `src/components/fab/UniversalHelpFAB.tsx` | Создать | Глобальная FAB-кнопка помощи |
| `src/components/leads/UniversalLeadForm.tsx` | Создать | Универсальная форма заявки |
| `src/components/leads/VerticalCTA.tsx` | Создать | CTA для страниц вертикалей |
| `src/hooks/useUniversalLead.ts` | Создать | Хук для работы с лидами |
| `src/hooks/useConsultationRequests.ts` | Обновить | Добавить новые типы |
| `src/pages/property/PropertyConsultation.tsx` | Обновить | Использовать UniversalLeadForm |

## Визуальный результат

### До (сейчас):
- Кнопка консультации только на /property
- Форма только для недвижимости
- Яхты, туры, транспорт — без точки входа

### После:
- FAB "Помощь" на всех страницах
- Единая форма для 19+ вертикалей
- Контекстные CTA на каждой странице вертикали
- Единый Lead Hub в админке для всех заявок

## Ожидаемый эффект

- **+40-60% конверсия** в заявки (доступность на всех страницах)
- **-80% хаос** (единая таблица вместо разрозненных)
- **+100% покрытие** (все вертикали имеют точку входа)
- **Полная трассировка** (откуда пришёл лид, что смотрел)
