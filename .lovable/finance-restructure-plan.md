# Finance Block Restructure Plan
## Status: PLANNED (not started)
## Date: 2026-02-28

## Current Problems

1. **Fragmented architecture** — KPI split across 3 pages (financials, analytics/overview, analytics/budget)
2. **QuickExpense/QuickIncome isolated** — separate routes instead of inline sheets
3. **Rate Seasons misplaced** — pricing is operational, not financial
4. **Analytics "matryoshka"** — 3 lazy-loaded pages hidden inside tabs
5. **Duplicate metrics** — OwnerRevenueDashboard and FinancialStatsCards show same data differently
6. **OwnerReportsPage zombie** — file still exists though marked as merged

## Target Architecture (Airbnb Host + Guesty model)

```
Finance (menu group)
├── 💰 Finance Overview (NEW)        — /owner/finance
│   ├── Balance / Upcoming / Paid out (3 hero cards)
│   ├── 6-month income/expense sparkline
│   ├── Quick Actions: + Income | + Expense (open sheet)
│   └── Last 5 transactions preview
│
├── 📋 Transactions                   — /owner/financials (keep)
│   ├── Tabs: All | Income | Expense
│   ├── Filters: property, period, category
│   └── + Add button opens sheet (not separate page)
│
├── 📊 Reports                        — /owner/reports (standalone)
│   ├── Generate configurable reports
│   └── Portfolio view
│
├── 🎯 Budget                         — /owner/budget (standalone)
│   └── Plan vs Actual by category
│
└── 🧾 Invoices                       — /owner/invoices (keep)
```

## Navigation Changes

### Move OUT of Finance:
- **Rate Seasons** → Operations group (or Properties)

### Promote to menu level:
- **Reports** (currently tab inside Analytics)
- **Budget** (currently tab inside Analytics)

### Deprecate:
- `/owner/analytics` (AnalyticsPage.tsx with 3 tabs) → replace with Finance Overview
- `/owner/quick-expense` → inline Sheet in Transactions
- `/owner/quick-income` → inline Sheet in Transactions
- `OwnerReportsPage.tsx` → delete (already marked merged)

## New: Finance Overview Page
Single-screen dashboard inspired by Airbnb Earnings:
- **Hero row**: 3 cards (Total Balance / This Month Net / Upcoming Payouts)
- **Chart**: Composed bar+line chart (income bars, expense bars, net line) for last 6 months
- **Quick actions**: FAB or prominent buttons for + Income / + Expense
- **Recent transactions**: Last 5, with "View All →" link to /owner/financials
- **Property filter**: dropdown at top, "All" by default

## Implementation Order
1. Create Finance Overview page
2. Restructure navigation (sidebar + dashboard menu)
3. Integrate QuickExpense/QuickIncome as sheets into Transactions
4. Move Rate Seasons to Operations
5. Remove AnalyticsPage wrapper (direct routes for Reports, Budget)
6. Delete OwnerReportsPage.tsx
7. Add redirects for old URLs

## Files Affected
- `src/components/owner/OwnerSidebar.tsx` — menu restructure
- `src/components/owner/dashboard/OwnerDashboardMenu.tsx` — menu restructure
- `src/components/layout/AnimatedRoutes.tsx` — routes
- `src/pages/owner/AnalyticsPage.tsx` — deprecate
- `src/pages/owner/OwnerReportsPage.tsx` — delete
- NEW: `src/pages/owner/FinanceOverview.tsx`
