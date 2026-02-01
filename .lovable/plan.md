
# UNO Property Care: Детальный план улучшения модуля собственника

## Текущее состояние системы

### Что уже реализовано
- **Система делегирования** (`property_delegates`): 4 роли (trustee, agent, manager, management_company) с настраиваемыми правами
- **Приглашения** (`property_ownership_invites`): передача владения и делегирование с баннером для pending-приглашений
- **Финансы**: доходы/расходы с категориями, CSV экспорт, графики, просмотр чеков
- **Документы**: коды доступа, юридические документы с трекингом сроков

### Критические пробелы
1. **Нет "обратного" приглашения** — УК не может добавить объект от имени собственника
2. **Нет отчётов** — только CSV экспорт без сводных отчётов
3. **Нет привязки чеков к документам** — receipt_url есть, но OCR/парсинга нет
4. **UX перегружен** — 29 страниц, 14 пунктов сайдбара

---

## Архитектура решения

### Новая модель взаимоотношений

```text
+-------------------+     invites     +-------------------+
|   Property Owner  |<--------------->| Management Company|
+-------------------+                 +-------------------+
         |                                      |
         | owns/delegates                       | manages
         v                                      v
+-------------------+                 +-------------------+
|  owner_properties |<--------------->|  property_access  |
+-------------------+                 +-------------------+
         |                                      |
         |                                      |
         v                                      v
+--------+--------+--------+--------+--------+--------+
|Bookings|Finances|Documents|Team   |Reports |Activity|
+--------+--------+--------+--------+--------+--------+
```

---

## Фаза 1: Расширение системы совместного доступа

### 1.1 Двунаправленные приглашения

**Таблица `property_management_requests`:**

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid | PK |
| property_id | uuid | FK -> owner_properties (null если новый объект) |
| requester_id | uuid | Кто запрашивает |
| requester_type | enum | 'owner', 'manager', 'agency' |
| target_email | text | Email получателя |
| request_type | enum | 'add_property', 'request_management', 'transfer_ownership' |
| proposed_terms | jsonb | Условия сотрудничества |
| status | enum | pending, accepted, declined, expired |
| created_at, expires_at | timestamp | Сроки действия |

**Сценарии использования:**
- Собственник приглашает УК управлять объектом
- УК создаёт объект от имени собственника → собственник подтверждает
- Собственник передаёт владение другому лицу

### 1.2 Улучшенный UI приглашений

**Компонент `ManagementInviteFlow`:**
- Wizard из 3 шагов: Выбор роли → Условия → Подтверждение
- Предпросмотр прав доступа до отправки
- Email-уведомления через Edge Function

---

## Фаза 2: Система отчётности

### 2.1 Генератор отчётов

**Новая таблица `property_reports`:**

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid | PK |
| property_id | uuid | FK |
| owner_id | uuid | Для кого отчёт |
| report_type | enum | monthly, quarterly, annual, custom |
| period_start, period_end | date | Период |
| data | jsonb | Структурированные данные |
| pdf_url | text | Ссылка на PDF |
| status | enum | draft, sent, viewed |
| sent_at, viewed_at | timestamp | Трекинг |

**Структура `data`:**
```text
{
  income: { total, by_category: {...} },
  expenses: { total, by_category: {...} },
  occupancy: { nights_booked, total_nights, rate },
  bookings: [{ guest, dates, amount }],
  maintenance: [{ type, cost, date }],
  highlights: ["Лучший месяц за год", ...],
  recommendations: [...]
}
```

### 2.2 Компоненты отчётов

**Страница `/owner/reports`:**
- Список отчётов с фильтрацией
- Кнопка "Сгенерировать" → выбор периода → PDF
- Автоматическая рассылка (настраивается в Settings)

**Компонент `ReportPreview`:**
- Визуализация данных до генерации PDF
- Возможность добавить комментарий

### 2.3 Edge Function `generate-report`

Логика:
1. Собрать данные за период (financials, bookings, maintenance)
2. Рассчитать метрики (occupancy rate, ROI, MoM change)
3. Сгенерировать PDF через @react-pdf/renderer
4. Загрузить в Storage
5. Отправить email владельцу (если настроено)

---

## Фаза 3: Управление документами и чеками

### 3.1 Расширение модели документов

**Добавить колонки в `property_financials`:**

| Колонка | Тип | Описание |
|---------|-----|----------|
| receipt_metadata | jsonb | Данные OCR (vendor, date, items) |
| verification_status | enum | pending, verified, rejected |
| verified_by | uuid | Кто подтвердил |

### 3.2 Улучшенный загрузчик чеков

**Компонент `ReceiptUploadWithOCR`:**
- Drag & drop или камера
- OCR через AI (gemini-2.5-flash)
- Автозаполнение полей: сумма, дата, категория, вендор
- Связь с конкретным расходом

### 3.3 Галерея документов

**Улучшения `PropertyDocumentsTab`:**
- Превью изображений в grid-view
- Bulk upload
- Фильтр по типу, статусу, дате
- Напоминания об истечении сроков (push + banner)

---

## Фаза 4: Упрощение UX

### 4.1 Консолидация навигации

**Текущее (14 пунктов) → Целевое (7 пунктов):**

```text
MAIN (всегда открыт)
├── Dashboard (обзор + виджеты)
├── Properties (объекты + быстрые действия)
└── Calendar (объединить с Operations)

MONEY
├── Financials (доходы/расходы + reports)
└── Documents (чеки + юр.документы)

TEAM
├── My Team (делегаты + приглашения)
└── Settings (профиль + уведомления)
```

### 4.2 Dashboard Hub

**Принцип**: Dashboard — точка входа для ВСЕХ действий

**Секции:**
1. **Today** — задачи дня, check-in/out, срочные
2. **Properties** — карточки с быстрыми действиями
3. **Finances** — сводка + Quick Expense
4. **Team** — приглашения + активность команды
5. **Reports** — pending отчёты, напоминания

### 4.3 Onboarding Tour

**Интеграция driver.js для новых пользователей:**

Шаги тура:
1. "Добавьте первый объект" → кнопка Add Property
2. "Настройте условия аренды" → Terms tab
3. "Пригласите управляющего" → Team tab
4. "Добавьте расход" → Quick Expense

---

## Фаза 5: Технический рефакторинг

### 5.1 Разбиение AddProperty.tsx (1200 строк)

**Новая структура:**
```text
src/components/owner/property-wizard/
├── index.ts
├── usePropertyWizard.ts (стейт + логика)
├── steps/
│   ├── BasicInfoStep.tsx
│   ├── LocationStep.tsx
│   ├── PhotosStep.tsx
│   ├── RentalTermsStep.tsx
│   ├── HouseRulesStep.tsx
│   ├── OwnershipStep.tsx
│   └── ReviewStep.tsx
├── components/
│   ├── WizardProgress.tsx
│   └── StepNavigation.tsx
└── schemas/
    └── propertySchema.ts (zod)
```

### 5.2 Унификация хуков

**Создать `usePropertyManagement`:**
- Объединяет usePropertyOwnership + usePropertyDelegates
- Single source of truth для прав доступа
- Мемоизированные проверки разрешений

### 5.3 RLS политики

**Обновить для поддержки делегатов:**
```sql
CREATE POLICY "Delegates can view properties"
ON owner_properties FOR SELECT
USING (
  owner_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM property_delegates 
    WHERE property_id = owner_properties.id 
    AND user_id = auth.uid() 
    AND status = 'active'
    AND (permissions->>'view')::boolean = true
  )
);
```

---

## Очередность реализации

| Приоритет | Задача | Сложность | Время |
|-----------|--------|-----------|-------|
| P0 | Консолидация навигации (сайдбар) | Низкая | 2-3ч |
| P0 | Двунаправленные приглашения | Средняя | 4-5ч |
| P1 | Система отчётов (UI + Edge) | Высокая | 6-8ч |
| P1 | Receipt OCR интеграция | Средняя | 3-4ч |
| P2 | Рефакторинг AddProperty | Средняя | 4-5ч |
| P2 | Onboarding tour | Низкая | 2ч |
| P3 | Mobile bottom navigation | Низкая | 2ч |

---

## Миграции базы данных

### Новые таблицы
1. `property_management_requests` — двунаправленные приглашения
2. `property_reports` — сгенерированные отчёты

### Модификации
1. `property_financials` — добавить receipt_metadata, verification_status
2. `property_delegates` — добавить notification_preferences

### Новые Edge Functions
1. `generate-report` — генерация PDF отчётов
2. `ocr-receipt` — распознавание чеков через AI
3. `send-report-email` — рассылка отчётов

---

## Ключевые UX-принципы

1. **Прозрачность** — все действия команды видны в Activity Log
2. **Простота** — максимум 3 клика до любого действия
3. **Контроль** — собственник всегда видит кто и что делает
4. **Автоматизация** — отчёты генерируются автоматически

Этот план превратит UNO в полноценную "One Stop Shop" систему для управления недвижимостью за рубежом с прозрачностью на уровне профессиональных управляющих компаний.
