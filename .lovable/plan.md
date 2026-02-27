
# Аудит myUNO: Слабые места и план доработок для малой УК

## 1. ОБЪЕКТЫ И ПОРТФЕЛЬ

### Что есть
- Список объектов с фильтрами, карточка объекта (6 табов), MultiPropertyTimeline (30 дней), PropertyStatusSnapshot (ключи + коммуналка)
- Управление ключами (property_key_assignments), коммунальные платежи (property_utility_schedules)

### Слабые места
- **Нет единого "здоровья объекта"** -- PropertyStatusSnapshot показывает ключи и утилиты, но не агрегирует: документы (просрочена страховка?), задолженности владельца, открытые задачи, последняя инспекция. Менеджер не может за 3 секунды понять "всё ли ок с объектом"
- **Нет чеклиста заезда/выезда** -- CreateServiceTaskDialog создает задачи check_in/check_out, но нет формализованного чеклиста с пунктами и фото-подтверждениями (кран работает, кондиционер чист, полотенца на месте)
- **Нет журнала показаний счётчиков** -- utility_schedules хранит last_paid_date, но не историю показаний (meter readings). Нужно для расчётов с владельцем и PEA
- **Инвентарь не привязан к чеклисту** -- Inventory существует отдельно, но при заезде/выезде не проверяется автоматически

### Что добавить
1. **Property Health Score** -- композитный компонент: % документов в порядке, 0 просроченных платежей, 0 открытых задач = зелёный; иначе жёлтый/красный
2. **Чеклист заезда/выезда** -- таблица `property_checklists` (template) + `checklist_completions` (факт с фото). Привязка к бронированию
3. **Журнал показаний счётчиков** -- таблица `meter_readings` (property_id, utility_type, reading_value, photo_url, recorded_at, recorded_by)

---

## 2. БРОНИРОВАНИЯ И КАЛЕНДАРЬ

### Что есть
- Полноценный CRUD бронирований через orders, MultiPropertyTimeline, BookingCalendar, BookingDetailSheet
- iCal sync (Airbnb, Booking.com), AddBookingFromCalendarDialog, статусы и участники

### Слабые места
- **Нет автоматической генерации задач при бронировании** -- в GuidePropertyCare описано ("система автоматически создаёт задачи"), но реального триггера/функции нет. Создание cleaning/check_in/check_out задач -- ручное
- **Нет timeline уборок** -- менеджер не видит "какие квартиры нужно убрать сегодня" в одном месте. Уборки разбросаны по задачам
- **Booking gap analysis отсутствует** -- нет отчёта "пустые ночи между бронированиями" для оптимизации заполняемости
- **Нет fast-track бронирования с мобильного** -- QuickExpense есть, но Quick Booking (имя, даты, сумма, объект) -- нет

### Что добавить
1. **Auto-task trigger** -- при создании/подтверждении бронирования автоматически создавать задачи: cleaning (за день до заезда), check_in, check_out
2. **Cleaning Dashboard** -- виджет "Уборки сегодня/завтра" с группировкой по объектам и статусом (назначена/в процессе/готово)
3. **Occupancy gap report** -- показывать пустые промежутки между бронированиями для каждого объекта

---

## 3. ФИНАНСЫ И ОТЧЁТЫ

### Что есть
- OwnerFinancials: доходы/расходы, CSV/Excel экспорт, графики, прогноз
- QuickExpense с фото чека, категории, повторяющиеся платежи
- FinancialStatsCards, CashFlowForecast, Budget tracking
- Ledger system (double-entry), MC commission splits

### Слабые места
- **Нет P&L по объекту за период** -- Revenue Dashboard показывает общие метрики, но владелец хочет видеть "Villa Sunrise: доход 120K, расход 45K, чистая прибыль 75K, комиссия УК 18K" за конкретный месяц
- **Нет отчёта для владельца "в один клик"** -- ReportSettingsSheet настраивает автоотправку, но нет PDF-генерации месячного отчёта с разбивкой
- **Нет сверки расходов** -- менеджер записал расход, но нет workflow подтверждения владельцем (approve/reject)
- **Нет dashboard KPI для принятия решений** -- Occupancy Rate, ADR, RevPAR показаны в OwnerRevenueDashboard, но без сравнения с прошлым месяцом/годом и без бенчмарков

### Какие отчёты нужны
1. **Месячный P&L по объекту** -- доход, расходы по категориям, комиссия УК, чистый доход владельца. PDF-экспорт
2. **Портфельный отчёт** -- все объекты сводно: заполняемость, доходность, проблемные объекты
3. **Сверка расходов для владельца** -- лист расходов с чеками на approve/reject
4. **Сравнительная аналитика** -- месяц к месяцу, год к году по ключевым KPI

### Что добавить
1. **Property P&L component** -- генерация отчёта по объекту за выбранный период с PDF-экспортом
2. **Expense approval workflow** -- статус расхода: pending_owner_approval -> approved/rejected. Уведомление владельцу
3. **KPI comparison** -- delta vs прошлый месяц на каждом KPI-виджете

---

## 4. ЗАДАЧИ И ОПЕРАЦИИ

### Что есть
- UnifiedTaskHub: CRM + Operations в 3 табах, TaskSummaryKPIs, TaskDetailSheet
- property_operational_tasks + crm_tasks, назначение на сотрудников
- CreateServiceTaskDialog (cleaning, maintenance, inspection, meter_reading, check_in, check_out)

### Слабые места
- **Нет SLA/дедлайнов с эскалацией** -- задача может висеть вечно, нет автоэскалации "не выполнено за 24ч -> уведомление менеджеру"
- **Нет повторяющихся задач** -- уборка общих зон, проверка бассейна -- всё создается вручную
- **Нет привязки задачи к бронированию** -- уборка "для заезда Ивана 1 марта" не связана с конкретным бронированием
- **Нет фото-отчёта по задаче** -- сотрудник не может прикрепить фото "уборка выполнена"

### Что добавить
1. **Recurring tasks** -- шаблоны повторяющихся задач (ежедневно, еженедельно, ежемесячно) с автогенерацией
2. **Task photo proof** -- поле photo_urls[] в задаче, обязательное для завершения cleaning/inspection
3. **Booking-linked tasks** -- связь задачи с order_id для трейсабельности
4. **SLA & escalation** -- настраиваемые правила: "если задача не выполнена за N часов, уведомить X"

---

## 5. КОМАНДА И БЕЗОПАСНОСТЬ

### Что есть
- StaffPage: CRUD сотрудников, роли (cleaner, maintenance, manager, admin, staff)
- team_member_permissions: гранулярные права по модулям (view/edit)
- MemberPermissionsSheet, MemberActivitySheet
- contactProtection.ts: маскирование телефонов/email
- team_activity_log: логирование действий
- Водяные знаки на CSV-экспортах

### Слабые места
- **Нет матрицы ответственности** -- кто за какой объект отвечает видно только через staff_property_assignments, но нет сводного вида "объект -> ответственный менеджер + клинер + техник"
- **Нет ограничения на экспорт контактов** -- маскирование есть, но нет запрета на скачивание базы контактов для определённых ролей
- **Нет NDA/трудового договора в системе** -- документы сотрудников есть (VendorDocumentsTab), но нет обязательного подписания NDA при приёме
- **team_activity_log неполный** -- логируются не все действия, нет dashboard для руководителя "что делал сотрудник сегодня"
- **Нет разделения данных между сотрудниками** -- менеджер A видит объекты менеджера B. Для малой УК это нормально, но для растущей -- риск

### Защита от воровства данных
1. **Export restrictions** -- запретить экспорт CRM контактов для ролей ниже director. Водяные знаки уже есть -- хорошо
2. **Session logging** -- расширить team_activity_log: логировать просмотры контактов, скачивание файлов, экспорт
3. **Data scope by assignment** -- опциональный режим: сотрудник видит только свои назначенные объекты и их контакты
4. **Обязательное подписание Terms при приёме** -- интегрировать с уже созданной legal_documents системой: при добавлении сотрудника -- обязательное принятие NDA

### Что добавить
1. **Responsibility matrix widget** -- на дашборде: объект -> кто отвечает, с быстрым переназначением
2. **Employee scorecard** -- количество выполненных задач, среднее время выполнения, рейтинг от гостей
3. **Granular export permissions** -- в team_member_permissions добавить can_export boolean

---

## 6. КОММУНИКАЦИИ (WhatsApp, Telegram, Team Space)

### Что есть
- OwnerMessages: внутренний чат с гостями (property_chat_messages)
- WhatsApp/Telegram ссылки для быстрой связи (UnifiedChatFAB, StaffCard)
- Message templates (OwnerAutoMessaging, BookingMessageRules)
- CRM контакты хранят whatsapp, telegram поля

### Слабые места
- **Нет интеграции с WhatsApp Business API** -- только wa.me ссылки, нет входящих/исходящих сообщений в системе. Вся переписка теряется в личных чатах
- **Нет внутреннего командного чата** -- сотрудники общаются в WhatsApp группах, информация не структурирована
- **Нет привязки сообщений к объекту/задаче** -- контекст теряется

### Нужен ли Team Space?
**Да, но в минимальном виде.** Для малой УК (2-5 человек) полноценный чат избыточен. Нужно:

### Что добавить
1. **Property-level notes/comments** -- уже есть PropertyNotesTab, но сделать его "живой лентой" с @mentions сотрудников и push-уведомлениями
2. **Task comments** -- возможность обсуждать задачу в контексте (комментарии к задаче)
3. **WhatsApp Business integration (P2)** -- через connector. Входящие сообщения от гостей попадают в Unified Inbox, исходящие отправляются из системы
4. **Quick notify team** -- кнопка "Уведомить команду" по объекту/задаче -> push/WhatsApp/Telegram

---

## 7. UX: ЧУВСТВО СИСТЕМЫ И КОНТРОЛЯ

### Текущие проблемы
- **Дашборд перегружен** -- 13+ виджетов для property_manager. Менеджер с 15 объектами тонет в информации
- **Навигация: 5 групп, 20+ пунктов** -- слишком много для ежедневной работы
- **Нет "Morning Briefing"** -- TodayBriefingWidget показывает заезды/выезды, но не даёт полную картину дня: сколько уборок, какие платежи, что просрочено
- **Нет notification center** -- уведомления разрозненны, нет единого места "что требует внимания"

### Что сделать для чувства контроля
1. **Morning Dashboard** -- при входе показывать: "Сегодня: 2 заезда, 1 выезд, 3 уборки, 1 просроченный платёж PEA, 2 задачи". Одно предложение = полная картина
2. **Action-required badge** -- красная точка на сайдбаре показывает количество элементов требующих действия
3. **Property health grid** -- вместо списка объектов показывать сетку карточек со светофором (зелёный/жёлтый/красный)
4. **Weekly digest email** -- автоматическая сводка за неделю: занятость, доход, проблемы

---

## 8. СВОДНАЯ ТАБЛИЦА ПРИОРИТЕТОВ

### P0 -- Критично (влияет на ежедневную работу)

| Задача | Компонент | Сложность |
|--------|-----------|-----------|
| Чеклист заезда/выезда с фото | Новые таблицы + UI | Средняя |
| Auto-task trigger при бронировании | Edge function / DB trigger | Средняя |
| Cleaning dashboard (уборки сегодня) | Новый виджет | Низкая |
| Property P&L отчёт по объекту | Новый компонент + PDF | Средняя |
| Morning briefing (единая сводка дня) | Рефактор TodayBriefingWidget | Низкая |
| Task photo proof | Расширение схемы + UI | Низкая |

### P1 -- Важно (улучшает контроль)

| Задача | Компонент | Сложность |
|--------|-----------|-----------|
| Recurring tasks | Шаблоны + cron | Средняя |
| Property Health Score | Агрегирующий компонент | Средняя |
| Expense approval workflow (для владельца) | Статусы + уведомления | Средняя |
| Responsibility matrix | Виджет | Низкая |
| Export restrictions по ролям | Расширение permissions | Низкая |
| Task comments | Новая таблица + UI | Низкая |

### P2 -- Стратегические (масштабирование)

| Задача | Компонент | Сложность |
|--------|-----------|-----------|
| WhatsApp Business API | Connector + Edge function | Высокая |
| Meter readings journal | Таблица + UI | Низкая |
| KPI comparison (MoM/YoY) | Аналитика | Средняя |
| Employee scorecard | Агрегация данных | Средняя |
| Weekly digest email | Edge function + cron | Средняя |
| Booking gap analysis | Отчёт | Низкая |

---

## Технические детали реализации P0

### Новые таблицы

```sql
-- Checklist templates
CREATE TABLE property_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type text NOT NULL CHECK (checklist_type IN ('check_in','check_out','cleaning','inspection')),
  items jsonb NOT NULL DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Checklist completions
CREATE TABLE checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES property_checklist_templates(id),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id uuid,
  task_id uuid,
  completed_by uuid REFERENCES auth.users(id),
  items jsonb NOT NULL DEFAULT '[]',
  photos text[] DEFAULT '{}',
  notes text,
  completed_at timestamptz DEFAULT now()
);

-- Meter readings
CREATE TABLE meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  reading_value numeric NOT NULL,
  photo_url text,
  recorded_by uuid REFERENCES auth.users(id),
  recorded_at timestamptz DEFAULT now()
);

-- Task comments
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  task_source text NOT NULL CHECK (task_source IN ('crm','ops')),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Модифицируемые таблицы
- `property_operational_tasks`: добавить `booking_id uuid`, `photo_proof text[]`, `recurring_rule jsonb`
- `team_member_permissions`: добавить `can_export boolean DEFAULT false`

### Новые компоненты
- `src/components/owner/checklists/ChecklistTemplate.tsx` -- управление шаблонами чеклистов
- `src/components/owner/checklists/ChecklistCompletion.tsx` -- заполнение чеклиста с фото
- `src/components/owner/dashboard/CleaningDashboard.tsx` -- виджет уборок на сегодня
- `src/components/owner/dashboard/MorningBriefing.tsx` -- единая сводка дня
- `src/components/owner/reports/PropertyPnL.tsx` -- P&L по объекту
- `src/components/owner/tasks/TaskComments.tsx` -- комментарии к задаче
- `src/components/owner/property-detail/MeterReadings.tsx` -- журнал показаний

### Модифицируемые файлы
- `src/lib/businessRoles.ts` -- добавить cleaning_dashboard и morning_briefing в виджеты property_manager
- `src/pages/owner/OwnerDashboard.tsx` -- зарегистрировать новые виджеты
- `src/components/owner/tasks/TaskDetailSheet.tsx` -- добавить секцию комментариев и фото
- `src/hooks/useTeamPermissions.ts` -- добавить can_export в интерфейс
- `src/pages/owner/OwnerPropertyDetail.tsx` -- добавить табы Checklists и Meter Readings
