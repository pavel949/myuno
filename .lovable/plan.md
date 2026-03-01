
# Комплексный аудит и усиление RLS платформы myUNO

## Обнаруженные проблемы

### КРИТИЧЕСКИЕ (Privilege Escalation)

**1. `profiles.user_type` используется в 25 RLS-политиках для проверки прав**
Пользователь может сам обновить своё поле `user_type` через политику `Users can update own profile` (USING auth.uid() = id, без ограничения колонок). Это значит: любой пользователь может сделать себя admin, изменив user_type.

Затронутые таблицы: `ai_agents`, `ai_agent_knowledge`, `ai_agent_logs`, `airport_bookings`, `airport_passengers`, `airport_suppliers`, `cohort_analytics`, `event_occurrences`, `experience_media`, `experience_pricing`, `funnel_analytics`, `orders`, `page_views`, `platform_events`, `platform_news` и другие (25 политик).

**2. `management_companies` UPDATE-политика содержит баг**
Политика `Company members can update their company` сравнивает `management_company_members.company_id = management_company_members.id` (колонку с самой собой), вместо `management_company_members.company_id = management_companies.id`. Результат: никто не может обновить компанию через эту политику.

**3. Дублированные UPDATE-политики на `profiles`**
Две идентичные политики: `Users can update own profile` и `Users can update their own profile`. Обе без ограничения колонок -- пользователь может менять любые поля, включая `user_type`.

### ВЫСОКИЕ (Отсутствие защиты)

**4. 5 таблиц с RLS без политик (полная блокировка данных)**
- `booking_notifications_log`
- `inventory_inspections`
- `property_documents`
- `property_management_terms`
- `property_meters`

Данные в этих таблицах полностью недоступны через клиент (RLS включена, но нет ни одной политики).

**5. `crm_web_form_submissions` -- INSERT с `WITH CHECK (true)`**
Любой аутентифицированный пользователь может вставить произвольные данные в формы любой компании.

**6. `management_company_members` -- публичный SELECT**
Политика `Anyone can view company memberships` позволяет видеть всех сотрудников всех УК (при is_active=true). Утечка организационной структуры.

**7. CRM INSERT-политики без проверки company_id**
`crm_contacts`, `crm_contact_notes`, `crm_companies` -- INSERT-политики не проверяют, что пользователь является членом компании, в которую вставляет данные.

### СРЕДНИЕ (Несогласованность)

**8. Три разных подхода к проверке админских прав**
- `profiles.user_type` (25 политик) -- НЕБЕЗОПАСНО
- `user_roles` напрямую (61 политика)
- `is_admin_or_uno_team()` helper (35 политик)
- `has_role()` helper (99 политик)

Нужна единая точка входа.

**9. MC-член без разграничения прав по модулям в RLS**
Таблица `team_member_permissions` существует и заполняется, но RLS-политики на CRM, bookings и других MC-данных не используют её. Все проверяют только `is_company_member()` без учёта `can_view`/`can_edit`.

**10. Bookings -- MC-менеджеры не видят бронирования своих объектов**
Политики на `bookings` не включают проверку `is_mc_member_for_property()`. Менеджер УК не видит бронирования по своим объектам через RLS.

---

## План исправления

### Фаза 1: Устранение критических уязвимостей

**1.1 Заблокировать изменение `user_type` через профиль**
- Создать триггер `BEFORE UPDATE ON profiles`, который запрещает изменение колонки `user_type` (только service role / admin может менять).
- Удалить дублированную политику `Users can update their own profile`.

**1.2 Мигрировать все 25 политик с `profiles.user_type` на `has_role()` / `is_admin_or_uno_team()`**
Единый паттерн: вместо `profiles.user_type = 'admin'` использовать `is_admin_or_uno_team()` (security definer, без рекурсии).

Таблицы для миграции: ai_agent_knowledge, ai_agent_logs, ai_agents, airport_booking_addons, airport_bookings, airport_passengers, airport_suppliers, cohort_analytics, event_occurrences, experience_media, experience_pricing, funnel_analytics, orders, page_views, platform_events, platform_news и остальные.

**1.3 Исправить баг в `management_companies` UPDATE-политике**
Заменить `management_company_members.company_id = management_company_members.id` на `management_company_members.company_id = management_companies.id`.

### Фаза 2: Добавление недостающих политик

**2.1 Таблицы без политик -- добавить корректные правила:**

| Таблица | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| `booking_notifications_log` | MC-member по property | System only (service role) | -- | -- |
| `inventory_inspections` | MC-member по property | MC-member | MC-member | MC-admin |
| `property_documents` | Owner + MC-member + assigned manager | MC-member / owner | MC-admin / owner | MC-admin / owner |
| `property_management_terms` | MC-director + owner + admin | MC-director | MC-director | Admin only |
| `property_meters` | MC-member по property | MC-member | MC-member | MC-admin |

**2.2 Закрыть CRM INSERT-политики проверкой компании**
Добавить `WITH CHECK (is_company_member(auth.uid(), company_id))` для `crm_contacts`, `crm_contact_notes`, `crm_companies`, `crm_web_form_submissions`.

**2.3 Ограничить публичную видимость членства в УК**
Заменить `Anyone can view company memberships` на `Members can view their company colleagues` (company_id IN (SELECT...)).

### Фаза 3: MC-иерархия и модульные права

**3.1 Создать helper-функцию `mc_can_access()`**

```text
mc_can_access(user_id, company_id, module, action) -> boolean

Логика:
1. Если role = 'director' или 'admin' -> true (полный доступ)
2. Иначе -> проверить team_member_permissions для module + action
3. Если нет записи в permissions -> false (deny by default)
```

**3.2 Применить модульные проверки к CRM-таблицам**
Заменить простые `is_company_member()` на `mc_can_access(auth.uid(), company_id, 'crm', 'view')` для SELECT и `mc_can_access(auth.uid(), company_id, 'crm', 'edit')` для INSERT/UPDATE/DELETE.

Аналогично для модулей: finance, tasks, bookings, reports, staff.

**3.3 Bookings -- добавить MC-менеджерам доступ к бронированиям**
Добавить SELECT-политику: `MC members can view property bookings` через `is_mc_member_for_property()`.

### Фаза 4: Единый стандарт и роли пользователя

**4.1 Стандартизировать helper-функции**

| Функция | Назначение | Security |
|---------|-----------|----------|
| `has_role(user_id, role)` | Проверка app_role в user_roles | DEFINER |
| `is_admin_or_uno_team()` | Платформенный админ | DEFINER |
| `is_company_member(user_id, company_id)` | Членство в УК | DEFINER |
| `is_mc_admin(user_id, company_id)` | Директор/админ УК | DEFINER |
| `mc_can_access(user_id, company_id, module, action)` | Модульный доступ | DEFINER |
| `is_mc_member_for_property(user_id, property_id)` | Доступ к объекту через УК | DEFINER |

**4.2 Профиль пользователя -- отображение ролей и прав**
- На странице профиля вывести: platform roles (из user_roles), MC memberships (из management_company_members с ролью), module permissions (из team_member_permissions).
- Роли и права read-only в профиле; изменения только через admin или MC-директора.

### Фаза 5: Бизнес-логика принятия условий платформы

**5.1 Только директор/владелец УК принимает Terms of Service**
- Добавить RLS на `management_terms_activity`: INSERT только если `get_company_member_role(auth.uid(), company_id) = 'director'`.
- Сотрудники УК при регистрации НЕ принимают условия платформы -- это делает только тот, кто создал/владеет УК.

---

## Технический план миграций

### Миграция 1: Критические исправления (Фаза 1)
- Триггер на profiles для блокировки user_type
- DROP + CREATE 25 политик (profiles.user_type -> has_role/is_admin_or_uno_team)
- Исправление management_companies UPDATE-политики
- Удаление дублированной profiles UPDATE-политики

### Миграция 2: Недостающие политики (Фаза 2)
- 5 таблиц без политик + CRM INSERT-ограничения + членство УК

### Миграция 3: Модульные права (Фаза 3)
- Функция mc_can_access() + обновление CRM/finance/booking политик

### Миграция 4: Terms и профиль (Фазы 4-5)
- Terms activity RLS + стандартизация

### Фронтенд
- Компонент отображения ролей и прав в профиле пользователя
- Индикация текущего контекста (клиент vs директор УК) в UI

---

## Итого

- **25 политик** мигрируются с profiles.user_type на user_roles (устранение privilege escalation)
- **5 таблиц** получают недостающие политики
- **1 критический баг** в management_companies исправляется
- **Новая функция** mc_can_access() подключает модульные права к RLS
- **CRM INSERT** закрываются проверкой членства
- **Terms of Service** ограничиваются директорами УК
- **Профиль** показывает роли и доступы пользователя
