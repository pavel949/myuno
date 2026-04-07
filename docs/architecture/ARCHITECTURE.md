# Architecture Overview

## Directory Structure

```
src/
├── components/          — UI components by domain
│   ├── admin/           — Admin panel components
│   ├── vendor/          — Vendor portal components
│   ├── owner/           — Property owner components
│   ├── booking/         — Booking flow components
│   ├── canonical/       — Canonical listing wizard components
│   ├── filters/         — Universal filter system
│   ├── miniapp/         — MiniAppLayout and shared vertical components
│   ├── listing-wizard/  — Schema-driven listing forms
│   ├── market/          — Marketplace components
│   ├── ui/              — shadcn/ui primitives
│   └── ...              — Domain-specific (beauty/, property/, yachts/, etc.)
│
├── pages/               — Route page components (one folder per vertical)
│   ├── admin/           — Admin pages
│   ├── vendor/          — Vendor portal pages
│   ├── owner/           — Owner portal pages
│   └── ...              — Vertical pages (property/, restaurants/, yachts/, etc.)
│
├── hooks/               — Business logic (230+ hooks)
│   ├── useSupabaseCRUD.ts     — Generic CRUD hook
│   ├── useSupabaseQuery.ts    — Generic query hook
│   ├── useVendor*.ts          — Vendor-specific hooks
│   ├── useAdmin*.ts           — Admin-specific hooks
│   └── use{Vertical}.ts      — Per-vertical data hooks
│
├── contexts/            — Global React Context providers
│   ├── AuthContext.tsx         — Authentication state & methods
│   ├── CartContext.tsx         — Shopping cart (localStorage + DB sync)
│   ├── LanguageContext.tsx     — EN/RU language switching
│   ├── CurrencyContext.tsx     — Currency display preferences
│   ├── LocationContext.tsx     — User geolocation
│   ├── ThemeContext.tsx        — Light/dark theme
│   ├── MaintenanceContext.tsx  — Maintenance mode toggle
│   ├── PWAInstallContext.tsx   — PWA install prompt
│   └── LifeSituationContext.tsx — LifeOS situational context
│
├── lib/                 — Utilities and configuration
│   ├── verticals.ts           — ★ Canonical vertical registry (SoT)
│   ├── config/                — App configuration
│   │   ├── routes.ts          — ★ Centralized route registry (SoT)
│   │   ├── currencies.ts      — Currency definitions
│   │   ├── contacts.ts        — Contact information
│   │   └── geography.ts       — Location data
│   ├── taxonomies/            — Taxonomy system
│   │   └── taxonomyTypes.ts   — Taxonomy type constants
│   ├── errorHandler.ts        — Centralized error handling
│   └── queryConfig.ts         — React Query defaults
│
├── types/               — TypeScript type definitions
│   ├── auth.ts                — Role types
│   ├── orders.ts              — Order/booking types
│   ├── property.ts            — Property types
│   └── vendor.ts              — Vendor types
│
└── integrations/        — ⚠️ Auto-generated (DO NOT EDIT)
    └── supabase/
        ├── client.ts          — Supabase client instance
        └── types.ts           — Database types (auto-generated)

supabase/
├── functions/           — Edge Functions (60+)
│   ├── _shared/         — Shared utilities for edge functions
│   │   └── supabase.ts  — Shared Supabase client factory
│   └── {function-name}/ — Individual function folders
│       └── index.ts     — Function entry point
└── migrations/          — SQL migrations (DO NOT EDIT)
```

## Key Patterns

### 1. MiniAppLayout

Every vertical page uses `MiniAppLayout` as its root wrapper. This provides:
- Consistent header with back navigation
- Bottom navigation bar
- Scroll-to-top behavior
- SEO meta tags via `react-helmet-async`

```tsx
<MiniAppLayout title="Restaurants" titleRu="Рестораны">
  <FilterBar />
  <ListingGrid />
</MiniAppLayout>
```

### 2. Canonical Listing Wizard

Schema-driven multi-step forms used across admin and vendor portals to create/edit listings for any vertical. The wizard:
- Uses a JSON schema to define form fields
- Validates with `zod`
- Supports drafts via `useCanonicalDraft`
- Submits via `useCanonicalSubmit`

### 3. UnifiedFilters (Klook-style)

Each vertical defines a `filterConfig` (see `src/components/filters/`). The `UniversalFilter` component renders the filter UI based on config:
- Quick filter chips
- Expandable filter panels
- Active filter badges
- Reset functionality

### 4. Content Adapters

Functions that map raw database records to standardized card props for `UnifiedCatalog` rendering. Each vertical has its own adapter.

### 5. Taxonomy System

Two-layer classification:
- **Static taxonomies** — TypeScript constants in `src/lib/taxonomies/` (property types, districts, etc.)
- **Dynamic taxonomies** — `lookup_values` table in the database, queried via `useLookupValues()` hook

### 6. Provider Tree (App.tsx)

```
ErrorBoundary
  └─ HelmetProvider
      └─ QueryClientProvider
          └─ ThemeProvider
              └─ MaintenanceProvider
                  └─ LanguageProvider
                      └─ LocationProvider
                          └─ CurrencyProvider
                              └─ AuthProvider
                                  └─ CartProvider
                                      └─ PWAInstallProvider
                                          └─ LifeSituationProvider
                                              └─ TooltipProvider
                                                  └─ HintProvider
                                                      └─ PrefetchProvider
                                                          └─ AppContent
```

Order matters: providers higher in the tree are available to all children. `AuthProvider` depends on Supabase client, `CartProvider` depends on `AuthContext`, etc.

### 7. Routing

All routes are defined in `src/lib/config/routes.ts` (`APP_ROUTES`). Pages are lazy-loaded via `src/lib/pageRegistry.ts`. Legacy URLs are handled by `LEGACY_REDIRECTS`.

Route ownership is classified:
- `PUBLIC` — No auth required
- `AUTH_REQUIRED` — Logged-in users only
- `VENDOR` / `OWNER` / `ADMIN` / `TEAM` / `MANAGER` — Role-based access

### 8. Bilingual Content

All user-facing text supports EN/RU:
- Database fields: `name_en` / `name_ru`, `description_en` / `description_ru`
- UI: `const { isRu } = useLanguage()` → `isRu ? item.name_ru : item.name_en`

### 9. Cart with Dual Storage

`CartContext` uses localStorage for guests and syncs to `cart_items` table when authenticated. On login, local cart merges with database cart.

### 10. Edge Function Patterns

All edge functions follow this structure:
```typescript
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  // CORS headers
  // Parse request
  // Business logic with createServiceClient()
  // Return JSON response
});
```
