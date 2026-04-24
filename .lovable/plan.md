

# Stage 4 — Унификация Outreach Engine (без потерь)

## Что нашёл фактически (важная корректировка)

В БД нет `outreach_campaigns`. Вместо одного движка работают **четыре независимых системы** с разными моделями владения, каналами и состоянием:

| Система | Таблицы | Цель | Кто пишет | Строк |
|---|---|---|---|---|
| **MC Sequences** | `crm_sequences` + `_steps` + `_enrollments` | Многошаговый drip для контактов MC (гости/арендаторы/owners) | MC team (`company_id`) | 0 |
| **Capital Outreach** | `capital_outreach` + реакции | 1:1 «сегодня позвонить инвестору» feed | Capital agent (`user_id`) | — |
| **Capital Campaigns** | `capital_campaigns` | Контейнер кампании (fundraise/project) — без сообщений | Capital agent | 0 |
| **Vendor Outreach** | `vendor_outreach_log` + `_templates` + `vendor-outreach-agent` edge fn | AI-аутрич вендорам (email/WhatsApp/Instagram) с автоfollow-up | Admin | log: 0, templates: **5** |
| **MCC Campaigns** | `mcc_campaigns` + `_creatives` + `_channel_metrics` | Маркетинговые кампании (acquisition/awareness) с бюджетами и креативами | MCC admin | 0 |

Из 5 систем **только vendor templates содержат данные (5 шаблонов)**. Остальные пусты. MC client (386 контактов в `crm_contacts`) ещё не запускал ни одной sequence. Это даёт максимальную свободу: **можно реально консолидировать, а не только "обернуть фасадом"**.

## Принцип Stage 4

**Не переписывать рабочие движки, а ввести единый слой "Outreach" поверх них** — общий dispatcher, общую таблицу шаблонов и единый UI-хаб. Источники остаются (RLS не трогаем), но появляется **единый язык: campaign → audience → channel → template → message → response**.

```text
┌──────────────────────────────────────────────────┐
│           /outreach (Unified Hub)                │
│   Tabs: Vendors · Investors · Guests/MC · Mktg   │
└──────────────────────┬───────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   outreach_       outreach_     outreach_
   templates       messages      audiences (view)
   (общая)         (общая лог)   (3 источника)
        │              │
        └──────────────┴──────► dispatch-outreach (edge fn)
                                  ├─ vendor: WhatsApp/Email
                                  ├─ investor: WhatsApp/TG
                                  └─ guest: Email/WhatsApp
```

## План в 5 шагов

### Шаг 1 — Единая таблица шаблонов `outreach_templates`

Создать `outreach_templates` как объединение `vendor_outreach_templates` + steps из `crm_sequences` + capital templates.

```text
outreach_templates (
  id uuid PK,
  audience_type text  -- 'vendor' | 'investor' | 'guest' | 'owner' | 'mcc_lead'
  channel text        -- 'email' | 'whatsapp' | 'telegram' | 'sms' | 'instagram_dm'
  language text       -- 'ru' | 'en' | 'th'
  stage text          -- 'initial' | 'followup_1..3' | 'meeting' | 'proposal' | 'thank_you'
  subject text,
  body text NOT NULL,
  variables text[],
  company_id uuid,    -- nullable для админских/глобальных
  created_by uuid,
  is_active bool default true,
  source_table text   -- откуда мигрирован (audit), nullable
)
```

Миграция данных: 5 строк из `vendor_outreach_templates` копируются в `outreach_templates` с `audience_type='vendor'`. Старая таблица **остаётся** (используется `vendor-acquisition` edge fn) — синхронизируется триггером `vendor_outreach_templates → outreach_templates`. Через 2 спринта старая удаляется.

RLS: глобальные шаблоны (`company_id IS NULL`) видны admin; MC-шаблоны — членам соответствующей `management_companies`.

### Шаг 2 — Единый лог сообщений `outreach_messages`

```text
outreach_messages (
  id uuid PK,
  identity_id uuid FK contact_identities(id),  -- ключ: используем Stage 1!
  audience_type text,
  channel text,
  template_id uuid FK outreach_templates(id),
  campaign_id uuid,                  -- nullable, ссылка на любую campaign-таблицу через source
  campaign_source text,              -- 'capital_campaigns' | 'mcc_campaigns' | 'crm_sequences' | NULL
  campaign_source_id uuid,
  subject text, body text,
  status text,                       -- 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed'
  sent_at, opened_at, clicked_at, replied_at timestamptz,
  followup_sequence int default 0,
  next_followup_at timestamptz,
  response_type text,                -- 'interested' | 'not_now' | 'declined' | 'no_response'
  error_message text,
  created_by uuid, created_at timestamptz
)
```

**Ключевое:** `identity_id` (из Stage 1 = `contact_identities`) делает невозможным «бомбить одного человека из 3 источников» — dispatcher проверяет дубли по identity за последние N дней.

Backfill: `vendor_outreach_log` → `outreach_messages` (resolve `contact_id`→`identity_id` через `contact_identity_links`). Старая таблица остаётся read-only до подтверждения.

### Шаг 3 — Edge Function `dispatch-outreach` (единый отправщик)

Один путь для всех каналов и аудиторий:

```text
POST /functions/v1/dispatch-outreach
{
  identity_ids: ["..."],
  template_id: "...",       // ИЛИ inline: { subject, body, channel }
  audience_type: "vendor",
  campaign_source?: "capital_campaigns",
  campaign_source_id?: "...",
  scheduled_at?: ISO8601,
  dry_run?: boolean
}
```

Поведение:
1. Валидирует доступ (RLS: только admin/owner identity'ев);
2. Проверяет анти-спам: «не писать одной identity чаще 1 раз в N дней по этому каналу»;
3. Резолвит контакт по `audience_type` (vendor → email/whatsapp из `crm_contacts`; investor → channels из `capital_contacts`);
4. Шлёт через существующие провайдеры (`send-email-resend`, `send-whatsapp`, `send-telegram`);
5. Пишет в `outreach_messages`;
6. Если шаблон в sequence — планирует следующий шаг через `next_followup_at`.

**Не дублируем**: дёргаем уже работающие функции `vendor-outreach-agent` (для AI-персонализации vendor) и `send-*` адаптеры. Новый код — только тонкий orchestrator.

### Шаг 4 — Унифицированный UI `/outreach`

Один маршрут с табами по audience. Все три старые точки входа становятся редиректами:

| Старый URL | Новый URL |
|---|---|
| `/admin/crm?tab=outreach` (Vendor panel) | `/outreach?audience=vendor` |
| `/capital/outreach` | `/outreach?audience=investor` |
| `/mc/sequences` | `/outreach?audience=guest&company=…` |

Структура страницы `/outreach`:
- **Табы**: Vendors / Investors / Guests (MC) / Marketing (MCC)
- **Левая колонка**: список campaigns (читается из 3 источников через view `v_outreach_campaigns_unified`)
- **Центр**: live feed `outreach_messages` с фильтрами по статусу/каналу/identity
- **Правая колонка**: «Today» (Capital-style 1:1 actions) + библиотека шаблонов

Существующие компоненты переиспользуются:
- `VendorOutreachPanel.tsx` → становится содержимым таба «Vendors»
- `CapitalOutreach.tsx` (Today feed) → содержимое таба «Investors»
- Sequence builder из `useCrmSequences` → таб «Guests»
- `mcc_campaigns` → таб «Marketing»

### Шаг 5 — View `v_outreach_campaigns_unified` + `v_outreach_messages_with_identity`

Чтобы Admin видел все 3 движка в одном списке без ALTER на исходных таблицах:

```sql
CREATE VIEW v_outreach_campaigns_unified AS
  SELECT id, name, 'capital_campaigns'::text src, status, created_at, user_id::text owner
    FROM capital_campaigns
  UNION ALL
  SELECT id, name, 'mcc_campaigns', status, created_at, created_by::text
    FROM mcc_campaigns
  UNION ALL
  SELECT id, name, 'crm_sequences', CASE WHEN is_active THEN 'active' ELSE 'paused' END,
         created_at, created_by::text
    FROM crm_sequences;
```

`SECURITY INVOKER` → каждый видит только своё.

## Таблица «что остаётся / что меняется / что редиректит»

| Сущность | Действие |
|---|---|
| `crm_sequences` + steps + enrollments | **Остаётся.** Используется как «sequence engine» для guest аудитории. |
| `vendor_outreach_log` | Read-only после backfill. Удалить через 1 спринт. |
| `vendor_outreach_templates` | Остаётся, синхронизируется с `outreach_templates` триггером. |
| `vendor-outreach-agent` edge fn | Остаётся, вызывается из `dispatch-outreach` для AI-персонализации vendor. |
| `capital_outreach` | Остаётся (специфичная логика реакций инвесторов). UI переезжает в таб. |
| `capital_campaigns`, `mcc_campaigns` | Остаются как контейнеры; новые сообщения логируются в `outreach_messages`. |
| `/admin/crm`, `/capital/outreach`, `/mc/sequences` | Редиректы → `/outreach?audience=...` |

## Что НЕ делаем

- ❌ Не удаляем `crm_sequences` — это работающий движок с FK от `agent_deals`
- ❌ Не мигрируем `vendor_outreach_templates` физически — синхронизация через trigger
- ❌ Не трогаем edge fn `vendor-outreach-agent` (там AI-логика, риск регресса)
- ❌ Не объединяем `capital_campaigns` и `mcc_campaigns` — разные модели владения и метрики

## Технические детали (по шагам)

### Миграция БД (одна, идемпотентная)
1. `CREATE TABLE outreach_templates` + RLS (admin/MC)
2. `CREATE TABLE outreach_messages` + индексы (`identity_id`, `next_followup_at WHERE status='queued'`, `(audience_type, status)`) + RLS
3. `INSERT INTO outreach_templates SELECT … FROM vendor_outreach_templates` (audience='vendor')
4. `INSERT INTO outreach_messages SELECT … FROM vendor_outreach_log JOIN contact_identity_links` (resolve identity)
5. Trigger `vendor_outreach_templates_sync` → `outreach_templates`
6. `CREATE VIEW v_outreach_campaigns_unified` (SECURITY INVOKER)
7. `CREATE VIEW v_outreach_messages_with_identity` (join с `contact_identities`)
8. `CREATE FUNCTION outreach_throttle_check(_identity uuid, _channel text, _window interval) RETURNS boolean` — для anti-spam в dispatcher

### Edge Function
- Новая: `supabase/functions/dispatch-outreach/index.ts` (~250 строк, использует `_shared/admin-config.ts`)
- Зависимости: уже существующие `send-email-resend`, `send-whatsapp`, `send-telegram-message`

### Новые/изменённые файлы кода
- **New:** `src/pages/outreach/OutreachHub.tsx`, `src/components/outreach/OutreachAudienceTabs.tsx`, `src/components/outreach/OutreachComposer.tsx`, `src/components/outreach/OutreachTemplateLibrary.tsx`, `src/hooks/useOutreachMessages.ts`, `src/hooks/useOutreachTemplates.ts`, `src/hooks/useDispatchOutreach.ts`
- **Modified:** `src/lib/config/routes.ts` (+`OUTREACH = '/outreach'`), `src/components/layout/AnimatedRoutes.tsx` (+route+ редиректы), `src/components/layout/pageRegistry.ts`
- **Refactored (минимально):** `VendorOutreachPanel.tsx`, `CapitalOutreach.tsx` — обёрнуты в табы, источник данных не меняется на этом этапе
- **Redirects (1 строка каждый):** `/admin/crm?tab=outreach`, `/capital/outreach`, `/mc/sequences` → `/outreach?audience=…` (preserve query)

### Откат
- `DROP VIEW v_outreach_*` — UI деградирует на старые компоненты (они остались)
- `DROP TABLE outreach_messages, outreach_templates CASCADE` — данные клиента не задеты (vendor_outreach_log/templates целы)
- `DROP FUNCTION dispatch-outreach` — старые пути работают
- Все 5 шагов независимы

## Эффект для MC-клиента

Ноль. У них:
- 0 sequences → нечего ломать
- 0 outreach сообщений → backfill пустой
- `crm_contacts` не трогается
- `crm_sequences` остаётся рабочим — если они начнут использовать, выйдут уже на новый `/outreach?audience=guest`

## Что получаем

1. **Один URL** для всех outreach-операций вместо трёх
2. **Anti-spam guarantee**: одна identity не получит 3 сообщения от 3 систем за день
3. **Единая аналитика**: open/click/reply rate по audience и channel в одном дашборде
4. **Готовность к scale**: новый канал (например, Viber) подключается в одной edge fn, не в трёх
5. **Identity-aware**: каждое сообщение привязано к человеку, а не к строке в исходной таблице

## Резюме

Stage 4 = **identity-aware unified outreach layer**. Три рабочих движка остаются, но получают общий dispatcher, общую таблицу шаблонов, единый лог сообщений и один UI-хаб `/outreach`. Vendor templates (5 строк) — единственные реальные данные — мигрируются через триггер. Откат каждого шага независим. Срок: ~1 день работы.

Если одобряешь — начинаю с **Шага 1+2 (миграции БД)**, затем Шаг 3 (dispatcher), затем Шаги 4–5 (UI + views + редиректы).

