# Mobile homepage header and hero

Based on main `0e4ce1f09d2b28632851bc422887b6010905106f`.

The overlay header now keeps the logo, a named 44px motion control and the menu
in one row. Mobile language/appearance controls live in the menu; desktop keeps
its toolbar. Removed switcher-specific z-50 overrides that placed their menus
behind the Sheet overlay; shared dropdown layering remains authoritative.
Hero title, copy, unified search and district discovery link remain in normal
vertical flow. Mobile hero height follows its content instead of a 640px minimum.

Validation: 34 targeted tests (header/navigation, hero motion, anonymous home),
TypeScript build mode, scoped ESLint and production build PASS. Browser checks:
30 cases at 320/360/390/430/1440, plus 12 at 768/1920; RU/EN/TH, normal and reduced
motion, native menu/language/theme pointer actions, Escape/focus restoration,
unified search entry, no horizontal overflow and 44px menu targets. At 390x568,
200% hero text remains in flow and the full search card can be scrolled above the
bottom navigation. The actual UnifiedChatFAB retains >=12px clearance (16px
canonical offset) above the mobile navigation. Bottom padding/safe-area tokens
remain unchanged. Static hero under reduced motion is verified.

Reproduce using a localhost Vite server on 8080, synthetic loopback configuration:

    HOME_GALLERY_OUTPUT=/tmp/mobile-home-header node scripts/qa/homepage-galleries-ui.mjs --build-only
    python3 scripts/qa/mobile-home-header.py /tmp/mobile-home-header
    python3 scripts/qa/mobile-home-header.py /tmp/mobile-home-header --wide

The fixture renders actual Landing, header, switchers and chat launcher, with
synthetic catalog/context adapters and denied backend/external requests. It does
not certify live catalog, authentication, assistant service or production release.
Representative screenshots were inspected. Full repository suite and production
publication are not claimed by these local checks.
