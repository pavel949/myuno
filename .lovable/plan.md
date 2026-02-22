

# Аудит UX для управляющей компании (УК) в /owner

## Обнаруженные проблемы

### 1. Страница "Объекты" (/owner/properties) не показывает управляемые объекты
**Критичность: Высокая**

`OwnerProperties.tsx` использует `useOwnerProperties()`, который фильтрует только `owner_id = user.id`. УК не является владельцем объектов -- она управляет чужой недвижимостью. Значит, менеджер УК видит **пустой список**, хотя у него есть назначенные объекты.

**Решение:** Заменить на `useMyProperties()` (уже существует и объединяет owned + managed) с визуальной индикацией источника (бейдж "Своё" / "В управлении").

---

### 2. Финансы (/owner/financials) фильтруют только по owner_id
**Критичность: Высокая**

`OwnerFinancials.tsx` использует `useOwnerProperties()` для списка объектов и `owner_id` для запроса финансовых данных. УК не видит транзакции по управляемым объектам.

**Решение:** Добавить в фильтр объекты из `useMyProperties()` (managed properties) и подтягивать финансовые данные по property_id для управляемых объектов.

---

### 3. KPI-виджет дашборда считает данные только по owner_id
**Критичность: Высокая**

`BusinessKPIWidget.tsx` запрашивает `property_financials`, `property_bookings`, `properties` только с `owner_id = user.id`. Менеджер УК видит нулевые Revenue, Expenses, Occupancy.

**Решение:** Добавить параллельный запрос по управляемым объектам (через `property_manager_assignments`) и суммировать с данными owner.

---

### 4. Bottom Nav не содержит ключевых разделов для УК
**Критичность: Средняя**

Мобильная навигация: Dashboard, Объекты, Календарь, Финансы, Команда. Для УК критичны: Воронка продаж (CRM), Операции, Контакты -- но они доступны только через длинное "Меню" в самом низу дашборда.

**Решение:** Сделать bottom nav адаптивным к роли:
- `property_manager`: Dashboard, Объекты, Календарь, Операции, Ещё (...)
- `sales_agent`: Dashboard, Сделки, Контакты, Задачи, Ещё (...)

---

### 5. Sidebar не отражает полный функционал УК
**Критичность: Средняя**

`OwnerSidebar.tsx` содержит только: Dashboard, Properties, Calendar, Sales Pipeline, Contacts, Financials, Team. Многие важные разделы (Operations, Staff, Inventory, Invoices, Reports, Management Terms) доступны только через меню дашборда.

**Решение:** Добавить в sidebar группу "Operations" с ключевыми пунктами: Operations, Staff, Inventory, Invoices, Reports.

---

### 6. Нет "property_manager_assignments" при создании сервисных заявок и расходов
**Критичность: Средняя**

`ServiceRequest.tsx`, `QuickExpense.tsx` используют `useOwnerProperties()` для выбора объекта. Менеджер УК не видит управляемые объекты при создании уборки/расхода/заявки.

**Решение:** Заменить на `useMyProperties()` во всех формах создания.

---

## Технический план исправлений

### Шаг 1: Обновить OwnerProperties для УК
- Заменить `useOwnerProperties()` на `useMyProperties()`
- Добавить бейдж "В управлении" / "Своё" на карточках
- Показывать имя владельца для управляемых объектов

### Шаг 2: Обновить BusinessKPIWidget
- Получать список property_id из `useMyProperties()` или `useAssignedProperties()`
- Фильтровать финансовые данные по массиву property_id (owned + managed)
- Корректно считать occupancy по всему портфелю

### Шаг 3: Обновить OwnerFinancials
- Добавить управляемые объекты в фильтр по свойствам
- Запрашивать финансовые данные по property_id (не только owner_id)

### Шаг 4: Обновить формы создания (ServiceRequest, QuickExpense, QuickIncome, InspectionRequest)
- Заменить `useOwnerProperties()` на `useMyProperties()` для выбора объекта

### Шаг 5: Адаптивная мобильная навигация
- Добавить в `OwnerMobileNav` зависимость от `useBusinessRole()`
- Показывать role-specific вкладки (для PM: Operations вместо Team; для Sales: Deals вместо Calendar)

### Шаг 6: Расширить Sidebar
- Добавить группу "Operations" с пунктами: Operations, Invoices, Staff, Inventory, Reports
- Перенести Management Terms в группу Operations

