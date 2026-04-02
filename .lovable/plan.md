

# Маховик myUNO: комплексное видение и план улучшений

## Текущее состояние системы

### Масштаб платформы
Платформа охватывает 40+ сервисных вертикалей (property, beauty, restaurants, yachts, transport, legal, medical, wellness, education, etc.) с тремя уровнями пользователей:
- **B2C гости/экспаты** — потребители услуг через единый хаб
- **B2B вендоры** — поставщики услуг с dashboard, листингами, заказами
- **MC (Management Company)** — операционное ядро с CRM, PMS, финансами

### Текущие проблемы

**1. Разрыв между привлечением и операциями**
- `vendor_prospects` (acquisition) живёт отдельно от `crm_contacts` (operations)
- Нет автоматической конверсии prospect → vendor → contact
- Owner prospects (`owner_prospects`) — третья изолированная таблица

**2. Фрагментация AI-агентов**
- 30+ edge functions с AI-логикой, но нет единого orchestration layer
- Агенты работают изолированно: `supplier-discovery`, `vendor-outreach-agent`, `ai-owner-nurture`, `auto-lead-scoring` — без обратной связи между собой
- Нет системы приоритизации: какой агент важнее прямо сейчас?

**3. Guest lifecycle не связан с revenue**
- `lifecycle-processor` отправляет сообщения гостям, но не генерирует cross-sell
- `ai-cross-sell` существует, но не интегрирован в lifecycle pipeline
- Гость после checkout — потерянный контакт

**4. Dashboard overload**
- 50+ виджетов в `/src/components/owner/dashboard/`
- Founder видит всё сразу вместо actionable priorities
- Нет "score" по здоровью бизнеса — только отдельные метрики

## Маховик myUNO: как должна работать система

```text
                    ┌──────────────────┐
           ┌──────>│  DISCOVER         │──────┐
           │       │  AI finds vendors │      │
           │       │  & owners online  │      v
      ┌────┴───┐   └──────────────────┘   ┌──────────┐
      │REFERRAL│                          │ OUTREACH  │
      │Guests  │                          │ Auto-email│
      │refer   │                          │ WhatsApp  │
      │vendors │                          │ sequences │
      └────┬───┘                          └────┬─────┘
           ^                                   v
    ┌──────┴──────┐                    ┌───────┴──────┐
    │ GUEST       │                    │ ONBOARD      │
    │ Experience  │                    │ Vendor/Owner  │
    │ Cross-sell  │<───Revenue────────>│ signs up      │
    │ Upsell      │                    │ adds listings │
    └──────┬──────┘                    └───────┬──────┘
           ^                                   v
    ┌──────┴──────┐                    ┌───────┴──────┐
    │ BOOK &      │                    │ OPERATE      │
    │ EXPERIENCE  │<───────────────────│ PMS, tasks   │
    │ Guest stays │    services        │ cleaning     │
    └──────┬──────┘                    └───────┬──────┘
           │                                   │
           └──── REVIEW & REPEAT ──────────────┘
```

**Ключевой принцип**: каждое действие в системе должно усиливать следующий шаг маховика.

## Конкретные предложения по улучшению

### Phase 1: Unified Entity Pipeline (Data Architecture)

**Проблема**: 3 изолированные таблицы для лидов, нет единого lifecycle.

**Решение**: Создать `entity_pipeline` — универсальную воронку для ВСЕХ сущностей:

```text
Discovery → Prospect → Contacted → Interested → Onboarding → Active → Retained
```

Технически:
- Добавить в `crm_contacts` поля `pipeline_stage`, `pipeline_type` (vendor/owner/guest/partner)
- Создать database view `v_unified_pipeline` объединяющий `vendor_prospects` + `owner_prospects` + `crm_contacts`
- Конверсия prospect → contact: автоматический trigger при смене статуса на "won"
- 1 таблица `pipeline_stage_history` для трекинга всех переходов

### Phase 2: AI Orchestrator (Smart Prioritization)

**Проблема**: AI-агенты работают изолированно, founder не знает что приоритетно.

**Решение**: Edge function `ai-orchestrator` — ежедневный cron:

1. Сканирует все таблицы: deals без движения, tasks просроченные, prospects без follow-up, guests pre-arrival
2. Генерирует `ai_task_suggestions` с приоритетами
3. Решает КАКОЙ агент должен запуститься: если есть hot prospect — запускает outreach, если guest arrival tomorrow — запускает welcome sequence
4. Пишет в `founder_daily_brief` — одно краткое сообщение в Telegram с топ-5 действиями дня

### Phase 3: Guest Revenue Loop

**Проблема**: Guest после checkout — потерянный контакт.

**Решение**: Замкнуть цикл guest → revenue → referral:

1. **Post-checkout upsell**: через 24ч после выезда — AI-персонализированное письмо с релевантными услугами (визы, property buy, return booking) на основе данных о пребывании
2. **Guest-to-referral**: если гость оставил 5-star review → автоматически предлагает referral program (скидка за приведённого друга)
3. **Guest-to-owner**: если гость интересовался покупкой → автоматически создаётся deal в Sales Pipeline с тегом "guest-conversion"
4. Интегрировать `ai-cross-sell` в `lifecycle-processor` как 6-й stage

### Phase 4: Vendor Self-Service Acceleration

**Проблема**: Вендор onboarding требует ручного внимания founder.

**Решение**: 
1. **AI Quality Gate**: при добавлении листинга `listing-quality-analyzer` автоматически проверяет и возвращает actionable feedback вендору
2. **Automated Verification**: если вендор загрузил 3+ фото, описание на 2 языках, цену в THB → автоматический переход в "Verified" статус
3. **Revenue Dashboard для вендора**: показать вендору его earnings, conversion rate, ranking vs competitors — мотивация улучшать листинги
4. **Smart Pricing Suggestions**: `ai-pricing-optimizer` предлагает цены на основе рыночных данных — вендор одобряет одним кликом

### Phase 5: Founder Dashboard v2 — "Business Health Score"

**Проблема**: 50+ виджетов, нет единого показателя здоровья бизнеса.

**Решение**: Заменить текущий multi-widget layout на:

```text
┌─────────────────────────────────────────────┐
│ Business Health Score: 73/100               │
│ ████████████████████░░░░░░░░                │
│                                             │
│ ⚠ 3 urgent actions    ✓ 12 on track        │
├─────────────┬───────────────────────────────┤
│ TOP 5 NOW   │ Pipeline     Revenue  Guests  │
│ 1. Call X   │ ██ 12 deals  ₿340K    23 arr  │
│ 2. Reply Y  │ ██ 4 hot     ₿120K    8 dep   │
│ 3. Approve Z│ ██ 2 stale   ₿45K     5 new   │
│ 4. Review W │                               │
│ 5. Send doc │                               │
└─────────────┴───────────────────────────────┘
```

Технически:
- Новый хук `useBusinessHealthScore` — агрегирует метрики из deals, tasks, properties, revenue
- Score формула: `(active_deals_moving * 20) + (tasks_on_time * 20) + (occupancy * 20) + (revenue_growth * 20) + (response_time * 20)`
- "Top 5 Now" — из `ai_task_suggestions`, сортированные по impact score
- Все остальные виджеты — в collapsible секции ниже, а не загружены по умолчанию

### Phase 6: Workflow Automation Rules

**Проблема**: Бизнес-правила зашиты в код, нельзя менять без разработчика.

**Решение**: Расширить `mcc_automation_rules` для реальных use cases:

| Trigger | Condition | Action |
|---------|-----------|--------|
| New vendor prospect | ai_score > 70 | Send outreach sequence |
| Deal stage = "viewing" | 48h no update | Create follow-up task |
| Guest checkout | rating >= 4.5 | Send referral invite |
| Property occupancy | < 40% this month | Alert + AI pricing suggestion |
| Invoice overdue | 7+ days | Send reminder + flag in dashboard |
| New contact created | source = "website" | Auto-assign to Sales Pipeline |

UI: визуальный rule builder в `/mc/settings` → Automation tab.

## Файлы для изменения

### Database (migrations)
1. View `v_unified_pipeline` — объединение 3 таблиц лидов
2. Таблица `pipeline_stage_history` — трекинг переходов
3. Таблица `founder_daily_brief` — AI-генерированные дайджесты
4. Расширение `crm_contacts`: `pipeline_stage`, `pipeline_type`
5. Расширение `mcc_automation_rules` для новых trigger types

### Edge Functions
1. `ai-orchestrator/index.ts` — главный координатор AI-агентов (cron)
2. Обновить `lifecycle-processor` — добавить cross-sell stage
3. `guest-referral-engine/index.ts` — автоматизация referral после отзыва
4. Обновить `listing-quality-analyzer` — auto-verify при соблюдении критериев

### Frontend
1. `useBusinessHealthScore.ts` — новый хук для агрегированного скора
2. `BusinessHealthCard.tsx` — главная карточка dashboard
3. `TopActionsWidget.tsx` — "Top 5 Now" из AI suggestions
4. `AutomationRulesBuilder.tsx` — визуальный конструктор правил
5. Рефакторинг `OwnerDashboard.tsx` — Health Score первым, виджеты collapsible
6. Обновить vendor dashboard — revenue analytics виджет

### Sidebar & Navigation
1. Упростить MC sidebar: объединить "CRM Dashboard" и "Dashboard" в один экран
2. Добавить бейдж "AI Suggestions" на Tasks с числом pending suggestions

## Порядок реализации

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 1. Unified Pipeline View | 4h | High — убирает фрагментацию данных | 1 |
| 5. Business Health Score | 4h | High — упрощает daily workflow founder | 2 |
| 2. AI Orchestrator | 6h | High — автоматизирует приоритизацию | 3 |
| 3. Guest Revenue Loop | 4h | Medium — новый revenue stream | 4 |
| 6. Automation Rules | 6h | Medium — убирает ручную рутину | 5 |
| 4. Vendor Self-Service | 4h | Medium — масштабируемость | 6 |

Готов начать с Phase 1 (Unified Pipeline) + Phase 5 (Business Health Score) — они дают максимальный эффект при минимальных изменениях.

