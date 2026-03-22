---
phase: quick
plan: 260322-unn
subsystem: schedule
tags: [lessons, location, form, supabase]
dependency_graph:
  requires: []
  provides: [location-field-on-lessons]
  affects: [schedule]
tech_stack:
  added: []
  patterns: [optional-nullable-text-column, form-field-pass-through]
key_files:
  created:
    - supabase/migrations/003_lessons_location.sql
  modified:
    - src/types/database.types.ts
    - src/lib/queries/lessons.ts
    - src/lib/actions/lessons.ts
    - src/components/schedule/LessonDrawer.tsx
    - src/components/schedule/LessonDetailPanel.tsx
    - src/components/schedule/SchedulePage.tsx
decisions:
  - "Location stored as nullable TEXT with no default — NULL is semantically correct for lessons without a location"
  - "Location displayed in detail panel only when non-null — no empty row clutter"
  - "Location input placed before Notes in the form — mirrors logical reading order (where, then any extra notes)"
metrics:
  duration_seconds: 241
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 260322-unn: Add Free-Text Location Field to Lessons

**One-liner:** Optional `location TEXT` column on lessons, wired through Zod schemas, server actions, and the LessonDrawer form, displayed conditionally in the LessonDetailPanel.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add location column to DB schema and TypeScript types | 91d8ffd | supabase/migrations/003_lessons_location.sql, src/types/database.types.ts, src/lib/queries/lessons.ts |
| 2 | Wire location through form, server actions, and detail view | 6cf67d9 | src/lib/actions/lessons.ts, src/components/schedule/LessonDrawer.tsx, src/components/schedule/LessonDetailPanel.tsx, src/components/schedule/SchedulePage.tsx |

---

## What Was Built

An optional free-text Location field for lessons, end-to-end:

1. **DB migration** (`003_lessons_location.sql`): `ALTER TABLE lessons ADD COLUMN location TEXT` — no NOT NULL constraint, NULL is the correct default for existing records.

2. **TypeScript types** (`database.types.ts`): `location: string | null` added to lessons `Row`, `Insert`, and `Update` — consistent with how `notes` is typed.

3. **Query** (`lessons.ts`): `location` added to the `select()` column list in `getLessonsForWeek` so the field is fetched with each lesson.

4. **Server actions** (`actions/lessons.ts`): `location: z.string().optional()` added to `LessonSchema`. All three mutations (`createLesson`, `createRecurringLessons`, `updateLesson`) pass `parsed.data.location ?? null` to Supabase.

5. **LessonDrawer** (`LessonDrawer.tsx`): Location text input added before the Notes field, using the same `Input` + `Label` pattern as the Time field. Default value comes from `editLesson?.location ?? ''`. Location appended to `FormData` in `onSubmit`.

6. **SchedulePage** (`SchedulePage.tsx`): `location: string | null` added to the `Lesson` interface and `buildEditLessonData` return type and object.

7. **LessonDetailPanel** (`LessonDetailPanel.tsx`): `location: string | null` added to props type. Location row rendered conditionally after Status — only shown when `lesson.location` is truthy.

---

## Verification

- `npx tsc --noEmit` — passed, zero errors
- `npm run build` — compiled successfully, all 9 routes generated

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None. All data flows from DB through server action through form and back. Location is fetched, stored, and displayed end-to-end.

---

## Self-Check: PASSED

Files created:
- supabase/migrations/003_lessons_location.sql: FOUND
- .planning/quick/260322-unn-add-free-text-location-field-to-lessons/260322-unn-SUMMARY.md: FOUND (this file)

Commits:
- 91d8ffd: FOUND
- 6cf67d9: FOUND
