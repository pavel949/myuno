---
name: office-hours
description: >
  Product brainstorming and feasibility for myUNO. Use when the user floats a
  product idea, asks "is this worth building?", "should we add X?", wants to
  pressure-test a feature, or explore directions. Triggers: product idea,
  brainstorm, feature pitch, "worth building", prioritisation, roadmap.
---

# Office Hours — Product Sounding Board

A structured way to pressure-test a myUNO product idea before any code.

## Read first
- `/PROJECT.md` — what the platform is, monetisation, audience, and the **5-test
  for new features**. This is the gate.
- `docs/canonical/01-segmentation-framework.md` — personas (P01–P25), life
  phases, roles, situations.
- `docs/canonical/02-service-catalogue-v2.md` — what already exists.

## Process
1. **Restate the idea** in one sentence, plus the job it does for which persona
   and which Surface (Arrive·Live·Manage·Invest·Legal·Build).
2. **Run the PROJECT.md 5-test** explicitly, point by point. If it fails one,
   say so plainly.
3. **Check for overlap** — does an existing micro-app / catalogue service
   already cover this? (59 micro-apps; canonical inventory
   `src/lib/appRegistry.ts`.)
4. **Monetisation & moat** — how it earns (lead routing, subscription,
   commission) and whether it strengthens a moat (e.g. ClearView™).
5. **Effort vs payoff** — rough scope across verticals; what's the smallest
   testable version behind a `feature_flag:*`.
6. **Verdict** — Build now / Build later / Don't build, with the single biggest
   risk and the one thing to validate first.

## Output
A crisp recommendation (not a survey): the verdict, the reasoning against the
5-test, and a concrete next step. Be willing to say "don't build this."
Do not write code in this mode.
