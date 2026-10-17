# myUNO Documentation Guide

This directory contains specialized canonical contracts, current implementation evidence, operational/hardening material and historical context.

## Authority order

1. [../PROJECT.md](../PROJECT.md) — repository constitution.
2. [../AGENTS.md](../AGENTS.md) — concise AI/engineering execution rules.
3. [canonical/](./canonical/) — durable specialized contracts.
4. [convergence/](./convergence/) — audits, gap analyses, tranche evidence and implementation reports.
5. [hardening/](./hardening/) — security/production hardening material and rollback artifacts.
6. Historical/archive documents — evidence only; never current authority unless explicitly promoted.

## Canonical architecture entry points

- [Connected Product Blueprint](./canonical/MYUNO_CONNECTED_PRODUCT_BLUEPRINT.md)
- [Operating Spaces Design](./canonical/OPERATING_SPACES_DESIGN.md)
- [Canonical documents index](./canonical/README.md)

## Current evidence entry points

- [UX Foundation Audit](./convergence/UX_FOUNDATION_AUDIT.md)
- [Final Order Mutation Security](./convergence/FINAL_ORDER_MUTATION_SECURITY.md)
- Operating Spaces E1–E2.x reports under `convergence/`
- [Rollback artifacts](./hardening/rollback/)

## Documentation rules

- **Normative vs evidence:** canonical docs define approved durable rules; convergence/audit docs show what was investigated, changed or verified at a point in time.
- **Evidence wins over stale prose:** if current source/live read-only evidence conflicts with documentation, report the conflict and update canonical docs through PROJECT.md §20 governance.
- **No silent promotion:** an audit proposal does not become architecture merely because it exists.
- **No competing PROJECT files:** root `PROJECT.md` is the single product/engineering constitution.
- **Current P0 moves:** execution state belongs in PROJECT.md §16 and current implementation reports; completed work must not remain described as current.
- **Historical material:** archive/deprecated docs must not be used as implementation authority.

## For AI agents

Read `PROJECT.md` then `AGENTS.md` before using this directory. Never infer production state from a migration/report alone. Verify source, schema/deployment evidence and current tests as appropriate.
