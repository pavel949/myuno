
# Audit Results: Agent Message Intake Flow

## 🔴 CRITICAL BUG #1: `rows` vs `records` Mismatch

**`useIntakeAgent.ts` line 225** sends `{ table, rows: [fields] }` but **`bulk-import/index.ts` line 107** expects `{ table, records: [...] }`.

This means **approval always fails** — `records` is undefined, the function throws "Records array is required".

**Fix**: Change `rows` → `records` in `useIntakeAgent.ts` line 225.

---

## 🔴 CRITICAL BUG #2: `data.success` Check is Wrong

**`useIntakeAgent.ts` line 231** checks `data.success > 0` but `bulk-import` returns `{ inserted, failed, errors }` — there is no `success` field.

**Fix**: Change `data.success > 0` → `data.inserted > 0` and `data.insertedIds?.[0]` → just log the result (bulk-import doesn't return IDs in current format, it returns `data` from `.select('id')` nested in batches but exposes only `inserted` count).

---

## ❌ MISSING: Photo Download from Yandex Disk / Cloud Links

The edge function extracts URLs from each item chunk (line 855: `extractUrls(text)`), but these are **Yandex Disk folder links** (e.g. `https://disk.yandex.ru/d/HCkgIKfuK4wqfQ`), not direct image URLs. The system:
- Stores them as `sourceImages` on the `IntakeItem`
- Does **NOT** download/scrape images from Yandex Disk
- Does **NOT** upload images to storage
- Does **NOT** attach images to the created listing

Photos are **not downloaded** — they're just stored as reference links.

**Fix needed**: Either use Firecrawl to scrape Yandex Disk pages for direct image URLs, or add a dedicated image extraction step. This is a significant feature addition.

---

## ❌ MISSING: CRM Contact Creation

The intake flow **does not create CRM contacts**. When an agent posts with contact info (`+66 92 478 1973`, WhatsApp, Telegram), the AI extracts `phone` and `email` fields into `extractedFields`, but:
- `approveItem()` only calls `bulk-import` to create a listing
- No code creates a `crm_contacts` record
- No code links the contact to the created listing

**Fix needed**: After successful listing creation in `approveItem()`, extract phone/email/whatsapp from `extractedFields`, upsert into `crm_contacts`, and create a relationship link.

---

## ⚠️ Build Status

The app builds and runs — no build errors. The DOM nesting warning (`<button>` inside `<button>`) in `ProactiveConcierge.tsx` is cosmetic and unrelated.

---

## Implementation Plan

### Task 1: Fix `rows` → `records` and `success` → `inserted` (5 min)
**File**: `src/hooks/useIntakeAgent.ts`
- Line 225: `rows: [fields]` → `records: [fields]`
- Line 231: `data.success > 0` → `data.inserted > 0`

### Task 2: Add CRM Contact Auto-Creation on Approve (30 min)
**File**: `src/hooks/useIntakeAgent.ts`
- After successful listing creation, check if `extractedFields` contains `phone`, `email`, `whatsapp`, or `telegram`
- If contact info exists, upsert into `crm_contacts` via supabase client
- Store the `source` as `'intake_agent'` for traceability
- Link contact to listing via a note or tag

### Task 3: Image Extraction from Cloud Links (1-2 hours)
**File**: `supabase/functions/intake-listing-agent/index.ts`
- Detect Yandex Disk / Google Drive / Dropbox links
- Use Firecrawl to scrape these pages for actual image URLs
- Return extracted image URLs in `sourceImages`
- On approve, download and upload to storage bucket

This is the most complex task and may require a separate edge function.

---

## Summary

| Check | Status |
|-------|--------|
| Build compiles | ✅ YES |
| Agent message splits correctly | ✅ YES (code logic is sound) |
| AI extraction runs | ✅ YES |
| Items appear in approval panel | ✅ YES (if edge function succeeds) |
| Approval creates listing | 🔴 NO — `rows`/`records` mismatch |
| Photos downloaded | 🔴 NO — only links stored |
| CRM contact created | 🔴 NO — not implemented |
| Contact linked to listing | 🔴 NO — not implemented |

**Priority**: Fix Bug #1 and #2 first (blocking), then CRM contacts, then image download.
