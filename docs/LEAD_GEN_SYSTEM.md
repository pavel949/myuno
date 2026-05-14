# Lead-Gen System for Real Estate Sales — Architecture & Operational Protocol

> **Статус:** draft v1.0 · 2026-05-14 · автор: Pavel
> **Цель документа:** единое описание системы лидогенерации на продажу недвижимости (off-plan + resale).
> **Принцип:** простая система. Pavel участвует только в двух точках — финал концепции и работа с квалифицированным лидом.

---

## 0. Context (почему сейчас)

**Сегодня:** лиды на продажу недвижимости приходят через личные знакомства и арендных клиентов. Системы нет. Pavel — единственная точка входа и закрытия.

**Цель:** превратить лидогенерацию в простой конвейер.

**Ключевой инсайт из аудита кода:** ~80% инфраструктуры уже есть в репо:
- CRM (`crm_contacts`, `crm_companies`, `crm_pipelines`, `crm_pipeline_stages`)
- Sales pipeline (`agent_deals` со стейджами new→qualified→...→closed_won)
- AI-генерация контента (`ai-content-planner`, `ai-generate-description`, `ai_agents` registry)
- Webhook-инфраструктура (`webhook_endpoints`, `webhook_deliveries`)
- WhatsApp-уведомления Pavel (`notify-lead-whatsapp` + UltraMSG)
- Lead-scoring (`score-lead`, `auto-lead-scoring`)
- Контент-календарь (`social_posts`, `social_content_calendar`)
- Listings (`properties`, `resale_properties`, `property_projects` с `commission_pct`)

**Не строим с нуля — сшиваем существующее в один операционный поток.**

---

## 1. Принципы (ODOO-style operational discipline)

1. **Один объект — одна Концепция (`lead_concept`).** Атом системы.
2. **Каждая стадия имеет владельца и триггер.** Никаких висящих состояний.
3. **Pavel вмешивается только когда нужен человек.** Всё остальное — автоматика.
4. **Все каналы дистрибуции = один webhook fan-out.** Pavel жмёт одну кнопку.
5. **Валидный контакт + интерес = квалифицированный лид.** Pavel доквалифицирует голосом.
6. **Комиссия трекается как событие сделки**, не отдельный модуль.
7. **Реюзаем существующие таблицы.** Новая таблица только одна — `lead_concepts`.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PAVEL (admin /admin/lead-gen)                                  │
│  1. Создаёт концепцию (property + USP + audience)               │
│  2. Жмёт "Generate" → AI делает 4 варианта поста                │
│  3. Редактирует, утверждает (status=approved)                   │
│  4. Жмёт "Publish" → fan-out во все каналы                      │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: concept-publish                                 │
│  ├─→ Telegram Bot API (прямо)                                   │
│  ├─→ Make.com webhook (Instagram + Facebook)                    │
│  ├─→ UltraMSG broadcast (WhatsApp список)                       │
│  └─→ Activates landing /p/[slug] на myuno.app                   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
                     [пост опубликован]
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  Лид кликает (любой канал):                                     │
│  • Landing → форма (name + contact + interest)                  │
│  • WhatsApp click-to-chat → автоматический шаблон               │
│  • Telegram → DM боту с UTM                                     │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: lead-capture                                    │
│  1. crm_contacts (concept_id, lead_source_channel)              │
│  2. agent_deals (stage=new, concept_id)                         │
│  3. score-lead → AI score                                       │
│  4. notify-lead-whatsapp → Pavel получает алерт                 │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  PAVEL (admin /admin/lead-gen → Pipeline)                       │
│  Kanban: new → contacted → qualifying → negotiating → closed    │
│  Карточка: контакт + концепция + WhatsApp-link + notes          │
│  Закрытие: вводит deal_value → комиссия считается автоматом     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Operational Cycle (полный путь: концепция → комиссия)

| # | Стадия         | Кто     | Где                          | Триггер → результат |
|---|----------------|---------|------------------------------|--------------------|
| 1 | **Brief**      | Pavel   | `/admin/lead-gen`            | Выбирает property (off-plan или resale), заполняет 4 поля: USP, аудитория, ценовая вилка, целевое действие |
| 2 | **Generate**   | AI      | `concept-generate` EF        | На входе brief → на выходе: TG-пост + IG/FB-копия + WhatsApp-сообщение + landing-текст. Используется `ai-generate-description` + tone-of-voice из `docs/canonical/03-tone-of-voice.md` |
| 3 | **Review**     | Pavel   | UI Concept editor            | Видит все 4 варианта рядом, редактирует inline, прикладывает 3-5 фото, жмёт **Approve** → `status=approved` |
| 4 | **Publish**    | system  | `concept-publish` EF         | Один клик → fan-out: TG Bot API + Make.com webhook (IG/FB) + UltraMSG broadcast + landing `/p/[slug]` активируется. `published_at` записывается |
| 5 | **Capture**    | system  | `lead-capture` EF            | Лид приходит → `crm_contacts` + `agent_deals` (stage=`new`) + AI-score + WhatsApp пингует Pavel |
| 6 | **Triage**     | Pavel   | Kanban / WhatsApp            | Pavel получает WhatsApp с именем + контактом + ссылкой на лида. Кликает — открывается карточка |
| 7 | **Contact**    | Pavel   | WhatsApp / звонок            | Pavel пишет лиду. После — в карточке переключает stage → `contacted` |
| 8 | **Qualify**    | Pavel   | карточка лида                | В разговоре уточняет бюджет/таймлайн. Стейдж → `qualifying` или → `closed_lost` с причиной |
| 9 | **Viewing/Nego** | Pavel | реальный мир                 | Стейджи `viewing` и `negotiating` помечаются вручную после действия |
| 10 | **Close**     | Pavel   | карточка лида                | `closed_won`: вводит реальную цену сделки → автомат расчёт комиссии по `property_projects.commission_pct` (off-plan 5-10%) или фикс % для resale (2-3%). Запись в `agent_deals.commission_amount` |
| 11 | **Report**    | system  | Reports tab                  | Weekly funnel: concepts published × leads × qualified × closed_won × commission_total |

---

## 4. Что использовать существующего (НЕ строим заново)

| Существующий компонент | Путь | Роль в lead-gen |
|---|---|---|
| `crm_contacts` table | DB | Хранение лидов (добавим колонку `concept_id`) |
| `agent_deals` table | DB + миграция `20260220092550_*` | Pipeline сделок (добавим `concept_id`, `commission_amount`) |
| `properties` / `resale_properties` / `property_projects` | DB | Источник объектов. `property_projects.commission_pct` уже есть |
| `social_content_calendar`, `social_posts` | DB | Запись опубликованных постов после fan-out |
| `webhook_endpoints` + `webhook_deliveries` | DB + admin `/mc/developer/webhooks` | Make.com интеграция через эти таблицы — конфиг, не код |
| `ai-content-planner` + `ai-generate-description` EF | `supabase/functions/` | Генерация — оборачиваем в `concept-generate` |
| `ai_agents` registry | DB | Добавим агента `concept-writer` со ссылкой на tone-of-voice |
| `notify-lead-whatsapp` EF | `supabase/functions/notify-lead-whatsapp/` | Алёрт Pavel при новом лиде — реюзаем 1:1 |
| `score-lead` / `auto-lead-scoring` | `supabase/functions/` | AI score для приоритезации в Kanban |
| `_shared/whatsapp.ts` | `supabase/functions/_shared/whatsapp.ts` | UltraMSG обёртка для broadcast |
| `_shared/admin-config.ts` | `supabase/functions/_shared/admin-config.ts` | Pavel'овский WhatsApp/email из `system_settings` |
| `AdminCRM.tsx` patterns | `src/pages/admin/AdminCRM.tsx` | Шаблон для нового `/admin/lead-gen` |
| `crm_pipeline_stages` | DB | Конфиг стейджей Kanban |

---

## 5. Что нужно построить

### 5.1 Новая таблица — `lead_concepts`

```sql
CREATE TABLE lead_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  resale_property_id uuid REFERENCES resale_properties(id),
  project_id uuid REFERENCES property_projects(id),  -- off-plan
  slug text UNIQUE NOT NULL,                          -- для /p/[slug]
  title text NOT NULL,
  brief jsonb NOT NULL,                               -- {audience, usp, price_range, target_action}
  generated_content jsonb,                            -- {telegram, instagram, facebook, whatsapp, landing}
  approved_content jsonb,                             -- то же после редактирования Pavel
  images text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',               -- draft|generating|pending_approval|approved|published|paused|archived
  channels jsonb DEFAULT '[]',                        -- ['telegram','instagram','facebook','whatsapp','landing']
  published_at timestamptz,
  external_post_ids jsonb,                            -- {telegram: 'msg_id', make_run: 'run_id', ...}
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extend agent_deals + crm_contacts
ALTER TABLE agent_deals  ADD COLUMN concept_id uuid REFERENCES lead_concepts(id);
ALTER TABLE agent_deals  ADD COLUMN commission_amount numeric;
ALTER TABLE crm_contacts ADD COLUMN concept_id uuid REFERENCES lead_concepts(id);
ALTER TABLE crm_contacts ADD COLUMN lead_source_channel text;
  -- telegram | instagram | facebook | whatsapp | landing | direct

-- RLS: только admin role читает/пишет
```

### 5.2 Новые Edge Functions

| Функция | Путь | Что делает |
|---|---|---|
| `concept-generate` | `supabase/functions/concept-generate/` | Принимает `concept_id`, читает brief, вызывает `ai-generate-description` 4 раза с tone-of-voice промптом, пишет `generated_content`, ставит `status=pending_approval` |
| `concept-publish` | `supabase/functions/concept-publish/` | Принимает `concept_id` (status=approved). Fan-out: (a) TG Bot `sendMessage`+`sendPhoto`, (b) POST в Make.com webhook URL из `system_settings.make_lead_gen_webhook`, (c) UltraMSG broadcast по `whatsapp_broadcast_list`, (d) активирует landing. Пишет `external_post_ids` + создаёт записи в `social_posts` |
| `lead-capture` | `supabase/functions/lead-capture/` | POST endpoint для landing-формы И для Make.com. Создаёт `crm_contacts` + `agent_deals` + вызывает `score-lead` + вызывает `notify-lead-whatsapp` |

### 5.3 Новые страницы / UI

| Путь | Что |
|---|---|
| `/admin/lead-gen` | Главная: табы **Concepts \| Pipeline \| Reports** |
| `/admin/lead-gen/concept/new` | Brief form (4 поля) + выбор property/project |
| `/admin/lead-gen/concept/[id]` | Editor: 4 варианта в textarea + photo upload + Approve/Publish |
| `/admin/lead-gen/pipeline` | Kanban 5 колонок: new → contacted → qualifying → negotiating → closed |
| `/admin/lead-gen/lead/[id]` | Карточка лида: контакт, концепция-источник, канал, score, кнопка WhatsApp, лог заметок, смена стейджа |
| `/admin/lead-gen/reports` | Funnel + commission totals (week/month) |
| `/p/[slug]` | Public landing: hero photo + landing-копия + lead form |

### 5.4 Конфиги (через `system_settings`, не хардкод)

- `make_lead_gen_webhook` — URL Make.com сценария
- `telegram_lead_gen_channel_id` — ID канала
- `whatsapp_broadcast_list` — массив номеров (или ID списка в UltraMSG)
- `feature_flag:lead_gen` — флаг для постепенной раскатки

---

## 6. Week Plan (3 рабочих дня MVP + 2 дня тестов)

### Понедельник — Foundation
**Цель:** БД + админ-каркас + AI-генерация работают.

- [ ] Миграция: `lead_concepts` table + ALTER на `agent_deals` / `crm_contacts` + RLS
- [ ] `system_settings` записи: 4 ключа выше (с тестовыми webhook URL)
- [ ] Страница `/admin/lead-gen` (shell + 3 таба) — реюз паттернов `AdminCRM.tsx`
- [ ] Concept brief form `/admin/lead-gen/concept/new`
- [ ] Edge Function `concept-generate` — оборачивает `ai-generate-description` × 4 с tone-of-voice
- [ ] **Проверка:** создаётся концепция, AI генерит контент, видно в editor

### Вторник — Approval + Distribution
**Цель:** один клик → пост в трёх каналах.

- [ ] Concept editor `/admin/lead-gen/concept/[id]` — 4 textarea + photo upload + Approve
- [ ] Edge Function `concept-publish`:
  - Telegram Bot `sendPhoto` + caption (`TELEGRAM_BOT_TOKEN`)
  - POST в Make.com webhook (payload: title, copy, photos, slug, utm)
  - UltraMSG broadcast через `_shared/whatsapp.ts`
  - Активация landing (status=published)
- [ ] Make.com сценарий (Pavel настраивает в Make UI): IG post + FB post из payload
- [ ] Landing страница `/p/[slug]` — простая (hero + копия + LeadForm)
- [ ] Edge Function `lead-capture` — принимает POST из landing, создаёт contact+deal, дёргает `notify-lead-whatsapp`
- [ ] **Проверка:** approve → пост в TG + IG/FB + WhatsApp; landing открывается; форма → лид; Pavel получает WhatsApp

### Среда — Pipeline + Close + Commission
**Цель:** работа с лидом до закрытия сделки и расчёта комиссии.

- [ ] Kanban `/admin/lead-gen/pipeline` — drag-drop 5 стейджей (используем `crm_pipeline_stages`)
- [ ] Карточка лида `/admin/lead-gen/lead/[id]` — контакт, концепция, source, score, click-to-WhatsApp, notes, смена стейджа
- [ ] Close-flow: при `closed_won` модалка → ввод `deal_value` → автомат `commission_amount = deal_value * commission_pct/100`
- [ ] Reports tab: funnel + commission widget (week/month)
- [ ] **End-to-end тест:** концепция → publish → fake-лид → pipeline → closed_won → комиссия считается корректно

### Четверг — Реальный запуск (тест #1)
- [ ] Pavel создаёт **2 концепции:** одна off-plan villa, одна resale apartment
- [ ] Approve + Publish обе
- [ ] Мониторинг: посты пошли во все 3 канала, landing открывается, метрики кликов
- [ ] Любые лиды → ловим, тестируем уведомление Pavel

### Пятница — Iteration day
- [ ] Фиксы найденных багов
- [ ] Тюнинг AI-промптов под tone-of-voice
- [ ] Доработка landing если конверсия низкая
- [ ] Финальный smoke test → release к выходным

### Сб-Вс — Buffer
- [ ] Запас на любые неучтённые недоработки
- [ ] Pavel ведёт первых реальных лидов через pipeline

---

## 7. Verification (как тестировать end-to-end)

```bash
# 1. БД
npx supabase db push        # миграции
npx supabase db diff        # проверить схему

# 2. Edge Functions
npx supabase functions deploy concept-generate
npx supabase functions deploy concept-publish
npx supabase functions deploy lead-capture

# 3. Локальный smoke test
npm run dev
# → /admin/lead-gen/concept/new
# → создать концепцию для property из properties
# → Generate → Approve → Publish
# → проверить: пост в Telegram-канале + Make.com run + WhatsApp получен + /p/[slug] открывается

# 4. Lead capture test (через curl)
curl -X POST <SUPABASE_URL>/functions/v1/lead-capture \
  -H "Content-Type: application/json" \
  -d '{"concept_slug":"test-villa","name":"Test","contact":"+66...","channel":"landing","interest":"viewing"}'
# → проверить crm_contacts, agent_deals, WhatsApp Pavel получил пинг

# 5. Pipeline test
# → /admin/lead-gen/pipeline
# → перетащить fake-лида в closed_won, ввести deal_value=10000000
# → проверить commission_amount записался
```

**Метрики успеха недели:**
- ✅ 2+ концепции опубликованы во все 3 канала
- ✅ ≥ 5 лидов собрано (с любого канала)
- ✅ Pavel получает WhatsApp в течение 60 секунд после каждого лида
- ✅ ≥ 1 лид доведён минимум до `qualifying`
- ✅ Время от brief до published ≤ 15 минут
- ✅ Комиссия считается корректно при закрытии

---

## 8. Что НЕ делаем в эту неделю (anti-scope)

- ❌ Сложный AI-чатбот для квалификации (Pavel сам квалифицирует)
- ❌ BANT-форма с бюджетом/таймлайном (просто валидный контакт)
- ❌ Отдельный CMS для контента (используем concept editor)
- ❌ Аналитика по каналам глубокая (только funnel в Reports)
- ❌ A/B тесты постов
- ❌ Nurture-sequences для холодных лидов (всё в один pipeline)
- ❌ Мульти-юзер: только Pavel ведёт лиды
- ❌ Партнёрская программа (affiliate-tracking)
- ❌ Авто-публикация по расписанию (Pavel жмёт Publish сам)

---

## 9. Файлы для модификации/создания

### Новые файлы
```
supabase/migrations/<timestamp>_lead_concepts.sql
supabase/functions/concept-generate/index.ts
supabase/functions/concept-publish/index.ts
supabase/functions/lead-capture/index.ts
src/pages/admin/AdminLeadGen.tsx
src/pages/admin/lead-gen/ConceptNew.tsx
src/pages/admin/lead-gen/ConceptEditor.tsx
src/pages/admin/lead-gen/Pipeline.tsx
src/pages/admin/lead-gen/LeadCard.tsx
src/pages/admin/lead-gen/Reports.tsx
src/pages/public/PropertyPromo.tsx          # /p/[slug]
src/components/lead-gen/ConceptBriefForm.tsx
src/components/lead-gen/ConceptContentEditor.tsx
src/components/lead-gen/PipelineKanban.tsx
src/components/lead-gen/LeadForm.tsx
src/hooks/useLeadConcepts.ts
src/hooks/useLeadPipeline.ts
```

### Файлы для правки
```
src/App.tsx                                  # + роуты /admin/lead-gen/* и /p/[slug]
src/pages/admin/AdminCRM.tsx                 # + ссылка на /admin/lead-gen
supabase/functions/_shared/whatsapp.ts       # + broadcast helper если нужно
src/integrations/supabase/types.ts           # auto-regenerated после миграции
```

---

## 10. Открытые вопросы (решить в понедельник до начала работ)

1. **Make.com сценарий** — кто настраивает в Make UI? Если Pavel сам — нужен webhook payload schema → задокументировать в `docs/integrations/make-com.md`.
2. **Telegram канал** — публикуем в существующий бот/канал или создаём `@myuno_invest`?
3. **WhatsApp broadcast list** — где хранится (UltraMSG список или массив в `system_settings`)?
4. **Photos для постов** — берём из `properties.images` или Pavel загружает заново на концепцию?
5. **Бренд landing-страницы** — используем layout главного сайта или standalone минималистичный? Рекомендую standalone — выше конверсия.

---

## 11. Why this works (резюме)

- **Реюзаем 80%** существующего кода → быстро.
- **Одна таблица + 3 функции + 5 страниц** → понятно держать в голове.
- **Pavel только в двух точках** (approve + qualified lead work) → выполняет обещание "простая система".
- **ODOO-discipline:** каждая стадия имеет состояние, владельца, триггер → нет висящих задач.
- **3 канала с одной кнопки** → масштабирование без операционной нагрузки.
- **Комиссия = событие сделки** → нет отдельного бухгалтерского модуля.
- **MVP за 3 дня** → реалистично, потому что 80% уже есть.

---

## Приложение A — Tone of Voice для постов (выжимка из canon)

Источник: `docs/canonical/03-tone-of-voice.md`

**Голос бренда:** спокойная уверенность. Продаём доверие, не транзакцию.

**Правила постов о недвижимости:**
- Точные числа (площадь, цена, ROI), не "от" и не "примерно"
- Конкретные риски (flood score, юр.статус, срок сдачи) — не замалчиваем
- Никакого хайпа ("лучшая возможность", "уникальное предложение")
- Без эмодзи в продающих постах (можно 1-2 в TG для дыхания)
- Билингв: каждый пост публикуем RU + EN (или одна версия с дублем по абзацам в TG)
- CTA: "Узнать подробности" / "Записаться на просмотр" — не "Купить сейчас"

**Пример (правильно):**
> Вилла в Cherngtalay, 300 м², oceanview. Аренда ฿150K/мес. Flood score A2. ROI 8-9% на 10-летнем горизонте без скрытых комиссий. Сдача Q3 2027. Записаться на просмотр → [link]

**Пример (неправильно):**
> 🔥 Не упустите уникальную возможность! Шикарная вилла мечты — лучшая инвестиция года! 💎

---

## Приложение B — Pipeline стейджи и SLA

| Stage | Владелец | Действие | Целевое время |
|---|---|---|---|
| `new` | system | Лид только пришёл | — |
| `contacted` | Pavel | Pavel написал/позвонил | ≤ 2 часа от `new` (рабочее время) |
| `qualifying` | Pavel | Диалог идёт, выясняем потребность | 1-3 дня |
| `viewing` | Pavel | Запланирован/прошёл просмотр | 3-7 дней |
| `negotiating` | Pavel | Обсуждаем условия | 7-14 дней |
| `closed_won` | Pavel | Сделка закрыта, deal_value + commission записаны | — |
| `closed_lost` | Pavel | Не сложилось, фиксируем `lost_reason` | — |

Если лид в `new` > 24 часов — алёрт Pavel повторно (через `notify-lead-whatsapp` reminder).
Если в `qualifying` > 7 дней без активности — алёрт.

---

## Приложение C — Webhook payload schema (Make.com)

POST endpoint Make.com сценария получает:

```json
{
  "concept_id": "uuid",
  "slug": "villa-cherngtalay-300",
  "title": "Villa Cherngtalay 300m²",
  "channels": ["instagram", "facebook"],
  "content": {
    "instagram": {
      "caption": "...",
      "hashtags": ["#phuket", "#realestate"]
    },
    "facebook": {
      "text": "...",
      "link": "https://myuno.app/p/villa-cherngtalay-300"
    }
  },
  "images": [
    "https://...image1.jpg",
    "https://...image2.jpg"
  ],
  "landing_url": "https://myuno.app/p/villa-cherngtalay-300",
  "utm": {
    "source": "make",
    "medium": "social",
    "campaign": "concept_<id>"
  }
}
```

Make.com обрабатывает payload и публикует в IG/FB через свои модули. Опционально шлёт callback на `lead-capture` функцию с external_post_id.
