# Exchange reference truth — bounded PR61 salvage

Base `fb4b944a4c736f680ddb8e4b178f833030e021b1`. No exchange table,
merchant records, ratings, commission model, migration or function deployment.

The old public page showed hardcoded rates, daily percentage changes, merchants,
ratings, spreads, hours, coordinates and an `Updated` time equal to page load.
None established actual published exchange offerings. PR61 moved similar data
into an unsafe parallel exchange model, so that proposal is not imported.

The page now reads the existing `CurrencyProvider` result of
`get_all_currency_rates`, with only validated positive numeric rates carrying a
valid persisted timestamp exposed as `referenceRates`. This additive metadata
is separate from the context's existing display-conversion fallback; no fallback
is presented as a live reference quote. Existing `formatPrice` / `convertPrice`
behavior is unchanged. Unknown currency keys are excluded using own-property
membership. Errors discard reference evidence and display an error; empty or
invalid data displays an unavailable state.

The calculator inverts canonical THB-base rates correctly, accepts nonnegative
finite amounts, rejects overflowing results, and shows each chosen rate's actual
recorded date in Bangkok time. It does not claim freshness, trends, executable
quotes, commissions, verified merchants or a daily change without evidence.
The unsupported merchant directory is explicitly unavailable on this page.
RU/EN/TH use the current `pickLang(language, values)` contract.

Validation: ten component tests mount the actual page plus actual provider with
network forbidden and synthetic RPC results: conversion and currency changes,
persisted date, negative amount, no fake merchants/trends, RPC errors, missing
rates/dates, invalid rates/dates, loading and localization. Browser fixture
`scripts/qa/exchange-reference-ui.mjs` renders the same real components with
production client excluded; `exchange-reference-ui.py` exercises data/empty/error
at390/1440 in RU/EN/TH, form interactions/focus, overflow and page errors.
Screenshots are synthetic reference evidence, not acceptance of live FX quotes.

Remaining critical issue: the existing `update-currency-rates` function is a
public privileged writer and its authentication/provider-response validation
needs its own critical tranche. This read-only UI patch does not activate,
invoke, deploy or certify that writer. No live financial or business QA writes.
