# Configurable operating setup — implementation contract
2026-10-17 · source candidate, not deployed production acceptance.

The user requires a usable empty platform that can be populated later. Real employees, property manifests and financial values are not prerequisites for building or testing these generic tools. Existing canonical entities remain authoritative.

## Operating spaces
Management-company oversight uses the existing actor-bound protected administrator or active company director/admin contract. Checked configuration RPCs read a finite same-company snapshot and create/rename/activate spaces, explicitly grant/revoke existing company members and assign an explicit set of existing properties. Names and keys carry no authority. No enforcement switch, automatic seed, inferred property/member mapping or module-capability grant is introduced.

Related physical parents/children must be explicitly selected together through the checked assignment API. The old single-property reassignment API delegates to that contract. Existing direct overseer table writers remain: a global topology invariant or completed runtime E3 isolation is not claimed.

## Staff account association
See STAFF_ACCOUNT_LINK.md. staff_members is the directory; management_company_members and Auth remain account/employment authority. The new relation only links a deliberately selected directory record to an existing active same-company membership. The directory cannot already represent that relation: it has no account reference and its UUID is not an Auth UUID. Composite FKs and one-to-one constraints protect association identity. No matching by name/email and no grant through association.

Invitation never upserts a directory row using an Auth UUID. Existing active membership is reused without overwriting role/profile/custom permissions; inactive reuse fails closed. The capabilities probe must confirm the matching Edge contract before optional invitation. Authentication and membership/default-permission initialization retain the existing nontransactional service boundary; rollback and operational recovery remain necessary for partial failures. Activity uses a freshly checked associated account ID.

## Management configuration
The existing property_management_terms row remains the canonical configuration. Commission amounts/percentages, payout day and expense responsibilities start unconfigured; explicit zero is retained. Incomplete terms can be saved as drafts. Activation/approval checks finite values, valid ranges/dates and explicit commission/expense choices on the persisted row, including status-only updates.

The previously displayed accounting options gain a nullable validated accounting_policy column on that same row; omitted choices are not synthesized. The create hook now actually stores accounting and notification choices. New recipient rules require an explicit amount; the database implicit zero default is removed. Existing data is retained, including historical incomplete active records; unrelated note edits remain compatible. Updated configuration must validate.

Configuration status is not commercial-price certification, payment authorization, inventory commitment, posted ledger truth or a financial GO. No quote/settlement/FX/commission precedence is invented. The existing canonical financial-writer gate remains independent.

## Integration and release
The source depends on the separate P0-A containment candidate in PR #95. Migration order: 0035 containment → 0036 space setup → 0037 staff association → 0038 management configuration. Preserve the upstream financial source; review and accept its gate independently before release. The earlier PR #92 empty-workspace entry is included in this package; avoid separate competing setup implementations.

Forward migrations and data-preserving/security-preserving rollback files are versioned. Blank Drizzle snapshots follow this repository's existing intentionally empty schema metadata convention, not a live-schema export. CI checks migration ordering and snapshot linkage.

No production business writes, seeded staff/properties, grants, enforcement, payments, notifications, schema application or Edge deployment were used for QA. Final SHA/test counts and verification links belong in the PR; authored cases are not substituted for executed results. Frontend, matching Edge and migrations require coordinated deployment and read-only verification before hosted readiness is claimed.
