# Service request → Admin Inbox: bounded tranche

Base: `d151a23cf0526d6ae9183f2a7cc2f34ec8e6f25d`. Class B (existing operator
handoff). No SQL, privilege, order, payment, delivery or production change.
The catalogue-provider request flow's existing `useCreateServiceOrder` saves
one canonical `service_orders` row; the admin Inbox omitted that source.
The added Services tab reads only `service_type = 'marketplace'` using the
existing `useIsAdmin` gate and authenticated Supabase client under RLS. Exact
detail filters by both ID and service type and checks the returned identity
and type; a deleted catalogue entry must not orphan a saved request. Other PMS
and staff service types stay out. Filters reflect stored statuses; a request
remains a request and a scheduled time is not a confirmation. List reads omit
customer details; only the exact admitted detail includes the minimum contact
and note fields. No new operator status control is in this tranche. Rollback:
revert this source projection, which does not touch the stored service requests.

## Verification boundary

Run the focused Admin Inbox route integration, adapter, existing exact detail,
guest handoff and route regression tests against synthetic backend data.
They cover saving one service request through the real intake hook, choosing the
Services source in the real admin Inbox, and readback of that same exact row;
a row past page one; cross-service-type/wrong-ID response rejection; actor
replacement with the previous detail cached; and no notification or commercial
write. The synthetic intake uses the production hook with a synthetic button and
mocked transport, not a submission from the live guest form. Auth and database
responses are mocked; no authenticated hosted acceptance or live delivery.

## Separate Class C: provider visibility stays unresolved

The existing `service_orders` policies `Admins and staff full access to service
orders` (admin/staff role checks), `Provider owners view their service orders`
and `Provider owners update their service orders` (matching
`providers.user_id = auth.uid()`) are present in repository migration
`20260924114852_9a588fff-8d77-4585-99b8-21390f3cce73.sql` and observed through
read-only live policy metadata by the release owner. The provider desk still
queries its matched rows, including guest fields. The marketplace writer's
existing validation sets `provider_id` from the approved offering; the Inbox
must neither discard that association nor claim platform-only visibility.
Notification dispatch and provider data visibility are different boundaries.

If operator-only visibility before approval is required, first agree who may
see or change what at each fulfilment state, what gate releases an assigned
provider, and how existing already-in-flight provider workflows behave. Before
any forward restrictive change, verify effective role policies as distinct
synthetic guest, admin, assigned staff, matching provider, unassigned provider
and generic employee actors; cover list, exact read, realtime and updates with
no change to approved-offering validation, capacity or checkout. Preserve
authorized guest/fulfilment and admin reads, use a security-preserving rollback,
then review deployment separately. This tranche neither drafts nor activates a
policy and must not be used as evidence of provider isolation.
