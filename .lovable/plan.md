

# Owner Portal: Связывание данных и UX для создания портала

## Проблема

Сейчас между CRM-контактом собственника (`crm_contacts` с `contact_type='owner'`) и его учётной записью в системе (`auth.users` / `profiles`) нет связи. Это означает:

1. **Нет UUID-привязки** -- когда УК вносит собственника в CRM, у него нет аккаунта в системе
2. **Портал "висит в воздухе"** -- `owner_portal_settings` требует `owner_user_id`, но его неоткуда взять из CRM
3. **Нет единого UX** -- нет кнопки "Создать портал" на карточке собственника в PMS
4. **Данные не связаны** -- объекты привязаны через `owner_contact_id`, но портал требует `owner_user_id`

## Решение

### 1. Добавить `linked_user_id` в `crm_contacts`

Новое поле для связывания CRM-контакта с реальным пользователем системы:

```text
crm_contacts
  + linked_user_id UUID (nullable, FK -> auth.users)
```

Это позволит:
- Связать контакт с существующим пользователем (поиск по email)
- Автоматически создать аккаунт при настройке портала

### 2. Компонент "Create Owner Portal" на карточке собственника

На странице `OwnerDetailPage` (/owner/owners/:id) добавить новый блок **"Портал владельца"**:

- Показывает статус: портал настроен / не настроен
- Если у контакта есть email -- кнопка **"Создать портал"**:
  1. Ищет пользователя по email в `profiles`
  2. Если найден -- привязывает `linked_user_id`, создаёт `owner_portal_settings` для всех объектов этого собственника
  3. Если не найден -- показывает сообщение "Собственник должен зарегистрироваться по email X, после чего портал активируется автоматически"
- Кнопка "Настройки портала" для каждого объекта -- ведёт к `/owner/properties/:propertyId/portal-settings`
- Показывает список объектов собственника с индикатором (портал включен / выключен)

### 3. Автоматическая активация портала

Компонент `OwnerPortalActivator` -- при создании портала:
1. Берёт email из `crm_contacts`
2. Ищет совпадение в `profiles` по email
3. Если найден:
   - Записывает `linked_user_id` в `crm_contacts`
   - Создаёт `owner_portal_settings` для каждого объекта (с дефолтными настройками)
   - Создаёт `property_delegates` запись (role: `owner_readonly`, status: `active`)
4. Если не найден:
   - Создаёт `property_delegates` с `invited_email` и `status: 'pending'`
   - Показывает ссылку-приглашение

### 4. Связь данных на OwnerDetailPage

На карточке собственника добавить секцию "Portal" (новый таб или блок в Overview):
- Список объектов с быстрыми переключателями (портал вкл/выкл)
- Ссылка на предпросмотр портала (как видит собственник)
- Статус: "Активен" / "Ожидает регистрации" / "Не настроен"

---

## Технический план

### Шаг 1: Миграция БД
- Добавить `linked_user_id uuid REFERENCES auth.users(id)` в `crm_contacts`
- Индекс на `linked_user_id` для быстрого поиска

### Шаг 2: Компонент `OwnerPortalSetupCard`
- Новый компонент в `src/components/owner/owners/OwnerPortalSetupCard.tsx`
- Принимает `contactId`, `email`, `properties[]`
- Логика: поиск пользователя, создание настроек, привязка
- Интегрируется в `OwnerDetailPage` (в Overview tab или как отдельный таб "Portal")

### Шаг 3: Обновить `OwnerDetailPage`
- Добавить таб "Portal" или карточку в Overview
- Показывать `OwnerPortalSetupCard` с актуальным статусом
- Для каждого объекта: кнопка настроек портала

### Шаг 4: Обновить `useOwnerAccounts`
- Добавить `linked_user_id` в выборку
- Добавить статус портала (есть ли `owner_portal_settings` для объектов)

---

## Файлы

**Новые файлы:**
- `src/components/owner/owners/OwnerPortalSetupCard.tsx` -- UI создания/управления порталом

**Изменяемые файлы:**
- `src/pages/owner/OwnerDetailPage.tsx` -- добавить Portal таб/блок
- `src/hooks/useOwnerAccounts.ts` -- добавить `linked_user_id` и portal status в выборку

**Миграция:**
- Добавить `linked_user_id` в `crm_contacts`
