

User wants a smoke test simulating 10 users on the real-estate block. Need to clarify approach since "10 users smoke test" can mean different things.

## План: Smoke-тест на 10 виртуальных пользователей

### Что я предлагаю

Скрипт-симулятор (Node/TS), который через Supabase JS client от имени **10 разных юзеров** прогоняет реалистичные сценарии блока «Недвижимость» и измеряет:
- HTTP/RPC статус каждого шага
- Время отклика
- Создаются ли реально записи в БД
- Где падают ошибки

### 10 пользовательских сценариев (по одному на юзера)

| # | Persona | Сценарий | Что проверяем |
|---|---------|----------|---------------|
| 1 | Гость-турист | Открыть `/property/rent` → загрузить листинг 12 объектов | properties query, RLS public read |
| 2 | Гость-инвестор | `/newbuilds` → фильтр по району → открыть карточку проекта | property_projects query, фильтрация |
| 3 | Гость-покупатель | `/property/buy` → открыть property_id → отправить inquiry | property_inquiries INSERT |
| 4 | Лид новостройки | `/newbuilds/:slug` → отправить NbLeadForm | nb_leads INSERT + attribution |
| 5 | Холодный лид | `/p/:slug` микросайт → форма консультации | consultation_requests INSERT |
| 6 | Зарегистрированный гость | Sign up → запросить просмотр объекта | auth.signUp + deal_viewings INSERT |
| 7 | Авторизованный | Sign in → открыть `/property/my` → создать favorite | property_favorites INSERT |
| 8 | Owner candidate | Открыть `/owner-portal` → нажать «Стать владельцем» | profile update path |
| 9 | Developer candidate | `/developer-portal/register` → submit | developer_users INSERT |
| 10 | Read-only crawler | Запросить 5 случайных `/p/:slug` микросайтов | landing_enabled gate, 404 rate |

### Реализация

**Файл:** `scripts/smoke-test-real-estate.ts` (запускается через `tsx`)

**Что делает:**
1. Создаёт 10 ephemeral test users (email: `smoke-{i}-{ts}@myuno.test`) через `supabase.auth.signUp` — или использует anon-сессию для гостевых сценариев
2. Для каждого юзера выполняет 1 сценарий из таблицы выше
3. Логирует timeline в консоль + JSON-отчёт в `/mnt/documents/smoke-test-{ts}.json`
4. В конце — cleanup: помечает все созданные записи `source='smoke_test'` чтобы потом легко удалить (или удаляет сразу для тестовых юзеров)

**Что НЕ делает:**
- Не имитирует реальный браузер (это не E2E через Playwright — это API-уровень)
- Не вызывает Stripe / платежи
- Не отправляет настоящие WhatsApp/email — формы полей `phone='+66 99 SMOKE TEST'`

### Формат отчёта

Markdown-таблица в чате:

| # | Сценарий | Шагов OK / Total | Avg latency | Записи созданы | Статус |
|---|---|---|---|---|---|
| 1 | Tourist rent browse | 3/3 | 142ms | — | ✅ |
| 4 | Newbuild lead | 2/3 | 380ms | nb_leads:1, attr:0 | ⚠️ attribution failed |
| 9 | Developer register | 0/2 | — | — | ❌ RLS denied |

Плюс **раздел «Найденные баги»** — конкретные RLS/валидационные ошибки с reproduction steps.

### Очистка тестовых данных

В конце скрипта SQL DELETE по маркеру:
```sql
DELETE FROM nb_leads WHERE source = 'smoke_test';
DELETE FROM property_inquiries WHERE message LIKE '[SMOKE TEST]%';
-- + auth.admin.deleteUser для всех smoke-{i}-{ts}@myuno.test
```

### Время
~8-10 минут (скрипт + прогон + отчёт + cleanup).

### Что НЕ трогаю
- Production-данные (только INSERT с маркером + удаление в конце)
- Настоящие email/WhatsApp нотификации (использую `dry_run` где возможно)
- Stripe/payments

