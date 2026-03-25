---
phase: 04-dashboard-and-revenue
plan: "02"
subsystem: ui
tags:
  - dashboard
  - ui
  - server-components
  - deep-link
dependency_graph:
  requires:
    - src/lib/queries/dashboard.ts
    - src/lib/queries/tutors.ts
    - src/lib/dal.ts
    - src/lib/utils/currency.ts
    - src/lib/utils/dates.ts
    - src/components/ui/card.tsx
    - src/components/ui/button.tsx
    - src/components/ui/badge.tsx
  provides:
    - src/app/(app)/page.tsx
    - src/components/dashboard/TodayLessons.tsx
    - src/components/dashboard/MetricCards.tsx
    - src/components/dashboard/QuickActions.tsx
  affects:
    - src/components/schedule/SchedulePage.tsx (deep-link support added)
tech_stack:
  added: []
  patterns:
    - "Server Component with inner async DashboardContent and Suspense skeleton"
    - "render prop pattern for Button polymorphism (no asChild — Base UI constraint)"
    - "buildLessonDeepLink with toZonedTime + startOfWeek for week param construction"
    - "useEffect deep-link handler reading searchParams.get('lesson') in client component"
key_files:
  created:
    - src/components/dashboard/TodayLessons.tsx
    - src/components/dashboard/MetricCards.tsx
    - src/components/dashboard/QuickActions.tsx
  modified:
    - src/app/(app)/page.tsx
    - src/components/schedule/SchedulePage.tsx
decisions:
  - "DashboardContent inner async component wrapped in Suspense for loading skeleton"
  - "buildLessonDeepLink uses toZonedTime for display-side week calculation"
  - "lessonParam useEffect guards with initialLessons.some() to avoid stale ID selection"
  - "QuickActions not sticky — placed as last content block to avoid bottom nav overlap"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
---

# Phase 4 Plan 2: Dashboard UI Summary

**One-liner:** Server Component dashboard at `/` with today's lessons list (deep-linkable), 2x2/4-across metric cards, and 3 quick action buttons; plus deep-link auto-open in SchedulePage.

---

## What Was Built

### src/components/dashboard/TodayLessons.tsx

Server-safe display component showing the tutor's lessons for today (or next teaching day).

- Each lesson row is a `<Link>` to `/schedule?week=[week-monday]&lesson=[lesson-id]` for deep-linking
- `buildLessonDeepLink` uses `toZonedTime` to compute the Monday of the lesson's week from the stored UTC timestamp
- Shows student name and formatted time: "Sarah — 3:30 PM" per D-05 copy spec
- Status badge with `variant="secondary"` for completed, `variant="outline"` for others
- Empty state: heading + body text when no lessons exist

### src/components/dashboard/MetricCards.tsx

Server-safe 2×2 (mobile) → 4-across (desktop) metric card grid.

- Four cards: This week (lessons count), Unpaid (total + invoice count), This month (revenue), This year (revenue)
- Icons from lucide-react in top-right corner of each card
- `text-xl font-bold` for metric values, `text-sm text-muted-foreground` for labels per UI-SPEC typography

### src/components/dashboard/QuickActions.tsx

Three quick action buttons at the bottom of the dashboard.

- Uses `render={<Link href="...">}` pattern (NOT asChild) per Base UI constraint
- Minimum `h-11` (44px) for mobile tap targets
- Copy: "Add Lesson", "Create Invoice", "Add Student" per UI-SPEC Copywriting Contract

### src/app/(app)/page.tsx

Replaced placeholder with a real Server Component dashboard.

- `DashboardContent` inner async component: calls `verifySession`, `getTutorProfile`, then `Promise.all([getDashboardLessons, getDashboardStats])`
- `DashboardSkeleton` fallback: 2 lesson rows + 4 metric card blocks using `bg-muted animate-pulse`
- Wrapped in `<Suspense>` with skeleton fallback
- Page wrapper: `p-4 md:p-6 max-w-2xl mx-auto` matching established pattern

### src/components/schedule/SchedulePage.tsx

Extended with deep-link support.

- Added `useEffect` reading `searchParams.get('lesson')`
- Guards with `initialLessons.some(l => l.id === lessonParam)` before calling `setSelectedLessonId`
- This auto-opens the `LessonDetailPanel` when navigated from dashboard via `?lesson=` param

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Dashboard page UI | 014f559 | src/app/(app)/page.tsx, src/components/dashboard/TodayLessons.tsx, MetricCards.tsx, QuickActions.tsx |
| 2 | Deep-link support in SchedulePage | 84a71eb | src/components/schedule/SchedulePage.tsx |

---

## Known Stubs

None — all components are wired to real data via Server Component props. No hardcoded placeholder data.

---

## Self-Check: PASSED

- [x] src/app/(app)/page.tsx exists and contains `getDashboardLessons, getDashboardStats`
- [x] src/components/dashboard/TodayLessons.tsx exists
- [x] src/components/dashboard/MetricCards.tsx exists
- [x] src/components/dashboard/QuickActions.tsx exists
- [x] src/components/schedule/SchedulePage.tsx contains `searchParams.get('lesson')`
- [x] Commit 014f559 exists
- [x] Commit 84a71eb exists
- [x] `npx tsc --noEmit` passes with no errors
