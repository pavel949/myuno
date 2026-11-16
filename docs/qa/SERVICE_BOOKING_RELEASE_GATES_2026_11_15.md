# myUNO service booking release gates — 2026-11-15

Scope: `pavel949/myuno`, not `myUNO-final`. Lovable project `dcc2b024-7627-4ad9-a915-a3df3dd839f0`.

## Canonical request contract

1. Customer selects an active service and sees a supplier-backed quote or "price on request".
2. Customer signs in or registers before final submission; a draft survives the auth redirect.
3. Persist a single request with an immutable ID, ownership, pricing snapshot and request-received state.
4. Admin CRM must surface requests from `orders`, `airport_bookings`, `service_orders` and `property_service_requests`, with original source ID, status, service and customer.
5. After successful commit, queue separate admin email and WhatsApp delivery jobs. Persist provider receipt/error and retry safely by (source, source_id, channel, event).
6. Customer gets a receipt ("request received"), not a claim of confirmed availability. Only operator confirmation changes status to confirmed and triggers the final customer notification.
7. Never treat an email API acceptance as inbox delivery, or a WhatsApp API acceptance as read confirmation.

## Confirmed findings

- Lovable Cloud database is enabled. At inspection: `orders` 453 rows; `airport_bookings`, `service_orders` and `property_service_requests` 0.
- `system_settings.admin_whatsapp` = 66954243332; `admin_emails` was corrected to pavel@myuno.app and pavel@ignatevestate.com.
- `useOrders` writes orders and invokes `notify-admin-order` without waiting for a provider receipt.
- `useCreateServiceRequest` writes `property_service_requests`; a best-effort operator alert was added in the feature branch.
- `useCreateServiceOrder` writes `service_orders`; a best-effort operator alert was added in the feature branch.
- `notify-admin-order` needs a durable server-side outbox, deduplication and authenticated source verification before it is considered reliable. Do not trust client-supplied amount, recipients or order details.

## Release test matrix (NOT YET PASSED)

| Flow | Persisted ID | CRM | Admin email | Admin WhatsApp | Customer receipt | Operator confirmation |
|---|---|---|---|---|---|---|
| Fast Track arrival/departure | pending | pending | pending | pending | pending | pending |
| Airport transfer from/to airport | pending | pending | pending | pending | pending | pending |
| Yacht instant/request | pending | pending | pending | pending | pending | pending |
| Flowers | pending | pending | pending | pending | pending | pending |
| Home services / owner property | pending | pending | pending | pending | pending | pending |

## Deployment gate

No production merge until build, TypeScript checks, booking smoke tests, authorization/RLS review, notification-provider credentials, and at least one real delivery receipt per channel are verified. Lovable publish must be independently verified; GitHub merge is not proof of publication.
