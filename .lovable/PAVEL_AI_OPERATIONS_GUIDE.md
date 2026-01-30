# UNO AI Operations Guide
## For Pavel — How AI Works in UNO

---

## Quick Overview

UNO has **8 AI-powered features** that help users, owners, vendors, and admins. All AI is **read-only** — it cannot change bookings, payments, or approvals.

---

## What AI Exists Today

### 1. Support Chat (for Everyone)
**Where:** Blue chat bubble (bottom-right on all pages)
**What it does:** Answers general questions about UNO, Phuket, bookings
**Language:** Russian and English

### 2. Owner Assistant (for Property Owners)
**Where:** Owner Dashboard → AI Chat
**What it does:** Answers property management questions, Thai laws, pricing advice
**Language:** Russian and English

### 3. Property Search (for Guests)
**Where:** Property Search page → AI Chat
**What it does:** Helps guests find the right property based on preferences
**Language:** Russian and English

### 4. Smart Search (for Everyone)
**Where:** Search bar (detects when you ask a question)
**What it does:** Answers questions directly or suggests categories
**Language:** Russian and English

### 5. Auto-Translate
**Where:** Any form with translation button (✨ icon)
**What it does:** Translates content between Russian, English, Thai
**Use case:** Vendors creating listings

### 6. Description Generator
**Where:** Listing forms (product, service, property)
**What it does:** Generates marketing copy from basic details
**Use case:** Vendors writing descriptions

### 7. Smart Data Extractor
**Where:** Admin import wizard, vendor upload forms
**What it does:** Extracts structured data from text, maps spreadsheet columns
**Use case:** Bulk imports

### 8. Photo Analyzer
**Where:** Property/product upload forms
**What it does:** Analyzes photos to detect features, condition
**Use case:** Property inspections

---

## Where to Manage AI

### Admin Dashboard → AI Agents
**URL:** `/admin/ai-agents`

From here you can:
- See all AI agents
- Edit prompts and knowledge
- View usage stats
- Create new versions

### Agent Editor
**URL:** `/admin/ai-agents/{id}`

- **System Prompt:** The instructions AI follows
- **Knowledge Base:** Facts AI knows (FAQs, contact info, etc.)
- **Versions:** All prompt changes are versioned

---

## How to Turn AI On/Off

### Disable an Agent
1. Go to `/admin/ai-agents`
2. Find the agent
3. Toggle "Active" switch to OFF
4. Agent stops responding (shows error message)

### Re-enable an Agent
1. Toggle "Active" switch to ON
2. Agent works immediately

### Emergency: Disable All AI
Contact Lovable support to disable the LOVABLE_API_KEY secret.

---

## How to Update AI Responses

### Scenario: Change what Support Chat says

1. Go to `/admin/ai-agents`
2. Click on "Support Chat"
3. Click "Create New Version"
4. Edit the **Knowledge Base** section
5. Click "Save Draft"
6. Test with the preview
7. Click "Publish" when ready

### Important:
- Previous versions are saved (you can rollback)
- Publishing takes effect immediately
- Test before publishing!

---

## Where to See AI Logs

### Admin Dashboard → AI Agents → Select Agent → Logs Tab

Shows:
- Who used it (user ID or anonymous)
- When
- How long it took
- Success/Error

### Useful for:
- Debugging issues
- Understanding usage patterns
- Finding errors

---

## AI Safety Rules (Built-In)

AI **CANNOT**:
- ❌ Create or modify bookings
- ❌ Process payments or refunds
- ❌ Change property/listing status
- ❌ Access other users' data
- ❌ Make promises on behalf of UNO
- ❌ Approve or reject anything

AI **CAN ONLY**:
- ✅ Answer questions
- ✅ Give advice
- ✅ Translate text
- ✅ Generate descriptions
- ✅ Extract data from text/images
- ✅ Suggest categories

---

## Cost Control

AI usage is rate-limited:
- **10 requests per minute** per user
- **Automatic** — no action needed

If limits are hit, user sees: "Too many requests. Please wait."

---

## Troubleshooting

### "AI is not responding"
1. Check if agent is active in admin
2. Check logs for errors
3. Check if rate limit was hit

### "AI gives wrong answers"
1. Review the Knowledge Base
2. Check recent prompt changes
3. Consider adding/updating FAQs

### "AI speaks wrong language"
AI auto-detects from user's message. If user writes in Russian, AI responds in Russian.

---

## Adding a New AI Agent

1. Go to `/admin/ai-agents`
2. Click "Create Agent"
3. Fill in:
   - Name (EN/RU)
   - Slug (unique identifier)
   - Target audience
   - Tone
4. Create first knowledge version
5. Write system prompt
6. Test and publish

---

## Technical Contact

For technical issues:
- **Frontend:** Check browser console for errors
- **Backend:** Check edge function logs in Lovable Cloud
- **AI Gateway:** Check for 429/402 errors (rate limit/quota)

---

## Summary

| Feature | Location | Audience | Status |
|---------|----------|----------|--------|
| Support Chat | Chat FAB | Everyone | ✅ Active |
| Owner Assistant | Owner Dashboard | Owners | ✅ Active |
| Property Search | Search Page | Guests | ✅ Active |
| Smart Search | Search Bar | Everyone | ✅ Active |
| Auto-Translate | Forms | Vendors | ✅ Active |
| Description Generator | Forms | Vendors | ✅ Active |
| Smart Data | Admin Import | Admins | ✅ Active |
| Photo Analyzer | Upload Forms | Vendors | ✅ Active |

All AI is safe, logged, and can be managed through the admin dashboard.
