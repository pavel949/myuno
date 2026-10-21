# Thai information surface and business indicator acceptance correction

The published Thai About check switched navigation but left page body in English. AboutPage used a RU/EN-only helper. Add Thai variants for all 25 page copy calls, translating existing statements without adding services, language-support promises or policy terms. Existing RU/EN strings are preserved. This does not substantiate existing marketing claims; it translates them. No legal-policy page content changed.

CookieConsentBanner likewise used RU/EN-only ternaries. Translate all 16 banner/settings/action strings, including dismiss accessible name, into Thai. Cookie category defaults, save/reject/accept handlers, persistence, timeout and policy link stay unchanged. Property-search worker confirmed no overlapping edits to this component.

Before business evidence: /workspace/shared/myuno-lovable-preflight-20261019/deploy-pr131/03-business-mobile-detail.png. Checkbox outline is about 16px wide and 44px tall because the global mobile button minimum overrides its 16px height. Add local min-h-4 to the business checkbox only; h-4/w-4/shrink-0 and focus-visible ring remain. Existing padded clickable service cards stay unchanged.

Verification: 8 tests pass across AboutPage (3 locale cases), ForBusinessPage (4 including all locale checkbox geometry contracts), CookieConsentBanner (1 lifecycle test switches EN/RU/TH then verifies original rejection semantics). Scoped ESLint has zero errors and three pre-existing cookie component warnings. All original string literals in About and CookieConsentBanner were verified preserved with a TypeScript AST comparison. These are source/render tests; published Thai and mobile geometry screenshots remain pending.
