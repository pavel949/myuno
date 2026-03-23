# MyUNO Agent & AI Audit
_Generated: 2026-03-20_

---

## 1. Claude / Anthropic Usage

| File | What it does | Input → Output | Key details |
|------|-------------|----------------|-------------|
| `supabase/functions/claude-chat/index.ts` | Secure proxy for Anthropic API. Frontend calls this; API key never exposed to browser. | POST `{messages, systemPrompt?, vertical?}` → `{response, vertical}` | Model: `claude-sonnet-4-20250514`, max_tokens: 1024, calls `https://api.anthropic.com/v1/messages` directly with `ANTHROPIC_API_KEY` secret |

**No other files** call the Anthropic API directly. All other AI edge functions call the Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `LOVABLE_API_KEY`.

**ENV files:** `.env` contains only Supabase public keys. No `ANTHROPIC_API_KEY` or `VITE_ANTHROPIC_*` is present in `.env` or `.env.example`. The Anthropic key is configured as a Supabase backend secret (not in version control).

**NPM/import scan:** No `@anthropic-ai/sdk` import found anywhere. The `claude-chat` function calls Anthropic via raw `fetch`.

---

## 2. Supabase Edge Functions

Total edge function directories: **~110** (including non-AI). Below are all AI-using functions plus notable automation functions. Non-AI utility functions (Stripe checkout, email, iCal, PDF, geocoding, etc.) are listed in the summary table at the end.

---

### `claude-chat`
- **File:** `supabase/functions/claude-chat/index.ts`
- **Purpose:** Secure reverse proxy for the Anthropic Claude API. Used by the frontend for Claude-powered chat features.
- **AI calls:** Yes — direct HTTP POST to `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-20250514`
- **System prompt:** Passed through from caller (no hardcoded system prompt in this function)
- **Input:** `{ messages: [{role, content}], systemPrompt?: string, vertical?: string }`
- **Output:** `{ response: string, vertical: string|null }`

---

### `ai-agent`
- **File:** `supabase/functions/ai-agent/index.ts`
- **Purpose:** General-purpose agent chat endpoint. Looks up agent config + published knowledge from `ai_agents` / `ai_agent_knowledge` tables, injects knowledge base into system prompt, then streams AI response.
- **AI calls:** Yes — Lovable AI Gateway, model configurable per agent (default: `google/gemini-3-flash-preview`), streaming SSE
- **System prompt:** Loaded from `ai_agent_knowledge.system_prompt` DB field with `{{KNOWLEDGE_BASE}}` placeholder injected at runtime. Also appends language preference (`RESPOND IN: Russian/English`).
- **Input:** `{ agentSlug: string, messages: [{role, content}], context?: object, sessionId?: string }`
- **Output:** SSE stream (text/event-stream)

---

### `ai-chat-moderator`
- **File:** `supabase/functions/ai-chat-moderator/index.ts`
- **Purpose:** Auto-moderation of property chat messages. Detects policy violations (contact sharing, off-platform payments, offensive language, scams). Logs violations to `chat_message_flags` table and updates `chat_violation_history`.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash-lite`, temperature 0.1
- **System prompt:**
  ```
  You are a chat moderation AI for myUNO, a property rental platform in Thailand (like Airbnb).
  Your task: Analyze chat messages between guests and property hosts to detect attempts to:
  1. Contact sharing — sharing phone numbers, emails, Telegram, WhatsApp...
  2. Off-platform deals — suggesting to pay outside the platform...
  3. Suspicious links — external URLs, shortened links, phishing...
  4. Offensive language — profanity, threats, harassment in Russian, English, or Thai
  5. Scam patterns — urgency pressure, too-good-to-be-true offers...
  Respond ONLY with valid JSON: { is_violation, violation_type, severity, confidence, detected_pattern, reasoning }
  ```
- **Input:** `{ message, messageId, propertyId, bookingId?, senderId? }`
- **Output:** `{ is_violation, violation_type, severity, confidence, detected_pattern, source }`

---

### `ai-concierge`
- **File:** `supabase/functions/ai-concierge/index.ts`
- **Purpose:** Proactive personalized suggestions for platform users. Gathers context (expiring documents, upcoming bookings, wallet balance, Phuket weather) then generates 2-3 actionable suggestions.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-3-flash-preview`, tool calling for structured output
- **System prompt:**
  ```
  You are a proactive personal concierge for an expat/tourist platform in Phuket, Thailand called myUNO.
  Your job is to generate 2-3 short, actionable, personalized suggestions based on the user's context.
  RULES: Each suggestion must be specific and actionable... Reference actual data...
  Available app paths: /profile/documents, /airport-transfer, /discover, ...
  Return a JSON array of objects with: icon (emoji), title, description, path, urgency
  ```
- **Input:** `{ user_id, language, persona?, life_situation? }`
- **Output:** `{ suggestions: [{icon, title, description, path, urgency}], context_used }`

---

### `ai-content-planner`
- **File:** `supabase/functions/ai-content-planner/index.ts`
- **Purpose:** Generates a multi-day Telegram channel content plan (in Russian) based on live platform data (new properties, experiences, recent orders). Saves results to `social_content_calendar` table.
- **AI calls:** Yes — Lovable AI Gateway, model from `ai_agents` DB config or `google/gemini-3-flash-preview`, tool calling
- **System prompt:**
  ```
  You are a social media content planner for UNO — a lifestyle super-app in Phuket, Thailand.
  Your audience: Russian-speaking expats and tourists in Phuket.
  Create a N-day content plan for Telegram channel. Each post should: Be in Russian... Include emoji...
  You MUST respond using the generate_content_plan tool.
  ```
- **Input:** `{ days?: number }` (default 7)
- **Output:** `{ success, posts_created, plan: [{date, title, content, content_type, tags}] }`

---

### `ai-cross-sell`
- **File:** `supabase/functions/ai-cross-sell/index.ts`
- **Purpose:** Selects top 3 cross-sell services for a booking (transfer, grocery, flowers, yacht, etc.) based on booking context. Inserts recommendations into `booking_cross_sell_offers`. Falls back to static rules if AI fails.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash-lite`, temperature 0.3
- **System prompt:** None (single user-turn prompt with booking context)
- **Input:** `{ booking_id }`
- **Output:** `{ offers: [{service_type, service_name, suggested_price, reasoning, currency, status}] }`

---

### `ai-generate-description`
- **File:** `supabase/functions/ai-generate-description/index.ts`
- **Purpose:** AI copywriting for product, service, or property descriptions. Model config fetched from `ai_agents` DB table.
- **AI calls:** Yes — Lovable AI Gateway, default `google/gemini-2.5-flash`, temperature 0.7
- **System prompt:** Varies by type and language, e.g.:
  ```
  You are a real estate copywriter. Write attractive property descriptions for rent/sale.
  Highlight location benefits and amenities. 2-3 paragraphs. Do NOT use markdown.
  ```
- **Input:** `{ type: 'product'|'service'|'property', name, language: 'en'|'ru', details? }`
- **Output:** `{ description: string }`

---

### `ai-guest-autoreply`
- **File:** `supabase/functions/ai-guest-autoreply/index.ts`
- **Purpose:** Automatically replies to guest messages in property chat when `ai_autoreply_enabled = true` for the property. Uses property data, guidebook, and chat history as context. Inserts reply as `sender_type: "manager"` with `ai_generated: true`.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-3-flash-preview`, temperature 0.6
- **System prompt:**
  ```
  You are a professional, friendly property manager assistant. You respond to guest inquiries about a vacation rental property.
  RULES:
  - Be warm, helpful, and concise (2-4 sentences max)
  - Answer based ONLY on the property data provided — never invent information
  - If you don't know the answer, say you'll check with the owner...
  - Never share owner's personal contact info
  - For booking/payment questions, direct guests to use the platform
  - Sign off as "Property Manager" or "Менеджер" (Russian)
  [+ OWNER CUSTOM INSTRUCTIONS if set]
  [+ PROPERTY CONTEXT, BOOKING CONTEXT, GUIDEBOOK CONTEXT, CHAT HISTORY]
  ```
- **Input:** `{ propertyId, bookingId?, guestMessage, guestName?, language? }`
- **Output:** `{ success, messageId, reply }` (also writes message to DB)

---

### `ai-image-enhance`
- **File:** `supabase/functions/ai-image-enhance/index.ts`
- **Purpose:** AI image enhancement for real estate photos. Auth required.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash-image`, multimodal (image in, image out)
- **System prompt:** None (user-only message with image URL and enhancement instruction)
- **Input:** `{ imageUrl, enhancement: 'auto'|'brightness'|'contrast'|'color' }`
- **Output:** `{ enhancedUrl, message }`

---

### `ai-intake-extract`
- **File:** `supabase/functions/ai-intake-extract/index.ts`
- **Purpose:** Extracts structured entity data (property projects, properties) from unstructured text using tool calling. Admin-only.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, tool calling
- **System prompt:**
  ```
  You are a data extraction assistant for a property management platform in Thailand (Phuket).
  Your task is to extract structured data from unstructured text input.
  Rules: 1. Extract all relevant information... 2. Convert prices to numbers... 3. Normalize amenities... 7. Be precise and extract only what's explicitly mentioned
  ```
- **Input:** `{ input: string, inputType: 'url'|'text', entityType: 'property_project'|'property', language? }`
- **Output:** `{ extracted: object }`

---

### `ai-legal-assistant`
- **File:** `supabase/functions/ai-legal-assistant/index.ts`
- **Purpose:** Legal document drafting assistant for Thai rental law. Generates leases, booking confirmations, power of attorney, deposit return acts, etc. in EN/RU. Streams response.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-3-flash-preview`, streaming
- **System prompt:**
  ```
  You are an expert AI Legal Assistant specializing in real estate rental law in Phuket, Thailand. You combine the roles of:
  1. Legal Advisor — Expert in Thai property law, rental regulations, foreigner ownership rules...
  2. Real Estate Specialist — Deep knowledge of Phuket rental market...
  3. Legal Translator — Professional bilingual (Russian-English) legal translation...
  Your capabilities: Draft and review rental/lease agreements... Create booking confirmation letters...
  Key Thai rental law points you know: Civil and Commercial Code governs leases (Sections 537-571)...
  When generating documents: Always include both English and Russian versions... Use proper legal formatting...
  ```
- **Input:** `{ messages: [{role, content}], context?: {property?, booking?, company?} }`
- **Output:** SSE stream

---

### `ai-owner-nurture`
- **File:** `supabase/functions/ai-owner-nurture/index.ts`
- **Purpose:** Lead scoring and nurture pipeline for property owner prospects. Scores prospects 0-100, advances them through stages (initial → day_0 → day_3 → day_7). Logs to `ai_decisions_log`.
- **AI calls:** Yes (for scoring) — Lovable AI Gateway, `google/gemini-3-flash-preview`, tool calling
- **System prompt (for scoring):**
  ```
  You are a property management expert analyzing owner prospects for UNO platform in Phuket.
  Current portfolio: N active properties.
  Evaluate this prospect and provide a score (0-100) and analysis.
  ```
- **Input:** `{ action?: 'score'|'auto_nurture', prospect_id?: string }`
- **Output:** `{ success, action, results: {scored, nurtured, followed_up, errors} }`

---

### `ai-personalize-home`
- **File:** `supabase/functions/ai-personalize-home/index.ts`
- **Purpose:** Generates personalized homepage content (greeting, priority categories, suggested services) based on user personas. Does NOT call an external AI model — all logic is rule-based lookups from static maps. Rate-limited public endpoint.
- **AI calls:** No (despite the name — purely rule-based code, no LLM call)
- **System prompt:** None
- **Input:** `{ personas: ['tourist'|'resident'|'property_owner'], language: 'en'|'ru', recentCategories? }`
- **Output:** `{ greeting, priorityCategories, suggestedServices }`

---

### `ai-platform-intelligence`
- **File:** `supabase/functions/ai-platform-intelligence/index.ts`
- **Purpose:** Generates a daily platform intelligence digest from cross-platform metrics (orders, users, properties, AI token usage, social posts, vendor/owner pipelines). Always responds in Russian.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-pro` (most expensive model used), tool calling
- **System prompt:**
  ```
  You are UNO's Platform Intelligence AI. Analyze cross-platform metrics and provide actionable insights for the team.
  Focus on: growth trends, anomalies, revenue opportunities, pipeline health, and user engagement.
  Always respond in Russian.
  Use the provide_intelligence tool to structure your response.
  ```
- **Input:** None (reads metrics from DB directly)
- **Output:** `{ success, metrics, intelligence: {summary, insights, actions, health_score}, execution_time_ms }`

---

### `ai-pricing-optimizer`
- **File:** `supabase/functions/ai-pricing-optimizer/index.ts`
- **Purpose:** Revenue management AI for vacation rental properties. Analyzes 90-day occupancy, ADR, season, and generates 3 nightly rate recommendations for the next 30 days. Saves to `pricing_recommendations`.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, temperature 0.2
- **System prompt:** None (single user-turn with property/performance context)
- **Input:** `{ property_id }`
- **Output:** `{ recommendations: [{date_from, date_to, recommended_price, confidence, reasoning, factors}], context }`

---

### `ai-smart-data`
- **File:** `supabase/functions/ai-smart-data/index.ts`
- **Purpose:** Multi-mode AI data utility: (1) `field-mapping` — maps CSV column names to target DB fields; (2) `text-extraction` — extracts structured data from property/product/service text; (3) `photo-analysis` — vision analysis of property/product/inspection photos. Agent config from DB.
- **AI calls:** Yes — Lovable AI Gateway, default `google/gemini-3-flash-preview` (text), `google/gemini-2.5-flash` (vision), tool calling
- **System prompt:** Varies by mode (field mapper, data extractor, or visual analyst)
- **Input:** `{ type: 'field-mapping'|'text-extraction'|'photo-analysis', ...type-specific fields }`
- **Output:** `{ success, type, result: object }`

---

### `ai-smart-search`
- **File:** `supabase/functions/ai-smart-search/index.ts`
- **Purpose:** AI-powered search for the marketplace. If query is detected as a question (not a keyword), calls AI to provide an answer + recommended service categories. Returns regular search signal otherwise.
- **AI calls:** Yes (for questions) — Lovable AI Gateway, `google/gemini-3-flash-preview`, temperature 0.7
- **System prompt (RU):**
  ```
  Ты — умный ассистент платформы myUNO для поиска услуг на Пхукете.
  ТВОИ ЗАДАЧИ: 1. Дать краткий, полезный ответ... 2. Предложить категории... 3. Предложить запросы...
  ДОСТУПНЫЕ КАТЕГОРИИ: yachts, tours, property, transport, beauty, medical, restaurants, events, water, legal, education, services, cleaning, visa, flowers, market, pharmacy
  ```
- **Input:** `{ query, language: 'en'|'ru', personas? }`
- **Output:** `{ type: 'ai_answer'|'search', answer?, suggestedCategories, suggestedServices }`

---

### `ai-support-chat`
- **File:** `supabase/functions/ai-support-chat/index.ts`
- **Purpose:** Customer support chatbot for the platform. Bilingual (RU/EN). Streams responses.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-3-flash-preview`, streaming
- **System prompt:**
  ```
  Ты — myUNO Assistant, дружелюбный AI-помощник платформы myUNO для бронирования услуг в Таиланде...
  Твои возможности: Помощь с бронированием туров, экскурсий, водных активностей... Информация о ресторанах...
  Правила: 1. Отвечай кратко и по делу (2-3 предложения максимум)... 3. Если не знаешь — предложи связаться с поддержкой через WhatsApp...
  Контакты поддержки: WhatsApp +66922407355
  Рабочие часы живой поддержки: 9:00-21:00 (время Таиланда)
  ```
- **Input:** `{ messages: [{role, content}] }`
- **Output:** SSE stream

---

### `ai-translate`
- **File:** `supabase/functions/ai-translate/index.ts`
- **Purpose:** Professional translation (EN ↔ RU ↔ TH) for single strings or batches of named fields. Agent config from DB.
- **AI calls:** Yes — Lovable AI Gateway, default `google/gemini-2.5-flash`, temperature 0.3
- **System prompt:** "You are a professional translator. Translate text accurately while preserving the original meaning, tone, and formatting."
- **Input:** `{ text?: string, fields?: Record<string, string>, targetLang: 'ru'|'en'|'th' }`
- **Output:** `{ translated: string }` or `{ translations: Record<string, string> }`

---

### `crm-ai-assistant`
- **File:** `supabase/functions/crm-ai-assistant/index.ts`
- **Purpose:** CRM assistant for real estate agents. 4 action modes: summarize contact, suggest next actions, draft email, analyze deal risk.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, temperature 0.7
- **System prompt:**
  ```
  You are a CRM AI assistant for a real estate management company (MyUNO).
  You help agents manage contacts and deals effectively.
  Always respond in the same language as the contact's data (Russian if data is in Russian, English otherwise).
  Be concise and practical.
  ```
- **Input:** `{ action: 'summarize'|'next_action'|'draft_email'|'risk_alert', contact_id?, deal_id?, company_id? }`
- **Output:** `{ result: string, action }`

---

### `detect-crm-duplicates`
- **File:** `supabase/functions/detect-crm-duplicates/index.ts`
- **Purpose:** CRM duplicate contact detection. Uses rule-based Levenshtein / phone normalization — NO AI call.
- **AI calls:** No
- **Input:** `{ company_id }`
- **Output:** `{ duplicates: [{contacts, match_reasons, confidence}], total }`

---

### `intake-listing-agent`
- **File:** `supabase/functions/intake-listing-agent/index.ts`
- **Purpose:** Bulk listing ingestion agent. Accepts raw text, URLs, file data, or uploaded images; scrapes URLs via Firecrawl; extracts structured listing fields with AI tool calling; saves session to `ai_intake_sessions`. Handles "agent messages" (emoji-numbered batches from Telegram real-estate groups).
- **AI calls:** Yes — Lovable AI Gateway, default `google/gemini-3-flash-preview`, tool calling per item
- **System prompt:**
  ```
  You are a data extraction assistant for a marketplace platform.
  Extract structured information from the provided content for a "<vertical>" listing.
  Return a JSON object with: fields (with confidence scores), title (en/ru), description (en/ru), confidence.
  COMPLETE LIST OF FIELDS TO EXTRACT: name_en, name_ru, title_en, ... bedrooms, bathrooms, area_sqm, ... price, deposit_amount, ... amenities, house_rules, ...
  ```
- **Input:** `{ mode: 'single'|'bulk_text'|'bulk_file'|'bulk_urls'|'files'|'agent_message', rawText?, urls?, images?, forceVertical?, sessionId? }`
- **Output:** `{ sessionId, status, items: [{detectedVertical, extractedFields, suggestedTitle, suggestedDescription, ...}], summary }`

---

### `lifeos-ai-analyst`
- **File:** `supabase/functions/lifeos-ai-analyst/index.ts`
- **Purpose:** Read-only AI analyst for the LifeOS catalog system. Detects coverage gaps, suggests mappings, finds catalog hygiene issues, identifies provider risks. Never executes changes.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-3-flash-preview`, tool calling
- **System prompt:**
  ```
  You are LifeOS Analyst (Read-Only), a specialized AI that analyzes catalog and mapping quality for the myUNO platform.
  YOUR ROLE: Analyze LifeOS health and coverage. Suggest improvements (never execute). Detect issues and risks. Respect governance rules strictly.
  HARD CONSTRAINTS: You NEVER execute changes. You NEVER suggest violating governance rules. All suggestions require human confirmation.
  GOVERNANCE RULES TO RESPECT: [loaded from DB]
  ```
- **Input:** `{ mode: 'scenario_gaps'|'mapping_suggestions'|'catalog_hygiene'|'provider_risks', situationCode?, entityType?, language? }`
- **Output:** `{ mode, timestamp, data_sources, suggestions, summary, disclaimer }`

---

### `lifeos-ai-fix`
- **File:** `supabase/functions/lifeos-ai-fix/index.ts`
- **Purpose:** Applies targeted DB fixes from LifeOS analyst suggestions (create mappings, adjust weights, deactivate duplicates). Admin-only. No AI call — purely executes pre-validated DB operations.
- **AI calls:** No
- **Input:** `{ suggestion: object, language? }`
- **Output:** `{ success, actions: string[] }`

---

### `listing-quality-analyzer`
- **File:** `supabase/functions/listing-quality-analyzer/index.ts`
- **Purpose:** Analyzes listing quality with rule-based checks + optional AI enhancement. Stores report as artifact in `ai_artifacts`. Returns verdict: approve / review / suspicious / reject_recommend.
- **AI calls:** Yes (optional enhancement) — Lovable AI Gateway, `google/gemini-3-flash-preview`, temperature 0.3
- **System prompt (for AI enhancement):** "You are a listing quality analyst. Return only valid JSON."
- **Input:** `{ entityType, entityId, entityData?, correlationId? }`
- **Output:** `{ success, artifact_id, correlation_id, report: {overall_score, completeness, issues, recommendations, ai_explanation}, verdict }`

---

### `ocr-receipt`
- **File:** `supabase/functions/ocr-receipt/index.ts`
- **Purpose:** OCR and parsing of receipt images. Extracts vendor, date, total, currency, line items, category. Auth required.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, vision, temperature 0.1
- **System prompt:** None (user-only message with image URL and JSON schema instruction)
- **Input:** `{ image_url }`
- **Output:** `{ success, data: {vendor, date, total, currency, items, category, confidence} }`

---

### `scan-business-card`
- **File:** `supabase/functions/scan-business-card/index.ts`
- **Purpose:** Business card OCR and CRM classification. Extracts contact details and classifies business vertical. Auth required.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, vision + tool calling
- **System prompt:**
  ```
  You are a business card OCR and analysis expert. Extract all information from business cards accurately.
  Your task: 1. Extract all visible text... 2. Classify the business into one of these verticals: restaurants, salons, tours, yachts, property, legal, clinics, cleaning, transport, fitness, construction, retail, education, pets, events, it, finance, other
  3. Suggest relevant services/products...
  Always respond using the provided function schema.
  ```
- **Input:** `{ imageBase64: string }` (base64 encoded image)
- **Output:** Extracted business card fields + vertical classification

---

### `vendor-outreach-agent`
- **File:** `supabase/functions/vendor-outreach-agent/index.ts`
- **Purpose:** Automated 3-stage vendor invitation campaign. Generates personalized email/WhatsApp messages via AI, sends them via Resend (email) or UltraMSG (WhatsApp), tracks outreach status in CRM.
- **AI calls:** Yes — Lovable AI Gateway, `google/gemini-2.5-flash`, temperature 0.7 (falls back to templates if AI unavailable)
- **System prompt:** None (single user-turn prompt with vendor details and outreach requirements)
- **Input:** `{ action: 'initial'|'followup', limit?: number }`
- **Output:** `{ success, action, processed, successful, failed, results }`

---

### `auto-lead-scoring`
- **File:** `supabase/functions/auto-lead-scoring/index.ts`
- **Purpose:** Batch-scores unscored consultation request leads by invoking `leads-factory/batch-score`. Notifies admin (email) when hot leads are found. No direct AI call in this function — delegates to leads-factory.
- **AI calls:** Indirect (delegates to `leads-factory`)
- **Input:** None (internal/cron protected)
- **Output:** `{ success, results: {scored, hot, errors} }`

---

### `publish-telegram-post`
- **File:** `supabase/functions/publish-telegram-post/index.ts`
- **Purpose:** Publishes posts to a Telegram channel via Bot API (`sendMessage` or `sendPhoto`). Logs to `social_posts` and updates `social_content_calendar`. No AI.
- **AI calls:** No
- **Bot:** `TELEGRAM_BOT_TOKEN` secret + `TELEGRAM_CHANNEL_ID` secret
- **Input:** `{ content, image_url?, channel_id?, post_id? }`
- **Output:** `{ success, message_id, post_id, error? }`

---

### `whatsapp-incoming-webhook`
- **File:** `supabase/functions/whatsapp-incoming-webhook/index.ts`
- **Purpose:** Receives inbound WhatsApp messages from UltraMSG webhook. Creates lead in `consultation_requests`, notifies admin via WhatsApp, sends bilingual auto-reply to customer, links to CRM contact if found.
- **AI calls:** No (auto-reply is a hardcoded template)
- **WhatsApp:** Uses `_shared/whatsapp.ts` → UltraMSG API (`ULTRAMSG_INSTANCE` + `ULTRAMSG_TOKEN`)
- **Input:** UltraMSG webhook POST payload `{ from, body, pushName, ... }`
- **Output:** `{ ok, lead_id }` or `{ ok, duplicate }`

---

## 3. Telegram / WhatsApp Bots

### Telegram Bot
- **Function:** `publish-telegram-post`
- **Credential:** `TELEGRAM_BOT_TOKEN` (backend secret) + `TELEGRAM_CHANNEL_ID`
- **Protocol:** Telegram Bot API (`https://api.telegram.org/botTOKEN/sendMessage` and `sendPhoto`)
- **Direction:** Outbound only (platform → Telegram channel)
- **Trigger:** Called by `auto-social-publish` and manually from admin UI

### WhatsApp via UltraMSG
- **Credential:** `ULTRAMSG_INSTANCE` + `ULTRAMSG_TOKEN` (backend secrets)
- **Protocol:** UltraMSG API (`https://api.ultramsg.com/INSTANCE/messages/chat`)
- **Shared module:** `supabase/functions/_shared/whatsapp.ts`
- **Used by:**
  - `whatsapp-incoming-webhook` — Receives inbound messages, auto-replies, notifies admin
  - `vendor-outreach-agent` — Sends personalized vendor outreach messages
  - `notify-lead-whatsapp` — Notifies admin about new leads
  - `send-guest-welcome-whatsapp` — Sends welcome messages to new guests
  - `send-nurture-messages` — Sends scheduled nurture messages
  - `notify-fasttrack-booking` — Booking notification via WhatsApp
  - `notify-vendor-order` — Notifies vendors about orders
  - `execute-campaign-rules` — Campaign message delivery
- **Direction:** Bidirectional (inbound via webhook, outbound via API)
- **Admin phone hardcoded:** `66922407355` (in `whatsapp-incoming-webhook`)

---

## 4. Cron Jobs & Scheduled Triggers

| Job name | Schedule | Triggers | File |
|---------|----------|----------|------|
| `process-nurture-queue` | `0 10 * * *` (daily 10:00 UTC) | `send-nurture-messages` edge function | `supabase/migrations/20260305170145_40bd9ea9-7970-494f-8919-97b12e081685.sql:62` |
| `ical-scheduled-sync-every-5min` | `*/5 * * * *` (every 5 min) | `ical-scheduled-sync` edge function | `supabase/migrations/20260311180100_ical_sync_cron_5min.sql:4` |

**pg_cron extension** enabled in migrations:
- `supabase/migrations/20260219011721_9e79ec63-1743-4272-b407-39372bbd4cd7.sql` — Initial enablement
- `supabase/migrations/20260220031331_f6d1f48a-23f4-44b5-b545-967b5d6bfa65.sql` — Re-enabled with schema
- `supabase/migrations/20260305162307_84b99a5c-0642-4eeb-9d3b-4513a5f2feec.sql` — Re-enabled
- `supabase/migrations/20260312011007_5246fb7d-8a11-437e-a0ac-2029bd249c48.sql` — Re-enabled for MC backup

Both cron jobs use `pg_net` + `net.http_post` to call edge function URLs with `Authorization: Bearer <service_role_key>`.

---

## 5. CLAUDE.md

Not found. No file exists at `C:\Users\pavel\OneDrive\ドキュメント\GitHub\myuno\CLAUDE.md`.

---

## Summary Table

| Component | Type | AI? | Model / Service | Notes |
|-----------|------|-----|-----------------|-------|
| `claude-chat` | Edge fn | Yes — Anthropic | `claude-sonnet-4-20250514` | Only direct Anthropic API call; proxies for frontend |
| `ai-agent` | Edge fn | Yes — Lovable | Configurable (default Gemini Flash) | DB-driven agent + knowledge system, SSE streaming |
| `ai-chat-moderator` | Edge fn | Yes — Lovable | `gemini-2.5-flash-lite` | Chat policy enforcement, auto-flags violations |
| `ai-concierge` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Proactive user suggestions with weather + booking context |
| `ai-content-planner` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Telegram content calendar (Russian) |
| `ai-cross-sell` | Edge fn | Yes — Lovable | `gemini-2.5-flash-lite` | Cross-sell service recommendations for bookings |
| `ai-generate-description` | Edge fn | Yes — Lovable | `gemini-2.5-flash` (default) | Copywriting for properties/products/services |
| `ai-guest-autoreply` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Auto-replies in property chat as "AI Assistant" |
| `ai-image-enhance` | Edge fn | Yes — Lovable | `gemini-2.5-flash-image` | Real estate photo enhancement (vision model) |
| `ai-intake-extract` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | Admin entity extraction from text |
| `ai-legal-assistant` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Thai rental law document drafting, streaming |
| `ai-owner-nurture` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Owner prospect scoring + nurture pipeline |
| `ai-personalize-home` | Edge fn | No (rule-based) | N/A | Persona-based homepage personalization, no LLM |
| `ai-platform-intelligence` | Edge fn | Yes — Lovable | `gemini-2.5-pro` | Daily platform digest in Russian |
| `ai-pricing-optimizer` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | Nightly rate recommendations |
| `ai-smart-data` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` / `gemini-2.5-flash` | Field mapping, text extraction, photo analysis |
| `ai-smart-search` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | AI answers for question-style search queries |
| `ai-support-chat` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Customer support chatbot, streaming |
| `ai-translate` | Edge fn | Yes — Lovable | `gemini-2.5-flash` (default) | EN/RU/TH translation |
| `crm-ai-assistant` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | CRM contact summarize/next-action/draft-email/risk |
| `detect-crm-duplicates` | Edge fn | No (rule-based) | N/A | Levenshtein + phone normalization |
| `intake-listing-agent` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` (default) | Bulk listing ingestion with Firecrawl + AI extraction |
| `lifeos-ai-analyst` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Catalog health analysis (read-only suggestions) |
| `lifeos-ai-fix` | Edge fn | No | N/A | Applies pre-validated DB fixes |
| `listing-quality-analyzer` | Edge fn | Yes — Lovable | `gemini-3-flash-preview` | Listing quality scoring + AI explanation |
| `ocr-receipt` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | Receipt OCR/parsing |
| `scan-business-card` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | Business card OCR + CRM classification |
| `vendor-outreach-agent` | Edge fn | Yes — Lovable | `gemini-2.5-flash` | Personalized vendor invitation messages |
| `auto-lead-scoring` | Edge fn | Indirect | via `leads-factory` | Delegates to leads-factory for AI scoring |
| `publish-telegram-post` | Edge fn | No | Telegram Bot API | Publishes to Telegram channel |
| `whatsapp-incoming-webhook` | Edge fn | No | UltraMSG | Inbound WhatsApp → CRM lead + admin notify |
| `WhatsApp (shared)` | Shared module | No | UltraMSG API | `_shared/whatsapp.ts`, used by 8+ functions |
| `process-nurture-queue` cron | pg_cron | No | — | Daily 10:00 UTC → `send-nurture-messages` |
| `ical-sync` cron | pg_cron | No | — | Every 5 min → `ical-scheduled-sync` |
| `CLAUDE.md` | Config | — | — | Not found |

**Total edge functions identified:** ~110
**AI-calling functions:** 22 (20 via Lovable AI Gateway, 1 via Anthropic API, 1 indirect)
**Non-AI automation functions:** ~88 (Stripe, email, iCal, geocoding, PDF, webhooks, etc.)
**pg_cron jobs:** 2 active
**WhatsApp bot functions:** 8+ functions using UltraMSG
**Telegram bot functions:** 1 (`publish-telegram-post`)
