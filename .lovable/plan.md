## Цель
Добавить админский экран `/admin/relocation-articles` для CRUD статей переезда (`relocation_articles`) и управления категориями.

## Что строим

### 1. Страница `src/pages/admin/AdminRelocationArticles.tsx`
- Список всех статей (включая неопубликованные) — таблица: title_ru, slug, category, sort_order, is_published, updated_at.
- Фильтр по категории + поиск по slug/title.
- Кнопки: «Создать», «Редактировать», «Опубликовать/Снять с публикации», «Удалить».
- Toggle для быстрого `is_published`.

### 2. Редактор (Sheet/Dialog) `AdminRelocationArticleEditor.tsx`
Поля формы (React Hook Form + Zod):
- `slug` (auto-generate из title_en, редактируемый)
- `category` (Select из текущих 10 категорий + динамические из БД)
- `title_en`, `title_ru` (input)
- `summary_en`, `summary_ru` (textarea)
- `content_en`, `content_ru` (textarea с markdown, моно-шрифт)
- `related_route` (input)
- `sort_order` (number)
- `is_published` (switch)

Save → upsert по `slug`.

### 3. Управление категориями
Категории сейчас живут как enum-литералы в `src/data/relocationArticles.seed.ts` (10 шт., колонка `category` в БД — text, не enum). Делаем легковесно, без новой таблицы:
- В UI таб «Категории» — список из `RELOCATION_ARTICLE_CATEGORIES` + категории, реально встречающиеся в БД (UNION).
- Показываем счётчик статей на категорию.
- Кнопка «Переименовать» делает массовый UPDATE `category` со старого ID на новый по всем статьям (для ребрендинга).
- Добавить новую категорию = просто использовать новый id при создании статьи (free-text + datalist подсказок). Помечаем «новая, не в seed» — напоминание добавить лейбл в seed для двуязычного отображения на публичной части.

> Полноценная таблица `relocation_article_categories` сейчас избыточна — её можно завести позже отдельной задачей, если потребуется управление лейблами RU/EN из UI.

### 4. Хук `src/hooks/admin/useAdminRelocationArticles.ts`
- `useAdminRelocationArticlesList()` — все строки без фильтра `is_published`.
- `useUpsertRelocationArticle()` — upsert по `slug`.
- `useDeleteRelocationArticle()` — delete by id.
- `useTogglePublishRelocationArticle()` — update `is_published`.
- `useRenameCategory(oldId, newId)` — массовый update.
- Все мутации инвалидируют `['relocation_articles']` и `['admin_relocation_articles']`.
- Toasts через `sonner`.

### 5. Регистрация
- Добавить `AdminRelocationArticles` в `src/components/layout/pageRegistry.ts` (lazy import).
- Добавить маршрут `/admin/relocation-articles` в `src/components/layout/routes/adminRoutes.tsx`.
- Добавить пункт в админ-навигацию (там, где сгруппированы `AdminClinics`, `AdminEducation` — найдём конкретный navConfig по ходу) под группой «Контент» или рядом с Education/Legal.

### 6. Доступ и безопасность
- Полагаемся на существующие RLS политики таблицы (write: `admin`/`uno_team`/`staff`, read: published для всех — для админа делаем `select` через RLS, у admin-роли есть полный доступ согласно миграции).
- Страница защищена `AdminGuard` через `AdminRouteLayout`.

### 7. Чистка кастов
В рамках этой задачи **не трогаем** `as never`/`(supabase as any)` — типы `relocation_articles` ещё не регенерированы. Используем тот же приём в новом хуке + TODO-коммент.

## Файлы

Новые:
- `src/pages/admin/AdminRelocationArticles.tsx`
- `src/components/admin/relocation/AdminRelocationArticleEditor.tsx`
- `src/components/admin/relocation/AdminRelocationCategoriesPanel.tsx`
- `src/hooks/admin/useAdminRelocationArticles.ts`

Изменения:
- `src/components/layout/pageRegistry.ts` — lazy import.
- `src/components/layout/routes/adminRoutes.tsx` — маршрут.
- Админ-навигация (точный файл найдём при имплементации; кандидаты: `src/components/admin/navigation/*` или `src/lib/nav/*`).

## Out of scope
- Богатый markdown-редактор (используем простой textarea + monospaced; апгрейд на TipTap — отдельной задачей).
- Создание отдельной таблицы `relocation_article_categories` с RU/EN лейблами.
- Загрузка картинок к статьям (схема не предусматривает поле image сейчас).
- Удаление seed-fallback из публичного хука.
