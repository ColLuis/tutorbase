---
phase: 02-students-and-scheduling
plan: "04"
subsystem: ui
tags: [schedule, calendar, react, nextjs, shadcn-ui, date-fns, sonner, vaul, base-ui]

requires:
  - phase: 02-students-and-scheduling
    provides: "Data layer — getLessonsForWeek, getTutorProfile, getActiveStudentsForPicker, updateLessonStatus, createLesson, createRecurringLessons, updateLesson — all built in plan 02"

provides:
  - "Schedule page at /schedule — Server Component shell with URL-param week navigation"
  - "WeekCalendar — CSS Grid weekly calendar with auto-fit time range, weekStartsOn:1"
  - "LessonList — chronological list view grouped by day with empty state"
  - "LessonBlock — status color-coded lesson tile (scheduled/completed/cancelled/no_show)"
  - "LessonDetailPanel — Sheet side panel with status quick actions + AlertDialog confirmations"
  - "LessonDrawer — Drawer (mobile) + Sheet (desktop) lesson form with student combobox and student default prefill"
  - "WeekNav — week navigation with prev/next arrows (44px tap targets)"
  - "SchedulePage — client shell owning view state, week, drawer, lesson selection"
  - "Sonner Toaster in app layout for bottom-center toast notifications"

affects:
  - 03-invoicing-and-payments
  - 04-dashboard-and-revenue

tech-stack:
  added:
    - "shadcn/ui: command, popover, drawer, sheet, dialog, alert-dialog, sonner, calendar, switch (new installs)"
    - "vaul (via shadcn drawer) — bottom drawer with gesture dismiss"
    - "@base-ui/react — underlies sheet, alert-dialog, popover (Radix-free, render prop pattern)"
  patterns:
    - "AlertDialog trigger without asChild — @base-ui AlertDialogTrigger accepts className directly (no asChild prop)"
    - "Popover trigger without asChild — @base-ui PopoverTrigger accepts className directly"
    - "URL search params for week/view state — router.push(?week=YYYY-MM-DD&view=calendar) keeps URL bookmarkable"
    - "Suspense wrapping SchedulePage — required for useSearchParams in Next.js 15 server component trees"
    - "Form values as strings — zodResolver with zod coerce works best when all form field values are strings, avoiding resolver type conflicts"
    - "type ActionResult cast — server actions return boolean success but typed as true; cast to { success: true } | { error: string } for type safety"

key-files:
  created:
    - src/app/(app)/schedule/page.tsx
    - src/components/schedule/SchedulePage.tsx
    - src/components/schedule/WeekNav.tsx
    - src/components/schedule/WeekCalendar.tsx
    - src/components/schedule/LessonList.tsx
    - src/components/schedule/LessonBlock.tsx
    - src/components/schedule/LessonDetailPanel.tsx
    - src/components/schedule/LessonDrawer.tsx
    - src/components/ui/calendar.tsx
    - src/components/ui/command.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/drawer.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/sonner.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/popover.tsx
  modified:
    - src/app/(app)/layout.tsx
    - src/app/(app)/students/page.tsx

key-decisions:
  - "AlertDialog/Popover trigger pattern — @base-ui components use className directly instead of asChild; this simplifies composition but requires Tailwind utility classes on the trigger element"
  - "Form rate/duration stored as strings in react-hook-form — avoids zodResolver type inference conflicts with z.coerce; parsed to number in FormData before action call"
  - "Schedule page wrapped in Suspense — useSearchParams in SchedulePage requires Suspense boundary when used inside a Server Component tree in Next.js 15"

patterns-established:
  - "Pattern: @base-ui trigger elements accept className/disabled directly — no asChild prop needed"
  - "Pattern: URL params for schedule state — ?week=YYYY-MM-DD&view=calendar|list makes schedule bookmarkable"
  - "Pattern: Suspense wrapping client shell when useSearchParams used — prevents static rendering errors"

requirements-completed: [SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07]

duration: 9min
completed: 2026-03-22
---

# Phase 2 Plan 04: Schedule Page Summary

**Weekly calendar grid and list view for /schedule with lesson creation drawer (Drawer+Sheet), status quick actions with AlertDialog confirmations, and Sonner toast notifications**

## Performance

- **Duration:** ~9 minutes
- **Started:** 2026-03-22T10:24:46Z
- **Completed:** 2026-03-22T10:33:40Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- CSS Grid weekly calendar with auto-fit time range (1h padding before/after lessons), Monday-first (weekStartsOn:1)
- Lesson creation/editing form in responsive Drawer (mobile bottom) + Sheet (desktop side) with student combobox and auto-prefill of rate/duration from student defaults (SCHED-07)
- LessonDetailPanel with Mark Complete (no confirmation), Cancel and No-show (AlertDialog confirmation per D-10), and Sonner toast on complete (D-11)
- Schedule route page with URL-based week navigation and Suspense boundary for useSearchParams
- All 8 routes pass build: /, /login, /students, /students/new, /students/[id], /students/[id]/edit, /schedule, /profile

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components, build schedule components, update app layout** - `9e2f722` (feat)
2. **Task 2: Create schedule route page and verify full build** - `a6f6805` (feat)

## Files Created/Modified
- `src/app/(app)/schedule/page.tsx` - Server Component: verifySession, parallel fetch, Suspense wrapper
- `src/components/schedule/SchedulePage.tsx` - Client shell: view toggle, week nav via router.push, drawer state
- `src/components/schedule/WeekNav.tsx` - Prev/next week buttons with date label
- `src/components/schedule/WeekCalendar.tsx` - CSS Grid calendar, auto-fit time range, weekStartsOn:1
- `src/components/schedule/LessonList.tsx` - Grouped-by-day list with empty state
- `src/components/schedule/LessonBlock.tsx` - Status color-coded tile (44px min-height)
- `src/components/schedule/LessonDetailPanel.tsx` - Sheet panel with toast + AlertDialog confirmations
- `src/components/schedule/LessonDrawer.tsx` - Drawer+Sheet lesson form, student combobox, recurrence toggle
- `src/app/(app)/layout.tsx` - Added Toaster (bottom-center)
- `src/components/ui/` - Added calendar, command, dialog, drawer, sheet, sonner, switch, popover, input-group

## Decisions Made
- AlertDialog/Popover trigger pattern: @base-ui components accept className/disabled directly (no asChild); trigger elements use Tailwind utilities for button-like styling
- Form fields stored as strings in react-hook-form to avoid zodResolver type inference conflicts with z.coerce; numbers parsed in FormData before server action call
- Suspense wrapping client SchedulePage required by Next.js 15 when useSearchParams is used in a server component subtree

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @base-ui incompatibility with asChild prop in AlertDialog and Popover triggers**
- **Found during:** Task 1 (LessonDetailPanel, LessonDrawer)
- **Issue:** Plan used `asChild` pattern (Radix UI convention), but installed shadcn/ui uses @base-ui/react which does not support asChild — triggers accept className directly
- **Fix:** Rewrote AlertDialogTrigger and PopoverTrigger to accept className/disabled props directly without asChild; used Tailwind button-like classes on trigger elements
- **Files modified:** src/components/schedule/LessonDetailPanel.tsx, src/components/schedule/LessonDrawer.tsx
- **Verification:** TypeScript clean (tsc --noEmit exits 0)
- **Committed in:** 9e2f722 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed pre-existing students page using asChild on Button**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** src/app/(app)/students/page.tsx used `<Button asChild>` which is not supported by @base-ui Button — blocked TypeScript compilation
- **Fix:** Updated to use `render` prop pattern (which was already applied by a linter before commit)
- **Files modified:** src/app/(app)/students/page.tsx
- **Verification:** TypeScript clean
- **Committed in:** 9e2f722 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed form type inference conflict in react-hook-form with zodResolver**
- **Found during:** Task 1 (LessonDrawer TypeScript errors)
- **Issue:** `z.coerce.number()` fields caused zodResolver TypeScript type mismatch where input type was `unknown` instead of `string`
- **Fix:** Changed rate and durationMinutes form fields to `z.string()` with manual parsing to numbers in FormData
- **Files modified:** src/components/schedule/LessonDrawer.tsx
- **Verification:** TypeScript clean
- **Committed in:** 9e2f722 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes required for TypeScript correctness and @base-ui compatibility. No scope creep.

## Issues Encountered
- @base-ui/react (used by this project's shadcn installation) differs from Radix UI: no `asChild` prop on Trigger components. All trigger customization done via className/render props directly. Pattern documented in patterns-established for future plans.
- react-hook-form zodResolver type inference issue with z.coerce fields — using string values in form state and parsing in FormData avoids this.

## Known Stubs

None — all components wire to real data via server actions and server component props.

## Next Phase Readiness
- /schedule fully functional: calendar, list view, lesson creation, status updates, toast notifications
- Lesson data flows through getLessonsForWeek → SchedulePage → WeekCalendar/LessonList → LessonBlock
- Status mutations flow through LessonDetailPanel → updateLessonStatus → revalidatePath('/schedule')
- Recurring lessons create N rows with shared recurring_series_id (SCHED-02 complete)
- Ready for Phase 3: Invoicing — completed lessons are available for invoice generation

---
*Phase: 02-students-and-scheduling*
*Completed: 2026-03-22*
