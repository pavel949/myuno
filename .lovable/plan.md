
## Airbnb-style Calendar with Service Tasks

### Current Problems

1. **3 tabs fragment the experience**: Calendar, Tasks (BookingCalendar), and Sync are separate -- user must switch tabs to see the full picture
2. **Two duplicate calendar components**: `UnifiedPropertyCalendar` (operations view) and `BookingCalendar` (booking management) show overlapping data in separate tabs
3. **Small standard Calendar widget**: Uses the tiny shadcn `<Calendar>` (280px) which doesn't show pricing, booking bars, or task indicators inline -- only colored dots
4. **No timeline view**: Airbnb shows bookings as horizontal bars spanning multiple days; current UI shows only dot indicators per day
5. **Task creation is buried**: Must click day -> Sheet -> "Task" button -> Dialog -- 3 clicks minimum
6. **No inline task status**: Tasks appear only in the bottom sheet, not visible on the calendar itself

### Proposed Airbnb-Style Redesign

**Single-page calendar** replacing 3 tabs with one unified view:

```text
┌──────────────────────────────────────┐
│  [Property Thumbnails - horizontal]  │
├──────────────────────────────────────┤
│  < February 2026 >    [+ Booking]    │
│                       [+ Task]       │
├──────────────────────────────────────┤
│  Mon Tue Wed Thu Fri Sat Sun         │
│  ┌───┬───┬───┬───┬───┬───┬───┐      │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │      │
│  │   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │   │      │
│  │   │ "John D."     │   │   │      │
│  │   │  3k  │  3k│  3k│   │   │      │
│  ├───┼───┼───┼───┼───┼───┼───┤      │
│  │ 8 │ 9 │10 │11 │12 │13 │14 │      │
│  │   │🧹 │   │▓▓▓▓▓▓▓▓▓▓▓│   │      │
│  │   │   │   │ "Maria S."│   │      │
│  │3.5k│3k │3k │  4k│  4k│  4k│3.5k│  │
│  └───┴───┴───┴───┴───┴───┴───┘      │
├──────────────────────────────────────┤
│  Legend: ● Booked ● Blocked          │
│          🧹 Cleaning 🔧 Maintenance  │
├──────────────────────────────────────┤
│  Today's Tasks (2)                   │
│  ┌─ 🧹 Cleaning - Villa Sunset ──✓─┐│
│  ┌─ 🔧 AC Filter - Pool Villa ──✓──┐│
├──────────────────────────────────────┤
│  iCal Sync  ▸  (collapsed)          │
└──────────────────────────────────────┘
```

### Key Changes

**1. Replace tiny Calendar with custom monthly grid (like PropertyCalendar)**
- Each cell is tall enough (h-20) to show: date, price, booking bar, task icon
- Booking bars span across days as colored strips with guest name
- Task icons (cleaning broom, wrench) shown inline on scheduled dates
- Prices displayed per day (base or override)

**2. Merge 3 tabs into single scrollable page**
- Calendar grid at top (full width, swipeable months)
- "Today's Tasks" section below calendar with quick-complete checkmarks
- iCal Sync as collapsible accordion at bottom
- Remove `BookingCalendar` tab entirely (its booking list moves below calendar)

**3. Day tap opens improved bottom sheet**
- Keep existing `CalendarDayEventsSheet` but add quick task creation buttons:
  - One-tap "Schedule Cleaning" / "Schedule Maintenance" (pre-filled type)
  - Existing "Add Task" for custom tasks
- Show price override inline

**4. Task indicators directly on calendar**
- Small icons in calendar cells: broom for cleaning, wrench for maintenance
- Completed tasks shown with checkmark overlay
- Pending tasks are solid color, completed are faded

**5. Upcoming bookings list (optional, below calendar)**
- Compact list of next 3-5 bookings with guest name, dates, source badge
- Tap opens booking details

### Technical Details

| File | Change |
|---|---|
| `src/pages/owner/OwnerCalendar.tsx` | Remove Tabs, render single unified layout: PropertyThumbnailSelector -> AirbnbCalendarGrid -> TodayTasksSection -> CollapsibleSyncSection |
| `src/components/owner/AirbnbCalendarGrid.tsx` | **New file.** Custom monthly grid with booking bars, prices, task icons. Based on PropertyCalendar grid logic but with booking spans and task indicators |
| `src/components/owner/CalendarTodayTasks.tsx` | **New file.** Extracted "Today's Tasks" section with quick-complete buttons, shown below calendar |
| `src/components/owner/UnifiedPropertyCalendar.tsx` | Remove (replaced by AirbnbCalendarGrid) |
| `src/components/owner/CalendarDayEventsSheet.tsx` | Add quick-action buttons for common tasks (one-tap cleaning/maintenance scheduling) |
| `src/components/owner/CalendarSyncManager.tsx` | Wrap in Collapsible/Accordion for compact display |

### Data Flow (unchanged)
- Bookings: `usePropertyBookings` hook
- Tasks: `useOperationalTasks` hook  
- Availability/Pricing: `usePropertyAvailabilityManagement` hook
- External calendars: `useExternalCalendars` hook

All existing hooks and database tables remain unchanged -- this is purely a UI/UX refactor.
