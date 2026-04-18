
План: реализовать полный E2E застройщика + дать тебе как админу/директору Ignatev Estate удобный UX для управления всеми застройщиками, проектами, юнитами и документами.

## Этап 1. Backfill + защита данных
- Backfill `developer_id` для 54 orphan-проектов: матчим по `name_en`/`developer_name` к существующим записям `developers`. Несматченные → создаём "Unassigned Developer" заглушку, помечаем `needs_review=true`.
- Добавить колонку `needs_review boolean default false` в `property_projects` для админ-фильтра.
- Унифицировать дублирующиеся поля: `project_units.status` ← `unit_status` (DROP старого), `property_projects.cover_image` ← консолидация.

## Этап 2. Notification engine
**Edge Function `nb-lead-notify`** (триггер на INSERT в `nb_leads`):
- Developer: WhatsApp (UltraMSG) + Email (Resend) с данными лида и ссылкой на `/developer-portal/leads/:id`.
- Admin (Pavel): Telegram + Email — все лиды дублируются в общий канал.
- Шаблоны RU/EN, fallback если канал недоступен.

**pg_cron daily digest** (`admin-pending-digest`, 09:00 ICT):
- Project pending >24ч → Telegram alert админу.
- Developer application pending >48ч → email + Telegram.
- Project без `nb_project_updates` >45 дней → "stale data" флаг + alert девелоперу.

## Этап 3. Admin UX — Ignatev Estate Director Console
Новый раздел `/admin/newbuilds` (только для admin role):

**3.1 Dashboard `/admin/newbuilds`**
- KPI: pending projects, pending developers, orphan projects, stale projects, leads (today/week).
- Quick actions: "Create developer", "Create project", "Bulk import".

**3.2 Developers manager `/admin/newbuilds/developers`**
- Таблица всех `developers` с inline-редактированием (DataTable + modal-edit).
- Колонки: logo, name, license, projects count, reliability_score, status, actions.
- Фильтры: pending/approved/needs_review, has_projects.
- Sheet для full edit: контакты, лицензии, track record, документы компании.

**3.3 Projects manager `/admin/newbuilds/projects`**
- Полный CRUD по `property_projects` без ограничений RLS (admin policy).
- Inline edit ключевых полей (price, status, handover_date), full edit через `DeveloperProjectEditor` (переиспользуем).
- Bulk actions: assign developer, approve, archive.
- Фильтр "Orphan / Pending / Needs review".

**3.4 Units manager (внутри проекта)**
- Уже есть `useProjectUnitsGrid` — добавить admin-режим с массовым импортом из CSV (paste-table).
- Inline-редактирование цены/статуса юнита прямо в таблице.

**3.5 Documents vault `/admin/newbuilds/projects/:id/documents`**
- Загрузка через `UnifiedMediaUploader` (mode=document).
- Категории по ClearView checklist: Land Title, Permits, Corporate, Financial, Construction, Marketing.
- Visibility toggle: public / kyc / buyer_only.
- Версионирование (v1, v2 при перезагрузке).

## Этап 4. Director shortcut
- Добавить кнопку "Ignatev Estate Console" в `UserAvatarMenu` для admin role.
- Pre-filled context: company=Ignatev Estate в фильтрах по умолчанию.

## Этап 5. Технические детали
- **Таблицы новые:** `project_documents` (project_id, category, url, visibility, version, uploaded_by, uploaded_at).
- **RLS:** admin → full access; developer → only own projects; public → only `visibility=public` published docs.
- **Edge Functions:** `nb-lead-notify`, `admin-pending-digest`, `cron-stale-projects-check`.
- **Cron:** через `pg_cron` + `pg_net` POST на edge functions.
- **Routes:** `/admin/newbuilds/*` под `AdminGuard`.

## Этап 6. Что не делаем сейчас
- DepositSafe escrow → Phase C.
- 3D/BIM viewer → Phase C.
- Investor post-purchase dashboard → отдельный заход (требует buyer_contracts).
- Pantip parsing → Phase B.

## Порядок имплементации
1. Миграция: backfill + new columns + project_documents table + RLS.
2. Edge Function `nb-lead-notify` + триггер.
3. Edge Function `admin-pending-digest` + pg_cron.
4. Frontend: `/admin/newbuilds/*` console (dashboard, developers, projects, documents).
5. UserAvatarMenu shortcut.
6. E2E проверка: создать проект → загрузить документы → симулировать лид → проверить нотификации.

Готов реализовать всё последовательно. Начнём с миграции и notification engine, затем admin console.
