# Combined layout integration evidence

This branch preserves PR143 and PR144 history through a merge and adds an
isolated layout fixture to the existing Connected workflow. It is not a release.

## Coverage

75 cases: RU/EN/TH × 320/360/640/767/1280px × property browse, account tabs,
local-service marketing, developer marketing and management-company marketing.

The actual NavShell, TopBar, ConsumerHeader, BottomBar, UserAvatarMenu, MiniCart,
global preference controls, LandingChrome, marketing pages, PropertyIndex,
AirbnbSearchBar and MeShellLayout are bundled. The builder verifies their
presence in its esbuild input graph. Real production CSS comes from the existing
isolated Vite server; component CSS is merged after it.

Checks include header control non-overlap and viewport bounds, unbroken language
labels, measured shared sticky offsets during scroll and resize, the marketing
header's 56px inner height, bottom navigation bounds/full booking names, marketing
button bounds/non-overlap and all page CTA handlers/destinations. Management
pricing scroll/module anchors and captured WhatsApp URL are checked without
opening a window or contacting a provider.

The workflow runs this fixture sequentially after the existing two-slot fixture
runner under the same network-denying Node environment. The existing browser
step and final enforcement gate remain intact. A 240-second timeout bounds the
new fixture; nonzero exit fails the browser step. Screenshots, matrix results and
bundle inputs are uploaded with the existing `/tmp/browser/` artifact.

## Limits

- No local browser bootstrap, launch or recovery is permitted. Local checks use
  `--build-only` (which exits before Python) and Python AST parsing. Both executable
  browser entry points reject non-CI execution.
- Authentication, roles, cart and property data hooks are synthetic. Supabase
  access throws; external browser requests abort and fail the case. This does
  not verify auth/backend behavior, permissions or destination pages.
- AppLayout is a thin fixture adapter to the real NavShell; its analytics,
  verification banners and footer are omitted. Closed search/apps overlays,
  property hub tabs, maps, listing cards, and cross-sell/insight regions are
  omitted. Empty browse content gets a synthetic spacer inside its existing
  sticky parent solely to exercise scrolling. Account content is synthetic.
- The primary canonical font families load from Google Fonts in production.
  They are not bundled; only unrelated Roboto assets are bundled. No external
  font requests are allowed. Results record computed stacks and certify system
  fallback geometry only, not canonical-font or real-device acceptance.
- Marketing pages currently use English copy for Thai. The fixture retains that
  behavior and checks the Thai preference state; it does not invent translations.
- The matrix uses signed-in guest-role account data. Other operational roles,
  populated carts, avatar images, live content, consent banners and safe-area
  device variations are outside this fixture.

Production rendered acceptance and release remain with the coordinator.
