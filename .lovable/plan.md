

# UNO как единая система управления для агента на Пхукете: аудит и план развития

## Сценарий: Агент с 50 объектами

Представим реального агента: 50 объектов на управлении, продажи + аренда, сотрудники (клинеры, мастера), поставщики, десятки контактов, коммунальные платежи, отчёты собственникам. Оценим каждую боль.

---

## Что UNO уже решает (СИЛЬНЫЕ СТОРОНЫ)

| Боль агента | Решение в UNO | Оценка |
|---|---|---|
| Контакты разбросаны | CRM-модуль с досье, историей сделок, pipeline Kanban | 9/10 |
| Бронирования хаотичны | Airbnb-style календарь, синхронизация iCal, Channel Manager | 9/10 |
| Финансы непрозрачны | property_financials с 20+ категориями, прогноз cash flow на 3 мес. | 8/10 |
| Нет операционного контроля | OwnerOperations с задачами today/upcoming/completed, привязка к объектам | 8/10 |
| Отчёты собственникам | Генерация PDF-отчётов (jsPDF), отправка по email, тип "management" для УК | 8/10 |
| Учёт сотрудников | StaffPage с реестром, типами оплаты (salary/daily/per_task), привязка расходов к cost_source | 7/10 |
| Условия управления | property_management_terms с комиссиями, распределением ответственности за 9 категорий | 8/10 |
| Контракты с поставщиками | provider_contracts с commission_rate, статусами, документами | 7/10 |
| Шаблоны расходов | ExpenseTemplates для быстрого ввода (электричество, вода, уборка) | 8/10 |
| Делегирование прав | property_delegates с гранулярными permissions (financials, calendar...) | 7/10 |

---

## Критические пробелы (ЧТО НУЖНО ДОБАВИТЬ)

### GAP 1: Генерация инвойсов для арендаторов/собственников
**Боль**: Агент не может выставить счёт арендатору за электричество или собственнику за комиссию. Нет системы инвойсов вообще.

**Текущее состояние**: Поле `invoice_number` в `property_financials` -- просто текстовое поле для ручного ввода. Нет генерации, нет PDF-инвойсов, нет нумерации.

**Решение**:
- Создать таблицу `owner_invoices` (номер, тип: tenant/owner, items, total, status: draft/sent/paid/overdue, due_date)
- Компонент `InvoiceBuilder.tsx` -- выбор объекта, добавление строк (аренда, электричество, вода, уборка), автоматический расчёт
- Генерация PDF через jsPDF (уже установлен) с брендингом УК
- Отправка по email через существующий Resend-интеграцию
- Автоматическое создание инвойса при checkout/заселении

### GAP 2: Напоминания об оплате коммунальных услуг
**Боль**: "Забываешь оплатить свет" -- нет автоматических напоминаний о recurring платежах.

**Текущее состояние**: Есть поля `recurring`, `recurring_interval`, `due_date` в `property_financials`, но нет Edge Function для напоминаний.

**Решение**:
- Создать Edge Function `utility-payment-reminders` -- ежедневный cron, проверяет `due_date` за 3 и 1 день, отправляет push/email
- В OwnerDashboard добавить виджет "Предстоящие платежи" с красными маркерами для просроченных
- Автоматическое создание recurring записей (копирование по интервалу)

### GAP 3: Защита контактной базы от кражи сотрудниками
**Боль**: "Работники воруют контакты"

**Текущее состояние**: CRM-контакты привязаны к `company_id` через RLS, но нет аудит-лога доступа, нет ограничения экспорта, нет маскирования телефонов.

**Решение**:
- Таблица `crm_access_log` -- логирование просмотра/экспорта контактов (кто, когда, какие)
- Гранулярные роли в `management_company_members`: `can_view_contacts`, `can_export_contacts`, `can_see_phone`
- Маскирование телефонов для ролей без `can_see_phone` (показывать +66***1234)
- Водяные знаки в CSV-экспорте (имя сотрудника + дата)
- Уведомление менеджеру при массовом просмотре (>20 контактов за час)

### GAP 4: Оценка и рейтинг поставщиков услуг
**Боль**: "Некоторые поставщики плохо работают"

**Текущее состояние**: `provider_contracts` хранит условия, но нет системы оценки качества работы поставщиков.

**Решение**:
- Таблица `vendor_performance_reviews` (vendor_id, property_id, task_id, score 1-5, categories: quality/speed/communication, notes)
- Автоматический запрос оценки после завершения operational_task
- Агрегированный scorecard на странице поставщика
- Алерт менеджеру при среднем рейтинге ниже 3.0

### GAP 5: CRM-задачи с напоминаниями (follow-ups)
**Боль**: Забываешь перезвонить клиенту, пропускаешь follow-up по сделке.

**Текущее состояние**: `operational_tasks` существуют для property-задач (уборка, ремонт), но нет CRM-задач (звонок клиенту, отправить документы, follow-up).

**Решение**:
- Таблица `crm_tasks` (contact_id?, deal_id?, title, due_date, reminder_at, priority, status, assigned_to)
- Виджет "Мои задачи сегодня" на главном экране Owner
- Push-напоминания через существующую систему уведомлений
- Автосоздание задач при смене стадии сделки (например: "Отправить договор" при переходе в "Negotiation")

### GAP 6: Шаблоны документов (договоры аренды, акты)
**Боль**: Для каждого арендатора нужно вручную заполнять договор.

**Текущее состояние**: Нет системы шаблонов документов.

**Решение**:
- Таблица `document_templates` (name, type: lease/handover_act/invoice, content_template, variables)
- Генератор документов с подстановкой переменных (имя, даты, суммы, адрес)
- Предустановленные шаблоны: Lease Agreement (EN/RU/TH), Check-in/Check-out Act, Damage Report
- Генерация PDF и отправка на подпись

---

## Порядок реализации

| Приоритет | Gap | Сложность | Влияние на бизнес |
|---|---|---|---|
| P0 | GAP 1: Инвойсы | Высокая | Критично -- агент теряет деньги |
| P0 | GAP 2: Напоминания о платежах | Средняя | Критично -- забытые счета = штрафы |
| P1 | GAP 5: CRM-задачи | Средняя | Высокое -- потеря сделок |
| P1 | GAP 4: Рейтинг поставщиков | Низкая | Среднее -- качество сервиса |
| P2 | GAP 3: Защита контактов | Средняя | Среднее -- безопасность |
| P2 | GAP 6: Шаблоны документов | Высокая | Среднее -- экономия времени |

---

## Технические детали реализации

### Таблица owner_invoices
```text
owner_invoices:
  id: uuid PK
  company_id: uuid FK -> management_companies
  property_id: uuid FK -> owner_properties
  invoice_number: text (auto: INV-2026-0001)
  invoice_type: enum (tenant_billing, owner_report, service_fee)
  recipient_name: text
  recipient_email: text
  items: jsonb [{description, quantity, unit_price, amount}]
  subtotal: numeric
  tax_rate: numeric (default 0)
  tax_amount: numeric
  total: numeric
  currency: text (default THB)
  status: enum (draft, sent, paid, overdue, cancelled)
  issued_date: date
  due_date: date
  paid_date: date
  notes: text
  pdf_url: text
  created_by: uuid
  created_at: timestamptz
```

### Edge Function: utility-payment-reminders
```text
Cron: daily at 09:00 ICT
Logic:
  1. SELECT * FROM property_financials 
     WHERE recurring = true AND status = 'pending' 
     AND due_date BETWEEN now() AND now() + interval '3 days'
  2. For each: send push notification to owner_id
  3. For overdue (due_date < now()): send urgent email
  4. Auto-create next recurring entry if current one is completed
```

### Защита контактов -- маскирование
```text
Phone masking for restricted roles:
  Full: +66 812 345 678
  Masked: +66 8** *** *78

CSV watermark:
  Header row: "Exported by: {employee_name} on {date}"
  Footer row: "Confidential — {company_name}"
```

---

## Итоговая оценка: может ли UNO стать единой системой?

**Сейчас UNO покрывает ~70% потребностей агента с 50 объектами.**

Сильнейшие стороны: CRM + Pipeline, Финансовый учёт, Операционные задачи, Календарь, Отчёты.

После реализации 6 gap'ов покрытие вырастет до ~90%, что сделает UNO полноценной альтернативой связке "Excel + WhatsApp + отдельная CRM + бухгалтер".

Оставшиеся 10% -- это deep accounting (полноценный бухучёт по тайским стандартам), юридическое сопровождение и банковская интеграция для автоплатежей, которые требуют сторонних интеграций.
