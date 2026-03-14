

# Plan: Agent Message Parser for Intake System

## Problem

Real estate agents post listings in WhatsApp/Telegram groups using a specific format: a header block (complex name, location) followed by numbered items (emoji digits like 1️⃣ 2️⃣) each with specs, links, and pricing info at the bottom. The current `splitBulkText` function in `intake-listing-agent` only recognizes `---`, `===`, `## headers`, and `^\d+\.` as item separators — it completely misses emoji-numbered patterns and groups-style messages.

## What Already Works

- **`intake-listing-agent` edge function** — full AI extraction pipeline with Gemini, Firecrawl scraping, vertical detection, confidence scoring
- **`IntakeInputForm` + `IntakeQueue` UI** — paste text → AI analyze → review → approve → create listings
- **`whatsapp-incoming-webhook`** — receives incoming WhatsApp messages (currently only creates leads, not listings)
- **`bulk_text` mode** — exists but the splitter can't parse agent-style messages

## What Needs to Change

### 1. New Intake Mode: `agent_message` 
Add a 5th mode to the intake system specifically designed for agent group messages.

**Files:**
- `src/components/admin/intake/IntakeModeSelector.tsx` — add `agent_message` mode with a MessageSquare icon
- `src/components/admin/intake/IntakeInputForm.tsx` — add placeholder example matching the agent format
- `src/hooks/useIntakeAgent.ts` — pass new mode type

### 2. Smart Message Splitter in Edge Function
Enhance `supabase/functions/intake-listing-agent/index.ts`:

- Add `splitAgentMessage()` function that:
  - Detects header block (complex name, location, common info like agent commission, contact)
  - Splits on emoji numbers (1️⃣ 2️⃣ 3️⃣...) or standard numbered patterns
  - Merges header context (complex name, district, contact, commission) into each sub-item
  - Extracts Yandex Disk / Google Drive / Dropbox links per item as `sourceImages`
  - Preserves shared footer info (pricing policy, agent commission, contact) across all items

- Update `splitBulkText()` to detect agent message patterns first and delegate to `splitAgentMessage()`

- The AI prompt already extracts all property fields — no change needed there, since each sub-item will be sent with its full context (header + item + footer)

### 3. Handle `agent_message` Mode in Edge Function
In the main `Deno.serve` handler:
- When `mode === 'agent_message'`, use `splitAgentMessage()` instead of `splitBulkText()`
- Force vertical to `properties` by default (can be overridden)
- Set `sourceText` to include the original header for traceability

### 4. Improve `splitBulkText` Detection
Update the `ITEM_SEPARATORS` array to also catch:
- Emoji number patterns: `/^[1-9]️⃣/m` and `/^[①②③④⑤⑥⑦⑧⑨⑩]/m`
- Emoji bullet patterns: `/^[🏠🏢🏡🛥️⛵🚗]/m`

This ensures even if someone uses `bulk_text` mode, agent messages still split correctly.

## Technical Details

```text
Input message structure:
┌─────────────────────────────┐
│ HEADER (shared context)     │  ← complex name, district, type
│ "Lagendary, Bangtao"        │
├─────────────────────────────┤
│ 1️⃣ Item 1 + link           │  ← split point
│ 2️⃣ Item 2 + link           │  ← split point  
│ 3️⃣ Item 3 + link           │  ← split point
├─────────────────────────────┤
│ FOOTER (shared context)     │  ← price policy, commission, contact
│ "Agent commission: 10%"     │
└─────────────────────────────┘

Each item sent to AI = HEADER + ITEM + FOOTER
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/intake-listing-agent/index.ts` | Add `splitAgentMessage()`, handle `agent_message` mode |
| `src/components/admin/intake/IntakeModeSelector.tsx` | Add 5th mode button |
| `src/components/admin/intake/IntakeInputForm.tsx` | Add placeholder + hint for agent mode |
| `src/hooks/useIntakeAgent.ts` | Extend mode type |

## Time Estimate

~3 hours total:
- Edge function splitter logic: 1.5h
- UI mode + form updates: 0.5h  
- Testing & edge cases: 1h

