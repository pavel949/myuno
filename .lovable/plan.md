
# Trip Planner: LifeOS Integration and Messaging Improvements

## Problem
1. No navigation link from LifeOS pages (`/life-flow/*`) to the Trip Planner (`/trip-planner`) -- users can't discover it
2. The Trip Planner checklist lacks a reassuring "we've got you covered" message
3. Flights and Insurance items need stronger, more actionable descriptions

## Changes

### 1. Add "Plan Your Trip" CTA block on LifeFlowPage
Add a prominent card at the bottom of the LifeFlow guided path (before the footer text) that links to `/trip-planner`. This will be a styled banner with a Palmtree icon and bilingual text like:
- RU: "Планируете поездку? Мы обо всём позаботимся"
- EN: "Planning a trip? We've got you covered"

With a button navigating to `/trip-planner`. This card will appear on all LifeFlow routes (especially `arrival_first_day`).

### 2. Add "We've got you covered" reassurance message to TripChecklist
Insert a small reassurance banner above the checklist items with text:
- RU: "Мы позаботимся обо всём. Просто отмечайте готовое."
- EN: "We've got you covered. Just check off what's done."

This follows the LifeOS pain-first philosophy: calm, decisive reassurance before the task list.

### 3. Improve Flights and Insurance checklist item copy
Update the descriptions in `TripChecklist.tsx`:
- **Flights**: More helpful description pointing to tips and recommendations, not just "book on your preferred platform"
  - EN: "Tips on the best routes and when to book"
  - RU: "Советы по лучшим маршрутам и когда бронировать"
- **Insurance**: Stronger positioning of myUNO's expertise
  - EN: "We'll help you pick the right coverage"
  - RU: "Поможем выбрать подходящую страховку"

## Technical Details

### Files to modify:
1. **`src/pages/LifeFlowPage.tsx`** -- Add a `TripPlannerCTA` card between `RouteNextSteps` and the footer paragraph. It will use `useNavigate` to link to `/trip-planner` and be styled with the situation's accent color.

2. **`src/components/trip-planner/TripChecklist.tsx`** -- 
   - Add a reassurance banner (Shield icon + "We've got you covered" text) between the progress bar and the checklist items
   - Update `descEn`/`descRu` for the `flights` and `insurance` items

### No new files or dependencies required.
