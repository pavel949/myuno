# Production Lighthouse evidence

The workflow checkout SHA identifies the runner/configuration, **not** the deployed frontend. `production-identity-before.json` and `production-identity-after.json` record public `/version.json`, its observed commit when present, and the fetched document's script asset names/hash. An unavailable or unidentifiable deployment remains UNVERIFIED. Source sync is not publication proof.

Lighthouse CI is pinned to 0.14.0 in an isolated temporary installation. Raw HTML/JSON, assertion results and identity snapshots in `.lighthouseci` are retained even when assertions fail; hidden artifact files must be included.

SEO/accessibility retain their 90 error thresholds. Desktop retains the existing stricter `lighthouse:no-pwa` individual-audit policy; mobile retains its existing category gates. Performance remains 85/80 warning thresholds. This difference is explicit, not an assertion that the two policies have equivalent strictness.

The three desktop audits `lcp-lazy-loaded`, `non-composited-animations`, and `prioritize-lcp-image` are non-scoring diagnostics in some Lighthouse outcomes. Their zero-findings budget replaces an invalid score comparison, without suppressing findings. Runtime/audit errors and missing category scores are rejected independently. No actual canonical, link, contrast, byte-weight or performance failure is waived.

Run 39923626510 audited five production URLs three times per form factor. Its artifact list is empty because hidden output was excluded; job logs remain evidence of the original failures. Reports from an older live build cannot establish whether a later source change fixed its failing DOM nodes. Re-run after verifying publication, inspect retained failing nodes, and keep genuine remaining failures visible.
