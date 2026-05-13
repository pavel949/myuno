
# Аудит CRM myUNO — куда пишутся данные, что ломается, что улучшить

## 1. Карта данных (что куда пишется)

В проекте уже **четыре параллельные «CRM-таблицы»** в `public`:

| Источник записи | Таблица | Где пишется |
|---|---|---|
| Owner CRM (Sales, /mc) | `crm_contacts`, `agent_deals`, `crm_contact_notes`, `crm_activities`, `crm_tasks`, `crm_meetings`, `crm_documents`, `crm_emails`, `crm_quotes` | `useCrmContacts`, `useAgentDeals`, `useCrmContactNotes`, `useCrm*` |
| Admin CRM (/admin/crm) | `vendor_prospects`, `mcc_leads`, `owner_prospects` | `useAdminCrmStats`, `VendorProspectsPipeline`, `MCCLeadsTab`, `AdminOwnerProspects` |
| Newbuilds (developer-portal) | `nb_leads` | `useNewbuildLeads` |
| Capital / Invest | `investment_deals` | `Capital*` |

**Важное наблюдение:** один и тот же человек (например, инвестор-партнёр, который потом купил для себя) может существовать одновременно в `vendor_prospects` + `crm_contacts` + `nb_leads` + `investment_deals` без связи между записями. Сейчас нет ни RPC, ни UI «promote prospect → contact», ни уникальных ключей `(company_id, phone)` / `(company_id, email)` — БД дубли не блокирует.

## 2. Конкретные проблемы экрана «New Deal» (на скриншоте)

Файл: `src/components/owner/sales/CreateDealSheet.tsx` + `src/pages/owner/NewDealPage.tsx`.

### 2.1 Дублирование одних и тех же данных в двух таблицах
В сделке `agent_deals` сохраняются `client_name/phone/email/budget_min/budget_max/currency/preferred_districts/preferred_types/bedrooms_min/client_source` — **те же** поля живут в `crm_contacts`. При создании сделки они пишутся в **обе** таблицы (lines 144-198), но:
- При редактировании сделки (`EditDealSheet`) контакт **не обновляется**.
- Если поменялся бюджет/предпочтения у контакта — сделка живёт со снапшотом.
- При выборе уже существующего `selectedContact` (lines 257-271) форма заполняется из контакта, но если пользователь меняет бюджет/предпочтения в форме сделки, **в контакт это не пишется** → расхождение.

→ Нет «источника правды» для предпочтений клиента.

### 2.2 Авто-создание контакта хрупкое
Lines 144-172: контакт создаётся **только если** заполнены `client_phone || client_email` И не выбран `selectedContact`. Если оператор ввёл только имя — сделка попадает в БД с `contact_id = null` (orphan), запись клиента нигде не остаётся.

Дубль-проверка (`useDuplicateCheck`, `useAgentDeals.ts:178`) работает по **точному** совпадению `eq('client_phone', phone)` без нормализации (+7 / 8 / пробелы / `+66 81…`). Реальные дубли пройдут.

### 2.3 VIP-флаг задвоен
Два независимых поля «VIP»: `agent_deals.is_vip` и тег `'VIP'` в `crm_contacts.tags` (+ `crm_contacts.is_vip`). В UI рядом стоят надписи «VIP client (deal)» и «Контакт отмечен как VIP», синхронизация — частичная (lines 68, 258-267).

### 2.4 prefilledContact перетирает ввод
Lines 53-71: `useEffect([prefilledContact, open])` перезаписывает форму каждый раз при `open === true`. Если пользователь открыл шит, начал править, что-то его перерендерило — теряются ручные правки.

### 2.5 Дубль поля «Проект»
В UI два контрола для одного и того же:
- `PropertySearchInput` с `includeProjects` (lines 319-337) → пишет в `property_project_id`.
- Отдельный `Select` «Project (offplan / newbuild)» (lines 341-363) → тоже пишет в `property_project_id`.

Если оператор выберет в обоих — побеждает ветка из `selectedProperty?.is_project`. Конфликт незаметен пользователю.

### 2.6 Вёрстка чипов «Deal Type» на 384px
Скриншот показывает: 8 чипов в один ряд → каждый сжат до 1 буквы по вертикали ("S/a/l/e", "Sh/ort-/Ter/m/Re/nt"). Не читается. Нужен flex-wrap или горизонтальный скролл.

### 2.7 Нет валидации телефона
Email валидируется regex'ом, телефон принимает что угодно. Дубль-проверка из-за этого не срабатывает.

### 2.8 Поля БД, до которых форма не дотягивается
В таблице `agent_deals` есть `pipeline_id`, `co_agent_id`, `co_agent_commission_pct`, `campaign_id`, `priority`, `tags`, `won_reason` — в New Deal **нет** ни одного. Их можно задать только через `EditDealSheet` после создания.

В `crm_contacts` Create-форма не пишет: `outreach_status`, `lead_score`, `pipeline_stage`, `pipeline_type`, `key_dates`, `linked_user_id`, `owner_user_id`, `last_activity_at`, `ai_summary` (но они есть в БД и местами читаются). Часть управляется триггерами/AI — это ок, но `owner_user_id` (ответственный) задавать вручную **надо** и нельзя.

## 3. Архитектурные проблемы CRM в целом

### 3.1 Нет уникальных индексов
В `crm_contacts` ровно 1 дубль по `phone` уже есть (видно в БД). Нужен:
```
CREATE UNIQUE INDEX crm_contacts_company_phone_uq ON crm_contacts(company_id, phone) WHERE phone IS NOT NULL AND phone != '' AND is_archived = false;
CREATE UNIQUE INDEX crm_contacts_company_email_uq ON crm_contacts(company_id, lower(email)) WHERE email IS NOT NULL AND email != '' AND is_archived = false;
```
+ нормализация телефона перед записью (только цифры).

### 3.2 Нет триггера auto-link deal→contact
Логика «сделка без contact_id → найти/создать контакт» сейчас живёт **только** во фронте (CreateDealSheet). API-вход (импорт, edge-функция, web-form) даёт orphan-сделки. Нужен trigger BEFORE INSERT/UPDATE на `agent_deals`.

### 3.3 Admin CRM ↔ Owner CRM не сшиты
Нет UI «конвертировать `vendor_prospect` / `mcc_lead` / `owner_prospect` в `crm_contacts`». На дашборде в `useAdminCrmStats` метрика «overall conversion» считается без понимания, что `won` vendor может стать `crm_contact`.

### 3.4 Источник правды для «предпочтения клиента»
Сейчас бюджет/районы/типы/спален хранятся И в контакте, И в каждой сделке. Решение: вынести «требования» (`requirement`) в отдельную таблицу `crm_requirements` (контакт ↔ N требований) и на сделке хранить `requirement_id`. Минимум — снять дубль и сделать сделку «снимком в момент создания», а контакт — актуальной картиной.

### 3.5 Audit / change-log
В БД есть `deal_field_changes`, `deal_stage_history`, `lead_activity_log`, `crm_access_log` — но в UI ContactDetail / SalesDealDetail таймлайн неполный. Надо проверить, что триггеры пишут (миграция аудита).

## 4. План правок (приоритет по влиянию)

### Wave A — баги и UX «New Deal» (frontend-only)
1. **Чипы Deal Type**: `flex-wrap gap-1.5` или `overflow-x-auto whitespace-nowrap`, чтобы на 384px не ломались.
2. **Убрать дубль «Project»**: оставить только `PropertySearchInput` (он уже умеет проекты), удалить отдельный Select «Project (offplan / newbuild)».
3. **Убрать перезапись формы**: `useEffect([prefilledContact])` срабатывает только при первом открытии (флаг `hasInitialized`), не при `open` каждый раз.
4. **VIP**: один тогл, источник правды — `agent_deals.is_vip` для сделки; галочка «также пометить контакт VIP» отдельно. Убрать дублирующий блок.
5. **Валидация телефона**: нормализация через `phone` (`+\d{8,15}`), показ ошибки.
6. **Дубль-проверка**: нормализованный поиск `phone like %digits-only%` + по email `ilike`.
7. **Создавать контакт всегда**, если введён хотя бы `client_name` (или name+phone/email). Сделка без `contact_id` запрещена в UI.
8. **При выборе существующего контакта**: блокировать редактирование name/phone/email на форме (показывать «Edit contact →»), чтобы не было silent drift.
9. **Sync назад в контакт**: если оператор поменял `budget_*`/`preferred_*` — спросить «обновить и контакт?» (один чекбокс).

### Wave B — backend целостности (миграция)
10. Уникальные индексы по `(company_id, phone-normalized)` и `(company_id, lower(email))`.
11. Триггер `agent_deals_autolink_contact()`: BEFORE INSERT, если `contact_id IS NULL` и есть `client_phone/email` → найти в `crm_contacts`, иначе вставить и привязать.
12. Триггер `crm_contacts_normalize_phone()`: перед INSERT/UPDATE приводить `phone`/`whatsapp`/`mobile` к `+digits`.
13. Скрипт-миграция: смерджить найденный 1 дубль (вызвать `useDeduplicate` из `useCrmDuplicates`).

### Wave C — единая модель «requirements»
14. Новая таблица `crm_requirements (id, company_id, contact_id, deal_id, budget_min, budget_max, currency, preferred_districts, preferred_types, bedrooms_min, source, snapshot_at)`.
15. Адаптеры: `agent_deals` показывает требования через join, не хранит дубль; `crm_contacts` — «активный requirement».
16. Backfill из текущих полей.

### Wave D — связка Admin↔Owner CRM
17. RPC `convert_prospect_to_contact(prospect_id, prospect_type)` — копирует данные в `crm_contacts`, ставит `source_entity_type/_id`, статус prospect → `converted`.
18. Кнопка «Перевести в клиенты» в `VendorProspectDetail`, `MCC lead`, `OwnerProspect`.
19. Фильтр в `ContactsList`: «Только конвертированные из prospect».

### Wave E — полнота полей в Create-формах
20. В `CreateDealSheet`: добавить `pipeline_id` (если company пользуется кастомными pipelines), `priority`, `tags`, `co_agent_id` (опционально, collapsable «advanced»).
21. В `CreateContactSheet`: добавить `owner_user_id` (ответственный менеджер), `lifecycle_stage` (выбор), `lead_temperature`.

## 5. Технические детали

```text
Файлы под правку (Wave A):
- src/components/owner/sales/CreateDealSheet.tsx  (UX, дубль project, VIP, init-effect, валидация)
- src/hooks/useAgentDeals.ts                      (useDuplicateCheck → нормализация)
- src/lib/phone.ts (новый)                        (normalizePhone)

Файлы Wave B (миграции):
- supabase/migrations/* — uniq indexes + триггеры

Файлы Wave C-E — отдельный roadmap, требуют согласования модели данных перед стартом.
```

**Out of scope сейчас:** редизайн Admin CRM, sequences/workflows engine, миграция Capital deals в общий контейнер.

## 6. Что я хочу подтвердить перед стартом

1. Стартуем с **Wave A + B** одной итерацией (UX + целостность БД), Wave C-E — отдельными PR-ами после твоего апрува модели?
2. Нужно ли при выборе существующего контакта **блокировать** редактирование его контактных данных в форме сделки (рекомендую: да), или оставить «editable + warning»?
3. Подтверди: единый источник правды для «предпочтений клиента» — это `crm_contacts` (на сделке хранится снимок только для исторической сделки)?

**Рекомендую:** да на (1), да на (2), да на (3). Это снимает 80% текущей путаницы за минимум кода.
