

# Унификация терминологии: Собственник vs Управляющая компания

## Проблема

Сейчас в коде дублируются и путаются понятия:
- В `AppRole` есть и `owner`, и `property_owner` — оба переводятся как «Собственник»
- В бизнес-ролях (`BusinessRole`) есть `property_manager` — для УК
- Термин «Owner» используется 65+ файлах без чёткого разграничения между собственником-самоуправленцем и УК-управленцем

## Целевая модель

| Роль | EN (интерфейс) | RU (интерфейс) | Описание |
|------|-----------------|------------------|----------|
| `owner` (AppRole) | Property Owner | Собственник | Владеет объектом, может сам управлять и покупать сервисы |
| MC Director/Manager | Management Company | Управляющая компания | Управляет объектами собственников, даёт им доступ к отчётам |

## Что будет сделано

### 1. Консолидация ролей в `src/types/auth.ts`
- Удалить дублирующую роль `property_owner` — оставить единственную `owner` как «Собственник»
- `property_manager` оставить для сотрудников УК
- Обновить `ROLE_METADATA`: у `owner` описание = «Управляйте своим объектом и заказывайте сервисы» / «Manage your property and order services»
- Обновить `SWITCHABLE_ROLES`, `SELF_ACTIVATABLE_ROLES`

### 2. Обновление UI-лейблов (основные файлы)
- `AccountRolesBlock.tsx`: описание роли owner = «Мой объект и сервисы» / «My property & services»
- `AccountProfileCard.tsx`: owner = «Собственник» / «Property Owner» (без изменений)
- `RoleContextSwitcher.tsx`: убрать дубль `property_owner`, оставить `owner`
- `AccountTypeSelection.tsx`: уточнить описание для owner
- `MCHeader.tsx`, `MCSidebar.tsx`: «Собственники» остаётся (это CRM-раздел управления аккаунтами собственников для УК)

### 3. i18n строки
- `home.forOwners`: RU «Для собственников» (без изменений, уже корректно)
- EN: «For Property Owners» (уточнить с «For Owners»)

### 4. Обновление `useUserPersonas.ts`
- Заменить `property_owner` на `owner` в типе `UserPersona` и связанной логике
- Обновить конфиг персоны: label = «Собственник» / «Property Owner»

### 5. Обновление `businessRoles.ts`
- Пояснение в комментариях: `property_manager` = сотрудник УК, не собственник
- Лейбл `property_manager`: RU «Управление объектами (УК)» / EN «Property Management (MC)»

### 6. Обновление всех ссылок на `property_owner` в коде
- `QuickActionsGrid.tsx`: `property_owner` -> `owner`
- `intakeVerticals.ts`: keywords остаются (поисковые)
- Все файлы с `SELF_ACTIVATABLE_ROLES` и `property_owner`

---

### Технические детали

**Файлы для изменений (~15 файлов):**
- `src/types/auth.ts` — удаление `property_owner`, обновление метаданных
- `src/hooks/useUserPersonas.ts` — тип и конфиг
- `src/lib/businessRoles.ts` — лейблы
- `src/components/account/AccountRolesBlock.tsx` — описания
- `src/components/account/AccountProfileCard.tsx` — проверить
- `src/components/uno/RoleContextSwitcher.tsx` — убрать дубль
- `src/components/home/QuickActionsGrid.tsx` — персона
- `src/pages/auth/AccountTypeSelection.tsx` — описания
- `src/i18n/en.ts`, `src/i18n/ru.ts` — строки
- `src/pages/owner/ReportsPage.tsx` — лейблы
- `src/pages/owner/ManagementPortfolio.tsx` — пояснения «Собственник X% / УК Y%»

**БД:** Если `property_owner` существует в enum `app_role` — потребуется миграция для удаления (после проверки что нет записей с этим значением). Будет проверено перед выполнением.

**Принцип:** Собственник = владеет и может сам. УК = управляет чужим и отчитывается собственнику.
