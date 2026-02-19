
# Отчёты об управлении для УК и собственников

## Анализ текущего состояния

Система отчётов (`/owner/reports`) уже работает для **собственников**, но имеет три критических ограничения для **УК (управляющих компаний)**:

| Проблема | Где | Критичность |
|---|---|---|
| `usePropertyReports` фильтрует только по `owner_id` — менеджер не видит отчёты | `usePropertyReports.ts` строка 110 | Высокая |
| RLS на INSERT не проверяет делегирование — менеджер не может создавать отчёты | `property_reports` политика INSERT | Высокая |
| Нет шаблона "Отчёт об управлении" с KPI для УК | Везде | Средняя |
| Нет агрегированного вида по портфелю объектов УК | `ReportsPage.tsx` | Средняя |
| Нет расписания автоматической отправки | `usePropertyReports.ts` | Низкая |

---

## Что будет реализовано

### 1. Исправление доступа УК к отчётам

**Файл:** `src/hooks/usePropertyReports.ts`

`usePropertyReports` будет расширен: помимо `owner_id = user.id` запрос будет проверять `property_delegates` (как уже сделано в `usePropertyFinancials`). Менеджер сможет видеть все отчёты по объектам, которыми управляет.

`useGenerateReport` будет передавать `generated_by = user.id` и не требовать совпадения `owner_id` — УК создаёт отчёт от имени собственника.

### 2. Исправление RLS на property_reports

**Миграция БД**

Текущая политика `INSERT` не имеет `WITH CHECK` — добавим условие, разрешающее создание отчёта если пользователь является делегатом с разрешением `financials`:

```sql
DROP POLICY IF EXISTS "Users can create reports for their properties" ON property_reports;

CREATE POLICY "Owners and managers can create reports"
ON property_reports FOR INSERT
WITH CHECK (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1 FROM property_delegates pd
    WHERE pd.property_id = property_reports.property_id
      AND pd.user_id = auth.uid()
      AND pd.status = 'active'
      AND (pd.permissions->>'financials')::boolean = true
  )
);
```

Также исправим политику SELECT — текущий ключ `financial` (без `s`) не соответствует ключу `financials` используемому в коде:

```sql
-- Унифицировать ключ: financial → financials
```

### 3. Новый шаблон: "Отчёт об управлении"

**Новый тип отчёта:** `management`

**Новый файл:** `src/components/owner/reports/ManagementReportDetail.tsx`

Этот компонент показывает:
- Заполняемость объекта (%) с графиком по неделям
- Список выполненных работ (уборки, ремонты, сервисные вызовы)
- Расходы УК: комиссия, управленческие работы
- Чистый доход собственника после вычета комиссии УК
- Сравнение с прошлым периодом (MoM)
- Рекомендации (из поля `recommendations` в `ReportData`)

**Расширение типа:** добавить `'management'` к `ReportType`

### 4. Агрегированный портфельный вид для УК

**Файл:** `src/pages/owner/ReportsPage.tsx`

Если пользователь является менеджером (есть делегирования), добавить вкладку **"Портфель"** ("Portfolio"), которая показывает:
- Суммарный доход по всем управляемым объектам за выбранный период
- Таблицу: объект → доход → расходы → заполняемость → чистый доход
- Кнопку "Сформировать сводный PDF" — один PDF с таблицей по всем объектам

### 5. Расписание автоотправки (опционально по кнопке)

**Файл:** `src/pages/owner/ReportsPage.tsx`

Добавить кнопку **"Настроить автоотправку"** (Schedule). Это простой UI с:
- Выбором периодичности: ежемесячно / ежеквартально
- Полем email получателя (по умолчанию — email собственника)
- Сохранением в `property_reports` с флагом `auto_send: true` в поле `data`

(Без cron-а — УК нажимает "Отправить за месяц" одним кликом, выбирая объект)

---

## Технические детали

### Файлы и изменения

```text
БД (миграция):
  - Исправить INSERT RLS policy на property_reports
  - Исправить ключ financial → financials в SELECT policy

src/hooks/usePropertyReports.ts:
  - usePropertyReports() → добавить JOIN через property_delegates
  - useGenerateReport() → не требовать owner_id === user.id (разрешить менеджеру)
  - Добавить тип 'management' к ReportType

src/pages/owner/ReportsPage.tsx:
  - Добавить вкладку "Портфель" для УК/менеджеров
  - Показывать управляемые объекты в селекторе
  - Кнопка генерации сводного PDF

src/components/owner/reports/ManagementReportDetail.tsx (новый):
  - Шаблон для отчёта типа 'management'
  - KPI: заполняемость, работы, комиссия УК, чистый доход собственника

src/utils/generateReportPdf.ts:
  - Добавить шаблон PDF для management-отчёта
  - Добавить секцию "Работы и обслуживание"
  - Строку "Комиссия УК" и "Доход собственника"
```

### Порядок реализации

1. Миграция БД (исправить RLS) — без этого УК вообще не может создавать отчёты
2. Исправить `usePropertyReports` — дать доступ для чтения
3. Добавить тип `management` и шаблон `ManagementReportDetail`
4. Добавить вкладку "Портфель" в `ReportsPage`
5. Расширить PDF-генератор для management-отчёта
