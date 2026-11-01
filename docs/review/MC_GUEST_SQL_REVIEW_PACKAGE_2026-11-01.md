# Ревью-пакет: SQL-активация для управляющей компании (MC) и гостевых заявок

**Статус: материал для ревью. Это НЕ одобрение, НЕ план к немедленному исполнению и НЕ разрешение применять SQL.**
Ничего из описанного ниже не применялось ни к одной базе. Все выводы получены чтением SQL и локальными тестами на изолированном PostgreSQL 16; живая схема Lovable Cloud (`kakkwibljrjsawxgnupk`) из этой сессии недоступна, поэтому совместимость с боевой базой **не проверена** (см. раздел 6).

Дата подготовки: 2026-11-01. Подготовил: Claude Code по запросу владельца.

## 0. Что и из каких веток рассматривается

| Что | Где | Состояние |
|---|---|---|
| SQL-кандидаты шагов A–D | ветка `codex/wip-mc-guest-handoff-20261025`, коммит `7e03ed765` (поверх `#183`, коммит `397c2886c`) | не влиты в `main`, не применены |
| Укрепление приёма заявок (#182) | `main`, `docs/hardening/consultation-intake/{forward,rollback}.sql` | код клиента в `main`, **SQL не применён** |
| Контейнмент холдов/чекаутов новостроек (#177) | `main`, `docs/newbuilds/project-unit-containment.sql` | справочный SELECT-инвентарь, не применяется |
| Исходный порядок активации (автор) | `docs/convergence/mc-authoring-activation/activation-order.md` в WIP-ветке | основа раздела 5 |

## 1. Что именно разблокирует каждый шаг (для владельца)

| Процесс, который сейчас не работает | Шаг | Что нужно |
|---|---|---|
| Создание комплексов/объектов управляющей компанией (интерфейс вызывает RPC, которых нет в живой базе) | **B** | `checked-publication` + `idempotent-create` |
| Двойной клик и «потерянный ответ» не должны создавать второй объект | **B** | `idempotent-create` |
| Задачи сотрудников: создание, назначение, завершение только назначенным исполнителем, серверный контроль `completed_by/at` | **C** | `task-commands` (после B) |
| Заявка гостя на объект, её открытие после перезагрузки, списки бронирований гостя и менеджера, принятие/отклонение с освобождением календаря | **D** | `property-reservation-lifecycle` (после preflight) |
| Публичный каталог не должен быть путём записи в `properties` | **A** | `public-property-catalog-readonly` |
| Повторная отправка консультации не создаёт дубль | intake | `consultation-intake/forward.sql` |

Важно: **шаг D нужен и для гостевой заявки, и для списков бронирований менеджера одновременно**: новый интерфейс (WIP) читает оба списка только через `list_*_checked`.

## 2. Опись кандидатов

Хэши — SHA-256 файлов в указанной ревизии. Любое изменение файла меняет хэш и требует нового ревью.

| Шаг | Файл | Строк | SHA-256 |
|---|---|---:|---|
| A | `public-property-catalog-readonly.candidate.sql` | 9 | `c43536424c147a47fb40fdc84b9646b6acb72e5ac2612e11fe2358b8c194878b` |
| B1 | `docs/convergence/employee-property-publication/checked-publication.candidate.sql` | 401 | `e020671fb695cf56032bf1a9516ba11f00a10e8f56c4a168abcc1c866f96e760` |
| B2 | `idempotent-create.candidate.sql` | 131 | `26077059bac2d8925a5278c6f4e95c05abe98ec020431dd27948b5a6d5d5445c` |
| C | `task-commands.candidate.sql` | 254 | `15deb54080333b77c3ab7bd1f2096f56739072915491acb7a8bc02addb4ef394` |
| D | `property-reservation-lifecycle.candidate.sql` | 839 | `0133f252e089d35d6377cf3d39e82bd87375cdce153bab3c20933cc0bd714b20` |
| intake | `docs/hardening/consultation-intake/forward.sql` | 128 | `f847f30fad454f2b29c316b50918ebb6c83de3021f33598cd039b20638121990` |
| preflight B/C | `preflight.sql` | 46 | `20e7db25d33e…` (read-only) |
| preflight D | `reservation-preflight.sql` | 62 | `bc273f022de5…` (read-only) |
| откат B2 | `docs/hardening/rollback/mc_authoring_idempotent_create.candidate.sql` | 9 | `41d01bd69f4d…` |
| откат C | `docs/hardening/rollback/mc_task_commands.candidate.sql` | 9 | `da7d8ee75362…` |
| откат D | `docs/hardening/rollback/property-reservation-lifecycle-stop.sql` | 12 | `b90d14195c56…` |
| откат intake | `docs/hardening/consultation-intake/rollback.sql` | 13 | `c7d97c6b6aa8…` |

Файлы A–D лежат в `docs/convergence/mc-authoring-activation/` WIP-ветки, если не указан другой путь.

## 3. Что меняет каждый шаг

### Шаг A — каталог только для чтения (риск: низкий; срочность: проверить первой)
- `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.public_property_catalog FROM PUBLIC, anon, authenticated`; `GRANT SELECT … TO anon, authenticated`. Одна транзакция, 9 строк, **только отзывает** права записи.
- Причина (из описания #183): живое представление автоматически обновляемо и сохраняет легаси-права записи у `anon`/`authenticated`. Является ли это эксплуатируемым, зависит от опций представления (`security_invoker`) и RLS на `public.properties`; это показывает `preflight.sql`. **Из этой сессии проверить нельзя.**
- Рекомендация: оценить этот шаг первым и независимо от остальных. Он ничего не ломает для чтения и закрывает потенциальный путь записи в объекты через публичный каталог.

### Шаг B1 — защищённое создание/чтение/сохранение объектов (риск: средний)
- Схема: `properties` + столбцы `content_author_user_id`, `checked_task_commands_enforced boolean NOT NULL DEFAULT false`; индекс `properties_content_author_company_idx`.
- Функции: 15, из них 8 `SECURITY DEFINER` (`create_managed_property_checked`, `save_/read_managed_property_draft_checked`, `list_managed_property_drafts_checked`, `review_property_submission_checked`, `audit_managed_property_publication` и др.).
- Триггеры на `public.properties` (INSERT/UPDATE): `zz_guard_managed_property_publication`, `audit_managed_property_publication`.
- Политика: `reserve_managed_publication_audit_actions` на `public.property_activity_log`, **`AS RESTRICTIVE … FOR INSERT`**. Ревьюеру: убедиться, что она не блокирует существующие записи в журнал активности из других мест.
- В WIP этот файл отличается от версии в #183: добавлен столбец `checked_task_commands_enforced`, требование **активной** компании (`is_active IS TRUE`) и включение контроля задач для новых объектов. Из-за этого тест `employeeActivationBundle.test.ts` падает (7 тестов): манифест хранит хэш прежней версии. Хэш нельзя править без повторного ревью новой версии.

### Шаг B2 — идемпотентное создание (риск: низкий–средний)
- `properties` и `property_complexes` + столбцы `authoring_create_key`, `authoring_create_fingerprint`; уникальные индексы `property_authoring_create_key`, `complex_authoring_create_key`.
- 5 функций (4 `SECURITY DEFINER`), триггеры-стражи на обеих таблицах.
- Повторная отправка с тем же ключом возвращает тот же объект; тот же ключ с изменёнными данными отклоняется.

### Шаг C — команды задач (риск: средний)
- Функции: 11 (8 `SECURITY DEFINER`): создание/назначение/правка/завершение задач, проверка исполнителя.
- Триггер `zz_guard_managed_task_commands` на `public.property_operational_tasks` (INSERT/UPDATE/DELETE) и `zz_guard_checked_task_activation` на `properties`.
- Политика `managed_task_staff_read_ceiling` — **RESTRICTIVE, FOR SELECT** на `property_operational_tasks`.
- Действует только для объектов с `checked_task_commands_enforced = true` (по умолчанию `false`). Включение для существующих объектов — **отдельное согласование**, а не часть миграции.
- `ADD COLUMN IF NOT EXISTS checked_task_commands_enforced` — безопасен только **после** B1, где столбец добавляется обычным `ADD COLUMN`. **Порядок B → C обязателен**; обратный порядок уронит B1.

### Шаг D — жизненный цикл резерваций (риск: ВЫСОКИЙ)
Самый крупный и самый рискованный пакет: 839 строк.
- Новая схема `pms_commands` (без `IF NOT EXISTS`: упадёт, если схема уже есть), таблицы `manual_booking_receipts`, `legacy_unpaid_reconciliation`.
- 16 функций (12 `SECURITY DEFINER`), в том числе `create_property_reservation_checked`, `list_property_reservations_checked`, `list_my_property_reservations_checked`, `create_manual_property_booking`, `change_property_booking`.
- **Триггеры «только через команды» на основных таблицах:** `orders` (UPDATE/DELETE), `order_items`, `order_status_history`, `order_participants`, `property_bookings` (все INSERT/UPDATE/DELETE) и защитные триггеры на `payment_intents`, `ledger_entries`, `manual_payment_requests`, `property_financials`, `property_availability`.
- **Новый `UNIQUE INDEX property_lifecycle_import_identity ON property_bookings(property_id, external_id)` на живой таблице.** Если в данных уже есть дубли (например, после iCal-импортов), создание сорвётся; обычный (не `CONCURRENTLY`) индекс блокирует запись в `property_bookings` на время построения. **Нужна предварительная проверка на дубли.**
- Эффект на существующий код: любой писатель в эти таблицы по пути «напрямую» (админка, iCal-синхронизация, Stripe-вебхук, финансовые мосты, импорт) для property-заказов будет отклонён триггерами. Автор прямо требует просмотреть **все** такие писатели на совместимость. Это не сделано.
- Требует настройки: схема `pms_commands` **не должна** входить в список открытых Data API схем.

### intake — укрепление консультаций (#182; риск: низкий–средний)
- Столбцы в `consultation_requests` (`intake_request_key`, `intake_actor_key`, `intake_payload_hash`), уникальный индекс `consultation_intake_actor_key_uniq`, схема `private`, функция `submit_consultation_request(jsonb)`.
- **Единственный пакет с `EXECUTE` для `anon`** (публичная форма), вместе с каталогом (A, только SELECT).
- Клиент уже в `main` и передаёт ключ внутри существующего jsonb-аргумента, поэтому до применения SQL работает со старой функцией без идемпотентности.
- Откат ставит приём заявок на паузу (`consultation_intake_temporarily_unavailable`), данные и ключи сохраняются.

## 4. Что проверено автоматически, что видно по коду

Проверено **чтением самого SQL** (скрипт-разбор, затем ручная сверка по спорным местам):
- Во всех кандидатах **нет записи данных вне тел функций** (никаких `INSERT/UPDATE/DELETE/TRUNCATE` на верхнем уровне, никаких сидов прав, участников или объектов).
- У **каждой** функции `SECURITY DEFINER` задан `SET search_path` (счётчики совпадают: B1 8/15, B2 4/5, C 8/11, D 12/16, intake 2/3 — `SET search_path` есть у всех функций).
- Выдач прав роли `anon` нет ни в B, ни в C, ни в D; они выдаются только `authenticated` и `service_role`.
- Оба preflight-скрипта читают только метаданные (структуру, политики, права, определения функций), D — в `READ ONLY` транзакции с `REPEATABLE READ`.
- Откаты B2, C и D — **ограничивающие остановки** (отзыв `EXECUTE`), а не обратные миграции. Данные, чеки, журналы и инвентарь сохраняются.

Проверено **локальными тестами** на PostgreSQL 16 (в CI автор тестировал на 17.x): полный прогон WIP-ветки поверх `main` — 4679 тестов прошли, 7 упали (манифест, см. B1). В том числе `managedPropertyPublication.postgres` (115), `managedComplexPublication.postgres` (75), `managedTaskCommands.postgres` (12) + unit (11), `managedGuestReservation.postgres` (60, 1 пропущен), `publicPropertyCatalog.postgres` (6), `consultationIntake.postgres` (23), `MCBookingsPage` (22), `PropertyInquiry.context` (8). Typecheck, линт (0 ошибок) и production-сборка проходят.

## 5. Рекомендуемый порядок и критерии GO / NO-GO

Каждое действие — отдельное письменное согласование, свежий preflight непосредственно перед ним и postflight сразу после.

| № | Шаг | GO, если | Пауза между шагами |
|---|---|---|---|
| 1 | **A** | preflight показал `is_updatable` и write-гранты; ревью принято | нет |
| 2 | **B1 → B2** | хэши пересчитаны и перепроверены; манифест обновлён после ревью; тест `employeeActivationBundle` зелёный | проверить создание объекта в изолированной сессии |
| 3 | **C** | B применён; решено, для каких существующих объектов включить контроль | включение по объектам — отдельно |
| 4 | **D** | preflight D чист; **проверка дублей `(property_id, external_id)`**; ревью всех прямых писателей в `orders`/`property_bookings`; `pms_commands` вне Data API | окно обслуживания; бронь меняет доступность |
| 5 | интерфейс (WIP) | RPC шагов выше уже есть на живой базе | только после шагов 1–4 |
| — | intake | независимо от остальных | независимо |

**Правило автора, которое нужно сохранить:** интерфейс нельзя публиковать раньше базы. WIP вызывает RPC без запасного пути; без шагов B–D слияние WIP в `main` сломает заявки гостей и списки бронирований.

## 6. Чего я не знаю и не проверял

1. Соответствие кандидатов **живой** схеме Lovable Cloud. Сверка делается только `preflight.sql` / `reservation-preflight.sql` оператором с доступом к базе.
2. Эксплуатируемость шага A (опции представления и RLS). Нужен вывод `preflight.sql`.
3. Наличие дублей `(property_id, external_id)` в `property_bookings`.
4. Совместимость всех существующих писателей в основные таблицы с триггерами шага D.
5. Поведение на PostgreSQL 17 (у меня 16; различие: роль `MAINTAIN`).
6. Реальные данные: связь «владелец» для настоящих объектов Layantara, привязка к компании и пространству (шаг E в плане автора) — это **конфигурация данных**, а не SQL, и требует отдельного согласования.
7. Медиа: браузерные ограничения не отзывают у загрузившего сотрудника серверный доступ к уже опубликованным файлам.

## 7. Лист согласования (заполняет владелец)

| Шаг | Решение (GO / NO-GO / отложить) | Кто | Дата | Условия |
|---|---|---|---|---|
| A | | | | |
| B1 | | | | |
| B2 | | | | |
| C | | | | |
| D | | | | |
| intake | | | | |
