---
phase: 02-students-and-scheduling
plan: 02
subsystem: data-layer
tags: [supabase, server-actions, queries, zod, typescript, students, lessons, tutors]

# Dependency graph
requires:
  - phase: 02-01
    provides: time utilities (combineDateTime, parseTimeInput) and schema migration
  - phase: 01-foundation
    provides: verifySession DAL, createClient, auth patterns
provides:
  - src/lib/queries/students.ts (getStudents, getStudent, getActiveStudentsForPicker)
  - src/lib/queries/lessons.ts (getLessonsForWeek, getLessonsForList)
  - src/lib/queries/tutors.ts (getTutorProfile)
  - src/lib/actions/students.ts (createStudent, updateStudent, deactivateStudent)
  - src/lib/actions/lessons.ts (createLesson, createRecurringLessons, updateLessonStatus, updateLesson)
  - src/lib/actions/tutors.ts (updateTutorProfile)
  - src/types/database.types.ts (full hand-maintained schema types for all tables)
affects: [02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "verifySession() called first in every server action before any DB access"
    - "Single bulk .insert(rows) for recurring lessons — implicit transaction, no loop"
    - "zod v4: .error.issues[0].message (not .errors) on ZodError"
    - "Supabase DB types: each table needs Row/Insert/Update/Relationships; __InternalSupabase.PostgrestVersion required"
    - "updateLesson never touches recurring_series_id — SCHED-06 this-lesson-only pattern"

key-files:
  created:
    - src/lib/queries/students.ts
    - src/lib/queries/lessons.ts
    - src/lib/queries/tutors.ts
    - src/lib/actions/students.ts
    - src/lib/actions/lessons.ts
    - src/lib/actions/tutors.ts
  modified:
    - src/types/database.types.ts

key-decisions:
  - "database.types.ts updated from placeholder (Tables: Record<string, never>) to full table definitions — required for TypeScript-correct Supabase mutations"
  - "zod v4 uses .issues not .errors on ZodError — updated all action files"
  - "Relationships array required on each table type to satisfy @supabase/supabase-js v2.99 GenericTable constraint"
  - "__InternalSupabase.PostgrestVersion = '12' added to Database interface to satisfy SupabaseClient generic"

requirements-completed: [AUTH-04, STUD-01, STUD-02, STUD-03, STUD-04, STUD-05, SCHED-01, SCHED-02, SCHED-05, SCHED-06, SCHED-07]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 2 Plan 02: Data Layer — Queries and Server Actions Summary

**Complete server-side data layer: 3 query files (students, lessons, tutors) and 3 action files (students, lessons, tutors), all TypeScript-typed against hand-maintained Supabase schema definitions, with verifySession guard on every mutation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T10:13:57Z
- **Completed:** 2026-03-22T10:20:23Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created `src/lib/queries/` directory with three query files providing typed read access to students, lessons (with student name join), and tutor profile
- Created `src/lib/actions/students.ts` with createStudent, updateStudent, deactivateStudent — all guarded by verifySession(), zod-validated, with revalidatePath('/students')
- Created `src/lib/actions/lessons.ts` with createLesson, createRecurringLessons (single bulk insert with shared recurring_series_id), updateLessonStatus, updateLesson (never touches recurring_series_id per SCHED-06)
- Created `src/lib/actions/tutors.ts` with updateTutorProfile for AUTH-04
- Updated `src/types/database.types.ts` from stub placeholder to full hand-maintained schema with all 6 tables, Relationships arrays, and __InternalSupabase.PostgrestVersion

## Task Commits

Each task was committed atomically:

1. **Task 1: Create query functions for students, lessons, and tutors** - `db2bb65` (feat)
2. **Task 2: Create server actions for students and lessons** - `4d0caa8` (feat)

**Plan metadata:** `(docs commit — see below)`

## Files Created/Modified

- `src/lib/queries/students.ts` - getStudents (with includeInactive flag), getStudent, getActiveStudentsForPicker
- `src/lib/queries/lessons.ts` - getLessonsForWeek (joins students.name, weekStartsOn:1), getLessonsForList
- `src/lib/queries/tutors.ts` - getTutorProfile
- `src/lib/actions/students.ts` - createStudent, updateStudent, deactivateStudent with full validation pipeline
- `src/lib/actions/lessons.ts` - createLesson, createRecurringLessons, updateLessonStatus, updateLesson
- `src/lib/actions/tutors.ts` - updateTutorProfile
- `src/types/database.types.ts` - Full schema types for tutors, students, lessons, invoices, invoice_items, receipts

## Decisions Made

- Updated database.types.ts to full schema definitions: the placeholder `Tables: Record<string, never>` caused all Supabase insert/update calls to type as `never`, blocking TypeScript compilation
- zod v4 uses `.issues` not `.errors` on `ZodError` — all action files use `parsed.error.issues[0].message`
- Each table type includes `Relationships: [...]` array as required by the `GenericTable` constraint in @supabase/postgrest-js
- Added `__InternalSupabase: { PostgrestVersion: '12' }` to satisfy the `SupabaseClient<Database>` generic in @supabase/supabase-js v2.99

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed zod v4 API: .errors → .issues on ZodError**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Plan used `parsed.error.errors[0].message` but zod v4 renamed the property to `.issues`
- **Fix:** Replaced all `.error.errors[0].message` with `.error.issues[0].message` in all three action files
- **Files modified:** src/lib/actions/students.ts, src/lib/actions/lessons.ts, src/lib/actions/tutors.ts
- **Commit:** 4d0caa8

**2. [Rule 2 - Missing Critical Functionality] Expanded database.types.ts from stub to full schema**
- **Found during:** Task 2 TypeScript verification
- **Issue:** The placeholder `Tables: Record<string, never>` caused all Supabase `.insert()` and `.update()` calls to resolve their value parameter type as `never`, producing 14 TypeScript errors
- **Fix:** Rewrote database.types.ts with complete Row/Insert/Update/Relationships definitions for all 6 tables, derived directly from migration SQL files. Added `__InternalSupabase.PostgrestVersion: '12'` required by the client generic
- **Files modified:** src/types/database.types.ts
- **Commit:** 4d0caa8

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None — no external service configuration required. The data layer is ready to import. Supabase project must be connected and migrations applied before the actions will execute against a real database.

## Next Phase Readiness

- Wave 3 plans (02-03, 02-04) can import all query and action functions with full TypeScript type safety
- `getActiveStudentsForPicker` provides exactly the shape the lesson form combobox needs
- `getLessonsForWeek` joins student names — no secondary query needed in schedule components
- `getTutorProfile` provides timezone for date display utilities
- TypeScript build is clean (npx tsc --noEmit passes with zero errors)

## Known Stubs

None — all exports are fully implemented with real Supabase queries and mutations. No hardcoded empty values, no placeholder text, no mock data in the data layer.

---
*Phase: 02-students-and-scheduling*
*Completed: 2026-03-22*
