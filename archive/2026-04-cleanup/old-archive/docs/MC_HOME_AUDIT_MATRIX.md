> ARCHIVED: 2026-04-20
> Superseded by: docs/MC_DASHBOARD_CORE_AUDIT.md
> Reason: 30-line subset of MC_DASHBOARD_CORE_AUDIT.md

# MC Home Audit Matrix

## Purpose

Widget-level audit for `/mc` control tower: query origin, scope model, confidence, and actionability.

## Matrix

| Widget | Primary Query Source | Scope Model | Confidence | Actionability |
|---|---|---|---|---|
| `today_actions` | `useDashboardMetrics()` -> `crm_tasks`, `property_service_requests`, `property_inventory_items`, `property_financials`, `booking_notifications_log` | Mixed: property filter + owner/company | Medium | High (`/mc/tasks`, `/mc/invoices`, `/mc/messages`, `/mc/inventory`) |
| `property_priority` | `property_bookings` + `useCrmTasks()` + `useMyProperties()` | Property-first (derived from user's properties) | Medium | High (`/mc/properties/:id/manage`) |
| `kpi` | `useDashboardMetrics()` -> `property_financials`, `property_bookings`, `agent_deals` | Mixed: owner + company | Medium | High (`/mc/financials`, `/mc/reports`, `/mc/calendar`) |
| `your_day` | Existing activity feed hook/component composition | Mixed | Medium | Medium |
| `active_stays` | Booking-based widget data | Property/booking | Medium | Medium |
| `property_status` | Property status derived widget | Property | Medium | Medium |
| `channel_sync` | `useChannelHealth()` -> `property_external_calendars`, `calendar_sync_logs`, `property_bookings` | Owner scoped | Medium-Low for MC staff | High (`/mc/channels`) |
| `maintenance_health` | Maintenance/service health widgets | Owner/property | Medium | High |
| `upcoming_payments` | Payment/financial widgets | Owner/property | Medium | High |
| `revenue_insights` | KPI-derived insights | Aggregated metrics | Medium | Medium |
| `active_deals` | CRM deals (`agent_deals`) | Company | High | High (`/mc/sales`) |
| `crm_tasks` | CRM tasks (`crm_tasks`) | Company | High | High (`/mc/tasks`) |
| `operations` | Operations flat widget composition | Mixed | Medium | High |

## Notes

- Current `/mc` is now reduced to control-tower zones: `Today`, `Portfolio Health`, `Revenue & Cash`, `Sales & CRM`, `Exceptions`.
- Marketing/static recommendation blocks were removed from home composition.
- `Channel Manager` remains under `Distribution`; `Inventory` is now accessible in property-centric flows.