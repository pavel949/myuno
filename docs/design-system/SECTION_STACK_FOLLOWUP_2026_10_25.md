# Section geometry followup — work in progress

Separate from release PR185 and frozen foundation PR186. No backend, permissions, business data, publication or contract changes.

Confirmed gaps: legacy PageShell space-y-6 floored physical compaction at24px; HomeGallery header/content separation used local12px/4px values rather than the canonical source. The optional PageShell stack now owns sibling gaps, adopted only by Admin Today and PMS Today. HomeGallery consumes the shared content-gap contract, a named public mobile density, and canonical action glyph/control-gap values. Existing default public gap remains12px desktop/4px mobile. Other PageShell callers remain unchanged until audited.

Local evidence:150 actual-page fixture cases (Landing, PMS Today, Admin Today),60 shared-component/token cases,42 targeted page/draft tests and10 record-identity tests passed. Physical PMS/Admin gap changes24→6→42px under canonical source scaling. Changing the content-gap source down/up changes mobile public4→2/8px and PageSection12→6/24px. Source variants are compiled from tokens.css, not asserted by string presence. Themes, RU/EN/TH, geometry, native action/history/focus checks and semantic-status contrast are covered by the bounded harnesses. Fonts/data/actors remain synthetic or fallback; not live-role or whole-platform acceptance.

Full final type/build/CI and integration with other followups remain pending. The source coverage registries are refreshed, but their per-surface NOTTESTED records are not promoted by scenario counts. Further route families and raw/legacy exceptions still require audit.
