# Public header scroll ancestor correction

## Real browser evidence

Firecrawl public desktop /discover/services, bundle index-BHFuOWCB.js, reported viewport 1920×993. Direct observation: window.scrollY and documentElement.scrollTop 639; body/#root scrollTop 0. ConsumerHeader computed position sticky, top 0px, height 81px, but bounding top -639 and bottom -558. Intermediate layout wrappers had visible overflow. #root/body/html computed overflow hidden auto; the non-scrolling root/body became accidental sticky scroll ancestors.

Verifier's reversible in-page experiment (styles discarded by reload):
- #root overflow-x clip alone: root clip/visible; body hidden/auto; header top -639 at reported scroll 639.
- #root and body overflow-x clip: both clip/visible; header top 0; html unchanged hidden/auto.
- Document scrollWidth and clientWidth both 1905 throughout. Inline overrides empty after reload.

The tool's initial experimental stage unexpectedly reported header top 0 at scroll 639. A settled post-reload baseline resolved that timing/report ambiguity: scrollY/documentElement.scrollTop 639, root/body scrollTop 0, header top -639; root/body inline styles null and all three ancestors hidden/auto. At scroll 0 the header top was 0. The defect therefore reproduced after all overrides were discarded. The comparative root-only versus root+body experiment supports changing both ancestors; it is not a published patch or mobile acceptance test.

## Change and bounds

Change only body/#root horizontal overflow from hidden to clip in index.css. Retain html viewport clipping, max-width, overscroll rules, flex/min-height layout, safe areas and existing header position/z-index. No !important overrides; modal inline body scroll locking keeps precedence. Home's relative overlay header remains relative. Dedicated horizontal scrollers remain untouched.

CSS semantics: hidden with visible on the other axis computes to auto and creates a scroll container; clip does not. Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow

## Verification

22 focused tests pass: sticky-scroll-root 4, ConsumerHeader 4, AppLayout composition 2, mobile-overflow 5, Coachmarks scroll-lock lifecycle 7. Scoped ESLint and git diff --check pass. Independent read-only source review found no blocker. Source tests are contract checks, not layout measurements. Published desktop/mobile scroll and horizontal containment verification remain required, including mobile menu/modal scroll locking and overlay home behavior.
