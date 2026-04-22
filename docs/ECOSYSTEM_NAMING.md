# Ecosystem naming (SSOT)

Canonical **Russian / English / Thai** labels for services, journey groups, nav clusters, and marketing surfaces live in:

- [`src/lib/ecosystemGlossary.ts`](../src/lib/ecosystemGlossary.ts) — primary glossary (`ECOSYSTEM_APP_TRIPLET`, journey groups, nav clusters, footer UI, discover cluster headers).
- [`src/lib/appRegistry.ts`](../src/lib/appRegistry.ts) — app entries; `labelEn` / `labelRu` / `labelTh` are aligned with `ECOSYSTEM_APP_TRIPLET` per `id`.
- [`src/lib/verticalGroups.ts`](../src/lib/verticalGroups.ts) — journey columns for hub/footer; titles and inline routes use the same triplet vocabulary.
- [`src/lib/nav/clusterCatalog.ts`](../src/lib/nav/clusterCatalog.ts) — public service map; localized labels use `getClusterHeaderLabel` / `getClusterServiceLocalizedLabel` (registry + glossary).
- [`src/lib/verticals.ts`](../src/lib/verticals.ts) — DB vertical ids; where an id matches an app id, prefer glossary / `getTripletForVerticalId` in UI.

## Rules

1. **One name per service** — add or change copy in `ecosystemGlossary` first, then wire registries and UI.
2. **No orphan RU/EN** — user-facing `isRu ? … : …` for user-visible names is discouraged; use `pickTriplet`, `getAppEntryLabel`, or i18n keys that mirror the glossary.
3. **Thai** — `labelTh` on registry entries; glossary is the default source for new strings.

## Auth value panel

Cluster chip strings are duplicated in i18n (`auth.value.cluster.*`) and must stay aligned with `ECOSYSTEM_NAV_CLUSTER_TRIPLET` in the glossary (update both when renaming).
