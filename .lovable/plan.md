

# CRM: Bug Fixes + Pro-Level Upgrade

## Bugs Found

1. **SalesAnalytics.tsx** -- Unused imports (`FunnelChart`, `Funnel`, `LabelList`) from recharts cause bundle bloat and potential warnings
2. **KanbanBoard.tsx** -- Click-to-navigate fires unreliably after drag because `isDragging` from `useSortable` doesn't reflect drag state correctly for droppable-only cards. Cards use `useSortable` but they're not actually sorted within columns, leading to incorrect behavior
3. **SalesAnalytics monthly chart** -- Off-by-one edge case: when `i=0`, `subMonths(new Date(), -1)` creates a future date filter that misses current month deals
4. **CreateDealSheet** -- Missing fields that exist in the schema: `preferred_districts`, `preferred_types`, `bedrooms_min`. This breaks PropertyMatching since it can never filter by type/bedrooms
5. **EditDealSheet** -- Same missing fields, plus no currency selector (hardcoded to THB in create)
6. **DealStageBar** -- Labels are hidden on mobile (`hidden sm:inline`), rendering empty buttons with no visible text on phones
7. **PropertyMatching** -- Uses `<a href>` instead of React Router `<Link>`, causing full page reloads

## Upgrades (Odoo/HubSpot Parity)

### 1. Search and Filtering
- Full-text search across client name, phone, email, notes on the Pipeline page
- Filter by agent (for owners/admins who see all deals)
- Filter by budget range and property type

### 2. Weighted Pipeline Value
- Show total pipeline value per stage in Kanban column headers
- Summary bar at top: "Pipeline: 45M THB | Weighted: 18M THB" (weighted by stage probability)

### 3. Deal Age and Velocity Tracking
- Show "days in stage" and "total deal age" on DealCard and DealDetail
- Color-code stale deals (e.g., >14 days in same stage = yellow, >30 = red)

### 4. Bulk Actions
- Multi-select checkboxes in list view
- Bulk stage change, bulk assign to agent, bulk delete

### 5. Quick Communication Actions
- Click-to-call (`tel:`) and click-to-WhatsApp (`wa.me/`) buttons on DealCard
- Quick WhatsApp message from deal detail page

### 6. Enhanced CreateDealSheet
- Add preferred_districts (multi-select from known Phuket districts)
- Add preferred_types (villa, condo, townhouse, land)
- Add bedrooms_min selector
- Add currency selector (THB, USD, RUB, CNY)

### 7. Agent Performance (for owners/admins)
- Leaderboard widget: deals won, total volume, conversion rate per agent
- Filter analytics by agent

### 8. Contact Timeline Improvements
- Show relative timestamps ("2 hours ago", "3 days ago")
- Activity icons with color coding by type
- Collapsible activity groups by date

### 9. Deal Duplicate Detection
- When creating a deal, check if client_phone or client_email already exists in another deal
- Show warning with link to existing deal

### 10. Stage Probability and Forecast
- Assign win probability to each stage (new=10%, contacted=20%, showing=40%, negotiation=60%, contract=80%)
- Show forecast on analytics: expected revenue = sum(deal_value * stage_probability)

## Technical Implementation

### Files to modify:
| File | Changes |
|------|---------|
| `SalesAnalytics.tsx` | Remove unused imports, fix monthly calc, add agent filter, forecast section, leaderboard |
| `KanbanBoard.tsx` | Fix drag/click, add pipeline value per column, use `useDraggable` instead of `useSortable` for cards |
| `SalesPipeline.tsx` | Add search bar, agent filter, bulk actions, weighted pipeline summary |
| `DealCard.tsx` | Add deal age indicator, WhatsApp/call quick actions, stale deal coloring, checkbox for bulk |
| `SalesDealDetail.tsx` | Add WhatsApp button, relative timestamps, deal age display |
| `CreateDealSheet.tsx` | Add districts, types, bedrooms, currency fields, duplicate detection |
| `EditDealSheet.tsx` | Add same missing fields + currency |
| `DealStageBar.tsx` | Fix mobile -- show abbreviated labels or icons instead of hiding text |
| `PropertyMatching.tsx` | Use React Router Link, show match score |
| `useAgentDeals.ts` | Add stage probabilities, add `useCompanyMembers` hook for agent filter |

### New files:
| File | Purpose |
|------|---------|
| `src/components/owner/sales/DealSearchBar.tsx` | Search + filters component |
| `src/components/owner/sales/PipelineSummary.tsx` | Weighted pipeline value bar |
| `src/components/owner/sales/AgentLeaderboard.tsx` | Agent performance ranking |
| `src/components/owner/sales/BulkActions.tsx` | Multi-select toolbar |

### Database changes:
None required -- all new features use existing schema fields.

