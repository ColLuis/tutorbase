---
phase: 02-students-and-scheduling
plan: 03
subsystem: ui
tags: [react, next.js, react-hook-form, zod, shadcn, base-ui, students, profile, server-components]

# Dependency graph
requires:
  - phase: 02-02
    provides: createStudent, updateStudent, deactivateStudent, getStudents, getStudent, getTutorProfile, updateTutorProfile server actions and queries
  - phase: 02-01
    provides: project scaffold, auth middleware, shadcn/ui base install (button, card, input, label)
provides:
  - src/components/students/StudentForm.tsx (create/edit student form with react-hook-form + zod, 8 fields)
  - src/components/students/StudentList.tsx (client-side searchable list with active/inactive toggle)
  - src/components/students/DeactivateButton.tsx (AlertDialog confirmation for student deactivation)
  - src/components/profile/ProfileForm.tsx (profile name/email edit form)
  - src/app/(app)/students/page.tsx (student list route)
  - src/app/(app)/students/new/page.tsx (add student route)
  - src/app/(app)/students/[id]/page.tsx (student detail route)
  - src/app/(app)/students/[id]/edit/page.tsx (edit student route)
  - src/app/(app)/profile/page.tsx (profile edit route)
  - src/components/ui/alert-dialog.tsx (Base UI AlertDialog)
  - src/components/ui/badge.tsx (Base UI Badge)
  - src/components/ui/select.tsx (Base UI Select)
  - src/components/ui/textarea.tsx (Textarea)
  - src/components/ui/separator.tsx (Separator)
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added:
    - shadcn/ui alert-dialog (Base UI AlertDialog)
    - shadcn/ui badge (Base UI badge)
    - shadcn/ui select (Base UI Select)
    - shadcn/ui textarea
    - shadcn/ui separator
  patterns:
    - "Server Components fetch data (verifySession + query), Client Components handle form state"
    - "Form fields use string values for react-hook-form; server action handles coercion via zod"
    - "Base UI Button uses render prop for link wrapping (not asChild)"
    - "AlertDialog open state controlled via useState for async deactivation flow"
    - "44px min-height on all interactive elements for mobile tap targets"
    - "notFound() used in catch block for missing student protection"
    - "Next.js 15: params is a Promise — always await before destructuring"

key-files:
  created:
    - src/components/students/StudentForm.tsx
    - src/components/students/StudentList.tsx
    - src/components/students/DeactivateButton.tsx
    - src/components/profile/ProfileForm.tsx
    - src/app/(app)/students/page.tsx
    - src/app/(app)/students/new/page.tsx
    - src/app/(app)/students/[id]/page.tsx
    - src/app/(app)/students/[id]/edit/page.tsx
    - src/app/(app)/profile/page.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/select.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/separator.tsx
  modified: []

key-decisions:
  - "Base UI Button does not support asChild — use render prop (render={<Link href='...'>text</Link>}) for link wrapping"
  - "StudentForm uses string fields in Zod schema (not coerce) to avoid zod v4 + @hookform/resolvers type inference issue with union types; server action handles coercion"
  - "AlertDialog controlled (open state via useState) to support async deactivation with loading state before navigating"

requirements-completed: [AUTH-04, STUD-01, STUD-02, STUD-03, STUD-04, STUD-05]

# Metrics
duration: 18min
completed: 2026-03-22
---

# Phase 2 Plan 03: Student Management Pages and Profile Edit Summary

**5 route pages (student CRUD + profile) and 4 client components (StudentForm, StudentList, DeactivateButton, ProfileForm) built on Base UI shadcn with 44px tap targets, client-side search, and AlertDialog confirmation**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-22T10:21:57Z
- **Completed:** 2026-03-22T10:39:57Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Installed 5 missing shadcn/ui components (alert-dialog, badge, select, textarea, separator) using the Base UI "base-nova" variant
- Built StudentForm (react-hook-form + zod, 8 fields including Base UI Select for duration, 44px submit button) in create and edit modes
- Built StudentList with client-side name search and show/hide inactive toggle, card-based layout with Badge for subject and formatCurrency for rate
- Built DeactivateButton with controlled AlertDialog (open state + loading state) so deactivation is async-safe before navigation
- Created all 5 Server Component route pages — each calls verifySession() first, detail/edit use notFound() on missing student

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components and build student form and list components** - `40c35b4` (feat)
2. **Task 2: Create student and profile route pages** - `4ad3764` (feat)

**Plan metadata:** `(docs commit — see below)`

## Files Created/Modified

- `src/components/students/StudentForm.tsx` - Create/edit student form, react-hook-form + zod, 8 fields
- `src/components/students/StudentList.tsx` - Client-side searchable list with active/inactive filter
- `src/components/students/DeactivateButton.tsx` - AlertDialog confirmation button for deactivation
- `src/components/profile/ProfileForm.tsx` - Profile name/email form with success/error messages
- `src/app/(app)/students/page.tsx` - Student list page (Server Component)
- `src/app/(app)/students/new/page.tsx` - Add student page
- `src/app/(app)/students/[id]/page.tsx` - Student detail page with all fields + Edit/Deactivate
- `src/app/(app)/students/[id]/edit/page.tsx` - Edit student page with prefilled StudentForm
- `src/app/(app)/profile/page.tsx` - Profile edit page
- `src/components/ui/alert-dialog.tsx` - Base UI AlertDialog component
- `src/components/ui/badge.tsx` - Base UI Badge component
- `src/components/ui/select.tsx` - Base UI Select component
- `src/components/ui/textarea.tsx` - Textarea component
- `src/components/ui/separator.tsx` - Separator component

## Decisions Made

- **Base UI Button render prop for links:** The `@base-ui/react/button` primitive does not support the `asChild` prop (unlike Radix UI). Using `render={<Link href="...">text</Link>}` achieves the same polymorphic rendering. Pre-existing schedule components had TypeScript errors from trying to use `asChild` — not from our code.
- **String fields in StudentForm Zod schema:** Using `z.union([z.coerce.number(), z.literal('')])` caused `unknown` type inference in `@hookform/resolvers` v5.2.2 with Zod v4. Switched to string fields throughout; the server action's own Zod schema handles coercion. This keeps the form simple and avoids type complexity.
- **Controlled AlertDialog for deactivation:** Using controlled `open` state allows showing a loading state during the async `deactivateStudent()` call and navigating only on success, rather than closing immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Base UI Button does not support asChild prop**
- **Found during:** Task 2 (creating route pages)
- **Issue:** Plan specified `<Button asChild><Link>...</Link></Button>` pattern, but `@base-ui/react/button` uses `render` prop for polymorphic rendering, not `asChild`
- **Fix:** Used `<Button render={<Link href="...">text</Link>} />` pattern throughout all pages
- **Files modified:** src/app/(app)/students/page.tsx, src/app/(app)/students/[id]/page.tsx
- **Verification:** TypeScript clean on all page files; build passes
- **Committed in:** 4ad3764 (Task 2 commit)

**2. [Rule 1 - Bug] zod v4 union type inference incompatible with @hookform/resolvers v5**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `z.union([z.coerce.number(), z.literal('')])` caused `unknown` inferred type which @hookform/resolvers typed as incompatible with FormValues
- **Fix:** Changed StudentForm schema to use `z.string().optional()` for all fields; coercion done by server action's own schema
- **Files modified:** src/components/students/StudentForm.tsx
- **Verification:** Zero TypeScript errors in students/ and profile/ directories
- **Committed in:** 40c35b4 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs in plan's assumed API)
**Impact on plan:** Both fixes were necessary for TypeScript correctness and Base UI compatibility. No scope creep. Form behavior is identical from user perspective.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None — no external service configuration required. Pages are ready to render once Supabase is connected and migrations applied.

## Next Phase Readiness

- Wave 3 parallel plans (02-04 scheduling pages, 02-05 if any) can now import components from students/ and profile/ directories
- `getActiveStudentsForPicker` ready for the lesson scheduling form's student combobox
- StudentForm's `StudentDefaultValues` interface exported for type-safe defaultValues passing from pages
- Next.js build passes cleanly with all 5 student/profile routes compiled

## Known Stubs

None — all pages fetch live data from Supabase via the data layer built in 02-02. No hardcoded empty values, no placeholder text.

---
*Phase: 02-students-and-scheduling*
*Completed: 2026-03-22*
