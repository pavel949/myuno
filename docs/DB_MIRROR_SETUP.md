# DB Mirror Snapshot — Setup Checklist

Зеркалирование БД **Lovable Cloud (`kakkwibljrjsawxgnupk`) → собственный Supabase (`erfwtoavipwjqmylpizt`)** через GitHub Actions cron каждые 6 часов.

Workflow: [`.github/workflows/db-mirror-snapshot.yml`](../.github/workflows/db-mirror-snapshot.yml)

---

## 🔑 Что нужно добавить в GitHub Secrets

Перейдите: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

| Имя секрета | Где взять | Обязательно? |
|---|---|---|
| `TARGET_SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard вашего проекта `erfwtoavipwjqmylpizt` → **Settings → API → Project API keys → `service_role`** (⚠️ **secret**, не `anon`) | ✅ ДА |

> **Только один секрет.** Source credentials (anon key Lovable Cloud) уже захардкожены в `scripts/export-data.mjs` — это безопасно, потому что anon key публичный.

### Как получить service_role key:

1. Откройте https://supabase.com/dashboard/project/erfwtoavipwjqmylpizt/settings/api
2. Раздел **Project API keys** → строка **`service_role`** → нажмите **Reveal** → скопируйте
3. ⚠️ Этот ключ обходит RLS — **никогда не коммитьте его, не публикуйте в чатах**
4. В GitHub: Settings → Secrets and variables → Actions → New repository secret
   - Name: `TARGET_SUPABASE_SERVICE_ROLE_KEY`
   - Value: вставьте ключ
   - Add secret

---

## 📋 Pre-flight checklist (один раз перед первым запуском)

### 1. Применить схему в target БД
Schema (514 миграций, таблицы, RLS, functions, triggers) должна **уже существовать** в `erfwtoavipwjqmylpizt`. Если нет:

```bash
npm i -g supabase
supabase login
supabase link --project-ref erfwtoavipwjqmylpizt
supabase db push
```

См. `scripts/MIGRATION_HOWTO.md` для полной инструкции.

### 2. Создать Storage Buckets вручную
В Supabase Dashboard `erfwtoavipwjqmylpizt` → Storage → New bucket:
- `avatars` (public)
- `listings` (public)
- `documents` (private)
- `property-images` (public)
- `vendor-uploads` (public)

> ⚠️ Этот workflow переносит **только данные таблиц**, не файлы Storage. Для Storage нужен отдельный скрипт (Вариант B).

### 3. Проверить что target БД пустая (или готова к перезаписи)
Скрипт `import-data.mjs` использует `upsert` с `ignoreDuplicates: true` — старые строки не перезаписываются, новые добавляются. Если хотите **чистый snapshot**, перед первым запуском очистите целевые таблицы вручную.

---

## 🚀 Запуск

### Автоматический
Cron сработает каждые 6 часов в `:17` минут (00:17, 06:17, 12:17, 18:17 UTC).

### Ручной (для теста)
1. GitHub Repo → **Actions** → **DB Mirror Snapshot (Lovable Cloud → Own Supabase)**
2. Кнопка **Run workflow** → ветка `main` → Run

### Просмотр результата
- **Actions → последний run → Summary** — общий отчёт
- **Artifacts** (внизу страницы run) — `db-snapshot-<run_id>.zip` с JSON всех таблиц (хранится 7 дней)
- **Logs** — построчный лог по каждой таблице (`✅ table: N rows` / `⚠️ error`)

---

## ⚠️ Известные ограничения

| Что | Статус | Решение |
|---|---|---|
| **Storage files** (изображения, документы) | ❌ Не переносятся | Нужен отдельный скрипт rsync через `supabase.storage.list/download/upload` |
| **Auth users** (`auth.users`) | ❌ Не переносятся через REST | Используйте `pg_dump` или `auth.admin.listUsers` API |
| **RLS-блокированные таблицы** | ⚠️ Частично | Anon key не видит закрытые таблицы. См. `tmp/export/_summary.json` после run — там список `blocked` таблиц. Для них нужен service_role key Lovable Cloud (запросите у поддержки Lovable). |
| **Edge Functions** | ❌ Не зеркалируются | Деплоятся через `supabase functions deploy` |
| **Секреты Edge Functions** | ❌ Не переносятся | Настройте вручную через `supabase secrets set ...` |
| **Realtime / Broadcast / Presence** | ❌ Не зеркалируется | Это runtime state, не persistent data |
| **Лаг** | До 6 часов | Уменьшить cron — но больше нагрузка на API. Для near-real-time см. Вариант B (triggers + Edge Function). |

---

## 🛡️ Безопасность

- ✅ `service_role key` хранится только в GitHub Secrets (зашифрован)
- ✅ Source anon key публичный — безопасно в коде
- ✅ Workflow запускается только из вашего репо, секрет не доступен в PR от форков
- ✅ Export artifacts хранятся 7 дней — после автоудаление
- ⚠️ **НЕ** включайте target БД в production trafffic, пока не верифицируете 1-2 успешных snapshot
- ⚠️ Не пишите в target БД параллельно — следующий snapshot затрёт изменения

---

## 🔧 Troubleshooting

**`SERVICE_ROLE_KEY env var not set`** — проверьте имя секрета: `TARGET_SUPABASE_SERVICE_ROLE_KEY` (точно так, case-sensitive).

**`relation "public.X" does not exist`** — schema не применена в target. Запустите `supabase db push`.

**Много `⚠️` в логе с `permission denied for table X`** — таблица закрыта RLS на source. Для полного дампа нужен service_role key Lovable Cloud (запросите у поддержки).

**Workflow timeout (>45 мин)** — увеличьте `timeout-minutes` в `.github/workflows/db-mirror-snapshot.yml` или уменьшите `BATCH` в `import-data.mjs`.

**FK violation на import** — порядок таблиц в `PRIORITY_TABLES` (см. `import-data.mjs`) может требовать корректировки. Добавьте недостающую родительскую таблицу в начало списка.

---

## 📊 Мониторинг

Рекомендуется:
1. **Включить email-уведомления GitHub** на failure: Settings → Notifications → Actions → "Only failed workflows"
2. **Telegram-алерт** на failure (опционально): добавить step с `curl` к Telegram Bot API в `if: failure()`
3. **Ежедневная проверка**: раз в день открывать Actions tab и смотреть, что зелёное

---

## 🔄 Дальнейшие шаги (опционально)

- **Storage mirror** — отдельный workflow для файлов
- **Auth users mirror** — SQL-based dump `auth.users` через service_role
- **Near-real-time** — Вариант B (DB triggers + Edge Function)
- **Failover** — DNS-переключение на target Supabase при инциденте Lovable Cloud
