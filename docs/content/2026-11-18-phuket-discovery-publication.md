# Phuket discovery publication

Owner authorised publishing the researched experiences and repairing their photography on 18 November 2026. This tranche publishes nine editorial experiences in the existing `listings` domain and adds six missing records to the existing `experience_categories` taxonomy. Eight existing IDs are retained; PowerDrive has one new, fixed ID after duplicate inspection. Canonical yacht and restaurant records remain separate.

## Presentation and data contract

`attributes.discovery_only = true` identifies information about a verified real operator, not a partner-approved commercial offer. Such entries have no asserted myUNO price, rating, schedule, capacity or availability. Their detail and direct `/book` route render the same informational view with a checked HTTP(S) source link; they do not show inherited pricing variants or admit the order form. Old pricing rows are retained as historical catalogue data, not displayed for editorial entries. This frontend restriction does not certify or change server order authorization.

Publication uses the existing `approval_status = approved`, `is_active = true`, `attributes.status = published` reader contract. It does not grant a provider verified status or change policies/roles. Ratings, coordinates and prices without verified attribution are cleared only on the selected entries. Commission, provider mapping, settlement and operational records are untouched.

The homepage uses the existing `HomeGallery` / `HorizontalRail` DS 2.1 frame with up to twelve compact photographic cards. Source photographs are recorded in `scripts/content/phuket-discovery-20261118.json` and served as same-origin assets. No generated stand-in photographs are used. Artwork was retrieved from the named operator's public site; no claim of a partner contract or media licence is inferred from retrieval.

## Activation and rollback

1. Verify tests, TypeScript, design audit, build and photographs.
2. Publish the frontend and same-origin assets before approving the new catalogue rows.
3. Run the reviewed, bounded content patch. It requires the eight expected existing IDs and timestamps and checks the exact affected count; no wildcard publication.
4. Verify anonymous homepage-equivalent reads, all selected record IDs, taxonomy filters, images and detail/direct-book routes without creating an order.

The accompanying rollback restores the eight captured marketing rows only while they retain this content version and have not been edited after publication; the new PowerDrive record is deactivated rather than deleted. Reusable categories remain in the taxonomy. A rollback of frontend code must first deactivate/revert these editorial rows so older clients cannot present them as commercial offers. No payment, inventory, RLS, function or schema migration is part of this tranche.

## Remaining restaurant editorial work

The researched dining shortlist is kept in the earlier proposal. The nine-experience activation does not silently duplicate restaurants into `experience`. Niyom has no verified reusable venue photo in this tranche; the current direct MICHELIN page fetch returned 404 despite indexed excerpts and a matching Maps record. Do not invent its photo or publish an asserted restaurant package. SUAY and Blue Elephant continue through their existing restaurant catalogue entries.
