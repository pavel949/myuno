

# Подготовка личного кабинета УК Show Property Phuket

## Проблема

Сейчас при входе в `/owner` директор Show Property Phuket видит **только 1 объект из 21**, потому что:

1. **Данные**: 20 из 21 объектов имеют `owner_id = NULL` -- они привязаны к УК через `management_company_id`, но у директора нет `property_manager_assignments`
2. **MC `properties_count` = 0** -- хук `useOwnerAccess` считает, что у УК нет объектов, что блокирует функционал
3. **Нет переключателя между УК** -- пользователь привязан к двум компаниям (Show Property + Ignatev Estate), но `useMyCompanyId` берёт только первую
4. **Объекты не видны в дашборде** -- `useOwnerProperties` ищет по `owner_id`, `useAssignedProperties` ищет по `property_manager_assignments` -- ни то, ни другое не покрывает объекты УК

## План реализации

### 1. Исправление данных в базе

- Обновить `properties_count` для Show Property Phuket на актуальное значение (21)
- Создать `property_manager_assignments` для всех 21 объектов Show Property, привязанных к пользователю-директору с полными правами
- Это позволит существующему хуку `useAssignedProperties` сразу подхватить все объекты

### 2. Доработка хука useMyProperties -- поддержка объектов УК

Сейчас `useMyProperties` объединяет owned + assigned. Нужно добавить **третий источник**: объекты, привязанные к УК пользователя через `management_company_id`. Это гарантирует, что директор видит все объекты компании, даже если они формально не назначены ему.

Изменения в `src/hooks/useMyProperties.ts`:
- Получить `companyId` из `useMyCompanyId`
- Добавить запрос объектов по `management_company_id`
- Объединить с owned и managed, дедуплицируя

### 3. Переключатель УК в Header

Создать компонент `CompanySwitcher` для пользователей, привязанных к нескольким УК:
- Отображается в `OwnerHeader` рядом с ролевым бейджем
- При переключении сохраняет выбранную компанию в контексте
- Все хуки (`useMyCompanyId`, `useDashboardMetrics`, `useCrmTasks`) реагируют на выбранную УК

Изменения:
- Новый файл `src/components/owner/CompanySwitcher.tsx`
- Новый хук `src/hooks/useActiveCompany.ts` (React Context + localStorage)
- Обновить `useMyCompanyId` для использования выбранной компании вместо первой попавшейся

### 4. Отображение названия УК в Sidebar и Header

- В `OwnerSidebar`: заменить статичный "myUNO" на название активной УК + логотип
- В `OwnerHeader`: показывать название компании в ролевом бейдже вместо generic "Owner"

### 5. Обновление properties_count триггером

Создать SQL-триггер, который автоматически обновляет `management_companies.properties_count` при добавлении/удалении объектов с данным `management_company_id`. Это устранит рассинхронизацию навсегда.

## Технические детали

### Миграция данных (SQL)
```text
-- 1. Обновить properties_count
UPDATE management_companies SET properties_count = 21 
WHERE id = '017c9759-af23-4233-8bba-f379c819736a';

-- 2. Создать assignments для директора
INSERT INTO property_manager_assignments (manager_user_id, property_id, is_active, permissions)
SELECT '5cbbcd96-7a9b-4311-ae5f-80a114b27b12', id, true, 
  '{"calendar":true,"pricing":true,"bookings":true,"guests":true}'::jsonb
FROM properties 
WHERE management_company_id = '017c9759-af23-4233-8bba-f379c819736a'
ON CONFLICT DO NOTHING;

-- 3. Триггер для properties_count
CREATE FUNCTION update_mc_properties_count() ...
CREATE TRIGGER trg_mc_properties_count ...
```

### Новые файлы
- `src/hooks/useActiveCompany.ts` -- контекст активной УК
- `src/components/owner/CompanySwitcher.tsx` -- UI переключателя

### Изменяемые файлы
- `src/hooks/useMyProperties.ts` -- добавить MC-объекты
- `src/hooks/useAgentDeals.ts` (`useMyCompanyId`) -- использовать activeCompany
- `src/components/owner/OwnerHeader.tsx` -- добавить CompanySwitcher + название УК
- `src/components/owner/OwnerSidebar.tsx` -- показать лого и название УК

## Результат

После реализации директор Show Property Phuket сможет:
- Видеть все 21 объект в дашборде и списке Properties
- Переключаться между Show Property и Ignatev Estate
- Видеть KPI, финансы, задачи и CRM в контексте выбранной УК
- Приглашать сотрудников через раздел Team
- Все данные изолированы по компаниям

