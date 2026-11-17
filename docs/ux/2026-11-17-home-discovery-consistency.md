# Home discovery consistency — bounded frontend tranche

Base: `f3b55ae4c8d83ad5321f9193a6df6d0fa651d650`.

## Source findings
- Guest `/` renders Landing; signed-in `/` renders Index. Index retains a separate admin-only `home_v2` flag and personalized work/account actions. This is intentional differentiation, not a reason to replace signed-in Home with marketing.
- The guest homepage includes experience discovery; neither personal Home variant included it.
- Rental photo eligibility ran after a server limit of 18; experience photo eligibility after a limit of 8. Thus an empty preview does not prove an empty catalogue or that every published record has no photographs.
- Experiences on Home additionally require `attributes.status=published`. The general experience catalogue does not use that flag. Do not relax this guard just to fill the landing.

## Change
- Keep all route/auth/publication boundaries, personal actions and the admin rollout gate unchanged.
- Increase bounded candidate samples to 48 rental / 24 experience records, retaining 6 / 4 displayed cards. This reduces first-page selection starvation; it is not an exhaustive catalogue audit.
- Use the same HomeGallery/SectionHeader/native horizontal rail for experiences as rental/newbuild/service sections.
- Add experience discovery to both authenticated Home variants after housing/newbuilds.
- When a successful read yields no usable preview, offer verified rental-duration or experience-type links, with explicit no-preview copy. These are navigation, not invented offers or a promise of availability.
- Preserve separate loading/error/retry states and known failed-media suppression. No placeholder inventory, supplier contact routing, DB write, migration, backend deploy or production data repair.

## Verification
- 43 tests pass across HomeDiscoveryPreview, HomeCatalogGalleries, HomeComposition, Landing.anonymous-home and homeShowcase.
- Design audit: 0 new/structural findings (existing baseline findings remain).
- Primitive adoption register regeneration produces no diff.
- Full `npm run typecheck` was killed by execution resources; no full typecheck pass claimed.
- No production transaction, lead delivery, mobile browser or live authenticated acceptance is claimed. These remain release checks.

Rollback: revert this frontend-only commit. No data rollback required.
