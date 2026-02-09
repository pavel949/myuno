

# P0 Fix: LifeSituation Gate Breaking All Pages

## Problem

The `LifeSituationGate` component fully replaces page content with a situation selector when no context is active. Since it wraps ~20 routes + the Home page, every page looks identical -- showing the same "What's happening in your life?" selector.

Two bugs:
1. **All pages identical**: Gate replaces content instead of guiding the user
2. **Wrong redirect**: Selecting a situation on `/beauty` navigates to `/life-flow/:code` instead of staying on `/beauty`

## Solution

Remove the hard-blocking `RequireLifeSituation` wrapper from all vertical routes. Instead, use a **non-blocking prompt** approach:

### Changes

**1. `LifeSituationGate.tsx` -- Fix redirect behavior**
- When `handleSelect` is called, set the life situation context but do NOT navigate away
- The user stays on the current page, which now renders because context is active

**2. `AnimatedRoutes.tsx` -- Remove `RequireLifeSituation` from all vertical routes**
- Remove the wrapper from all ~20 routes (`/beauty`, `/property`, `/restaurants`, `/transport`, `/fitness`, `/medical`, `/events`, `/education`, `/flowers`, `/services`, `/legal`, `/insurance`, `/banking`, `/discover`, etc.)
- Verticals render normally regardless of life situation state

**3. `Index.tsx` -- Keep gate only on Home page**
- Home page keeps `LifeSituationGate` but as a **non-blocking suggestion** below the hero
- Vertical content (QuickActions, Discovery) always renders -- gate becomes a prompt, not a wall

**4. Vertical index pages -- Add soft banner (optional, lightweight)**
- Each vertical can show the `ActiveSituationBanner` to indicate context
- No blocking behavior

### Architecture after fix

```text
Home (/)
  +-- HeroBlock (always visible)
  +-- LifeSituation prompt (suggestion, not blocker)
  +-- QuickActions + Discovery (always visible)

/beauty, /yachts, etc.
  +-- ActiveSituationBanner (if context active)
  +-- Normal page content (always renders)
```

### Technical details

**`AnimatedRoutes.tsx`**: Unwrap all `<RequireLifeSituation>` wrappers:
```tsx
// BEFORE:
<Route path="/beauty" element={<LazyPage><RequireLifeSituation><BeautySpaIndex /></RequireLifeSituation></LazyPage>} />

// AFTER:
<Route path="/beauty" element={<LazyPage><BeautySpaIndex /></LazyPage>} />
```

This applies to all routes: `/beauty`, `/property`, `/restaurants`, `/transport`, `/fitness`, `/medical`, `/events`, `/education`, `/flowers`, `/services`, `/legal`, `/insurance`, `/banking`, `/discover`

**`LifeSituationGate.tsx`**: Remove `navigate()` from `handleSelect`:
```tsx
// BEFORE:
const handleSelect = (situation) => {
  setLifeSituation(situation.code, title, situation.color);
  navigate(`/life-flow/${situation.code}`);  // <-- wrong redirect
};

// AFTER:
const handleSelect = (situation) => {
  setLifeSituation(situation.code, title, situation.color);
  // Stay on current page -- context is now set, children will render
};
```

**`Index.tsx`**: Make gate non-blocking -- always show verticals:
```tsx
// Show life situation prompt if no context, but don't block content
{!hasContext && <LifeSituationPrompt />}
<QuickActionsGrid />
<DiscoveryCarousel />
```

### Files to modify
- `src/components/layout/AnimatedRoutes.tsx` -- remove RequireLifeSituation from ~20 routes
- `src/components/life-os/LifeSituationGate.tsx` -- remove navigate redirect
- `src/pages/Index.tsx` -- make gate non-blocking

### What this preserves
- LifeSituation context still works as global state
- ActiveSituationBanner still shows when context is active
- `/life-flow/:code` route still works as a first-class route
- P0 intent (LifeOS as primary axis) remains -- it's just not breaking the app

