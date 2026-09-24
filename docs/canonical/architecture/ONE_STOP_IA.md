# One-Stop IA — audit & mapping (step 1)

Goal-first public IA layered over existing verticals. No data or routes removed.

| Goal | Entry page | Existing routes reused |
|---|---|---|
| Stay | `/discover/stay` | `/property/rent/short-term`, `/property/rent/long-term`, `/property/map`, `/transport`, `/experiences`, `/bookings` |
| Live | `/discover/live` | `/relocate`, `/live`, `/medical`, `/legal`, `/insurance` |
| Buy | `/discover/buy` | `/property/browse`, `/property/offplan`, `/property/consultation`, `/invest`, `/sell` |
| Services | `/discover/services` | `/services`, `/thai-services`, `/cleaning`, `/services/map`, `/discover` |

- Config SSOT: `src/lib/nav/goalEntries.ts` (test fails on any unregistered link).
- Guest nav: Home · Stay · Buy · Services · Me (Live via home strip + goal tabs; 5-slot limit).
- Mounted as static children of `/discover` so `/discover/:code` situations keep working.
- Role switching: existing switcher in the avatar menu (Provider / Owner / Admin / Team / Investor) is the canonical role switcher — reused, not duplicated.

## Duplicates / migration TODO (not changed in this step)
- `/stays` is the owner subscription landing, not guest stays — rename candidate.
- `/market` and `/discover` dropped from guest bar; still reachable via Apps drawer and Home.
- Pre-existing failing tests: top-level allowlist (`/bloom`, `/home`, `/invite`, `/join`, `/marketplace`), clusterCatalog "Services hub" label.
