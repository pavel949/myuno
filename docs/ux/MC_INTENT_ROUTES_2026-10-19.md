# MC intent routing — bounded repair

Implemented locally; CI/browser/publication not yet verified.

- Expense quick action opens the existing quick-expense form, rather than a finance overview that ignores action=create.
- Meeting quick action opens the existing CRM meeting draft, rather than the property stay calendar.
- Task quick action opens the existing task draft after company/user context resolves.
- Draft intents are consumed with a replace navigation, retain other query filters, and perform no writes by opening.
- Company/CRM settings links open the requested supported accordion sections; changing sections preserves unrelated query context and browser Back restores state.
- Taxes opens the existing tax center. Company information opens its specific section.

No writer, role, permission, schema, money calculation or live record changed. Existing form validation and submission remain authoritative.

Local evidence: 10 component/route tests passed. ESLint: 0 errors, 14 pre-existing any warnings in the task hub. Browser and full CI remain required. These changes do not claim full Thai localization or the complete approved MC redesign.

Rollback: revert this bounded UI commit; no data rollback.

## Navigation organization candidate

The approved four-area hierarchy preserves all 23 original sidebar destinations. Persona filtering runs before grouping; independent comparison checked 24 role/property-count combinations. The All tools directory preserves all 29 existing id/path/permission tuples and offers text search, readable rows, and four expandable groups. Sidebar and directory labels are supplied in EN/RU/TH. This is not a claim that every downstream screen is fully translated.

Sidebar keyboard and collapsed-mode regressions found in independent review were corrected before acceptance: native button group triggers, all permitted icons retained when collapsed, and multiline labels overriding the shared truncate selector. Eight independent component tests are retained.

Browser fixture: mc-workspace-ui, actual shell/sidebar/directory components on synthetic permissions, EN/RU/TH at 375/390/430/1280, no external requests or database writes. Bundle compilation passed; browser execution and screenshots remain pending CI.

Local full TypeScript processes were terminated by the environment; no local typecheck success is claimed. CI must supply the gate.
