# Property search visibility correction

User requirement: editable criteria must be obvious; Russian heading must say «Найдите ваш дом на Пхукете».

Source baseline: 36fee777b (myuno production-core repository). Uploaded screenshot matches PropertySearchPage; public myuno.app observed an older form without this heading. No production business records changed.

Changes: always-visible canonical HomeDiscoverySearch; labelled property-name field connected via q to existing server title search; preserved URL filters and history; clear price/bedroom/amenities action; visible control borders and mobile stacking; map action contrast; loaded count distinguished from final count; reset includes name/guest/date constraints. Existing catalogue date-availability limitation remains explicitly disclosed: dates are carried to property selection, not used to certify availability in the result list.

Validation: 35 tests pass across HomeDiscoverySearch and PropertySearchRoutes; focused ESLint passes; isolated UI fixture compiles with production data modules excluded; diff whitespace check passes. Browser fixture updated for visible controls, but not executed locally. Browser could read public myuno.app; localhost is blocked by that browser environment. Full production build terminated with exit 137 after transformation/chunk rendering, so build is unverified. Initial full typecheck exhausted the default heap; higher-heap retry was started separately and is not counted as passed here.

Delivery: local branch fix/property-search-visible-controls. Git push blocked by automatic approval review pending explicit authorization for pavel949/myuno. Not merged or deployed. After authorization: push, run CI including browser fixtures, inspect rendered RU/EN desktop/mobile results, then publish approved frontend and verify exact production version. Rollback is reverting this frontend-only tranche; no migrations or data rollback.
