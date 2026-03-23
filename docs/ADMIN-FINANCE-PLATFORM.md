# Admin → Finance: platform economics

## Purpose

The **Finance → Transactions** tab shows **platform** metrics (marketplace GMV, commissions, vendor payouts, subscription footprint), not MC/property ledger (`property_financials`).

## Data sources

| Metric | Source |
|--------|--------|
| GMV, commissions, payouts, averages, by-vertical | PostgreSQL function **`get_gmv_summary(start, end)`** → aggregates **`orders`** (`deleted_at IS NULL`, date range on `created_at`). Revenue statuses: **`confirmed`**, **`in_progress`**, **`completed`**. |
| **Platform take** | `SUM(platform_fee_amount + concierge_fee_amount)` on those orders (after migration `20260324103000_platform_finance_gmv_concierge.sql`). |
| **Active subscriptions** | **`vendor_subscriptions`** with `status IN ('active', 'trialing')`. |
| **Est. MRR** | Plan list prices: **`subscription_plans.price_monthly`** or **`price_yearly / 12`** by `billing_cycle`. This is an **estimate** from catalog prices, not Stripe cash recognition. |

## Deploy

Apply the migration so RPC returns `platform_take` and `total_concierge_fee`:

```bash
supabase db push   # or your migration pipeline
```

Ensure **`GRANT EXECUTE`** on `get_gmv_summary` is effective for **`authenticated`** (included in the migration).

## RLS

- **Orders:** admin / service paths as per existing policies.
- **Vendor subscriptions:** policies use `has_role(..., 'admin')`. Users with **`uno_team`** only may need an extra policy if they should see subscription counts.

## Future improvements

- Stripe reconciliation (actual subscription cash vs plan MRR).
- Time series charts from **`platform_metrics`** (if populated by jobs).
- Net platform margin after payment processing fees.
