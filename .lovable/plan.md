
# План D: максимальная безопасная чистка БД (359 → ~300)

## Цель
Уменьшить количество таблиц с **359 до ~300** в три фазы. Каждая фаза независимо безопасна, имеет откат, и не требует переписывания работающих фич.

## Фаза 1 — Удалить полностью мёртвые таблицы (12 шт., 0 риска)

Таблицы с **нулевыми ссылками в коде** (даже в Edge Functions):
- `juristic_documents` — 0 ref
- `crm_score_log` — 0 ref
- `cohort_analytics`, `marketplace_product_attributes` (упоминаются только в типах)
- `experience_media`, `category_suggestions` — 1 ref каждая, в неиспользуемом коде

**Действие:** `DROP TABLE IF EXISTS ... CASCADE` в одной миграции.

---

## Фаза 2 — Удалить мёртвый код + связанные таблицы (~30 таблиц)

Найдено **~17 хуков**, которые **никогда не импортируются** из остального приложения:
- `useCrmSequences`, `useCrmQuotes`, `useCrmMeetings`, `useCrmEmails`, `useCrmDocuments`, `useCrmCompanies`, `useCrmCustomFields`, `useCrmWebForms`, `useCrmWorkflows`, `useCrmTemplates` — 10 enterprise-CRM хуков
- `useMCCAutomation`, `useMCCAnalytics`, `useMCCControlTower`, `useABVariants`, `useLandingRegistry`, `useCampaignFactory` — 6 marketing-cloud хуков

**Edge Functions для удаления** (нет триггеров, нет webhook-ссылок):
- `execute-campaign-rules`, `execute-crm-workflow`, `submit-web-form`, `send-crm-email`

**Связанные таблицы для DROP (после удаления кода):**
```
crm_workflows, crm_workflow_actions, crm_sequences, crm_sequence_steps,
crm_sequence_enrollments, crm_quotes, crm_meetings, crm_emails, crm_documents,
crm_companies, crm_custom_fields, crm_custom_field_values, crm_comm_templates,
crm_scoring_rules, crm_web_forms, crm_web_form_submissions, crm_access_log,

mcc_ab_tests, mcc_automation_rules, mcc_landing_events, mcc_user_states,
mcc_state_history, mcc_creatives, mcc_channel_metrics, mcc_ai_recommendations,
mcc_campaigns, mcc_campaign_rules
```

**Порядок работы:**
1. Удалить хуки + Edge Functions
2. Удалить пункты из `src/lib/untypedTables.ts` (строки 240-260)
3. Удалить компоненты-сироты: `MCCContentLabTab.tsx` (если не подключён)
4. Verify build → migration с `DROP TABLE`

**Риск:** низкий. Если что-то всё-таки используется — компиляция упадёт до миграции БД, легко откатить.

---

## Фаза 3 — Compat views для capital_*/deal_* (~13 таблиц)

Таблицы `capital_*` (8 шт.) и `deal_*` (4 шт.) полностью **дублируют** `crm_contacts` + `crm_pipeline_stages` + `crm_activities`. Все данные пустые. Frontend ссылается через `untypedFrom` → можно безболезненно подменить на VIEW.

**Маппинг:**
| Старая таблица | Новый источник | Дискриминатор |
|---|---|---|
| `capital_contacts` | `crm_contacts` | `pipeline_kind='capital'` |
| `capital_pipeline` | `crm_pipeline_stages` | `pipeline_id` ссылается на capital pipeline |
| `capital_campaigns` | (drop, нет UI) | — |
| `capital_intro_requests` | `crm_activities` | `activity_type='intro_request'` |
| `capital_projects` | `listings` | `vertical='investment'` |
| `deal_parties` | `order_participants` | — |
| `deal_stage_history` | `crm_activities` | `activity_type='stage_change'` |
| `deal_pipeline_stages` | `crm_pipeline_stages` | — |
| `deal_scheduled_activities` | `crm_activities` | `scheduled_for IS NOT NULL` |

**Действие:**
1. ALTER `crm_contacts` ADD COLUMN `pipeline_kind TEXT DEFAULT 'sales'` (если ещё нет)
2. CREATE OR REPLACE VIEW для каждой старой таблицы
3. CREATE TRIGGER ... INSTEAD OF INSERT/UPDATE/DELETE — маршрут в новую таблицу
4. DROP TABLE для старых (после смены типа на VIEW PostgREST продолжит работать)

**Риск:** средний. Триггеры INSTEAD OF требуют тестирования Capital Hub и Deal flow. Все эти таблицы пусты, поэтому миграция данных не нужна.

---

## Что НЕ трогаем

- 21 `property_*` таблица (`property_documents`, `property_inventory_items`, `property_guidebook` и т.д.) — **активно используются** в PMS компонентах, даже если пустые. Это работающие фичи без данных, не мусор.
- `mcc_leads` (5 ref) — реальный поток лидов в `useLeadHub`.
- `service_orders`, `juristic_requests`, `business_listings`, `investment_*` — рабочий фронтенд.
- Booking-таблицы (`airport_*`, `booking_*`) — используются в Edge Functions для чекаута.

---

## Итоговый эффект

| Фаза | Удалено таблиц | Хуков | Edge Functions | Остаток |
|---|---:|---:|---:|---:|
| Старт | — | — | — | 359 |
| Фаза 1 | -6 | 0 | 0 | 353 |
| Фаза 2 | -27 | -16 | -4 | 326 |
| Фаза 3 | -13 (DROP) +13 (VIEW) | 0 | 0 | **313 tables + 13 views** |

Реальное число **физических таблиц = ~313**. Views не считаются за таблицы.

## Откат

Каждая фаза = **одна миграция**. Откат через `git revert` миграции + восстановление из backup mirror DB (`erfwtoavipwjqmylpizt`). Все удаляемые таблицы пусты, поэтому потери данных невозможны.

## Тест-план после каждой фазы

1. `npm run build` — TypeScript компилируется
2. Открыть `/admin/marketing` — не должно быть 500
3. Открыть `/mc/crm` — список контактов работает
4. Открыть `/capital` — Capital Hub отображается
5. Создать тестовый CRM-контакт через UI
6. Supabase linter: 0 новых WARNING

## Файлы которые будут изменены (примерно)

- 3 миграции (по одной на фазу) в `supabase/migrations/`
- ~17 удалённых хуков в `src/hooks/`
- 4 удалённых Edge Function в `supabase/functions/`
- 1 правка `src/lib/untypedTables.ts` (удалить ~25 строк)
- 1 правка `src/integrations/supabase/types.ts` (auto-regen)
- Обновить `/mnt/documents/SCHEMA_AUDIT.md` с финальной картой

## Поэтапная доставка

Я буду коммитить **по одной фазе за раз** и ждать твоего "ок" перед следующей. Это даст возможность тестировать в проде между шагами.
