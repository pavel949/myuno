# Developer Portal — End-to-End QA Checklist

> Smoke test the full developer journey from registration through admin moderation.
> Estimated time: 20–30 minutes per pass. Run before every release that touches `/developer-portal/*` or `/admin/newbuilds`.

## Test Accounts
- **Developer (test):** `dev-portal-qa+<date>@myuno.app`
- **Admin (existing):** use admin account with `roles.role = 'admin'`

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
35. **Expect:** small edits keep `approval_status='approved'`. Significant changes (price, units) trigger re-review (status reverts to `pending`).

### 11. Lead capture
36. As anonymous visitor, submit lead form on the project page.
37. **Expect:** row in `nb_leads` with `project_id` set, notification to developer email.
38. Developer dashboard → "Leads" tab shows new lead.

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
- [ ] All 15 steps pass
- [ ] No console errors during run
- [ ] No 4xx/5xx in network tab
- [ ] Mobile + desktop both verified
- [ ] Tester: __________ Date: __________
