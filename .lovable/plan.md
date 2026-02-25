

# Аудит блока управления недвижимостью

## 1. Что сделано хорошо

- **Command Center**: Структура дашборда логичная — Today Briefing -> Today Actions -> KPI -> виджеты. Правильная приоритизация.
- **KPI**: Включены индустриальные метрики (ADR, RevPAR, Occupancy, Margin). Сравнение с прошлым месяцем.
- **Календарь**: Два режима (single/multi), группировка по комплексам, iCal-синхронизация.
- **Финансы**: Полноценный модуль — список, графики, прогноз, CSV/Excel экспорт, бюджетирование.
- **Кадры**: Развитая StaffPage с фильтрами, ролями, зарплатами, назначениями на объекты.
- **CRM**: Полный цикл — Kanban, контакты, задачи, настраиваемые этапы.
- **Билингвальность**: Все модули поддерживают RU/EN.

## 2. Критические проблемы

### 2.1 Дублирование отчётов (3 страницы делают почти одно и то же)

| Страница | Путь | Что делает |
|---|---|---|
| `ReportsPage` | `/owner/reports` | Генерация отчётов (monthly/quarterly/annual/P&L/owner statement), PDF, Excel, Email, Portfolio view |
| `OwnerReportsPage` | `/owner/owner-reports` | Простой расчёт Revenue/Expenses/ADR за месяц + Save |
| `OwnerRevenueDashboard` | `/owner/revenue` | Revenue + Occupancy + ADR + RevPAR графики, прогноз 3 мес, per-property breakdown |

**Проблема**: Пользователь не понимает куда идти. `OwnerReportsPage` — это упрощённый клон `ReportsPage`. `OwnerRevenueDashboard` — аналитика, а не отчёт, но KPI дублируют дашборд.

**Решение**: Объединить в одну страницу "Аналитика и отчёты" с табами: Обзор (метрики + графики из RevenueDashboard) | Отчёты (генерация/история из ReportsPage) | Бюджет (из BudgetPage). Удалить `OwnerReportsPage` как полностью дублирующую.

### 2.2 Дублирование команды (2 страницы)

| Страница | Путь | Что делает |
|---|---|---|
| `StaffPage` | `/owner/staff` | Сотрудники: создание, роли, зарплаты, назначения, фото, документы |
| `TeamPage` | `/owner/team` | Делегаты: приглашения, разрешения (view/edit/financials/bookings) |

**Проблема**: Для руководителя УК это один раздел "Команда". Разделение сбивает: куда добавить нового уборщика vs менеджера с доступом?

**Решение**: Объединить в одну страницу с табами: Сотрудники (текущий StaffPage) | Доступ и делегирование (текущий TeamPage) | Приглашения (incoming/outgoing).

### 2.3 Навигация "Финансы" перегружена (4 пункта)

Текущее:
- Income & Expenses (`/owner/financials`)
- Invoices (`/owner/invoices`)
- Reports (`/owner/reports`)
- Owner Reports (`/owner/owner-reports`)

Плюс скрытые: Budget (`/owner/budget`), Portfolio (`/owner/portfolio`), Revenue Dashboard (`/owner/revenue`) — доступны только через кнопки внутри страниц.

**Решение**: Сократить до 3 пунктов: Финансы (Income/Expenses + Invoices) | Аналитика (объединённые отчёты + revenue dashboard) | Бюджет.

### 2.4 Операции не структурированы логически

Текущая группа "Operations" содержит:
- Tasks (операционные задачи по объектам)
- Inventory (расходники)
- Vendors (поставщики)
- Reviews (отзывы с OTA)
- Rate Seasons (тарифы)
- Insurance & Docs (страховки)

**Проблема**: Reviews и Rate Seasons — это не операции, а коммерция/revenue management. Insurance — это compliance/документооборот.

**Решение**: Перегруппировать:
- **Операции**: Tasks, Inventory, Vendors, Maintenance Plan
- **Коммерция**: Rate Seasons, Reviews, Channel Sync (перенести из дашборда)
- **Документы**: Insurance & Docs, Document Templates

## 3. Что нужно доработать

### 3.1 Календарь не связан с операционным управлением
Календарь показывает бронирования и iCal, но не интегрирует: плановые уборки, техобслуживание, сроки страховок, оплаты. Руководителю нужен единый операционный календарь.

**Решение**: Добавить слой "operational overlay" в MultiPropertyTimeline — показывать иконки задач, срочных дедлайнов документов, плановых расходов прямо на таймлайне.

### 3.2 KPI дублируются между виджетами
`BusinessKPIWidget` загружает 11 запросов к базе. `TodayActionsWidget` загружает 5 частично совпадающих запросов (overdue tasks, service requests, low stock, pending invoices). Те же данные считаются отдельно в `OwnerRevenueDashboard` и `OwnerReportsPage`.

**Решение**: Создать единый хук `useDashboardMetrics()`, который делает один batch запросов и возвращает все метрики. Все виджеты подписываются на него через React Query.

### 3.3 Нет dashboard-level фильтра по объекту
На дашборде все виджеты показывают агрегат по всем объектам. Нет возможности быстро отфильтровать один объект и увидеть все его метрики.

**Решение**: Добавить Property Selector в header дашборда (глобальный контекст). При выборе объекта все виджеты фильтруются.

### 3.4 Today Actions ведут на несуществующие роуты
- `href: '/owner/tasks'` — нет такого роута (правильный: `/owner/operations`)
- `href: '/owner/inbox'` — нет такого роута (правильный: `/owner/messages`)

## 4. План реализации

### Фаза 1: Устранение дублирования и битых ссылок
1. Удалить `OwnerReportsPage` — его функционал полностью покрыт `ReportsPage`
2. Объединить `StaffPage` + `TeamPage` в единую страницу с табами
3. Исправить href в `TodayActionsWidget`: `/owner/tasks` -> `/owner/operations`, `/owner/inbox` -> `/owner/messages`
4. Убрать "Owner Reports" из сайдбара и мобильного меню
5. Перегруппировать навигацию:
   - Operations: Tasks, Inventory, Vendors, Maintenance
   - Commerce: Rates, Reviews
   - Finance: Income/Expenses, Invoices, Analytics (unified reports)
   - Team: Staff + Access (merged)

### Фаза 2: Объединение аналитики
6. Создать единую страницу "Analytics" (`/owner/analytics`), объединяющую: Revenue Dashboard графики + ReportsPage генератор + Budget (как таб)
7. Удалить отдельные роуты `/owner/revenue`, `/owner/budget`, `/owner/owner-reports`
8. Создать хук `useDashboardMetrics()` для консолидации запросов

### Фаза 3: Улучшение Command Center
9. Добавить глобальный Property Selector на дашборд
10. Добавить operational overlay на MultiPropertyTimeline (задачи, дедлайны документов)

### Затрагиваемые файлы
- `OwnerSidebar.tsx` — перегруппировка навигации
- `OwnerDashboardMenu.tsx` — синхронизация с сайдбаром
- `TodayActionsWidget.tsx` — исправление href
- `AnimatedRoutes.tsx` — обновление роутов
- `pageRegistry.ts` — удаление неиспользуемых lazy imports
- `StaffPage.tsx` — добавление табов Team/Access
- `TeamPage.tsx` — интеграция в StaffPage (удаление отдельной страницы)
- `OwnerReportsPage.tsx` — удаление
- Новый: `src/pages/owner/AnalyticsPage.tsx` — объединённая аналитика
- Новый: `src/hooks/useDashboardMetrics.ts` — консолидированные метрики

