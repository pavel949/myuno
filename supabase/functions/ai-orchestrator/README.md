# ai-orchestrator (Wave 1)

Single AI entrypoint for myUNO. Replaces direct calls to `ai-support-chat` / `concierge-route` from the client.

## Contract

`POST /functions/v1/ai-orchestrator` — `Authorization: Bearer <jwt|anon>`.

### A. Streaming chat (default concierge)
```json
{ "messages": [{ "role": "user", "content": "..." }],
  "pageContext": { "lang": "ru", "path": "/index", "title": "Home" } }
```
Returns `text/event-stream` (OpenAI-compatible delta chunks), same shape as `ai-support-chat`.

### B. JSON router (explicit intent)
```json
{ "intent": "realestate_high_value", "payload": { "message": "Looking for villa $500K" } }
```
Returns `{ status, intent, delegated_to, agent, result, ... }`.

| intent | delegates to | agent slug |
|---|---|---|
| `realestate_high_value` | `crm-ai-assistant` (+ `notify-lead-whatsapp`) | `crm-scouter` |
| `listing_intake` / `listing_edit` | `intake-listing-agent` | `intake-listing-agent` |
| `stays_guest_request` | `ai-support-chat` | `guest-autoreply` |
| `default` (or auto on $100K+ keyword) | streaming concierge | `concierge` |

## Tone enforcement

Every run prepends a civic-tone preamble (no emoji, no caps, locale-match, escalate on uncertainty) ahead of the agent's published system_prompt from `ai_agent_knowledge`.

## Logging

Each run inserts into `ai_agent_logs` with: `intent`, `execution_status` (`success` / `failed` / `escalated`), `route_reason`, `model`, `agent_version`, `response_time_ms`.

## Escalation

On upstream gateway failure or unknown error: writes `execution_status='escalated'`, pings Telegram (if `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` set), returns calm locale-aware fallback with `sla_hours: 2`.

## Required env

- `LOVABLE_API_KEY` (auto)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (auto)
- Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`

## Out of scope (Wave 2)

- `calculate_order_totals` RPC and audit-marker rendering
- Interactive price-breakdown sheets
- Post-webhook success cards
