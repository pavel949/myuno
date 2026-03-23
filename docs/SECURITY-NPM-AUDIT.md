# npm audit — known remaining issues

Run periodically:

```bash
npm audit
npm audit fix
```

`npm audit fix --force` may pull **breaking** upgrades (e.g. Vite 5 → 8). Review changelogs before forcing.

## Last review (roadmap implementation)

Transitive issues may include:

- **esbuild** (via Vite) — dev-server advisory; production bundle not affected the same way.
- **serialize-javascript** (via workbox / PWA) — assess impact on build output; track upstream `vite-plugin-pwa` / Workbox releases.

Document accepted risk in PR when deferring a major bump.
