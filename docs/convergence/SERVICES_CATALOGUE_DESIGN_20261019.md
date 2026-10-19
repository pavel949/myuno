# Services catalogue design — 19 October 2026

Baseline: main `145d4122df334c693ee51b448d72796b8baa4539` in pavel949/myuno.
Scope: routine catalogue presentation and navigation; existing request and booking writers unchanged.

## Result

- Responsive request cards with category icons, price estimates, time and one accessible action. No invented provider photos or verification claims.
- Initial preview uses eight existing request functions from distinct categories; All home services expands the existing 41-function catalogue. Search/category filters always include the complete permitted catalogue.
- URL-backed quick category controls coexist with the detailed category menu, legacy aliases, persona filtering and catalogue return context.
- Transport/local business links retain their specialized destinations. Home request categories do not claim to filter provider offerings, whose projection has no category field.
- Existing ConciergeHelpSheet is lazy-loaded for exceptional requests, with the current query and return context. No parallel request workflow.
- Existing approved-provider offerings retain booking actions and verified-provider indicators; layout and loading state match the card grid.

## Executed verification

- 40 tests across ServicesIndex, ServiceRoutes integration, ServiceFunctionCard and MarketplaceServiceGrid passed.
- TypeScript passed with NODE_OPTIONS=--max-old-space-size=6144. Default local 2 GB heap exhausted; not counted as a source failure or a passed check.
- Focused ESLint and git diff whitespace check passed.
- Production build passed using synthetic localhost configuration; existing large-chunk/catalogue warnings remain.
- Cloud browser inspected the real components in the isolated catalogue fixture: RU/EN at iframe viewport widths 375/390/430/1280, eight initial cards, no document horizontal overflow. Catalogue filtering, keyboard opening of the request destination and return context inspected; unit/integration tests cover the actual route combinations. The fixture request destination is a Back-button stub, not the complete booking form.
- Existing real ConciergeHelpSheet opened visibly at 375 px with close/submit controls and no overlap inside the fixture. No form submitted. Auth/analytics and provider data are synthetic; database access throws. No hosted transactions, production notifications, schema changes or backend deployments.

## Limits and rollback

This is a catalogue design candidate, not Marketplace activation or end-to-end operational acceptance. Provider data, prices, availability, checkout/fulfilment and the existing legacy home-request writer were not certified or changed. Hosted header/assistant overlap still needs post-deployment inspection.

Rollback: revert the catalogue design commit; no data rollback is needed. Production deployment is separate from this evidence.
