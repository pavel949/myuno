# Property option A — 2026-11-13

## Delivered
- Shared desktop/mobile stay calculator, explicit indicative total, date/guest context handoff to the existing inquiry route.
- Contextual WhatsApp questions without registration; internal authenticated chat unchanged.
- Related eligible public properties with configured tariff periods, current-offer exclusion, deterministic ranking and allowlisted AI IDs.
- New source-only `property-related-recommendations` function uses streaming Responses and strict structured output. `feature_flag:property_related_ai` remains OFF/unmodified.

## Verification
- `bun run test src/lib/real-estate/relatedProperties.test.ts src/components/property/__tests__/PropertyQuestionButton.test.tsx src/components/property/__tests__/PropertyBookingCardContext.test.tsx src/components/property/detail/__tests__/PropertyDetailMobileBar.test.tsx src/components/property/detail/__tests__/PropertyDetailMobileBar.clearance.test.tsx src/components/property/__tests__/availabilityLoadStates.test.tsx src/lib/real-estate/propertyDetailPricing.test.ts src/pages/property/__tests__/PropertyDetailIntent.test.tsx`: 8 files, 73/73 PASS.
- `python3 /tmp/browser/property-option-a/check_ui.py`: desktop calculation → inquiry dates/guests; RU mobile shared calculator at 375/390/430; 4/4 PASS, no runtime errors, non-local network denied. Screenshots retained in `/tmp/browser/property-option-a`. Synthetic browser QA, NOT live E2E.
- `deno check --node-modules-dir=none supabase/functions/property-related-recommendations/index.ts`: PASS.
- Synthetic server-held-key gateway SDK test with `openai/gpt-6-astra` returned structured `{"ids":["a","b"]}`; no production catalogue or business mutations. This verifies the gateway contract, not deployed endpoint acceptance.
- Automatic preview build: OK.

## Boundaries and blockers
- No publication, edge deployment, settings changes, messages, working tariff changes or business writes.
- AI ranking needs separately authorized deployment and activation, plus deployed endpoint acceptance; deterministic recommendations remain available now.
- Existing inquiry chooses request or instant-payment branch from its existing authoritative settings; unchanged here. Estimate/button alone does not reserve capacity or charge money. Copy does not promise a request-only destination for an instant-enabled property.
- Sansiri monthly working tariff untouched, pending explicit narrow data-change authorization.
- Tested evolving source, observed HEAD before final documentation: `7cc0ac3a7a3a4aa49b4827c69f39d8ba0549cb22`; not a claim of publication or remote CI parity.