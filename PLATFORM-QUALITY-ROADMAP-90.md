# myUNO — Roadmap to 90+ Platform Quality

**Goal:** Raise **average domain score from ~69 to 90+** (see `TECHNICAL-AUDIT-2026.md` for baseline).  
**Reality check:** 90+ on *every* dimension is rare for a pre-PMF product; this plan targets **90+ weighted average** and **no domain below 82** by end state.

---

## 1. Current → Target (by domain)

| Domain | Baseline | Target | Gap (main levers) |
|--------|----------|--------|-------------------|
| Architecture | 78 | **90** | Module ownership, boundaries, ADRs, dependency rules |
| Code quality | 56 | **88** | `strict` TS, reduce `any`, ESLint enforcement, logger |
| Security | 73 | **90** | npm audit, CORS policy, RLS review, secrets hygiene |
| Performance | 72 | **88** | Query consolidation, bundle budget, Core Web Vitals |
| Dependencies | 75 | **92** | Audit remediation, Renovate/Dependabot, dev/prod split |
| Testing | 58 | **85** | Critical-path coverage, CI gates, Playwright smoke |
| Build & deploy | 76 | **90** | CI/CD, env validation, preview deploys |
| Technical debt | 64 | **88** | console → logger, TODO triage, config centralization |
| Documentation | 70 | **88** | ADRs, runbooks, onboarding for MC/owner flows |

**Weighted target (code + security ×1.2 as in audit):** **≥ 90**  
**Minimum acceptable per domain:** **≥ 82** (no weak link dragging production risk)

---

## 2. Principles

1. **Measure before/after** — each initiative has a metric (coverage %, audit count, Lighthouse, bundle KB).
2. **Vertical slices** — prefer “one flow done well” (e.g. MC contact → deal) over scattered fixes.
3. **No big-bang strict mode** — enable TypeScript/ESLint incrementally (per folder or `// @ts-expect-error` with ticket).
4. **Security and payments first** — anything touching money, PII, or auth outranks cosmetic refactors.

---

## 3. Phased plan (realistic timeline: 4–6 months focused effort)

### Phase A — Foundation (Weeks 1–4)

**Outcome:** Tooling and safety nets; quick wins on dependencies and build.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| A1 Dependency hygiene | Dependencies | `npm audit`, `npm audit fix`, document remaining CVEs; add Dependabot/Renovate | High/critical CVEs = 0 or accepted + documented |
| A2 CI pipeline | Build, Testing | GitHub Actions: `lint`, `test:run`, `build` on PR | Main always green; PRs blocked on failure |
| A3 Env & secrets | Build, Security | Verify `.env` gitignored; document required vars; optional Zod schema for `import.meta.env` at startup | No secrets in repo; new dev onboarding < 30 min |
| A4 Playwright smoke | Testing | 3–5 e2e tests: home, auth shell, one MC route | `test:e2e` in CI (optional nightly if slow) |

**Expected lift:** Dependencies **→ ~88**, Build **→ ~82**, Testing **→ ~65**.

---

### Phase B — Code quality & debt (Weeks 5–10)

**Outcome:** TypeScript and ESLint move toward production-grade; noise reduced.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| B1 Strict TypeScript (incremental) | Code | Enable `strictNullChecks` first, then `noImplicitAny` for `src/hooks` + `src/lib` | New code in those paths = 0 implicit any |
| B2 ESLint hardening | Code, Debt | `no-console` with allowlist for `logger.ts` + tests; `@typescript-eslint/no-explicit-any`: warn → error for new files via override | -50% raw `console` in `src/` (measure via grep) |
| B3 Logger migration | Debt | Replace top-offending files (hooks, MC) with `@/lib/logger` | Critical paths use logger only |
| B4 Config centralization | Debt, Arch | External URLs, feature flags, API versions in `src/lib/config` | No new hardcoded domains in components |

**Expected lift:** Code **→ ~72**, Tech debt **→ ~75**.

---

### Phase C — Security & backend alignment (Weeks 8–14)

**Outcome:** Defensible posture for real users and transactions.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| C1 CORS policy review | Security | Document fallback behavior; for mutations/webhooks, reject unknown Origin where safe | Written policy + code comments |
| C2 RLS spot audit | Security | SQL review for `crm_*`, `properties`, `property_financials`, MC tables; fix gaps | Checklist signed off |
| C3 Edge function hygiene | Security | Ensure `getCorsHeaders`, auth guards, no PII in logs (sample review) | Audit log of reviewed functions |
| C4 npm supply chain | Dependencies | Lockfile policy, `npm ci` in CI | Reproducible builds |

**Expected lift:** Security **→ ~85**.

---

### Phase D — Performance & architecture (Weeks 12–18)

**Outcome:** Faster perceived load; clearer structure for scaling team.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| D1 Hot-path queries | Performance | Identify top 5 N+1 or sequential chains; consolidate with joins/RPC/views | Latency ↓ or requests ↓ per page (measure in Network) |
| D2 Bundle budget | Performance | Set `vite` chunk size warning thresholds; lazy-load heavy routes if needed | No chunk > 1MB without justification |
| D3 Core Web Vitals | Performance | Measure LCP/INP on `/`, `/property/:id`, `/mc` | Targets: LCP &lt; 2.5s p75 on 4G |
| D4 Module boundaries | Architecture | Document owners (MC, Owner, Vendor, Admin); optional ESLint `boundaries` or folder READMEs | New PRs reference module owner |

**Expected lift:** Performance **→ ~85**, Architecture **→ ~85**.

---

### Phase E — Testing depth (Weeks 14–22)

**Outcome:** Confidence in CRM/MC/financial flows.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| E1 Unit tests for hooks | Testing | `useCrmContacts`, financial hooks, critical adapters | ≥ 60% line coverage on targeted hooks |
| E2 Integration tests | Testing | Supabase-mocked or test DB for 2–3 flows | Contacts list, deal save happy path |
| E3 E2E expansion | Testing | MC pipeline + owner report view (smoke) | 10–15 stable e2e scenarios |
| E4 Coverage gate | Testing | `vitest run --coverage` with threshold on `src/hooks` (start 40%, raise quarterly) | CI fails if regression |

**Expected lift:** Testing **→ ~85**.

---

### Phase F — Documentation & polish (Weeks 18–26)

**Outcome:** Onboarding and operations match product maturity.

| Initiative | Domain | Actions | Success criteria |
|------------|--------|---------|------------------|
| F1 ADRs | Documentation, Arch | 5–10 ADRs: auth model, MC permissions, financial data flow | ADR index in repo |
| F2 Runbooks | Documentation, Build | Deploy, rollback, Supabase migration, incident checklist | On-call can follow without asking founder |
| F3 Update TECHNICAL-AUDIT | All | Re-score quarterly | Documented 90+ evidence |

**Expected lift:** Documentation **→ ~88**, Architecture **→ ~90**.

---

## 4. Final push to 90+ average (Month 6+)

| Focus | Action |
|-------|--------|
| Code | Enable full `strict` for entire `src/` or exclude legacy with explicit debt list |
| Testing | Raise coverage thresholds; flake-free e2e (retries, stable selectors) |
| Security | External pen-test or automated SAST on PRs (optional budget) |
| Performance | CDN/cache headers for static assets; image pipeline review |

---

## 5. Effort summary (rough)

| Phase | Calendar | Engineering (FTE-weeks est.) |
|-------|----------|------------------------------|
| A | 4 weeks | 2–3 |
| B | 6 weeks | 4–6 |
| C | 6 weeks | 3–4 (incl. SQL/DB time) |
| D | 6 weeks | 4–5 |
| E | 8 weeks | 5–8 |
| F | 8 weeks | 2–3 |
| **Total** | **~6 months** | **~20–29 FTE-weeks** (parallelizable with 2 devs) |

*Estimates assume 1 senior full-stack + occasional DB focus; adjust for team size.*

---

## 6. What we are NOT promising

- **100** on every domain while pre-PMF — unrealistic without dedicated QA and SRE.
- **Full strict TypeScript in one PR** — high breakage risk; incremental is deliberate.
- **90+ testing** without stable product flows — stabilize happy paths first, then coverage.

---

## 7. Scorecard (how to verify 90+)

Re-run the domain rubric quarterly:

| Domain | 90+ means (examples) |
|--------|------------------------|
| Architecture | ADRs, boundaries, no circular deps in critical graphs |
| Code | `strict` or documented exceptions; ESLint green; minimal `any` in new code |
| Security | No open high CVEs; RLS reviewed; CORS documented |
| Performance | Budgets met; Vitals targets on key routes |
| Dependencies | Automated updates; audit clean or waived |
| Testing | CI gates; critical paths covered; e2e stable |
| Build | Full CI; secrets safe; preview envs |
| Debt | Logger everywhere critical; TODO budget decreasing |
| Docs | ADRs + runbooks; new dev &lt; 1 day to first PR |

---

## 8. Next step (this week)

1. Approve phase order (A → B is non-negotiable for measurement).
2. Create GitHub Project / Linear columns mapped to phases A–F.
3. Run `npm audit` and file issues for each CVE cluster.
4. ~~Add CI workflow: `lint` + `test:run` + `build`.~~ ✅ Done (`.github/workflows/ci.yml`)

---

## 9. Implemented (2026-03-23)

| Item | Details |
|------|---------|
| **CI** | `.github/workflows/ci.yml` — `lint`, `test:run`, `build` on push/PR |
| **E2E smoke** | `e2e/tests/smoke/platform-smoke.spec.ts`, `npm run test:e2e:smoke`, weekly/manual workflow |
| **Dependabot** | `.github/dependabot.yml` — npm weekly |
| **`.gitignore`** | `.env`, `.env.*` with `!.env.example` |
| **Env validation** | `src/lib/env.ts` + `validatePublicEnv()` in `main.tsx` |
| **Docs** | `docs/ENV.md`, `SECURITY-NPM-AUDIT.md`, `CORS-POLICY.md`, `MODULE-OWNERSHIP.md`, `adr/0001-*.md` |
| **ESLint** | `no-console` left off until logger migration (comment in `eslint.config.js`) |
| **Phase B** | ✅ `docs/PHASE-B.md` — logger в hooks/lib, `publicUrls`, ESLint для hooks/lib, `typecheck` / `typecheck:strict-null` |

---

*This plan complements `CLAUDE.md` priorities: stability and first transactions beat cosmetic perfection—use Phase A–B to protect shipping velocity while climbing toward 90+.*
