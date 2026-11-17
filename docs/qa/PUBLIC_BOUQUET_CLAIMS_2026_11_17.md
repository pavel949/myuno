# Legacy bouquet copy containment

## Verified source problem
`BouquetDetail` rendered `urgency_badge` unconditionally and copied free-text descriptions into both public body and SEO metadata. Neither field has verified delivery/date or freshness evidence at this call site. The reported live bouquet contained “Order by 2 PM for same-day delivery” and “freshness up to 10 days”. No production records were queried or changed for this patch.

## Narrow correction
- Never publish the unverified legacy urgency field on this detail route.
- Withhold the entire description field when it mentions the known freshness/delivery claim topics; show a florist-confirmation fallback, and use the product name rather than the withheld description in metadata.
- Preserve neutral composition/design descriptions and existing booking/cart flow.
- Apply the same guard to RU/EN. No rewriting a commercial claim into a different fact.

## Limits and cross-category review
This lexical guard is targeted containment, NOT arbitrary-language claim verification. It intentionally also withholds qualified/negative delivery or freshness statements. Unrecognized claims, other marketing fields, catalogue cards and descriptions outside this route are not certified by it.

`YachtDetail` uses provider descriptions in body, SEO and service JSON-LD; `ExperienceDetail` uses short/long provider descriptions and highlights. These lack description-level provenance at the display call sites. They are not changed here: no specific unsupported description was established for these surfaces, and suppressing all useful provider copy would exceed this correction. A durable publication policy needs explicit reviewed content/provenance and expiry fields maintained by an authorized review process, not regex or a disclaimer pretending to verify content.

## Validation
Focused regression tests cover full-field withholding, neutral RU/EN text, absent/malformed values, removal of urgency, and body/metadata wiring. No real booking, payment, provider message, production data update or deployment.
