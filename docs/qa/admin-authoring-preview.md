# Admin authoring preview acceptance

The Design system verification workflow runs
`node scripts/qa/admin-authoring-preview-ui.mjs` as an additional step in
its existing `isolated-core` shard. It uses the already pinned Python Playwright
Chromium and the canonical CSS emitted by the preceding convergence build.
No Vite app, service session, database, deploy, or action secrets are needed.
The shard and its existing fail-closed aggregation remain required as before.

The real admin routes and five editor components run with only synthetic
read hooks and no business writes. A routed local virtual origin serves
only the three generated fixture files. Every other network request
fails the fixture; service workers are disabled. The workflow preserves images
and the per-case JSON result in its existing artifact, under
`artifacts/design-system/admin-authoring-preview`.

The path from each add action, and from the provider-linked service alias,
is tested at 320, 390, and 1440 px. It edits the actual title field, opens the
draft disclosure by keyboard, checks that the supplier contact is absent
from preview and that the scroll area/footer remain reachable without
horizontal overflow, then dismisses with Escape. It asserts no mutation
attempt at either preview or dismissal. This is not a test of saving,
publishing, permissions, the live admin shell or a guest record.

Local: install the lockfile dependencies and Python `playwright==1.55.0`, then
`python -m playwright install chromium`. Run the same Node command with
`ADMIN_AUTHORING_CSS_FILE` pointing to compiled canonical CSS, or use the
repository's Vite CSS endpoint at localhost:8080. `--bundle-only` compiles
and checks fixture module boundaries without claiming a browser pass.
