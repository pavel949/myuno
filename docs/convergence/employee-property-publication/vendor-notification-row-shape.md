# Vendor moderation row-shape compatibility candidate

Status: source-only; not a migration or live-activation approval.

Read-only Lovable inspection on 19 October 2026 confirmed that the shared deployed `notify_vendor_on_content_status_change()` trigger still reads both `NEW.title_en` and `NEW.name_en`. Canonical properties have `title_en` and no `name_en`. Named catalogue tables use the other shape. PostgreSQL analyzes the entire reached expression before evaluating `COALESCE`, so a populated first argument does not make an absent record field valid.

The existing trigger returns early for unchanged status or absent provider user. Otherwise it reaches this expression before filtering approved/rejected states. Thus provider-linked draft submission, moderation, and rejected-to-draft transitions can fail. Newly authored employee drafts explicitly use a null provider and take the earlier return.

`vendor-notification-row-shape.candidate.sql` replaces only those optional lookups with `to_jsonb(NEW)->>'title_en'` and `to_jsonb(NEW)->>'name_en'`. Missing keys yield NULL. Recipient selection, fallback text, status gates, notification text/payload, transaction failure semantics, SECURITY DEFINER, search path, existing grants and trigger attachments remain unchanged. The original applied migration is not edited. No new domain storage or authority is introduced.

Verification:
- Source-contract tests compare the whole function body to the historical body after exactly the two intended substitutions.
- A Unix-socket-only owned PostgreSQL suite replays the original function and deployed trigger attachments on synthetic title-only properties and name-only restaurants, demonstrates the original error, and tests fixed submission/approval/rejection/fallback/early-return behavior, atomic failure, and preserved function ACL/security metadata.
- The suite never accepts hosted database URLs or credentials. Missing local PostgreSQL is an explicit skip; CI must supply it or fail.
- Local checks: 3 source-contract tests passed; all 15 PostgreSQL cases were explicitly skipped because PostgreSQL is absent. Targeted TypeScript, ESLint and whitespace checks passed. No PostgreSQL pass or production-write result is claimed.

Activation remains gated by green isolated PostgreSQL execution and explicit approval of the forward change. Apply before provider-linked existing drafts are included in the employee walkthrough. A source merge does not activate this file.

Rollback: the former function body is recorded in the historical migration. Reintroducing its missing-field defect is not an automatic rollback. If notification dispatch must be disabled, make that a separately reviewed targeted incident decision; do not disable moderation authorization or undo publication ceilings. This compatibility fix creates no data that needs deletion.

References: [PostgreSQL 17 expression analysis](https://www.postgresql.org/docs/17/plpgsql-implementation.html), [JSON extraction and absent keys](https://www.postgresql.org/docs/17/functions-json.html).
