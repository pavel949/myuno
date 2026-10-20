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

The workflow runs this fixture in an early dedicated step immediately after
dependency installation under the same network-denying Node environment. Its
own artifact uploads immediately, before slower checks. The existing two-slot
browser runner and all mandatory gates remain intact; the final gate additionally
requires the early layout step to pass. A 240-second timeout bounds the fixture.

The first remote attempt on c365a723 failed before geometry: the filter hook mock
incorrectly supplied `filterConfig: []`, while actual UniversalFilter calls
`config.sections.map`. Runtime errors contained the corresponding undefined-map
error and no blocked requests. **Zero geometry cases passed on that run.** The
payload is now `{sections: []}` and shared between the virtual hook and a JSDOM
regression that renders, opens and submits the actual UniversalFilter.

The mock audit compared consumed fields with PropertyIndex, AirbnbSearchBar,
PropertySearchSheet, TopBar, UserAvatarMenu, MiniCart and preference controls:
property data pages and query flags; quick-filter district arrays; persona filter
function; account metadata/role/notification/owner fields; cart methods; theme
methods; currency symbol/code/names/formatter; and language/translation methods.
CurrencySwitcher consumes `name`, so the synthetic currency record now supplies
that field rather than `nameEn`. Mocks remain narrow empty/signed-in fixtures;
this audit does not certify unexercised backend or overlay behavior.

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

## Subsequent evidence and corrections

The next remote attempt (647726a, run39369794773/artifact12240942361) passed
RU/320 property, account and local-services cases, then found real clipping of
the lower developer-card CTA. Runtime errors and blocked requests were empty.
Its 165px consumer header offset matched the sticky surfaces, but the accidental
three-row layout was too tall. The remaining71 cases were not executed then.

The batch following that evidence keeps complete CTA copy/actions and gives all
three marketing pages' buttons flexible height, normal whitespace and bounded
width/padding; all multi-action rows can wrap. A real-component regression checks
the full Russian developer registration label and original navigation. Consumer
mobile chrome is now a deliberate two-row grid (wordmark/menu; preferences and
account controls). CI requires at most two control rows and at most120px height,
while retaining measured sticky offsets. LandingChrome retains its56px contract.

The matrix now collects individual failures through all75 cases, saves each
completed case and fails the aggregate. Bounds failures retain text, rectangles
and overflow flags in both explicit result fields and assertion details. A
failing case does not silently become a pass. The Testing Library exact-name
query uses the supported `/^Apply$/` regex; source typecheck is separate from
Vitest execution.

The5f4bd11 early matrix (run39370712644/artifact12241421367) completed75cases:
57passed and18failed. All CTA bounds passed; mobile headers measured117px and
at most2 rows in RU/EN/TH. The18 failures were harness defects:15 management CTA
scroll checks sampled a long native smooth-scroll after only100ms, and3 desktop
account checks selected the intentionally hidden mobile combobox. Source and
screenshots confirmed the desktop tabs were visible and the real pricing handler
called smooth scroll. No production change was indicated by those18 failures.

The follow-up selects a visible sticky control and observes the actual pricing
CTA's result with bounded RAF polling: the pricing heading must be fully inside
the viewport below the header and stable for100ms, within5s. It never scrolls the
page from the harness to satisfy pricing acceptance. Success records the observed
heading/header/scroll geometry; timeout records the actual heading rectangle and
last observed scroll. Current-head geometry remains unconfirmed until CI runs.

Thed8a3e143 matrix (run39371327125/artifact12241975732) completed75cases with
60PASS/15FAIL. Only management WhatsApp capture checks failed: captured calls
were `[null]` followed by the correct URL/`_blank` pair, with no runtime errors or
blocked requests. Playwright evaluates the initializer string then calls a
function-valued result; the final assignment returned the replacement function
and created the spurious call. Production had only its correct WhatsApp action.

The replacement uses an explicit block initializer with undefined return. Pure
Node VM tests reproduce the old evaluator behavior and verify the actual new
initializer captures exactly one explicit correct call; they run before remote
geometry. No external window or provider is opened. All remaining evaluate
assignments were audited: spacer initialization is already a block, pricing
polling returns data/false, other reads return data/promises/booleans, and the
intermediate pricing assignment was removed. Pricing proof is now written into
the case and results file immediately after the observed scroll succeeds,
before subsequent WhatsApp/anchor assertions can fail.
