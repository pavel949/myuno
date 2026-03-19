# MC Module — Comprehensive Code Audit

**Date:** 2026-03-19
**Auditor:** Claude Code (claude-sonnet-4-6)
**Scope:** `src/components/mc/`, `src/pages/mc/`, `src/components/admin/mc/`, `src/hooks/useCompanyCategorySettings.ts` and all related imports/dependencies.

---

## 1. Architecture Review

**Structure:** `src/components/mc/` (layout + settings) + `src/pages/mc/` (pages) + `src/components/admin/mc/` (admin) + `src/hooks/useCompanyCategorySettings.ts` (data layer). The boundary is clean — no other module imports MC internals; MC is accessed exclusively through routes.

**Separation of concerns:** Good. React Query owns all server state. Local `useState` handles form/UI. Contexts (Auth, Language, ActiveCompany) injected via hooks, not prop-drilled.

**Dependency graph:** No circular dependencies found. External imports flow one-way: `mc` → shared hooks/contexts/utils → supabase.

**Coupling issue:** `MCHeader.tsx` imports `navigationGroups` from `MCSidebar.tsx` at module level to build breadcrumbs. These two layout components are tightly coupled through a shared mutable export.

---

## 2. Findings

---

### CRITICAL — Must fix before new features

---

#### C-1: Slug TOCTOU Race Condition
**File:** `src/pages/mc/MCOnboarding.tsx:101–109`

```ts
const { data: existing } = await supabase
  .from('management_companies')
  .select('id')
  .eq('slug', slug)
  .maybeSingle();
if (existing) {
  slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
}
// ... then calls register-mc with this slug
```

**Problem:** Classic check-then-act race. Two concurrent registrations with the same company name both pass the read check simultaneously, then both call `register-mc` with the same slug. If there is no DB-level unique constraint on `slug`, duplicate slugs silently exist in production. If there is a constraint, the user sees a generic Edge Function error.

**Why it matters:** Onboarding is the first user experience. Corrupted slugs break company storefront links, routing, and identity.

**Fix:** Remove the client-side check entirely. Let the DB unique constraint reject duplicates. In the `catch` block, inspect `data.error` for a unique violation and show "Company name already taken — try a more specific name."

---

#### C-2: AI Stream — No AbortController, No Unmount Cleanup
**File:** `src/pages/mc/MCHelpPage.tsx:250–303`

```ts
const streamChat = async (msgs: ChatMessage[]) => {
  const resp = await fetch(CHAT_URL, { ... });
  const reader = resp.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // ... setMessages() called here
  }
};
```

**Problem:** If the user switches tabs while a response is streaming, the `ReadableStreamDefaultReader` keeps reading and calls `setMessages()` on an unmounted component. There is no `AbortController` passed to `fetch` and no cleanup.

**Why it matters:** Memory leak, React "state update on unmounted component" violation, and the stream continues consuming network bandwidth until the response body ends.

**Fix:**
```ts
useEffect(() => {
  const controller = new AbortController();
  // pass controller.signal to fetch
  return () => controller.abort();
}, []);
```

---

#### C-3: Direct Mutation of React State Object
**File:** `src/pages/mc/MCOnboarding.tsx:207`

```ts
for (const invite of validInvites) {
  // ...
  invite.sent = true; // ← direct mutation of state array item
}
setInvites([...invites]); // spread doesn't help — objects were mutated
```

**Problem:** `invite` is a reference into the `invites` state array. Mutating it before `setInvites` means React sees the same object references and may skip re-render or produce stale closures in concurrent mode.

**Why it matters:** Silent rendering bugs — `sent` checkmarks may not appear, or the UI freezes on the invite step.

**Fix:**
```ts
setInvites(prev => prev.map(inv =>
  validInvites.includes(inv) ? { ...inv, sent: true } : inv
));
```

---

### HIGH — Fix within current sprint

---

#### H-1: Unbounded Query — All Property Slots Fetched for Admin View
**File:** `src/components/admin/mc/AdminMCSubscriptions.tsx:58–61`

```ts
const { data: slots } = await supabase
  .from('mc_property_slots')
  .select('company_id, is_active');
// No .limit(), no .filter()
```

**Problem:** Every active slot record across every company is loaded into the client, then aggregated in JS. As the platform grows (100 companies × 30 properties = 3,000 rows now, unbounded later), this query becomes costly.

**Why it matters:** Admin dashboard load time degrades linearly with platform growth. Supabase free tier row limits could be hit.

**Fix:** Use a server-side aggregate:
```ts
.from('mc_property_slots')
.select('company_id, count(*)', { count: 'exact' })
.eq('is_active', true)
// Then groupBy company_id — or use a DB view/RPC
```

---

#### H-2: Unused `useResolvedContext` Call Fires Extra RPC
**File:** `src/components/mc/MCSidebar.tsx:158`

```ts
const { role: resolvedRole } = useResolvedContext();
// resolvedRole is never referenced anywhere in the component
```

**Problem:** `useResolvedContext` calls the `resolve_user_context` Postgres RPC on every render. The result is destructured but the variable is never used — permissions are already handled by `useTeamPermissions`.

**Why it matters:** Every time the sidebar re-renders (navigation, language change, badge update), an unnecessary DB round-trip is triggered.

**Fix:** Remove line 158 entirely. The sidebar only needs `useTeamPermissions` and `useActiveCompany`.

---

#### H-3: Auto-Backup Feature is a No-Op (Misleading UX)
**File:** `src/components/mc/settings/DataBackupSettings.tsx`

**Problem:** The UI saves `auto_enabled`, `frequency`, and `format` into `management_companies.backup_settings` (a JSON field). No server-side cron job, Supabase Scheduler, or Edge Function trigger reads this field and actually runs backups. The badge says "Saved to cloud" — no cloud backup ever happens.

**Why it matters:** Users trust this feature for data safety. Silent feature gap is a business/trust risk.

**Fix:** Either (a) implement a Supabase scheduled function that reads `backup_settings` and calls `export-mc-data`, or (b) replace the toggle with a "Coming Soon" badge and remove the false affordance until it's built.

---

#### H-4: `format` Local State Overwrites Saved Backup Format on Toggle
**File:** `src/components/mc/settings/DataBackupSettings.tsx:108–124`

```ts
const [format, setFormat] = useState<ExportFormat>('json'); // local state

const toggleAutoBackup = (enabled: boolean) => {
  saveAutoBackup.mutate({
    ...backupSettings,
    auto_enabled: enabled,
    format, // ← uses LOCAL state, not saved value
  });
};
```

**Problem:** If a user saved `format: 'csv'` in a previous session, then opens settings and toggles auto-backup on/off without touching the format selector, `format` local state is `'json'` (the default), and `toggleAutoBackup` overwrites the saved format to `'json'`.

**Why it matters:** Silent data loss — user preferences are destroyed by unrelated actions.

**Fix:** Initialize local `format` state from `backupSettings?.format ?? 'json'` in a `useEffect`, or use `backupSettings?.format` directly in the mutate call.

---

#### H-5: No Error Boundary in MC Workspace
**File:** Entire MC module

**Problem:** There are no `<ErrorBoundary>` components anywhere in `MCLayout.tsx` or its subtree. Any render-time throw in any MC page (bad data shape, null access, etc.) crashes the entire workspace back to a blank screen.

**Why it matters:** Users lose all context and see nothing — no error message, no "try again" button.

**Fix:** Wrap `MCLayout`'s `<Outlet />` in an error boundary that shows a friendly "Something went wrong" panel with a reload option.

---

### MEDIUM — Technical debt, schedule for cleanup

---

#### M-1: `company_category_settings` Table Entirely Untyped — `as any` Throughout
**File:** `src/hooks/useCompanyCategorySettings.ts:34, 40, 71, 77, 78, 114, 115, 151–159, 195, 197`

```ts
.from('company_category_settings' as any)
// ...
} as any,
{ onConflict: 'company_id,category_type,category_code' }
```

**Problem:** The table `company_category_settings` is not in the generated Supabase TypeScript schema (`Database` type), so all queries cast the table name and row data to `any`. Zero type safety: a column rename or type change would silently break at runtime.

**Fix:** Run `supabase gen types typescript` to regenerate types after confirming the table exists in the DB schema, or manually add the type definition to `src/integrations/supabase/types.ts`.

---

#### M-2: Duplicate Calendar Path in Sidebar Navigation
**File:** `src/components/mc/MCSidebar.tsx:50, 82`

```ts
// Control Tower group:
{ title: 'Calendar', path: APP_ROUTES.MC_CALENDAR, ... }

// Distribution group:
{ title: 'Calendar Sync', path: APP_ROUTES.MC_CALENDAR, ... } // same path!
```

**Problem:** Two separate sidebar items navigate to the same route. Both will show as "active" simultaneously. `APP_ROUTES.MC_CHANNELS` is also in the Distribution group but missing from `PATH_TO_MODULE`, so the Channel Manager bypasses RBAC filtering.

**Fix:** "Calendar Sync" should point to `APP_ROUTES.MC_CHANNELS` (the actual channel manager route). Add `[APP_ROUTES.MC_CHANNELS]: 'bookings'` to `PATH_TO_MODULE`.

---

#### M-3: Custom Category Code Collision — No User-Friendly Handling
**File:** `src/components/mc/settings/FinanceCategorySettings.tsx:341`

```ts
const code = newNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
```

**Problem:** "Pool Maintenance" and "Pool-Maintenance" → same code `pool_maintenance`. Also "Pool Maintenance" and "Pool Maintenance " (trailing space) → same code. DB upsert will silently overwrite if there's no unique constraint, or throw a constraint error showing a raw error toast.

**Fix:** Check for existing codes before insert; append `_2`, `_3`, etc. if needed. Show a specific error message on DB constraint violation.

---

#### M-4: Custom Category Name Edit Goes to Wrong Table
**File:** `src/components/mc/settings/FinanceCategorySettings.tsx:367–373`

```ts
const handleSaveCustomEdit = async () => {
  // Uses company_category_settings overrides, NOT financial_categories
  handleOverride(editCustom.code, 'custom_name_en', editCustomNameEn.trim());
  handleOverride(editCustom.code, 'custom_name_ru', editCustomNameRu.trim());
};
```

**Problem:** Custom categories exist in `financial_categories` table. Editing their name stores the change in `company_category_settings.custom_name_*` (the override mechanism designed for standard categories). If the company's category settings are ever reset/reinitialised, the custom category reverts to its original name.

**Fix:** Update `financial_categories` directly when editing custom categories; the override mechanism is for standard (immutable) category labels.

---

#### M-5: `setTimeout` Navigation Without Cleanup
**File:** `src/pages/mc/MCRegistrationPage.tsx:77`

```ts
setTimeout(() => navigate(redirectTo), 2000);
```

**Problem:** No `clearTimeout` on unmount. If the component unmounts within 2 seconds (e.g., user clicks back), the `navigate` fires after unmount, potentially redirecting to a stale location.

**Fix:**
```ts
useEffect(() => {
  if (!success) return;
  const t = setTimeout(() => navigate(redirectTo), 2000);
  return () => clearTimeout(t);
}, [success, navigate, redirectTo]);
```

---

#### M-6: Invalid Tailwind Class `h-4.5 w-4.5`
**File:** `src/pages/mc/MCSettingsPage.tsx:75`

```tsx
<Icon className="h-4.5 w-4.5 text-primary" />
```

**Problem:** Tailwind's default scale has `h-4` (1rem) and `h-5` (1.25rem) but not `h-4.5`. This class is silently ignored; the icon renders at its default size.

**Fix:** Use `h-4 w-4` or `h-5 w-5`.

---

#### M-7: Duplicate `NavItem` Interface
**Files:** `src/components/mc/MCSidebar.tsx:28–34`, `src/components/mc/MCMobileNav.tsx:11–17`

**Problem:** Both files define an identical `NavItem` interface independently.

**Fix:** Extract to `src/components/mc/types.ts` and import in both files.

---

#### M-8: `MCLayout` Accepts `children` Prop That Is Never Passed
**File:** `src/components/mc/MCLayout.tsx:9–11, 42`

```ts
interface MCLayoutProps {
  children?: React.ReactNode;
}
// ...
{children || <Outlet />}
```

**Problem:** No MC route ever passes `children` to `MCLayout`. This prop is dead code that adds confusing optionality to the API.

**Fix:** Remove the `children` prop and `MCLayoutProps` interface; render `<Outlet />` unconditionally.

---

### LOW — Nice to have / minor improvements

---

#### L-1: Hardcoded WhatsApp Number
**File:** `src/pages/mc/MCHelpPage.tsx:584`

```ts
onClick={() => window.open('https://wa.me/66922407355', '_blank')}
```

Should come from a config constant or the company's `whatsapp` field.

---

#### L-2: Hardcoded Route Strings in Onboarding Step 4
**File:** `src/pages/mc/MCOnboarding.tsx:427, 431`

```ts
navigate('/mc/properties/new')
navigate('/mc')
```

Should use `APP_ROUTES.MC_PROPERTIES_NEW` and `APP_ROUTES.MC`.

---

#### L-3: Fragile DOM Query for Keyboard Shortcut
**File:** `src/components/mc/MCLayout.tsx:21`

```ts
document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement
```

**Problem:** Relies on an internal attribute of the shadcn Sidebar component. A library upgrade could silently break Ctrl+B.

**Fix:** Use a `ref` on the `SidebarTrigger` or call `useSidebar().toggleSidebar()` from the sidebar context directly.

---

#### L-4: Search Filter in Help Page Has No Debounce
**File:** `src/pages/mc/MCHelpPage.tsx:414–432`

The FAQ and features are filtered on every keystroke. Non-issue at current data size, but worth adding a `useDeferredValue` or 150ms debounce for future growth.

---

#### L-5: Missing `aria-label` on Icon-Only Buttons
**Files:** `src/components/mc/MCHeader.tsx:140, 148`, `src/components/mc/MCMobileNav.tsx:83–90`

The Help, Notifications, and FAB buttons are icon-only with no accessible label. The `title` attribute is set on some but not all.

---

## 3. Summary Table

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 3 | Slug race condition, AI stream memory leak, state mutation |
| HIGH | 5 | Unbounded admin query, dead RPC call, fake auto-backup, format overwrite, no error boundary |
| MEDIUM | 8 | Untyped table (`as any`), duplicate nav paths, code collision, wrong table for custom edit, setTimeout leak, invalid Tailwind class, duplicate interface, dead prop |
| LOW | 5 | Hardcoded WhatsApp, hardcoded routes, fragile DOM query, no debounce, missing ARIA labels |

---

## 4. Overall Architecture Score: 7 / 10

**Strengths:**
- Clean module boundaries — MC is self-contained, no external components import from it
- Consistent React Query usage for all server state
- Proper RBAC enforced at DB level (RLS + `resolve_user_context` RPC)
- Bilingual support is thorough and consistent throughout
- Good memoisation in `FinanceCategorySettings` (memo components, `useMemo` for derived data)
- Lazy loading for heavy pages

**Weaknesses:**
- Untyped data layer for a key table (`as any` everywhere in category settings)
- One prominently featured but non-functional feature (auto-backup)
- One TOCTOU bug in the primary onboarding path
- No error boundaries protecting the workspace

---

## 5. Top 3 Immediate Actions

1. **Fix slug race condition** (`MCOnboarding.tsx:101–109`) — Drop client-side uniqueness check; handle DB unique constraint error with a friendly message. ~1 hour.

2. **Remove auto-backup UI or implement it** (`DataBackupSettings.tsx`) — Currently misleads users into believing backups are running. Either wire up a Supabase scheduled function that reads `backup_settings` and calls `export-mc-data`, or replace the toggle with "Coming Soon" until it's built. ~2–4 hours to implement properly.

3. **Remove dead `useResolvedContext` call in MCSidebar** (`MCSidebar.tsx:158`) — One-line deletion eliminates an unnecessary DB round-trip on every navigation event. ~5 minutes.

---

## 6. Estimated Refactor Effort

| Severity | Items | Estimated Hours |
|----------|-------|----------------|
| CRITICAL | 3 | 4–6 h |
| HIGH | 5 | 8–12 h |
| MEDIUM | 8 | 10–16 h |
| LOW | 5 | 3–5 h |
| **Total** | **21** | **25–39 h** |
