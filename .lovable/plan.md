

User says "Реализуй аккуратно" — implement carefully. This refers to the remaining deferred tasks from previous audit:
- P1-1: Decompose PropertyDetail.tsx (1035 lines)
- P1-5: Drag & Drop bulk logo upload for developers
- P0-2: Semantic mapping developer_id for 214 projects
- P1-3: E2E smoke-test Developer Portal

Let me check current state of these to plan properly.

Actually plan should be concise. I know enough from prior context. Let me design the implementation.

## Plan: Завершение P0/P1 фиксов блока «Недвижимость»

### 1. P0-2 — Backfill `developer_id` (SQL миграция)
- SQL: для всех `property_projects` где `developer_id IS NULL` и `developer_name IS NOT NULL`:
  - LEFT JOIN на `developers` по нормализованному имени (lower + trim)
  - UPDATE проставляет `developer_id`
- Логирование: report сколько обновлено, сколько не найдено
- Без удаления `developer_name` — оставляем как fallback

### 2. P1-1 — Декомпозиция `PropertyDetail.tsx` (1035 → ~250 строк)
Разбиваю на 6 sub-компонентов в `src/components/property/detail/`:
- `PropertyGallery.tsx` — фото/лайтбокс
- `PropertyHeader.tsx` — название, рейтинг, локация, share/save
- `PropertyAmenities.tsx` — сетка удобств
- `PropertyDescription.tsx` — описание + highlights
- `PropertyHostCard.tsx` — карточка хоста + chat button
- `PropertyLocationMap.tsx` — карта + район
Главный `PropertyDetail.tsx` оставляет только: data fetching, layout, sticky booking card.

### 3. P1-5 — Bulk logo upload для застройщиков
В `/admin/developers`:
- Кнопка "Bulk Upload Logos" → открывает `ResponsiveModal`
- Drag&drop зона (через существующий `UnifiedMediaUploader` mode='gallery')
- После загрузки: матчинг по filename → developer name (fuzzy)
- Превью таблицы "Файл → Застройщик" с возможностью корректировки
- Кнопка "Apply" → batch UPDATE `developers.logo_url`

### 4. P1-3 — Smoke-test Developer Portal
- Создаю `docs/DEVELOPER_PORTAL_QA.md` — чек-лист из 15 шагов:
  1. Регистрация на `/developer-portal/register`
  2. Email verify → login
  3. Создание проекта (минимум: название RU/EN, локация, статус, обложка)
  4. Добавление 3 unit types (1BR/2BR/3BR)
  5. Загрузка floor plans
  6. Публикация → проверка в `/newbuilds`
  7. Submit for moderation → проверка в `/admin/newbuilds` (Pending tab)
  8. Approve как admin → проверка публичной видимости
  9. Edit проекта → проверка что не сбрасывается approval
  10. Impersonation flow от админа
  - И т.д.
- Добавляю автоматический `dev_portal_smoke_test` SQL view, который проверяет integrity

### Что НЕ трогаю
- Storage migration / auth.users (отложено пользователем)
- DB mirror workflow (уже сделан)
- Существующие таблицы (только UPDATE через миграцию)

### Файлы (новые)
- `src/components/property/detail/PropertyGallery.tsx`
- `src/components/property/detail/PropertyHeader.tsx`
- `src/components/property/detail/PropertyAmenities.tsx`
- `src/components/property/detail/PropertyDescription.tsx`
- `src/components/property/detail/PropertyHostCard.tsx`
- `src/components/property/detail/PropertyLocationMap.tsx`
- `src/components/property/detail/index.ts`
- `src/components/admin/developers/BulkLogoUploadModal.tsx`
- `docs/DEVELOPER_PORTAL_QA.md`

### Файлы (изменения)
- `src/pages/property/PropertyDetail.tsx` — рефакторинг, импорт sub-компонентов
- `src/pages/admin/AdminDevelopers.tsx` — кнопка Bulk Upload + интеграция модалки
- SQL migration: backfill developer_id

### Acceptance criteria
1. `PropertyDetail.tsx` < 300 строк, sub-компоненты < 200 строк каждый
2. Visual parity — на /property/:id всё выглядит идентично
3. SQL backfill отчитывается: "Updated X projects with developer_id, Y unmapped"
4. Bulk logo upload: можно загрузить 10 файлов разом и применить одним кликом
5. QA checklist доступен по ссылке из `/admin/developers`

### Порядок исполнения
1. SQL миграция (developer_id backfill) — самое критичное, 0 риск UI
2. Декомпозиция PropertyDetail (по одному компоненту, проверяем после каждого)
3. Bulk logo upload modal
4. QA документ

Время: ~12-15 минут.

