# Legacy landing reconciliation — 21 October 2026

PR 70 is reconciled with main `fb4b944a4c736f680ddb8e4b178f833030e021b1` without restoring its obsolete homepage.

Already superseded by current main: real-image public hero, shortened discovery, microsite theme tokens, semantic navigation and safe `LandingActionLink` behavior. Preserve the deleted `ClusterGrid` and `PrimaryGrid`; do not resurrect them. The older extracted `PersonaClusterHero` is omitted because its two call sites have newer canonical implementations and an unused duplicate would add no behavior. Conflicting area/persona content retains current main rather than replaying older assertions.

The remaining source delta is English punctuation in 38 existing content files. It does not add area facts, prices, yields, catalogue records, routes or availability claims. Existing financial/area assertions are outside this copy-only reconciliation and are not newly certified. Russian wording is unchanged.

PR 156's revised homepage remains separate; final integration must preserve it. No production writes, permissions, deployments or database changes are included.
