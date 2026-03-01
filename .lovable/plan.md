
# Онбординг-флоу для новой Управляющей Компании

## Обзор

Создаём полноценный пошаговый мастер регистрации УК, доступный по маршруту `/mc/onboarding`. Флоу состоит из 4 шагов:

1. **Регистрация УК** -- название, контакты, описание
2. **Загрузка логотипа** -- брендирование
3. **Приглашение первых сотрудников** -- email + роль
4. **Добавление первого объекта** -- переход к существующему визарду

## Архитектура

### Backend (Edge Function)

**Новая Edge Function `register-mc/index.ts`:**
- Принимает данные формы (name_en, name_ru, slug, email, phone, address, description)
- Создаёт запись в `management_companies` (is_active=true, created_by=user.id)
- Автоматически добавляет текущего пользователя в `management_company_members` с ролью `director`
- Добавляет роль `property_manager` в `user_roles` (если отсутствует)
- Возвращает `company_id`

**Миграция:**
- RLS-политика на `management_companies` для INSERT: authenticated users могут создавать (created_by = auth.uid())
- Альтернативно, используем Edge Function с service role ключом, что безопаснее

### Frontend

**1. Новая страница `src/pages/mc/MCOnboarding.tsx`**

4-шаговый визард внутри `OnboardingLayout`:

- **Шаг 1: О компании** -- форма с полями name_en, name_ru, slug (авто-генерация из name_en), email, phone, address, description. Валидация обязательных полей.
- **Шаг 2: Логотип** -- загрузка логотипа в storage bucket, превью. Можно пропустить.
- **Шаг 3: Команда** -- мини-форма для приглашения до 3 сотрудников (email + роль). Использует существующую Edge Function `invite-team-member`. Можно пропустить.
- **Шаг 4: Первый объект** -- кнопка перехода к `/mc/properties/new` или summary + "Начать работу"

**2. Регистрация маршрута**

- `pageRegistry.ts` -- добавить `MCOnboarding` lazy import
- `AnimatedRoutes.tsx` -- добавить маршрут `/mc/onboarding` (вне MCGuard, но с проверкой auth)

**3. Точки входа**

- Кнопка "Зарегистрировать УК" на `/owner` dashboard (в SetupPromptBanner или отдельный баннер)
- MCGuard: если user авторизован но нет компаний -- показывать кнопку "Создать УК" вместо AccessDenied
- CompanySwitcher: добавить кнопку "+ Создать УК" внизу списка

## Технические детали

### Edge Function `register-mc`

```text
POST /register-mc
Body: { name_en, name_ru, slug, email, phone, address, description_en, description_ru }
Auth: Bearer token (required)
Response: { company_id, slug }
```

Логика:
1. Проверить auth
2. Генерировать slug если не передан (slugify name_en)
3. INSERT в management_companies
4. INSERT в management_company_members (role: director)
5. UPSERT в user_roles (role: property_manager) если нет
6. Вернуть company_id

### Файлы для создания/изменения

| Файл | Действие |
|------|----------|
| `supabase/functions/register-mc/index.ts` | Создать -- Edge Function регистрации УК |
| `src/pages/mc/MCOnboarding.tsx` | Создать -- 4-шаговый визард |
| `src/components/layout/pageRegistry.ts` | Добавить MCOnboarding |
| `src/components/layout/AnimatedRoutes.tsx` | Добавить маршрут /mc/onboarding |
| `src/components/auth/MCGuard.tsx` | Заменить AccessDenied на кнопку "Создать УК" |
| `src/components/owner/CompanySwitcher.tsx` | Добавить "+ Создать УК" внизу |

### Шаг 1: Форма регистрации

Поля:
- name_en (required) -- название на английском
- name_ru (required) -- название на русском
- email -- контактный email
- phone -- телефон
- address -- адрес офиса
- description_en / description_ru -- краткое описание

Slug генерируется автоматически из name_en (латиница, lowercase, дефисы).

### Шаг 3: Приглашение команды

Переиспользуем существующую Edge Function `invite-team-member`. Показываем мини-форму: email + роль (manager/staff/accountant). До 3 приглашений. Каждое отправляется отдельным запросом. Шаг можно пропустить.

### Интеграция с ActiveCompanyProvider

После успешной регистрации:
1. Инвалидируем query `user-companies`
2. Устанавливаем новую компанию как activeCompanyId
3. Перенаправляем на следующий шаг визарда

### UX

- Двуязычный интерфейс (ru/en) как во всём проекте
- Используем существующий `OnboardingLayout` с прогресс-баром
- Анимации через framer-motion (как в OwnerSetupWizard)
- Mobile-first дизайн
