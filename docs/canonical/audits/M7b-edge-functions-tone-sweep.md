# M7b · Edge Functions Tone-of-Voice Sweep

**Дата:** 2026-04-23
**Версия:** v1.14.1
**Статус:** ✅ done
**Канон:** [`03-tone-of-voice.md`](../03-tone-of-voice.md) §14
**Предыдущая веха:** [`M7-tone-of-voice.md`](./M7-tone-of-voice.md)

---

## Цель

Расширить tone-sweep за пределы UI-компонентов на все исходящие коммуникации:
- Email-шаблоны (Resend, auth-email-hook, send-*).
- WhatsApp / Telegram outreach (notify-*, *-nurture).
- AI-генерируемый контент персонализации (ai-personalize-home).

## Методология

1. Сканирование `supabase/functions/**/*.ts` по тем же regex'ам, что и в M7 (forbidden words + soft urgency / hype).
2. Разделение на:
   - **system prompt'ы AI** (`ai-*`, `concierge-route`) — описывают задачу для LLM, не пользовательский текст → **не правим** (дезориентирует модель).
   - **user-facing шаблоны** (`vendor-outreach-agent`, `peylaa-lead-notify`, `ai-personalize-home`) → **правим**.
   - **технические идиомы** (`Best regards`, `// best effort`, `rate-limited`) → **не правим**.

## Найдено и зачищено

### `supabase/functions/ai-personalize-home/index.ts`
| Было | Стало |
|---|---|
| `Best villas on the island / Лучшие виллы на острове` | `Curated villas across the island / Подобранные виллы по острову` |
| `Unforgettable sea experience / Незабываемый отдых на воде` | `A day on the water / Отдых на воде` |
| `Discover island beauty / Откройте красоты острова` | `Discover the island / Откройте остров` |
| `Best schools for children / Лучшие школы для детей` | `Verified schools for children / Проверенные школы для детей` |
| `Hassle-free visa renewal / Продление визы без проблем` | `Visa renewal without hassle / Продление визы без хлопот` |
| `Hi! Here are the best offers for a {persona} / Вот лучшие предложения` | `Hi! Curated for a {persona} / Подобрали для {persona}` |

### `supabase/functions/vendor-outreach-agent/index.ts`
Полная переписка трёх sequence email-шаблонов (sequence 1/2/3):
- Subject 1: `Join myUNO — Connect with Premium Clients in Phuket` → `myUNO — partner invitation for service providers in Phuket`
- Body 1: `premium concierge platform serving high-net-worth clients` → `concierge platform connecting international residents and visitors with verified local service providers`
- Body 1: `the best local service providers ... caught our attention` → `trusted partners ... stood out`
- Body 1: `Why join myUNO? / Access to affluent international clients / Zero upfront costs — we only succeed when you do` → `How myUNO works for partners: / Steady flow of international clients / No upfront costs — commission only on completed orders`
- Subject 2: `Quick follow-up: myUNO Partner Invitation` (Capitalized) → `Quick follow-up: myUNO partner invitation`
- Body 2: `seeing great traction with our vendor partners` → `continue to onboard new partners` (фактическое утверждение вместо хайпа)
- Body 3: `If you're interested in connecting with premium clients` → `If working with international clients is relevant for you`
- Все `Best regards / Best,` → `Kind regards,` (нейтральная подпись без §14 trigger).

### `supabase/functions/peylaa-lead-notify/index.ts`
| Было | Стало |
|---|---|
| `Ignatev Capital — эксклюзивный консультант PEYLAA` | `Ignatev Capital — официальный партнёр PEYLAA` |

Замена снимает overpromise оттенок ("эксклюзив" в потребительском контексте трактуется как hype) и одновременно точнее юридически.

## Намеренно НЕ зачищено

| Файл | Строка | Причина |
|---|---|---|
| `ai-owner-nurture/index.ts:86` | `"Best angle for the pitch in Russian"` | JSON-schema description для LLM → промпт-инструкция, не пользовательский текст. |
| `ai-smart-search/index.ts:40` | `"recommend", "suggest", ..., "best", "good"` | Stop-words list для intent extraction → служебный массив. |
| `concierge-route/index.ts:79,104` | `"return 3-5 best platform routes"` | LLM-инструкция (output-format), не UI. |
| `crm-ai-assistant/index.ts:49` | `"top 3 next best actions"` | LLM-инструкция (next-best-action — устоявшийся CRM term). |
| `confirm-manual-payment/index.ts:143` | `// 4. Email guest (best effort)` | Code comment (best-effort delivery — техническая идиома). |
| `import-experience-media/index.ts:99` | `// srcset best candidates` | Code comment. |
| `supplier-discovery/index.ts:32` | `'best restaurant Phuket fine dining'` | Поисковой query для discovery agent (имитирует реальный пользовательский запрос). |
| `vendor-acquisition/index.ts:324` | `"<best time to send>"` | LLM output schema description. |

## Acceptance

- ✅ Все user-facing email/WhatsApp/Telegram шаблоны проходят §14.
- ✅ Подписи email унифицированы на нейтральное `Kind regards,`.
- ✅ AI-генерируемые reasons в `ai-personalize-home` соответствуют канону «спокойной уверенности».
- ✅ Outreach к вендорам (cold email) переформулирован: фактические утверждения вместо хайпа («great traction», «high-net-worth», «we only succeed when you do»).
- ✅ Edge Function bundle компилируется (Deno 2.0 import map не затронут).
- ✅ ESLint guard из M7 (`eslint.config.js`) не сработал на функции (Deno-функции вне scope ESLint frontend-проекта — отдельная среда).

## Backlog

- M7d — content sweep в БД-таблицах с пользовательским текстом (`landing_pages.content_sections`, `services.description_*`) — отдельный спринт после контентной ревизии.
- M7e — alt-text sweep для image assets (`alt=""`, `aria-label=""`) — отдельный спринт.
