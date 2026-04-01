

# "Новостройки Пхукета" — New Developments Section Plan

## What Already Exists (DO NOT rebuild)

| Asset | Details |
|-------|---------|
| **`property_projects`** table | 157 records, has `project_status`, `price_from/to`, `construction_progress`, `completion_date`, `developer_id`, `muuno_score`, `units_available/sold`, `is_featured`, `is_active` |
| **`developers`** table | 39 records with `name_en/ru`, `slug`, `logo_url`, `muuno_score`, `is_verified`, `website`, `phone` |
| **`development_units`** table | Unit configs per project (type, area, bedrooms, price, floor_plan_url, status) |
| **`consultation_requests`** table | Full lead pipeline with `ai_score`, `development_project_id`, `vertical_id`, `status` pipeline |
| **Hooks** | `useOffplanProjects`, `useDevelopers`, `useDevelopmentUnits`, `usePropertyProjects` |
| **Pages** | `OffplanIndex`, `OffplanDetail`, `DevelopersIndex`, `DeveloperDetail` at `/property/offplan/*` and `/property/developers/*` |
| **Components** | `OffplanProjectCard`, `DeveloperBadge`, `DevelopmentUnitsSection`, `UniversalLeadForm`, `OffplanCTASection` |
| **Routes** | `APP_ROUTES.OFFPLAN`, `OFFPLAN_DETAIL`, `DEVELOPERS`, `DEVELOPER_DETAIL` |

**Key insight**: The entire data layer and basic pages exist. The user wants a **premium editorial redesign** of these pages under a new `/newbuilds` route hierarchy, with a developer portal and admin approval flow added on top.

---

## What Needs Building

### Phase 1: Schema Extensions (migration)

**Extend existing tables** (no new `nb_*` tables — reuse what's there):

1. **Add to `property_projects`**: `slug TEXT UNIQUE`, `tagline TEXT`, `tagline_ru TEXT`, `is_approved BOOLEAN DEFAULT true`, `unit_types TEXT[]`, `gallery_urls TEXT[]` (alias for existing `images`), `location_area TEXT`
2. **Add to `developers`**: `user_id UUID REFERENCES auth.users`, `verified BOOLEAN` (alias `is_verified`), `subscription_tier TEXT DEFAULT 'free'`, `company_name TEXT` (alias `name_en`)
3. **New table `nb_special_terms`**: payment_plan, discount, promo_label, valid_until — linked to `property_projects`
4. **New table `nb_project_updates`**: construction feed entries (title, content, photo_urls, progress_at_time) — linked to `property_projects`
5. **New table `nb_project_reports`**: monthly PDF reports — linked to `property_projects`
6. **New table `nb_leads`**: dedicated newbuild leads with `project_id`, `developer_id`, `score`, `status`, `source`, `transferred_to_developer` — separate from `consultation_requests` for developer-facing CRM
7. **New table `nb_promotions`**: paid placements (featured, banner, email_blast)
8. **RLS**: Public read on approved/active projects; developer write own; admin write all. Leads: developer read own, admin read all.

### Phase 2: Design System — Newbuilds Theme

Create `src/styles/newbuilds-theme.css` with scoped CSS variables:
- Colors: `--nb-bg: #0F0F0F`, `--nb-surface: #141414`, `--nb-gold: #C9A84C`, `--nb-muted: #8A8A7A`
- Typography: Import "Cormorant Garamond" (serif) for headlines
- Glass cards: `rgba(255,255,255,0.04)` + gold border + backdrop-blur
- Gold progress bars, status badges, grain texture overlay
- Wrapper component `<NewbuildsLayout>` that applies `.nb-theme` class scope

### Phase 3: Routes & Navigation

Add to `APP_ROUTES`:
```
NEWBUILDS: '/newbuilds'
NEWBUILDS_PROJECTS: '/newbuilds/projects'
NEWBUILDS_PROJECT: (slug) => '/newbuilds/projects/${slug}'
NEWBUILDS_DEVELOPERS: '/newbuilds/developers'
NEWBUILDS_DEVELOPER: (slug) => '/newbuilds/developers/${slug}'
DEVELOPER_PORTAL: '/developer-portal'
DEVELOPER_PORTAL_PROJECTS: '/developer-portal/projects'
DEVELOPER_PORTAL_NEW_PROJECT: '/developer-portal/projects/new'
DEVELOPER_PORTAL_EDIT_PROJECT: (id) => '/developer-portal/projects/${id}'
DEVELOPER_PORTAL_LEADS: '/developer-portal/leads'
DEVELOPER_PORTAL_ANALYTICS: '/developer-portal/analytics'
ADMIN_NEWBUILDS: '/admin/newbuilds'
```

Add "Новостройки" to main nav dropdown.

### Phase 4: Public Pages (8 files)

**4.1 `/newbuilds` — Landing Page** (`src/pages/newbuilds/NewbuildsLanding.tsx`)
- Hero: full-viewport, Cormorant Garamond 80px gold headline, search bar, filter pills
- Stats bar pulling real counts from DB (157 projects, 39 developers)
- Featured projects section (3 cards, horizontal editorial layout)
- Map section with Leaflet dark tiles + gold markers
- All projects grid preview (6 cards) with "Смотреть все →"
- AI assistant widget with pre-filled prompts
- Lead capture / alert signup form → `nb_leads` with `source='alert_signup'`
- Developer CTA section

**4.2 `/newbuilds/projects` — Catalog** (`src/pages/newbuilds/NewbuildsCatalog.tsx`)
- Reuses `useOffplanProjects` hook with extended filters
- Sidebar filters: area, unit type, price slider, status, completion year, developer, sort
- Grid/list toggle, pagination (12/page)
- New `<NewbuildProjectCard>` with gold design language

**4.3 `/newbuilds/projects/:slug` — Project Detail** (`src/pages/newbuilds/NewbuildDetail.tsx`)
- Sticky header on scroll with CTA
- Hero image gallery + video
- Core info bar (developer, location, price, units, completion)
- 7 tabs: Обзор | Инвентарь | Планировки | Условия | Обновления | Отчёты | О девелопере
- Right sidebar: lead form → `nb_leads`, ROI calculator widget, share/save
- Reuses `DevelopmentUnitsSection` for inventory tab

**4.4 `/newbuilds/developers` & `/:slug`** — Restyled versions of existing pages with gold theme

### Phase 5: Developer Portal (protected, 6 files)

**5.1 Portal layout** with sidebar nav (Overview, Projects, Leads, Analytics, Promotions, Settings)
- Auth guard: requires login + developer record linked to `user_id`
- "Apply to join" form if not a developer

**5.2 Overview**: KPI cards, recent leads, quick actions
**5.3 My Projects**: list with status, views, leads, edit buttons
**5.4 Project Editor**: 5-step wizard (Info → Media → Description → Inventory → Terms)
- Media uploads to Supabase Storage bucket `newbuilds`
- Inventory table editor for `development_units`
- Creates project with `is_approved = false`

**5.5 Leads CRM**: table with status pipeline, score badges, filters, CSV export
**5.6 Analytics**: Recharts line/bar/funnel/donut charts

### Phase 6: Admin Panel (1 file)

`/admin/newbuilds` — Pending approvals queue, all projects/developers management, featured slot ordering

### Phase 7: Shared Components (~10 files)

1. `<NewbuildProjectCard>` — compact + featured variants with gold design
2. `<ProjectStatusBadge>` — Строится (amber) / Сдан (green) / Скоро (blue)
3. `<ConstructionProgress>` — gold progress bar
4. `<PriceDisplay>` — THB with ฿M/K formatting
5. `<NewbuildLeadForm>` — inquiry form saving to `nb_leads`
6. `<UnitStatusBadge>` — available/reserved/sold
7. `<AIAssistantWidget>` — chat with project recommendations
8. `<InventoryTable>` — sortable units table
9. `<ConstructionFeed>` — timeline of updates
10. `<NewbuildsLayout>` — dark editorial wrapper

### Phase 8: Seed Data

Insert via SQL: ensure 5+ projects have `slug`, `is_approved=true`, `gallery_urls`, `unit_types` populated. Add sample `nb_special_terms`, `nb_project_updates`, and `nb_leads`.

---

## Implementation Order

1. **Migration**: schema extensions + new tables + RLS
2. **Theme CSS** + `NewbuildsLayout` wrapper
3. **Shared components** (cards, badges, price display)
4. **Hooks** (`useNewbuildProjects`, `useNewbuildLeads`, `useProjectUpdates`, `useSpecialTerms`)
5. **Public pages**: Landing → Catalog → Detail → Developers
6. **Developer portal**: Layout → Overview → Editor → Leads → Analytics
7. **Admin panel**
8. **Routes + navigation** integration
9. **Seed data**

Estimated: ~25 new files, 1 migration, ~5 modified files.

