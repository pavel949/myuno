# iCal import containment rollback

The source candidate changes two Edge adapters, shared inventory/access code and
a read-only PMS projection. It adds no
schema, grant, cron schedule or production data migration. No deployment or live
sync was performed as part of verification.

If controlled activation later fails, contain both manual and scheduled sync at
the approved ingress/deployment boundary. Preserve every existing
property_bookings row and existing orders/children. Do not cancel dates, set
amounts to zero, delete imported rows, or regenerate orders as rollback.

Do not blindly redeploy the old scheduled adapter: it fabricates prices/fees and
confirmed commercial orders. Do not redeploy the old manual adapter: it guesses
money and can release missing events. A safe rollback keeps the no-commercial-
write restriction and disables only the failing import path, with explicit
operator visibility that synchronization is unavailable. Scheduler/config or
production deployment changes require the separate approved activation procedure.

The read-only PMS overlay can remain available while imports are contained; it
reads the canonical retained blocks. Reverting that overlay must not make dates
look available: retain an error/blocked state or disable that booking surface.

Any change to historical fabricated orders, legacy amounts, missing/cancelled
source events or inventory release requires a separately reviewed reconciliation
contract. Snapshot/compare row counts and identities read-only before/after an
approved rollout. No destructive SQL rollback is supplied or authorized.

Do not roll back the manual verified-user/object guard or scheduled internal-secret
guard to restore a public caller. A configuration mismatch must leave sync denied
and visibly unhealthy while retained inventory remains blocked. `INTERNAL_SECRET`
and the trusted server caller require a separate secure user-operated configuration
step; no secret value or command containing one belongs in source or rollback notes.
