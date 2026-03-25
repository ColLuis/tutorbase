---
phase: 04-dashboard-and-revenue
plan: "01"
subsystem: data-layer
tags:
  - queries
  - dashboard
  - revenue
  - timezone
dependency_graph:
  requires:
    - src/lib/queries/tutors.ts
    - src/lib/supabase/server.ts
    - src/types/database.types.ts
  provides:
    - src/lib/queries/dashboard.ts
    - src/lib/queries/revenue.ts
  affects:
    - src/app/(app)/page.tsx (dashboard page)
    - src/app/(app)/revenue/page.tsx (revenue page)
tech_stack:
  added: []
  patterns:
    - "fromZonedTime for UTC DB boundaries, toZonedTime for display"
    - "Promise.all for parallel Supabase queries"
    - "JS Map grouping for monthly and per-student aggregation"
    - "null-guard on issued_date per DB types (string | null)"
key_files:
  created:
    - src/lib/queries/dashboard.ts
    - src/lib/queries/revenue.ts
  modified: []
decisions:
  - "Use fromZonedTime (not toZonedTime) to convert local day boundaries to UTC for DB queries"
  - "paid_date attribution for monthly amountPaid (not issued_date month) per plan critical note"
  - "Exclude draft invoices from amountInvoiced — only sent and paid invoices represent billed work"
  - "weekStartsOn: 1 for Monday-first weeks per AU tutor context"
  - "issued_date null guard added — DB type is string | null, not string"
metrics:
  duration_minutes: 10
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 4 Plan 1: Dashboard and Revenue Data Layer Summary

**One-liner:** Timezone-aware Supabase query functions for dashboard (today/fallback lessons + stats) and revenue (12-month breakdown + per-student aggregation).

---

## What Was Built

Two new query files that power the dashboard and revenue UI plans:

### src/lib/queries/dashboard.ts

Exports `getDashboardLessons` and `getDashboardStats`.

**getDashboardLessons(tutorId):**
- Queries tutor's timezone via `getTutorProfile`, defaults to `Australia/Sydney`
- Uses `fromZonedTime(startOfDay(nowInTz), tz)` / `fromZonedTime(endOfDay(nowInTz), tz)` for UTC day boundaries
- Returns `{ label: 'Today', lessons }` if today has lessons
- Falls back to 30-day lookahead when today is empty; finds first teaching day, filters to that full day, returns `{ label: 'Next up: Wednesday 26 Mar', lessons }`
- Returns `{ label: 'Today', lessons: [] }` if no upcoming lessons found

**getDashboardStats(tutorId):**
- Computes timezone-aware week (Monday-start), month, and year boundaries
- Runs 4 parallel Supabase queries via `Promise.all`
- Returns `weeklyLessonCount`, `unpaidCount`, `unpaidTotal`, `monthlyRevenue`, `yearlyRevenue`
- Unpaid = draft + sent invoices; monthly/yearly revenue = paid invoices filtered by `paid_date`

### src/lib/queries/revenue.ts

Exports `MonthlyRow` type, `StudentRow` type, `getMonthlyRevenue`, and `getStudentRevenue`.

**getMonthlyRevenue(tutorId, year):**
- Initializes a Map with 12 month entries (YYYY-01 through YYYY-12) pre-zeroed
- Groups completed lessons by `scheduled_at.slice(0, 7)` for `lessonsDelivered` and `hoursTaught`
- Groups invoices by `issued_date.slice(0, 7)` for `amountInvoiced` (sent/paid only, excludes drafts)
- Groups invoices by `paid_date.slice(0, 7)` for `amountPaid` (paid_date attribution, not issued_date)
- Computes `outstanding = amountInvoiced - amountPaid` per month
- Returns exactly 12 rows sorted Jan–Dec

**getStudentRevenue(tutorId, year):**
- Builds student Map from completed lessons (count) and invoices (invoiced/paid amounts)
- Excludes draft invoices from invoiced total
- Computes `outstanding = invoiced - paid` per student
- Returns array sorted by `invoiced` descending (most revenue first, per D-11)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] issued_date null guard**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** DB type for `issued_date` is `string | null`, not `string`. Plan assumed non-null but `tsc` caught `TS18047: 'inv.issued_date' is possibly 'null'`
- **Fix:** Added `if (!inv.issued_date) continue` before `.slice(0, 7)` in the invoice grouping loop
- **Files modified:** src/lib/queries/revenue.ts
- **Commit:** 15edbc8

---

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create dashboard query functions | 4c9d1d2 | src/lib/queries/dashboard.ts |
| 2 | Create revenue query functions | 15edbc8 | src/lib/queries/revenue.ts |

---

## Known Stubs

None — both query files are fully implemented with real Supabase queries. No placeholder data or hardcoded returns.

---

## Self-Check: PASSED

- [x] src/lib/queries/dashboard.ts exists
- [x] src/lib/queries/revenue.ts exists
- [x] Commit 4c9d1d2 exists
- [x] Commit 15edbc8 exists
- [x] `npx tsc --noEmit` passes with no errors
