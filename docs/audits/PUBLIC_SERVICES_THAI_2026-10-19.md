# Observed Services Thai UI correction

The live acceptance check on 2026-10-19 at approximately 19:00 UTC selected Thai on the public Services surface. Header navigation changed to Thai, but catalogue controls and request instructions remained English at desktop width. This patch covers that observed surface only; no new localization scope is asserted.

ServicesIndex now uses existing pickLang selection for RU/EN/TH headings, search, quick categories, request category controls, empty state, help entry and confirmation steps. Existing category IDs receive display-only Thai labels. ServiceFunctionCard uses the same locale choice for request, urgent and price-prefix controls. Existing English/Russian strings, service names/descriptions, prices, category IDs, filters, destinations and click handlers are retained. There are no database writes or legal/policy edits.

Verification: 35 focused tests passed across ServicesIndex.locale, ServicesIndex and ServiceRoutes.integration. Four new rendered tests cover RU/EN/TH, real request-card controls, unchanged English catalogue names in Thai and category URL behavior. Scoped ESLint and git diff --check pass. Post-deployment Thai screenshots are still required; desktop evidence does not establish mobile acceptance.
