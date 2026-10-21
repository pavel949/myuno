# Public homepage: “Пхукет. Вы дома.”

This is a presentation-only redesign of the guest Landing at `/`. Authenticated users continue into the existing Index workspace via HomeRouter. The owner/business/service/property systems remain canonical; no database, payment, inventory or authorization changes are included.

The home presents a cinematic destination image, direct rent/buy search, four life situations, editorial discovery entries and a team-help fallback. Structured services link to existing discovery; the concierge sheet is reserved for assistance. Public emergency access remains a separate link to SOS without requiring an account.

Content lives in `src/content/home/cinematicHome.ts` and uses the existing `pickLang` localization utility. Category links describe search intents, not individual listings. Images are existing repository assets; counts, partner guarantees and Google ratings are intentionally absent until verified.

Search preserves the existing PropertySearchPage URL contract and shared civil-date helpers. Buying omits rental dates, guests and tenancy. Dates are requested together. The receiving search bar now initializes visible controls from the parsed URL, avoiding a misleading reset after arriving from the homepage.

Validation: `npm run typecheck` (Node heap 6144MB), six isolated tests (search handoff and analytics identifier security), full production build, cloud-browser checks. See the repository-root `design-qa.md` for evidence, comparison history and limitations. No production business writes were used for QA.

Rollback: revert this UI commit. No migration or data rollback is required. Public catalogue availability and downstream transaction correctness remain governed by existing canonical systems.
