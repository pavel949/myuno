# Canonical pricing calendar — security-preserving rollback

The migration only adds a price-only definer function. Live unit availability
RLS is admin-only, so generic table access is deliberately not widened. The
function explicitly requires `auth.uid()`, `can_manage_property_e28_private`
and `actor_private_property_ceiling` before reading or writing private prices. It writes only date price columns in
`property_availability` (unit) or `property_stay_restrictions` (category).
Status, blocked dates, booking IDs, stop-sell, arrival/departure/minimum rules,
accepted bookings, order totals and financial records are unchanged.

Rollback UI to the previous deployment and revoke execute on
`public.set_property_calendar_price(uuid,uuid,date,date,numeric,text,jsonb)`
from authenticated. Retain the function and audit history until diagnosis.
Do not delete availability rows: they can contain occupancy or closures.
Restore a price only through an authorized, reviewed price edit using the
recorded before-image, never by restoring entire availability rows.

Production preflight on 2026-10-21 used the authorized Lovable database for
project dcc2b024-7627-4ad9-a915-a3df3dd839f0. Its commit matches the
myuno.app Vercel production commit c6d6e4ce23f1e1c1d903ce4ba6141cd37f5b8ef7.
Canonical columns, uniqueness, hardened authority helpers and live RLS were
read-only verified. No business records are used for QA.
