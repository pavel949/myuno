## MVP AI Orchestrator (Wave 1)

Цель: связать существующие AI-функции (`ai-agent`, `crm-ai-assistant`, `intake-listing-agent`, `listing-quality-analyzer`, `ai-support-chat`, `concierge-route`, `notify-lead-whatsapp`) в один детерминированный роутер с контекстом пользователя, логированием в `ai_agent_logs` и canon-tone guardrails. Без новых UI-виджетов, без нового RPC, без новой таблицы `crm_leads`.

### 1. База данных (migration)
- Проверить и при необходимости добавить колонки в `public.ai_agents`: `agent_token` (unique), `model_engine`, `temperature`, `system_prompt`, `is_active`.
- Проверить `ai_agent_knowledge` (`agent_id`, `category`, `content_ru`, `content_en`, `version`) и `ai_agent_logs` (`user_id`, `agent_id`, `input_tokens`, `output_tokens`, `execution_status`, `latency_ms`, `route_reason`).
- GRANT/RLS: чтение `ai_agents` + `ai_agent_knowledge` всем `authenticated`; запись `ai_agent_logs` только через `service_role` (edge).
- Сид-строки для 5 канонических агентов: `concierge`, `crm-scouter`, `intake-listing`, `listing-quality`, `guest-autoreply` с civic-tone system_prompt (RU/EN, без эмодзи, без капса, без давления).

### 2. Edge function `supabase/functions/ai-orchestrator/index.ts` (новая)
Единая точка входа. Контракт: `POST { intent, message, context_override? }`.

Логика:
1. Аутентификация через `getClaims()` (verify_jwt в коде, как в остальных функциях).
2. Контекст: подтянуть из `profiles` — `primary_role`, `roles_stack`, `locale`, активный `lifecycle_phase` (из `user_active_context`).
3. Роутер (deterministic switch по `intent` + эвристика на `message`):
   - `realestate_high_value` (триггер $100K+ или ключи property/invest) → инвок `crm-ai-assistant` для драфта в `crm_contacts` (поля `lead_status`, `lead_score`, источник `ai_orchestrator`), затем `notify-lead-whatsapp` → Pavel.
   - `listing_intake` / `listing_edit` → последовательно `intake-listing-agent` затем `listing-quality-analyzer`.
   - `stays_guest_request` → `ai-support-chat` с system_prompt агента `guest-autoreply`, SLA-таймер фиксируется в `ai_agent_logs.latency_ms`.
   - default → `ai-agent` (Lovable AI Gateway, `google/gemini-3-flash-preview`) с system_prompt агента `concierge`.
4. Tone guardrail: к каждому system_prompt префикс из `ai_agent_knowledge` категории `tone-civic` (запрет эмодзи/капса, требование locale-match).
5. Логирование: каждый запуск пишет `ai_agent_logs` (`success` / `failed` / `escalated`). При `failed` или необработанном edge case — статус `escalated`, отправка в Telegram через существующий `_shared/telegram.ts` + возврат структурированного fallback `{ status: 'escalated', sla_hours: 2 }`.

### 3. Frontend (минимальная проводка)
- Расширить `src/hooks/useAIAgents.ts` (или добавить тонкий `useAIChat.ts`-обёртку поверх него), чтобы `FloatingConcierge` и `useConciergeAdvance` ходили в `ai-orchestrator` вместо прямого вызова `ai-agent` / `concierge-route`.
- Локаль и role-stack читать из существующего `LanguageContext` + `useAuth` — передавать в body вызова.
- При ответе `status: 'escalated'` показывать calm-fallback (через `sonner`) с текстом «Передал специалисту, ответ в течение 2 часов» (i18n ключ `ai.escalated.fallback`).
- Никаких новых компонентов; `MiniAppLayout`, рендер payment-sheet, audit-marker, `calculate_order_totals` RPC — вне MVP (Wave 2).

### 4. Tone enforcement
- Единственный canonical system_prompt живёт в `ai_agent_knowledge.category = 'tone-civic'`, версионируется через `version`.
- Lint-правило (опц., если успеет): простой regex-тест в `src/test/` который проверяет seed-промпты на отсутствие emoji/«!!!».

### 5. Реконсиляция / выход
- `tsgo` чистый, `bun run build` зелёный.
- README в `supabase/functions/ai-orchestrator/README.md`: контракт, intents, fallback.
- Smoke-тест: 4 curl-сценария (default concierge, high-value lead → проверка записи в `crm_contacts` + лог WhatsApp, listing intake, escalated failure → запись `ai_agent_logs.execution_status='escalated'`).
- Финальный отчёт пользователю: список таблиц с GRANT'ами, путь edge function, маппинг intents → агенты.

### Что НЕ входит в MVP (вынесено в следующие волны)
- AIConciergeWidget.tsx, useAIChat транзакционный sheet, рендер price breakdown.
- RPC `calculate_order_totals` и audit-marker `[TX_ID · LEDGER_REF · TIMESTAMP]`.
- Привязка к `create-*-checkout` и post-webhook карточка успеха.
- e2e тесты онбординга и полный type-safety pass по AI state.

### Технические детали
```text
client (FloatingConcierge / useConciergeAdvance)
   │  useAIAgents.invoke(intent, message)
   ▼
supabase/functions/ai-orchestrator
   ├── ctx = loadContext(uid)
   ├── agent = route(intent, message, ctx)
   ├── prompt = tonePrefix + agent.system_prompt
   ├── call → ai-agent | crm-ai-assistant | intake-listing-agent
   │           | listing-quality-analyzer | ai-support-chat
   ├── on lead → notify-lead-whatsapp
   ├── log → ai_agent_logs
   └── on error → telegram + status:escalated
```

**Рекомендую** утвердить план as-is — он закрывает §1, §2, §4 и §5 из спецификации без риска регрессий в Stays/CRM/Checkout. Транзакционный цикл (§3) пойдёт отдельной волной после стабилизации роутера.