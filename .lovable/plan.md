

# Super Search: Deep Audit and Fix

## Issues Found

### 1. "Page Jump" Bug -- Root Cause
The `InlineSearch` dropdown uses `position: absolute` inside a `space-y-3` flex container on the home page. When the dropdown appears/disappears via AnimatePresence, it doesn't cause layout shift itself (it's absolute), **but** the real problem is:

- **Mode flipping between `ai` and `search`**: The `isLikelyQuestion()` function in `useAISearch.ts` classifies queries as "questions" if they contain common Russian words like "ищу" (I'm looking for). When typing "Яхта" character by character ("Я" -> "Ях" -> "Яхт" -> "Яхта"), the first character "Я" alone doesn't trigger anything, but the mode can flip between `ai` and `search` mid-typing because:
  - At 3+ chars, `isLikelyQuestion` re-evaluates on every keystroke
  - When mode flips, the dropdown content completely re-renders (AI loading spinner vs search results vs "no results"), causing visible flicker
  - The `useGlobalSearch` hook is conditionally enabled (`enabled && !isQuestion`) -- so when mode flips to AI, regular search results disappear; when it flips back, they reload from scratch

- **Concurrent request issues**: `useAISearch` fires an edge function call to `ai-smart-search`, but that function doesn't exist in `supabase/functions/`. This means every "question" query returns an error, which then flashes an error state before falling back.

### 2. Redundant Search Components
There are **3 separate search implementations**:
- `InlineSearch` (home page) -- uses `useAISearch` + `useGlobalSearch`
- `GlobalSearchModal` (dialog) -- uses only `useGlobalSearch`
- `MiniAppSearch` (mini apps) -- simple local filter, no DB search
- `UnifiedHeader` search -- simple input, delegates to parent

### 3. Missing AI Edge Function
`useAISearch.ts` calls `supabase.functions.invoke('ai-smart-search')` but no such function exists. Every AI search attempt fails silently, showing a brief error flicker.

### 4. `useGlobalSearch` Performance
- Fires **21 parallel database queries** on every keystroke (after 300ms debounce)
- No query caching between renders
- Searches 21 tables sequentially with individual `ilike` queries

---

## Solution: Unified Super Search

### Phase 1: Fix the Page Jump (Critical)

**File: `src/hooks/useAISearch.ts`**
- Remove the `isLikelyQuestion` mode-switching logic entirely for now
- Always use `useGlobalSearch` as the primary search engine
- Only activate AI mode when user explicitly presses an "Ask AI" button or types "?" prefix
- This eliminates the mode-flipping that causes the jump

**File: `src/components/search/InlineSearch.tsx`**
- Remove the dual-mode rendering that switches between AI and search results
- Use a single consistent results view
- Add an "Ask AI" chip/button at the bottom of results for question-style queries
- Fix the dropdown to use a stable height container with overflow scroll

### Phase 2: Create a Super Search Experience

**File: `src/components/search/InlineSearch.tsx` (rewrite)**
- Stable dropdown that doesn't flicker between states
- Show results immediately from `useGlobalSearch`
- Group results by category (Property, Yachts, Tours, etc.) with section headers
- Add "Ask AI" button that appears when query is 5+ words, triggering AI mode on demand
- Recent searches + trending (already exists, keep)

**File: `src/hooks/useGlobalSearch.ts` (optimize)**
- Add result caching with `useRef` to avoid re-fetching the same query
- Batch results rendering instead of waiting for all 21 tables
- Prioritize category matches (instant) over entity matches (slower)

### Phase 3: Wire AI Search Properly (Optional, separate task)

Create the missing `ai-smart-search` edge function using Lovable AI, or remove all AI search references until it's properly implemented. For now, Phase 1 removes the broken AI dependency.

---

## Technical Details

### Changes to `useAISearch.ts`
- Make AI mode opt-in only (triggered by explicit action, not auto-detection)
- Default behavior: always return `useGlobalSearch` results
- Expose a `triggerAI()` function that the UI can call when user clicks "Ask AI"

### Changes to `InlineSearch.tsx`
- Single rendering path: always show search results
- Stable container: `min-h-[200px]` on the dropdown to prevent jump
- Grouped results with category headers
- "Ask AI" CTA at the bottom of results list
- Smooth transitions without mode switching

### Changes to `useGlobalSearch.ts`
- Add `lastQuery` ref to skip duplicate fetches
- Cache results for 5 seconds to prevent re-fetch on re-renders
- Priority ordering: synonym matches first, category matches second, entity results third

### Files Modified
| File | Change |
|------|--------|
| `src/hooks/useAISearch.ts` | Make AI opt-in, remove auto-detection |
| `src/components/search/InlineSearch.tsx` | Single-mode rendering, grouped results, Ask AI button |
| `src/hooks/useGlobalSearch.ts` | Add caching, prevent duplicate fetches |

