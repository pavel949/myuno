# Developer Portal — End-to-End QA Checklist

> Smoke test the full developer journey from registration through admin moderation.
> Run the applicable checks before releases that touch `/developer-portal/*` or `/admin/newbuilds`. Record the deployed revision and the exact scope of the checks.

## Environment and stop condition

Production and Lovable preview share the same business database. Treat both as live. On them, use read-only navigation: open published pages and authenticated views without submitting a form, changing a record or role, impersonating a developer, uploading media, or sending a notification.

Run registration, mutations, approval/rejection, cleanup, and lead submission only against a verified separate database with disposable fixtures and isolated notification sinks. A fake name or a `[TEST]` label does not isolate the request. If that environment is unavailable, mark write and delivery acceptance **BLOCKED**, not passed.

## Test Accounts
- **Developer and admin:** disposable accounts in the isolated environment, with the same roles as the corresponding production accounts. Route synthetic mail and WhatsApp delivery only to test sinks.

## Steps

### 1. Public landing
1. Open `/developer-portal` while logged out.
2. **Expect:** Hero with CTA "Register", value-prop sections, case studies. No layout shift on load.

### 2. Registration
3. Click "Register" → `/developer-portal/register`.
4. Submit form: company name, contact email, phone, country.
5. **Expect:** confirmation email sent, redirect to `/developer-portal/verify-email`.
6. Open the magic link from email.
7. **Expect:** redirect to `/developer-portal/dashboard` with empty state.

### 3. Profile completion
8. Complete developer profile: logo, headquarters, founded year, website.
9. Save.
10. **Expect:** profile data persisted (refresh page → fields still populated). Row in `developers` table tied via `user_id`.

### 4. Create a project
11. Click "New project" → form opens.
12. Fill required fields: `name_en`, `name_ru`, district, project_status, cover_image.
13. Save as draft.
14. **Expect:** appears in dashboard "Drafts". Row in `property_projects` with `approval_status='draft'` and `developer_id=<your dev>`.

### 5. Add unit types
15. Open project → "Units" tab.
16. Add 3 unit types: 1BR, 2BR, 3BR with price ranges and area.
17. **Expect:** rows in `project_units` with `project_id` set, sorted by bedrooms.

### 6. Upload media
18. Project → "Media" tab.
19. Upload 5 gallery photos and 2 floor plans.
20. **Expect:** WebP-compressed uploads in `vendor-uploads` bucket; floor plans in `floor_plans` table.

### 7. Submit for moderation
21. Click "Submit for review".
22. **Expect:** `approval_status='pending'`, toast confirms submission.
23. Project disappears from "Drafts", appears in "Pending review".

### 8. Admin moderation
24. Log in as admin, open `/admin/newbuilds`.
25. Switch to "Pending" tab.
26. **Expect:** project visible with developer name, cover image, submission date.
27. Select project via checkbox → click "Approve" in bulk bar.
28. **Expect:** `approval_status='approved'`, project disappears from Pending tab.

### 9. Public visibility
29. Logged out, open `/newbuilds`.
30. **Expect:** approved project listed in catalog.
31. Open project detail page (`/newbuilds/:slug`).
32. **Expect:** `SEOHead` populated (check `<title>`, `og:image`, JSON-LD), gallery, units, lead form.

### 10. Edit after approval
33. Back as developer → edit project description.
34. Save.
35. **Expect:** isolated tests confirm the configured moderation rule. With a disposable fixture, make one authorized photo or starting-price change, then read the public project from a separate signed-out session. Confirm approved changes propagate and pending/rejected changes do not appear. Record project ID, role, result, and build revision; a success toast does not prove public propagation.

### 11. Lead capture
36. **Isolated only.** As an anonymous visitor, submit one synthetic lead for a known project; keep the request ID. Repeat the same request after a simulated lost response. Record the page URL and route, writer, Inbox source and stored request ID for each entry point. The current project form uses `nb_leads`; the off-plan consultation candidate (#260) uses `consultation_requests`. Verify them separately if both are available.
37. **Expect:** one durable request linked to the intended project, visible in the internal myUNO admin queue. Reconcile the same ID in the configured myUNO email and WhatsApp test sinks. Verify the operator can identify the specific project and, when selected, the unit without searching by the customer's name. For a consultation, check the exact Inbox entry and the corresponding Buyer Request Summary in `/admin/consultations`; opening the Inbox entry alone does not prove offer context. A configured recipient or an accepted send is not delivery evidence.
38. **Expect:** no forwarding to the developer or any supplier, and no customer contact or lead exposure in a supplier workspace. Any legacy notification path, duplicate, missing record/delivery, or wrong recipient blocks acceptance.

### 12. Admin impersonation
39. Admin → `/admin/developers` → click developer → "Impersonate".
40. **Expect:** session swap, banner "Acting as <developer>", row in `developer_impersonation_log`.
41. Click "End impersonation" → return to admin.

### 13. Reject flow
42. Submit a second project for review.
43. As admin → "Pending" tab → bulk reject with reason.
44. **Expect:** `approval_status='rejected'`, developer sees reason in dashboard.

### 14. Mobile (375 px)
45. On mobile viewport: open `/developer-portal/dashboard`, project create form, `/admin/newbuilds`.
46. **Expect:** no horizontal scroll, sticky bulk-actions bar visible, lead modals open as bottom sheets.

### 15. Cleanup
47. Delete test project from admin.
48. **Expect:** rows removed from `property_projects`, `project_units`, `floor_plans`. Storage assets remain (manual cleanup if needed).

---

## Known integrity check (SQL)

```sql
-- Projects without developer_id
SELECT id, name_en, developer_name FROM property_projects
WHERE developer_id IS NULL AND developer_name IS NOT NULL;

-- Developers with no projects
SELECT d.id, d.name_en FROM developers d
LEFT JOIN property_projects pp ON pp.developer_id = d.id
WHERE pp.id IS NULL;

-- Pending projects older than 7 days
SELECT id, name_en, created_at FROM property_projects
WHERE approval_status = 'pending' AND created_at < now() - interval '7 days';
```

## Sign-off
- [ ] Read-only smoke: published build, desktop and mobile scope recorded.
- [ ] Isolated CRUD: test roles, disposable project, signed-out readback, and expected moderation outcome.
- [ ] Isolated delivery: one request ID, same project, myUNO admin visibility and confirmed internal test-sink delivery; no supplier notification or duplicate.
- [ ] Blocked or skipped checks and relevant console/network failures documented.
- [ ] Tester: __________ Date: __________ Revision: __________
