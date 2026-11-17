# myUNO-managed customer intake: supplier alert containment

Owner direction, 17 November 2026: every customer enquiry belongs to myUNO admin and the specified myUNO contacts, irrespective of supplier. Do not connect customers directly with suppliers. myUNO manages the customer-facing service.

## Source evidence and bounded implementation

`notify-vendor-order` forwards order/customer details to a provider's in-app inbox, email and WhatsApp. `stripe-webhook` calls it after payment processing. Its provider lookup also incorrectly equates org and provider identities. Replace the legacy notification endpoint with an explicit no-op that does not read any private record or send any message. The no-op says `sent:false`, `success:false`, `skipped:myuno_managed_intake`, and `admin_delivery:not_checked`. HTTP 200 acknowledges the intentional suppression, not notification delivery, and avoids encouraging retries. The payment webhook and every payment/order/inventory mutation remain untouched.

`notify-manual-payment-request` also forwards customer details to an owner/manager resolved from order metadata/profile. Remove only that secondary recipient resolution and fan-out; preserve existing myUNO admin email, WhatsApp and admin-inbox writes. Remove message/recipient logging in its WhatsApp helper. No order, payment, provider or request data is deleted or rewritten.

## Release gates, not silently claimed complete

- This is suppression, not a new central delivery implementation. `notify-admin-order` and protected configured recipients still need production evidence and exact enquiry/context routing. No automatic replay of historical requests.
- `notify-transfer-booking` has distinct operator/extra-operator dispatch, customer copy promising an operator contact, and financial-split/order-metadata writes in the same function. It needs a separate bounded notification-only change and review. Do not deploy this patch as proof that *all* supplier dispatch is disabled.
- Provider/admin inbox permissions and existing records remain unchanged; no access-policy change is included. Absence of a notification does not prove the provider cannot already read a record.
- Customer-confirmation and operational fulfilment channels require separate review so this customer-intake rule does not silently disable already-committed service fulfilment.
- Catalogue moderation/vendor onboarding approval notices are not customer enquiry forwarding; leave them intact.
- Source-only correction. No edge deployment, production mutation, external test send or credential change performed. Review actual production endpoints before controlled activation.

## Verification / rollback

Six isolated tests exercise no-op behavior without reading request bodies, preflight, absence of DB/network/sender imports, retained admin path and removed manager fan-out. No live calls.

Do not restore the old vendor handler as rollback: that reopens customer forwarding against the owner's latest instruction. Keep suppression and apply corrective forward patches. The stored order/request/provider relationship and audit data remain intact.
