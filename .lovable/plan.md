## Цель

Добавить два связанных retention-механизма для off-plan/newbuilds:
1. **Сохранённые поиски** — пользователь сохраняет текущие фильтры каталога offplan и получает уведомления, когда появляются новые проекты/юниты под критерии.
2. **Алерты по избранным ЖК** — когда в проекте, который пользователь добавил в favorites (`item_type='newbuild_project'`), появляется новый юнит (`project_units.status='available'`) или апдейт стройки (`nb_project_updates`) — отправляется WhatsApp/Email.

Каналы: Email через существующий `send-email`, WhatsApp через существующий `notify-lead-whatsapp` (UltraMSG). Настройки каналов — per-user.

---

## 1. БД (миграция)

### 1.1 `nb_saved_searches`
```
id uuid pk, user_id uuid not null (auth.users),
name text,                              -- например «Виллы Раваи до 15M»
filters jsonb not null,                 -- OffplanUiFilterState
notify_email bool default true,
notify_whatsapp bool default false,
frequency text default 'instant',       -- instant | daily
last_notified_at timestamptz,
last_seen_project_ids uuid[] default '{}', -- чтобы не дублировать
is_active bool default true,
created_at, updated_at
```
RLS: владелец видит/мутирует свои.

### 1.2 `nb_alert_preferences` (per-user глобальные настройки канала для favorites-алертов)
```
user_id uuid pk, email text, whatsapp_phone text,
notify_new_units bool default true,
notify_progress_updates bool default true,
notify_price_changes bool default false,
channel_email bool default true,
channel_whatsapp bool default false,
quiet_hours_start int, quiet_hours_end int,  -- 0..23 локально
updated_at
```
RLS: own row only.

### 1.3 `nb_alert_log` (anti-spam, аудит)
```
id, user_id, project_id, alert_type ('new_unit'|'progress'|'price_change'|'saved_search_match'),
ref_id uuid,         -- unit_id / update_id / search_id
channel text, status text, sent_at timestamptz, payload jsonb
unique(user_id, alert_type, ref_id, channel)  -- идемпотентность
```
RLS: own SELECT only; инсерты через service role.

---

## 2. Edge Functions

### 2.1 `nb-process-alerts` (cron каждые 15 мин)
- Тянет `project_units` созданные/перешедшие в `available` за последние 30 мин (по `created_at`/`updated_at` + `unit_status='available'`).
- Тянет `nb_project_updates` за тот же период.
- Для каждого изменения находит юзеров через `favorites WHERE item_type='newbuild_project' AND item_id=project_id`.
- Применяет `nb_alert_preferences` (каналы, тихие часы), проверяет `nb_alert_log` на дубль.
- Шлёт через `send-email` и `notify-lead-whatsapp`. Логирует результат.

### 2.2 `nb-process-saved-searches` (cron daily 09:00 локально)
- Загружает все active `nb_saved_searches`.
- Для каждого формирует SQL по `property_projects` + `project_units` по фильтрам (re-use логика из `useOffplanProjects.ts` — выносим в `_shared/offplanQuery.ts`).
- Берёт project_ids, исключает уже отправленные (`last_seen_project_ids`).
- Если есть новые → email/WhatsApp дайджест («3 новых проекта по поиску "Виллы Раваи"») + апдейт `last_seen_project_ids` и `last_notified_at`.

### 2.3 Cron планирование
SQL через insert tool (pg_cron + pg_net) с реальным `service_role` ключом — два расписания.

---

## 3. UI

### 3.1 Сохранённые поиски в каталоге offplan
- Файл `src/pages/property/OffplanCatalog.tsx` (или где сейчас рендерятся фильтры — найти при имплементации): рядом с фильтрами кнопка **«Сохранить поиск»** → модалка (имя + чекбоксы каналов).
- Хук `useSavedOffplanSearches.ts` (CRUD + React Query).
- Страница `src/pages/account/SavedSearches.tsx` (`/account/saved-searches`) — список, переключатель active, удаление, «Применить» (проставляет фильтры и уходит в каталог).

### 3.2 Управление избранными ЖК и каналами
- На карточке `NbProjectCard.tsx` сделать иконку «favorite» рабочей через существующий `favorites` (item_type=`newbuild_project`, item_data — снапшот проекта).
- Страница `src/pages/account/NewbuildAlerts.tsx` (`/account/newbuild-alerts`):
  - Список favorited проектов с тогглами «новые юниты», «прогресс», «цены» per project (упрощённо — глобально через `nb_alert_preferences`, доп. оверрайды добавим позже).
  - Поля Email / WhatsApp + verify (минимум — формат).
  - Тихие часы (start/end).
- Точка входа из `NotificationInbox` («Настроить алерты по новостройкам»).

### 3.3 i18n
RU + EN ключи в `src/i18n/uiStrings.ts` (и `LanguageContext`).

---

## 4. Email/WhatsApp шаблоны

В `_shared/email-templates.ts` добавить две функции:
- `renderNewUnitsEmail({ projectName, units, lang })`
- `renderSavedSearchDigestEmail({ searchName, projects, lang })`

WhatsApp — короткий текст + deep link `https://myuno.app/newbuilds/projects/<slug>?utm=alert`.

Соблюдаем тон-of-voice (`docs/canonical/03-tone-of-voice.md`): «спокойная уверенность», без CAPS и эмодзи-спама.

---

## 5. Технические детали / интеграция

- **Источник истины для фильтров offplan** — вынести построение запроса из `useOffplanProjects.ts` в чистую функцию `buildOffplanQuery(filters)` в `src/lib/offplan/query.ts`, чтобы переиспользовать в edge-функции (через клон логики на Deno — фильтры простые: zone/seg/beach/price/bedrooms/rec).
- **Идемпотентность** — `nb_alert_log` уникальный индекс `(user_id, alert_type, ref_id, channel)`.
- **Throttling** — не более 5 алертов одного типа на юзера в сутки (агрегируем в дайджест если больше).
- **Тихие часы** — если попадает в quiet hours, откладываем до конца окна (cron каждые 15 мин подберёт).
- **Feature flag** — `feature_flag:newbuild_alerts` в `system_settings`, по умолчанию on.
- **WhatsApp opt-in** — обязательно показывать чекбокс согласия и сохранять в `nb_alert_preferences.whatsapp_opt_in_at`.

---

## 6. Что НЕ входит в этот блок
- Двухсторонний WhatsApp inbox (только исходящие через UltraMSG).
- Per-project granular preferences (overrides) — сейчас глобально + on/off через favorite.
- Push-уведомления (есть `push_subscriptions`, но добавим отдельной задачей).
- Алерт «снижение цены» — таблица истории цен ещё не наполнена; сделаем плейсхолдер UI, отключённый.

---

## 7. Файлы

**Создаются:**
- migration `*_nb_alerts.sql`
- `supabase/functions/nb-process-alerts/index.ts`
- `supabase/functions/nb-process-saved-searches/index.ts`
- `supabase/functions/_shared/offplanFilter.ts`
- `src/hooks/useSavedOffplanSearches.ts`
- `src/hooks/useNewbuildAlertPreferences.ts`
- `src/pages/account/SavedSearches.tsx`
- `src/pages/account/NewbuildAlerts.tsx`
- `src/components/newbuilds/SaveSearchDialog.tsx`
- `src/components/newbuilds/FavoriteProjectButton.tsx`

**Редактируются:**
- `src/pages/property/Offplan*` (фильтр-бар: кнопка save)
- `src/components/newbuilds/NbProjectCard.tsx` (favorite кнопка)
- `src/lib/config/routes.ts` (маршруты)
- `src/lib/offplan/types.ts` (тип SavedSearch)
- `src/i18n/uiStrings.ts`
- `supabase/functions/_shared/email-templates.ts`
- cron schedule SQL (через insert tool с реальным ключом)

---

## 8. Acceptance

1. Юзер на `/property/offplan` ставит фильтры → «Сохранить поиск» → видит запись в `/account/saved-searches`.
2. На следующий день при появлении нового проекта под критерии — приходит email/WhatsApp с дайджестом, в логе строка.
3. Юзер ставит ❤️ на ЖК → в `/account/newbuild-alerts` видит его, включает WhatsApp.
4. Через `psql` инсертим тестовый `project_units` со status='available' → cron в течение 15 мин шлёт алерт; повторный запуск не дублирует (anti-spam).
5. RLS: чужие saved_searches/preferences/log невидимы.
