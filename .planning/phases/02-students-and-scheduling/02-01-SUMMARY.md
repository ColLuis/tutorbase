---
phase: 02-students-and-scheduling
plan: 01
subsystem: database
tags: [supabase, postgresql, migrations, date-fns-tz, typescript, seed]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: initial schema with students table and date-fns-tz utilities pattern
provides:
  - students table with subject TEXT and default_duration_minutes INTEGER columns
  - migration 002_students_subject_duration.sql ready to apply to Supabase
  - seed script updated with subject and default_duration_minutes for all 3 students
  - parseTimeInput() utility handling free-text time formats
  - combineDateTime() converting local date+time to UTC via tutor timezone
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fromZonedTime from date-fns-tz for converting local datetime strings to UTC before DB insert"
    - "ADD COLUMN IF NOT EXISTS pattern for safe incremental migrations"

key-files:
  created:
    - supabase/migrations/002_students_subject_duration.sql
    - src/lib/utils/time.ts
  modified:
    - scripts/seed.ts

key-decisions:
  - "Used ADD COLUMN IF NOT EXISTS for idempotent migration — safe to re-run without errors"
  - "parseTimeInput regex /^(\\d{1,2}):?(\\d{2})?\\s*(am|pm)?$/i handles all documented free-text time formats"
  - "combineDateTime returns null (not throw) when time string is unparseable — caller handles gracefully"

patterns-established:
  - "Pattern 1: Time utility returns null for invalid input — caller decides how to handle (no exceptions thrown)"
  - "Pattern 2: combineDateTime uses fromZonedTime(new Date(localDatetime), timezone) — same import pattern as dates.ts"

requirements-completed: [STUD-01, SCHED-07]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 2 Plan 01: Schema Foundation + Time Utilities Summary

**ALTER TABLE migration adding subject/default_duration_minutes to students, plus parseTimeInput() + combineDateTime() utilities using fromZonedTime from date-fns-tz**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T10:09:21Z
- **Completed:** 2026-03-22T10:11:14Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created migration 002_students_subject_duration.sql with idempotent ADD COLUMN IF NOT EXISTS statements for subject TEXT and default_duration_minutes INTEGER on the students table
- Updated seed.ts with subject and default_duration_minutes on all 3 student rows (Alice: Mathematics/60, Bob: Physics/90, Charlie: English/60)
- Created src/lib/utils/time.ts with parseTimeInput() handling "3:45", "14:00", "2:15 pm", "2:15pm" formats and combineDateTime() converting local datetime to UTC using tutor timezone

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schema migration and update seed script** - `c5f99ed` (feat)
2. **Task 2: Create time parsing utility** - `600abff` (feat)

**Plan metadata:** `(docs commit — see below)`

## Files Created/Modified
- `supabase/migrations/002_students_subject_duration.sql` - ALTER TABLE migration adding subject + default_duration_minutes columns
- `scripts/seed.ts` - Updated student insert with subject and default_duration_minutes for Alice, Bob, Charlie
- `src/lib/utils/time.ts` - parseTimeInput() + combineDateTime() named exports using date-fns-tz

## Decisions Made
- Used ADD COLUMN IF NOT EXISTS for idempotent migration so it can be re-applied safely
- parseTimeInput returns null for invalid input rather than throwing — caller decides how to handle
- combineDateTime accepts raw free-text timeStr and internally calls parseTimeInput — cleaner API for form usage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration SQL is ready to apply via the Supabase Dashboard SQL Editor or Supabase CLI.

## Next Phase Readiness

- Schema foundation for Phase 2 is complete — all other Phase 2 plans can now use subject and default_duration_minutes
- Time utilities are ready for lesson form components (02-03 and beyond)
- Migration must be applied to the Supabase project before student forms can write subject/duration data
- TypeScript build is clean (npx tsc --noEmit passes with zero errors)

## Known Stubs

None - all code is wired and functional. The migration file is ready to apply; no placeholder data in utility functions.

---
*Phase: 02-students-and-scheduling*
*Completed: 2026-03-22*
