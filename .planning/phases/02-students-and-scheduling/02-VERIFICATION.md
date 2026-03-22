---
phase: 02-students-and-scheduling
verified: 2026-03-22T12:00:00Z
status: human_needed
score: 18/18 automated must-haves verified
re_verification: false
human_verification:
  - test: "Student list renders active students and search filters them"
    expected: "Active students (Alice Smith, Bob Jones) visible; Charlie Brown hidden by default; search input narrows list in real time"
    why_human: "Client-side filter logic verified in code but browser rendering and reactivity require live browser"
  - test: "Add a new student end-to-end"
    expected: "Form at /students/new accepts all fields; submit inserts row; redirect to /students shows new student"
    why_human: "Requires live Supabase connection with migration 002 applied"
  - test: "Edit a student and verify change persists on detail page"
    expected: "Pre-filled form at /students/[id]/edit; save updates DB record; /students/[id] shows new value"
    why_human: "Requires live DB round-trip"
  - test: "Deactivate a student with AlertDialog confirmation"
    expected: "Button opens dialog (not window.confirm); confirm soft-deletes; student disappears from active list; visible under Show inactive"
    why_human: "Dialog interaction and DB state require live browser"
  - test: "Schedule page: calendar and list view toggle"
    expected: "Both views render without page reload; week nav arrows change displayed week; lessons positioned correctly"
    why_human: "CSS Grid positioning and URL-param navigation require live browser"
  - test: "Mark lesson complete shows toast, no dialog"
    expected: "Clicking Mark Complete immediately calls updateLessonStatus; toast appears at bottom; lesson color changes to green"
    why_human: "Sonner toast and router.refresh() behaviour require live browser"
  - test: "Cancel / No-show require AlertDialog confirmation"
    expected: "AlertDialog appears before status change; cancelling dialog leaves lesson unchanged"
    why_human: "Interactive confirmation flow requires live browser"
  - test: "Lesson drawer: bottom drawer on mobile, side sheet on desktop"
    expected: "useMediaQuery switches between Drawer (mobile) and Sheet (desktop) based on viewport"
    why_human: "Responsive rendering requires browser with viewport controls"
  - test: "Student combobox auto-fills rate and duration from student defaults"
    expected: "Selecting a student in LessonDrawer triggers useEffect that calls form.setValue for rate and durationMinutes"
    why_human: "React state cascade and form pre-fill require live browser"
  - test: "Recurring lessons create N entries across N consecutive weeks"
    expected: "Enabling repeat toggle and submitting with 3 weeks inserts 3 lessons with shared recurring_series_id"
    why_human: "Requires live Supabase insert and schedule re-render to confirm"
  - test: "Profile edit saves and shows confirmation"
    expected: "Form at /profile pre-fills name and email; save calls updateTutorProfile; success message 'Profile updated.' appears"
    why_human: "Requires live DB write and component state update"
---

# Phase 2: Students and Scheduling Verification Report

**Phase Goal:** Build student management and lesson scheduling — the core daily workflow for a tutor.
**Verified:** 2026-03-22T12:00:00Z
**Status:** human_needed — all automated checks pass; 11 items require live browser + Supabase verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | students table has subject TEXT and default_duration_minutes INTEGER columns | VERIFIED | `002_students_subject_duration.sql` contains both `ADD COLUMN IF NOT EXISTS` statements |
| 2  | seed script inserts subject and default_duration_minutes for all 3 seed students | VERIFIED | `scripts/seed.ts` lines 97/98, 109/110, 121/122 confirm all 3 rows |
| 3  | time parsing utility correctly handles '3:45', '14:00', '2:15 pm' inputs | VERIFIED | `src/lib/utils/time.ts` regex and AM/PM logic substantively implemented with validation |
| 4  | getStudents() returns active students scoped to tutorId, sorted by name | VERIFIED | `src/lib/queries/students.ts` — `.eq('tutor_id', tutorId).order('name')` with `is_active` filter |
| 5  | getLessonsForWeek() returns lessons with student name join, ordered by scheduled_at | VERIFIED | `src/lib/queries/lessons.ts` — `students(name)` join, `.order('scheduled_at')`, `endOfWeek({weekStartsOn:1})` |
| 6  | createStudent server action inserts a student with all STUD-01 fields and calls revalidatePath | VERIFIED | `src/lib/actions/students.ts` — verifySession, zod validation, insert, `revalidatePath('/students')` |
| 7  | updateLessonStatus server action updates status and revalidatePath('/schedule') | VERIFIED | `src/lib/actions/lessons.ts` line 78–92 — `.eq('tutor_id', tutorId)` guard + `revalidatePath('/schedule')` |
| 8  | createRecurringLessons uses a single bulk insert with a shared recurring_series_id | VERIFIED | `src/lib/actions/lessons.ts` line 60–72 — `Array.from({length})` builds rows, single `.insert(rows)`, `crypto.randomUUID()` series ID |
| 9  | every server action calls verifySession() before any DB access | VERIFIED | All 7 action functions (createStudent, updateStudent, deactivateStudent, createLesson, createRecurringLessons, updateLessonStatus, updateLesson, updateTutorProfile) call `verifySession()` first |
| 10 | Tutor can navigate to /students and see a searchable list of active students | VERIFIED (code) | `students/page.tsx` calls `getStudents(tutorId, true)` → passes to `StudentList` with search input and `showInactive` toggle |
| 11 | Tutor can add/view/edit/deactivate students via correct routes | VERIFIED (code) | All 4 routes exist; pages call `verifySession()`, correct queries, and `notFound()` on missing student |
| 12 | Tutor can navigate to /profile and edit name and email | VERIFIED (code) | `profile/page.tsx` fetches tutor, renders `ProfileForm`; form calls `updateTutorProfile` on submit |
| 13 | Tutor can visit /schedule and see lessons for the current week | VERIFIED (code) | Schedule Server Component fetches via `Promise.all`, wraps `SchedulePage` in `<Suspense>` |
| 14 | View toggle (calendar/list) uses URL search params — no page reload | VERIFIED (code) | `SchedulePage.tsx` reads `?view=` from `useSearchParams()`; toggle calls `router.push` with new param |
| 15 | Week navigation works with arrow buttons | VERIFIED (code) | `WeekNav` renders ChevronLeft/Right with `min-h-[44px]`; `navigateWeek` updates `?week=` param |
| 16 | Lesson detail panel has toast for Complete, AlertDialog for Cancel/No-show | VERIFIED (code) | `LessonDetailPanel.tsx` — `toast.success` on complete; two `AlertDialog` instances for cancel and no-show |
| 17 | Lesson form pre-fills rate and duration from selected student defaults | VERIFIED (code) | `LessonDrawer.tsx` `useEffect` watches `selectedStudentId`, calls `form.setValue` for both fields |
| 18 | Recurring lesson toggle creates N lessons with shared recurring_series_id | VERIFIED (code) | `LessonDrawer.tsx` calls `createRecurringLessons(formData)` when `repeatEnabled`; server action does bulk insert |

**Automated score: 18/18 truths verified in code**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/002_students_subject_duration.sql` | ALTER TABLE migration | VERIFIED | Both `ADD COLUMN IF NOT EXISTS` statements present |
| `scripts/seed.ts` | Updated seed with subject + duration | VERIFIED | All 3 students have `subject` and `default_duration_minutes` |
| `src/lib/utils/time.ts` | parseTimeInput + combineDateTime | VERIFIED | Both exported, `fromZonedTime` used, regex + AM/PM logic complete |
| `src/lib/queries/students.ts` | getStudents, getStudent, getActiveStudentsForPicker | VERIFIED | All 3 exported, all filter by `tutor_id`, `getActiveStudentsForPicker` always filters `is_active=true` |
| `src/lib/queries/lessons.ts` | getLessonsForWeek, getLessonsForList | VERIFIED | Both exported; `getLessonsForWeek` joins `students(name)`, uses `endOfWeek({weekStartsOn:1})` |
| `src/lib/queries/tutors.ts` | getTutorProfile | VERIFIED | Exported, selects all needed tutor fields |
| `src/lib/actions/students.ts` | createStudent, updateStudent, deactivateStudent | VERIFIED | `'use server'`, zod schemas, `verifySession()` in all 3, `revalidatePath('/students')` |
| `src/lib/actions/lessons.ts` | createLesson, createRecurringLessons, updateLessonStatus, updateLesson | VERIFIED | `'use server'`, `combineDateTime` used, bulk insert, no `recurring_series_id` mutation in updateLesson |
| `src/lib/actions/tutors.ts` | updateTutorProfile | VERIFIED | `'use server'`, verifySession, `revalidatePath('/profile')` |
| `src/app/(app)/students/page.tsx` | Student list Server Component | VERIFIED | `verifySession()`, `getStudents(tutorId, true)`, renders `StudentList` |
| `src/app/(app)/students/new/page.tsx` | Add student page | VERIFIED | Renders `StudentForm mode="create"` |
| `src/app/(app)/students/[id]/page.tsx` | Student detail page | VERIFIED | `verifySession()`, `getStudent`, `notFound()` on error, `DeactivateButton` wired |
| `src/app/(app)/students/[id]/edit/page.tsx` | Edit student page | VERIFIED | `verifySession()`, `getStudent`, `StudentForm mode="edit"` with `defaultValues` |
| `src/app/(app)/profile/page.tsx` | Profile edit page | VERIFIED | `verifySession()`, `getTutorProfile`, `ProfileForm` with `defaultValues` |
| `src/app/(app)/schedule/page.tsx` | Schedule Server Component | VERIFIED | `Promise.all` fetch, `weekStartsOn:1`, wrapped in `<Suspense>`, passes all props to `SchedulePage` |
| `src/components/students/StudentForm.tsx` | Add/edit form | VERIFIED | `'use client'`, react-hook-form + zodResolver, all 8 STUD-01 fields, `min-h-[44px]` on submit |
| `src/components/students/StudentList.tsx` | Searchable list with inactive toggle | VERIFIED | Search input, `showInactive` state, client-side filter, empty state |
| `src/components/students/DeactivateButton.tsx` | AlertDialog confirmation | VERIFIED | Full `AlertDialog` with confirm/cancel, `deactivateStudent` wired, `router.push('/students')` |
| `src/components/profile/ProfileForm.tsx` | Profile form | VERIFIED | `'use client'`, react-hook-form, `updateTutorProfile`, success/error message |
| `src/components/schedule/SchedulePage.tsx` | Client shell with all state | VERIFIED | `useSearchParams`, view/week URL state, `WeekNav`, `WeekCalendar`, `LessonList`, `LessonDetailPanel`, `LessonDrawer` all wired |
| `src/components/schedule/WeekNav.tsx` | Week navigation | VERIFIED | ChevronLeft/Right, `min-h-[44px]`, formatted week label |
| `src/components/schedule/WeekCalendar.tsx` | CSS Grid calendar | VERIFIED | 7 columns, `startOfWeek({weekStartsOn:1})`, auto-fit time range, `topOffset`/`blockHeight` positioning |
| `src/components/schedule/LessonList.tsx` | Chronological list view | VERIFIED | Groups by day using `toZonedTime`, day headers, empty state |
| `src/components/schedule/LessonBlock.tsx` | Lesson tile | VERIFIED | Status-based color map, `formatTime`, `min-h-[44px]`, `compact` prop |
| `src/components/schedule/LessonDetailPanel.tsx` | Status quick actions | VERIFIED | `updateLessonStatus`, `toast.success`, 2x `AlertDialog` (cancel + no-show), `router.refresh()` |
| `src/components/schedule/LessonDrawer.tsx` | Lesson form | VERIFIED | `DrawerContent` (mobile) + `SheetContent` (desktop), `useMediaQuery`, student combobox with default pre-fill, `createLesson`/`createRecurringLessons`/`updateLesson` |
| `src/app/(app)/layout.tsx` | Toaster present | VERIFIED | `import { Toaster } from '@/components/ui/sonner'` and `<Toaster position="bottom-center" />` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `002_students_subject_duration.sql` | students table | `ADD COLUMN IF NOT EXISTS subject` | VERIFIED | Pattern found at line 4 |
| `src/lib/utils/time.ts` | `src/lib/actions/lessons.ts` | `combineDateTime` imported and called | VERIFIED | Import line 7, called in `createLesson`, `createRecurringLessons`, `updateLesson` |
| `src/lib/actions/students.ts` | `src/lib/dal.ts` | `verifySession()` at top of every action | VERIFIED | 3/3 action functions confirmed |
| `src/lib/queries/students.ts` | supabase students table | `.from('students').eq('tutor_id', tutorId)` | VERIFIED | Pattern present in all 3 query functions |
| `src/app/(app)/students/page.tsx` | `src/lib/queries/students.ts` | `getStudents(tutorId)` called in Server Component | VERIFIED | Line 9 |
| `src/components/students/StudentForm.tsx` | `src/lib/actions/students.ts` | `createStudent` / `updateStudent` called on submit | VERIFIED | Lines 90, 93 |
| `src/components/students/DeactivateButton.tsx` | `src/lib/actions/students.ts` | `deactivateStudent(studentId)` on confirm | VERIFIED | Line 31 |
| `src/components/schedule/SchedulePage.tsx` | `src/lib/actions/lessons.ts` | `updateLessonStatus()` in LessonDetailPanel | VERIFIED | LessonDetailPanel imports and calls at line 48 |
| `src/components/schedule/LessonDrawer.tsx` | `src/lib/actions/lessons.ts` | `createLesson`/`createRecurringLessons` on submit | VERIFIED | Lines 141, 143 |
| `src/components/schedule/SchedulePage.tsx` | `src/lib/queries/lessons.ts` | `getLessonsForWeek` called in schedule Server Component | VERIFIED | `schedule/page.tsx` line 29 |
| `src/components/schedule/WeekCalendar.tsx` | date-fns | `startOfWeek({weekStartsOn:1})` Monday-first | VERIFIED | Line 68 |
| `src/app/(app)/layout.tsx` | sonner | `<Toaster position="bottom-center" />` | VERIFIED | Line 13 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-04 | 02-02, 02-03 | User can view and edit their tutor profile (name, email) | VERIFIED (code) | `profile/page.tsx` + `ProfileForm.tsx` + `updateTutorProfile` server action fully wired |
| STUD-01 | 02-01, 02-02, 02-03 | User can add a student with name, parent contact, subject, rate, and duration | VERIFIED (code) | Migration adds columns; `createStudent` action includes all fields; `StudentForm.tsx` has all 8 fields |
| STUD-02 | 02-03 | User can view a list of all students with search and filter | VERIFIED (code) | `StudentList.tsx` with `searchQuery` state + `showInactive` toggle |
| STUD-03 | 02-03 | User can view a student's detail page | VERIFIED (code) | `/students/[id]/page.tsx` renders all student fields |
| STUD-04 | 02-03 | User can edit a student's information | VERIFIED (code) | `/students/[id]/edit/page.tsx` + `StudentForm mode="edit"` + `updateStudent` |
| STUD-05 | 02-03 | User can deactivate a student (soft delete) | VERIFIED (code) | `DeactivateButton.tsx` AlertDialog → `deactivateStudent` → `is_active=false` |
| SCHED-01 | 02-02, 02-04 | User can create a single lesson with date, time, duration, rate | VERIFIED (code) | `LessonDrawer.tsx` form → `createLesson` server action |
| SCHED-02 | 02-02, 02-04 | User can create recurring weekly lessons for N weeks | VERIFIED (code) | `repeatEnabled` toggle → `createRecurringLessons` bulk insert with `recurring_series_id` |
| SCHED-03 | 02-04 | User can view lessons in a weekly calendar grid | VERIFIED (code) | `WeekCalendar.tsx` CSS Grid, 7 columns, time-positioned lesson blocks |
| SCHED-04 | 02-04 | User can view lessons in a chronological list grouped by day | VERIFIED (code) | `LessonList.tsx` groups by `toZonedTime` day key with day headers |
| SCHED-05 | 02-02, 02-04 | User can mark a lesson as completed, cancelled, or no-show | VERIFIED (code) | `LessonDetailPanel.tsx` → `updateLessonStatus` with tutor-scoped guard |
| SCHED-06 | 02-02, 02-04 | User can edit a single lesson (this lesson only for recurring) | VERIFIED (code) | `updateLesson` server action never modifies `recurring_series_id` (comment at line 103 confirms) |
| SCHED-07 | 02-01, 02-02, 02-04 | Lessons pre-fill duration and rate from student defaults | VERIFIED (code) | `LessonDrawer.tsx` `useEffect` on `selectedStudentId` calls `form.setValue` for both fields |

All 13 Phase 2 requirements are covered across the 4 execute plans. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No stubs, empty implementations, or placeholder returns in any Phase 2 file |

All `return null` instances in `src/lib/utils/time.ts` are correct error-return paths (invalid input guard), not stubs.
The `return null` in `SchedulePage.tsx` (`buildEditLessonData`) is a guard for a missing lesson ID, not a stub.

---

## Human Verification Required

All 18 automated must-haves pass. The following 11 items require a running dev server connected to Supabase with migration 002 applied.

**Before starting:** Apply the schema migration in Supabase Dashboard SQL Editor (run `supabase/migrations/002_students_subject_duration.sql`), then run `npm run seed`, then `npm run dev`.

### 1. Student list renders with search and inactive toggle

**Test:** Navigate to `/students` as `jane@example.com`. Confirm Alice Smith and Bob Jones appear. Confirm Charlie Brown is absent. Type "alice" in the search box. Toggle "Show inactive".
**Expected:** Active students visible; Charlie hidden; search filters in real time; "Show inactive" reveals Charlie with Inactive badge.
**Why human:** Client-side filter reactivity and badge rendering require live browser.

### 2. Add a new student end-to-end

**Test:** Click "Add Student", fill all fields (name, parent contact, subject, rate, duration), submit.
**Expected:** Redirect to `/students`; new student appears in list; no DB error.
**Why human:** Requires Supabase RLS + migration applied.

### 3. Edit student persists change

**Test:** Click Alice Smith → Edit → change subject to "Maths and Science" → Save.
**Expected:** Detail page shows updated subject.
**Why human:** Requires live DB round-trip and page revalidation.

### 4. Deactivation uses AlertDialog (not window.confirm)

**Test:** On a student detail page, click "Deactivate Student". Observe dialog. Click Confirm.
**Expected:** shadcn AlertDialog appears (not browser dialog); student soft-deleted; redirected to `/students`; student absent from active list.
**Why human:** Dialog rendering and DB state require live browser.

### 5. Schedule calendar view

**Test:** Navigate to `/schedule`. Confirm 7-column calendar grid with correct day headers. Confirm Alice's future lesson appears on the correct day.
**Expected:** Calendar grid renders; lesson block positioned by time; week nav arrows change displayed week.
**Why human:** CSS Grid positioning and DB data require live browser.

### 6. View toggle and week navigation

**Test:** Click "List" button; click "Calendar" button; click prev/next week arrows.
**Expected:** View switches without page reload (URL `?view=` param updates); week changes update displayed lessons.
**Why human:** URL state and Server Component re-render require live browser.

### 7. Mark Complete shows toast without dialog

**Test:** Click a scheduled lesson; click "Mark Complete".
**Expected:** Toast "Lesson marked complete" appears at bottom; no AlertDialog; lesson color changes to green after `router.refresh()`.
**Why human:** Sonner toast and refresh behaviour require live browser.

### 8. Cancel / No-show require AlertDialog

**Test:** Click a lesson; click "Cancel Lesson"; observe dialog; click "Keep Lesson"; verify lesson unchanged. Then confirm cancel.
**Expected:** AlertDialog appears; cancelling leaves lesson as-is; confirming updates status.
**Why human:** Interactive confirmation flow requires live browser.

### 9. Lesson drawer: bottom drawer on mobile, side sheet on desktop

**Test:** Click "+ Lesson" on desktop viewport; click "+ Lesson" on mobile viewport (or DevTools emulation).
**Expected:** Side sheet slides in from right on desktop (≥768px); bottom drawer slides up on mobile.
**Why human:** `useMediaQuery` and drawer/sheet rendering require browser viewport.

### 10. Student combobox pre-fills defaults

**Test:** Open lesson drawer; type in student search; select Bob Jones.
**Expected:** Rate field auto-fills with 80.00; duration auto-fills with 90 minutes.
**Why human:** React `useEffect` state cascade requires live browser.

### 11. Recurring lessons create N entries

**Test:** Open lesson drawer; fill date/time; enable "Repeat weekly"; set 3 weeks; submit.
**Expected:** 3 lesson entries appear across 3 consecutive weeks on the schedule; all share the same recurring series.
**Why human:** Requires Supabase insert and schedule re-render to confirm.

---

## Gaps Summary

No gaps found. All automated checks pass: 26 artifacts exist and are substantively implemented, 12 key links are wired, all 13 requirement IDs are satisfied. Zero stubs or placeholder anti-patterns detected.

The phase's automated foundation is complete. Functional verification against a live Supabase instance (with migration 002 applied) is the remaining step before the phase can be marked complete in ROADMAP.md.

---

_Verified: 2026-03-22T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
