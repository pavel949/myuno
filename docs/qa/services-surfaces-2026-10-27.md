# Public services: local premium surface tranche

Base: main `046663d895ccdc4beedacaa436e6e7044938895b`. Branch: `codex/premium-services-surfaces-20261027`. Local only: no push, PR, merge or publication. The pending property branch `37dd479e7dadd485e9c91ee0b75a3b0e4cf38b58` remains unchanged.

## Scoped inventory

| Surface | Residual finding | Local change |
| --- | --- | --- |
| `/discover/services`, `/services` | Existing live taxonomy/filter projection already works; header/card rhythm differs from residential public surfaces | Scoped display typography, canonical wide gutters and spacing. Existing situations/categories, text filter, query/history and destinations retained |
| Category/situation queries on those routes | Shared presentation, not separate category records | Same component and canonical query implementation; no taxonomy or route additions |
| Existing provider offers in `MarketplaceServiceGrid` | Dense covers and inconsistent card surface | 4:3 media when present, quiet borders and focus state, existing request action and provider link |
| `/services/provider/:id?returnTo=…` | Narrow legacy profile, false active→Available cue, unknown rating/price→zero, inert Message button, fixed duplicate action strip | Shared detail frame/type, neutral missing/failed avatar, no invented availability/rating/price, remove inert action, in-flow continuation and responsive offer rows |
| In-place `ServiceBookingSheet` | Price relabelled THB even when explicit currency differs; full-width desktop form | Reuse existing truthful price label and form-width token, preserve scheduling/writer/reset/auth behavior, usable 44px close control |
| `/services/booking/:id` | Existing guarded commercial continuation | Route retained; wizard and financial model not redesigned or altered |

Dedicated transport, beauty, pets, legal, home-service request wizards and service map are not certified as visually migrated by this tranche. Shared components may improve their existing embeds; no claim that all service routes or all433 canonical entries are complete.

## Correctness and boundaries

- Provider publication (`is_active`) does not assert current availability or online presence. Provider-specific generic verification remains tied to the existing explicit flag; no new verification meaning is introduced.
- Known explicit currency/price is displayed; unknown price/currency remains quote-only. The legacy cart totals THB, so both Add UI and handler admit only known THB prices. Other currencies keep their existing service-request entry and clear explanation; no conversion or multi-currency checkout is introduced. Mixed-currency local provider summaries do not invent THB totals.
- Public provider or service-read failure renders a retryable error, not “provider missing/no services.” The hook change is restricted to public visibility; private admin behavior is unchanged. Raw error details are not exposed.
- Existing public allowlisted catalogues, canonical categories/situations, slots, service-order writer, auth redirects and safe catalogue return validation are retained. No DB, SQL, RLS, roles, billing, credentials, real inventory or order writes.
- All new CSS lives in `premium-services.css` and consumes tokens already on main. No dependency on pending property commit37dd479 and no modifications to its files. Shared dependencies: MarketplaceServiceGrid/ServiceBookingSheet and public useProviderDetails; the latter's private consumer is unchanged.

## Validation

- 70 tests /8 files PASS, including real provider→request-sheet scheduling, unknown price, explicit USD/Thai display with disabled unsupported cart Add, provider/service-read failure and existing public projection boundaries.
- Another39 tests /3 files PASS: integrated service route ownership, safe return navigation and canonical discovery projection. Total109 tests across11 files.
- Typecheck PASS. Full lint0 errors/2460 warnings; changed files0 errors/7 warnings. Production build7117 modules,1m45s PASS. Design audit4127 findings,0 new/structural,154 resolved baseline entries; baseline unchanged.
- Actual Chromium: initial30 catalogue/category/provider renders over320/390/430/768/1440/1920 plus actual RU/TH document locales at390/1440. The first combined script stopped later because the existing missing-provider page lacked H1; that page now has a proper heading and the states pass was rerun independently.
- Final10 captures recheck corrected profile/media/spacing and catalog/category at1440/390, provider at all six widths. Dialog close target measured44×44px; loading state captured. No horizontal overflow/runtime errors in accepted passes.
- Separate states pass: unknown/non-THB cart guard; open/Escape/reopen service request; error→retry; missing provider; query reload and Back/Forward; reduced motion/focus. Initial states-script setup attempted localStorage before opening an origin; corrected only the QA setup and reran successfully.
- No live service-order, booking, payment or authenticated transaction acceptance. Published provider hours were intentionally absent in fixtures; the UI honestly explains online times are unavailable.

Local evidence: `/workspace/myuno-ui-evidence/services-surfaces-20261027`, `services-surfaces-final-20261027`, `services-states-20261027`; scripts/logs in `/tmp`. Fixtures are explicitly synthetic and outside the production import graph. No new project/stock media or Library transfer attempt. Localhost is not a user-accessible published preview. External visual/live acceptance remains future work.
