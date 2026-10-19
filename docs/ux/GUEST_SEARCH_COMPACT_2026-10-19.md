# Guest property search: compact results-first design

Status: implemented candidate; central CI browser rendering and visual acceptance pending.
Scope: `myuno` guest `/property/search`. No backend, inventory, pricing, access, or booking-counterparty changes.

## Decision

The supplied desktop reference put two rows of intent/duration controls, a large form, a company selector and fourteen feature icons before the properties. Keep existing navy/cream semantic tokens, sharp edges, shared search logic and catalogue cards, but reduce default control density:

1. Direct Rent / Buy intent, with the existing URL contract and rental context retained when switching.
2. A compact type/area/date/guest summary at every viewport. One Edit search button reveals the existing form. Submitting collapses it and focuses results; resize does not discard a mounted draft.
3. One Filters entry plus three text quick choices: Walk to beach, Private pool, Sea view. All fourteen former ribbon features remain inside the existing responsive filter sheet, using the same `cats` state and matcher. Other active legacy features remain individually removable.
4. A clear results heading, accessible sort selector, and map/list toggle before the unchanged listing cards.

Management-company discovery controls and badges are removed. Guest search no longer fetches the company catalogue. Existing `company` bookmarks are still honored and counted as an additional constraint; the existing Clear action removes them. Authorization/scoping hooks elsewhere and property/booking counterparty information are unchanged.

The responsive filter trigger now refreshes its draft when opened. This prevents stale selections after changing a quick feature, closing/reopening the sheet, or navigating history.

## Verification boundary

Focused route, shared-form and URL tests cover legacy URLs, dates, guests, type/area, rent duration, sale price/intent, Back/Forward, compact desktop/mobile state, resize draft retention, three quick choices, all fourteen sheet features, repeated sheet-open synchronization and rental-only filter handling in Buy.

`scripts/qa/unified-property-search-ui.mjs` uses the real page, shared form/date picker, filter modal, sort and property card with synthetic hooks. Production data modules are excluded and external browser traffic is denied. Its existing CI invocation now covers RU/EN at 375, 390, 430 and 1280px, keyboard editing, date changes, history, Rent/Buy, filters, sort, map, no overflow, 44px quick-feature targets, plus light/dark screenshots. The fixture checks the first card starts before 560px on mobile / 460px on desktop, excluding the global consumer header. These are acceptance assertions, not yet measured results.

No local browser, full build/typecheck, production writes, push, merge or deployment was performed for this candidate. Visual acceptance requires inspecting central CI screenshots, including the existing global-shell limitation. Canonical date availability remains explicitly unverified until opening a property.

Rollback: revert this UI-only commit. No data rollback is needed.
