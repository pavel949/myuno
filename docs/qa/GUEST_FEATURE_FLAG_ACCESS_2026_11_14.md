# Guest feature-switch access — 2026-11-14

## Scope and decision
GO for the two exact public catalogue switch reads only. No frontend publication, business-record writes, notification calls, stored flag changes, invitations, enforcement or financial/E3 activation. Stop after this bounded RLS tranche.

Observed source HEAD: `3446dcc87e99e15b67e18c87e8c5aa5f2c49226f`; evolving workspace tested, not a release/CI parity claim.

## Findings and disposition
| Switch | Source/data evidence | Before / disposition |
|---|---|---|
| `multi_unit_properties` | Public `PropertyDetail.tsx:107,425` gates `RoomCategoryOffers`; migration 0016 admits public category availability; stored enabled=true. | Anonymous query returned only related-AI, so singular hook returned false and hid room categories. Confirmed access defect: admit this exact key. Does not prove populated categories or booking readiness. |
| `thai_business_layer` | Public Thai catalogue/detail; explicit GA admission in `20260624120000_enable_thai_business_layer.sql`; stored enabled=true. | Anonymous override was hidden. Registry default=true means current visibility does **not** prove the catalogue was disabled; the confirmed defect is that guests cannot observe the authoritative kill-switch (including a future false value). Admit this exact key without changing its value. |
| `property_related_ai` | Already deployed and explicitly public in migration 0037. | Already visible; unchanged. |
| `home_v2`, `command_palette` | Source additionally requires admin. | Internal rollout; remain hidden. |
| `legacy_unit_tables` | Canonical-unit migration explicitly keeps guests on canonical tables. | Private rollback; remain hidden. |
| `auth_phone` | Stored false and registry false; SMS prerequisite. | Intentionally off; unchanged. |
| `concierge_routing_v2_canonical` | Stored true, but canonical audit says default-OFF/QA activation and no verified public activation record. Public `/start` showed the OFF placeholder in read-only browser reproduction. | Public access intention ambiguous, not just a missing-grant conclusion: leave hidden pending public admission decision. Do not silently activate onboarding. |
| Other vertical/trust/finance/legacy switches | No current anonymous reader with proven public admission identified; vertical reads found in admin evidence. | No additional access granted. Route existence and wildcard queries are not authority. |

Both flag hooks query visible `feature_flag:%` rows; row policy, not the query pattern, governs exposure. Source audit covered both hooks and all current consumers; no registry expansion or authorization changes.

## Implementation
- Applied via Lovable Cloud: `drizzle/migrations/0038_guest_catalog_flag_reads.sql`.
- New SELECT policy `system_settings_public_catalog_flags_read` permits only `feature_flag:multi_unit_properties` and `feature_flag:thai_business_layer` to anon/authenticated.
- Existing admin read/write, public organization-contact and exact AI policies unchanged; no table grants changed.
- `AGENTS.md`: records exact-key public-admission contract.
- Security-preserving rollback: `docs/hardening/rollback/0038_guest_catalog_flags.sql`; removes only the new policy, preserves prior AI and admin boundaries. No value updates required.

## Verification
- `bun run test src/lib/__tests__/guestFeatureFlags.postgres.test.ts`: **8/8 PASS** on ephemeral Unix-socket-only PostgreSQL. Tests run actual migration: exact anon/authenticated-non-admin keys, public false remains false, private/future settings hidden, anon/non-admin mutations rejected, existing admin access and rollback preserved. No hosted business writes.
- `python3 /tmp/browser/guest-flags/check.py`: initial selector ambiguity corrected, then `/start` reproduction confirmed only AI flag visible and OFF placeholder. No user submissions.
- `python3 /tmp/browser/guest-flags/verify.py`: actual signed-out preview Data API **8/8 assertions PASS**: exact three-key allowlist plus seven hidden keys (`admin_emails`, invitation setting, home, palette, legacy units, onboarding, phone). No private values read or printed. Public flags all remain true.
- Guest property detail renders at 1280×1800 without runtime errors; screenshot reviewed `/tmp/browser/guest-flags/after-property.png`. All external non-GET/HEAD/OPTIONS and function calls blocked; visible availability error is expected under this fixture, **not evidence of a live availability failure**. AI/booking writes not exercised here.
- Hosted `pg_policies` SELECT after apply confirms five policies: four unchanged plus exact two-key SELECT; before/after SELECT of all 32 feature-switch boolean states is identical.
- Automatic build log after migration: **build OK** at `2026-11-14T00:48:08Z`.

## Residual limits
Real populated resort-category acceptance and Thai catalogue loading/redirect behavior are not certified by switch access tests. No booking, service request, backend business lifecycle, email/WhatsApp or financial end-to-end acceptance performed. Authenticated non-admin policy test is isolated; no hosted account/role assignments used. Onboarding public activation needs a separate bounded decision; no other flag/settings exposure is justified.