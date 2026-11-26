# Shared marketplace presentation

Base: c702584d1 (visual foundation #367). Scope: public discovery presentation only.

## Implementation plan and result

1. Reuse MarketplaceEntry for Services, Experiences, Buy, Homes, Discovery and Live. One masthead typography, spacing and catalogue width; editorial Rent/Newbuild landings keep their richer area/project guidance and existing search forms.
2. Reuse MarketplaceDiscoveryMenu for category and journey choices. Same media slot for photos and Lucide icons, keyboard focus, readable wrapping, two mobile columns and explicit access to additional choices. Preserve native links, route state and callback semantics.
3. PlatformJourneyLinks retains its named navigation landmark while sharing category-card presentation. Property search retains existing mode, dates, guests, projects and URL/history contracts.
4. Compact homepage service previews use the same media dimensions and token surfaces. Keep flowers/yachts illustration notes and the independent Fast Track link.
5. Share the quieter results heading only in opted-in catalogue layouts. Domain filters and request/booking/payment semantics stay with existing implementations.

## Direction-specific contracts

| Direction | Preserved specificity |
| --- | --- |
| Rent | Dates, guests, tenancy, areas, complexes and canonical property search |
| Buy/newbuilds | Projects, units, resale, buyer enquiry and ClearView boundaries |
| Experiences | Topics, programme/duration, map and existing discovery-only restrictions |
| Services | Category/situation filters, provider offers, request templates and My requests |
| Discovery/Live | Canonical goal navigation and relocation guidance |

## Coordination

Integrated accepted Design Bible #368 from main 720bf4840 (PR head 4c9aa07a6). The combined tree retains main's property search logic, actual header/navigation changes, compiled-index CSS fixture support and new page-state behaviour. The shared marketplace layer consumes the accepted Outfit/Manrope type tokens and card/media radius tokens. Homepage geometry assertions and the source register are regenerated for this combination. #369 keeps its own marketplace navigation, imagery/icon proportions and QA asset/style fixes. No PR merge, publication or backend activation is part of this integration.

## Verification

Synthetic actual-component fixtures only; no live submissions. Typecheck, focused navigation/filter tests, production-format build with loopback configuration and design audit are required. The resulting loopback build must never be published. Browser evidence covers seven entries in three languages at320/375/390/768/1440, real ServicesIndex in light/dark, and actual anonymous Landing with source CSS and computed homepage category geometry. Screenshots use local fallback fonts and synthetic catalogue records; they do not establish live data, complete app-shell equivalence or backend acceptance. Exact results are recorded with the PR.

Rollback: revert the UI commit and republish through the normal release gate; no data rollback.
