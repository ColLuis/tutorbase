# Phase 2: Students and Scheduling - Research

**Researched:** 2026-03-22
**Domain:** Next.js 16 App Router, Supabase, shadcn/ui, date-fns v4, zod v4, react-hook-form v7
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Student picker is a searchable dropdown (combobox) — type to filter student names
- **D-02:** Recurring lessons use a "Repeat weekly for N weeks" toggle on the lesson form — all lessons pre-generated at once with shared `recurring_series_id`
- **D-03:** Date input via calendar picker, time input is free text (allows non-standard times like 3:45, 2:15)
- **D-04:** Lesson form presented as a bottom drawer on mobile, side drawer on desktop — stays in context of the schedule
- **D-05:** Weekly calendar auto-fits time range to lessons (1 hour padding before/after earliest and latest lessons)
- **D-06:** On mobile, calendar shows a compressed week grid with minimal info (colored blocks) — tap to expand a day
- **D-07:** Each lesson block shows student name + time only, color-coded by status. Tap for full details.
- **D-08:** Calendar and list views toggle via a button on the same page (same URL, instant switch)
- **D-09:** Tap a lesson block to expand/open it, then tap one of 3 status buttons (Complete, Cancel, No-show)
- **D-10:** No confirmation for "Complete" (happy path, no friction). Cancel and No-show require confirmation dialog.
- **D-11:** After marking complete, show a brief toast notification ("Lesson marked complete") — non-disruptive, stay on schedule

### Claude's Discretion
- Student list layout (cards vs table), search/filter UX, form field ordering
- Empty states for student list and empty schedule
- Lesson detail view layout and edit form design
- Color scheme for lesson status (scheduled, completed, cancelled, no-show)
- Toast component choice and positioning
- Week navigation UI (arrows, date picker, swipe)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-04 | User can view and edit their tutor profile (name, email) | Tutors table exists; server action pattern established; `verifySession()` DAL in place |
| STUD-01 | User can add a student with name, parent contact, subject, rate, and duration | Students table needs `subject` and `default_duration_minutes` columns via migration; react-hook-form + zod v4 pattern |
| STUD-02 | User can view a list of all students with search and filter | Server Component fetch + client-side search state; RLS auto-scopes to tutor |
| STUD-03 | User can view a student's detail page | Dynamic route `/students/[id]`; server component fetch |
| STUD-04 | User can edit a student's information | Server action mutation; optimistic UI optional |
| STUD-05 | User can deactivate a student (soft delete) | `is_active` boolean already in schema; server action UPDATE |
| SCHED-01 | User can create a single lesson with date, time, duration, rate | Lesson form with zod validation; free-text time parsing; server action insert |
| SCHED-02 | User can create recurring weekly lessons for N weeks (pre-generated) | Bulk INSERT loop in server action; `recurring_series_id = gen_random_uuid()`; cap at 52 |
| SCHED-03 | User can view lessons in a weekly calendar grid | Custom CSS Grid calendar component; date-fns `startOfWeek`/`endOfWeek`; auto-fit time range |
| SCHED-04 | User can view lessons in a chronological list grouped by day | Server Component fetch; `groupBy` day using date-fns; same page URL as SCHED-03 |
| SCHED-05 | User can mark a lesson as completed, cancelled, or no-show via quick action | Server action UPDATE status; Sonner toast for Complete; AlertDialog confirmation for Cancel/No-show |
| SCHED-06 | User can edit a single lesson (defaults to "this lesson only" for recurring) | Lesson edit form; `recurring_series_id` preserved; no cascade update needed in Phase 2 |
| SCHED-07 | Lessons pre-fill duration and rate from student defaults | Lesson form reads student's `default_rate` and `default_duration_minutes` on student selection |
</phase_requirements>

---

## Summary

Phase 2 builds on top of a solid Phase 1 foundation: authenticated shell, Supabase schema, RLS policies, and established patterns for Server Actions and the DAL. The primary deliverables are student CRUD pages, a lesson scheduling form with recurring support, and a schedule page with dual calendar/list views.

The most important discovery is a **schema gap**: the `students` table is missing `subject TEXT` and `default_duration_minutes INTEGER` columns that STUD-01 and SCHED-07 require. A second migration file must be the first task in the plan. All other tables are correctly structured and ready.

**Critical version note:** The project is running date-fns **v4**, zod **v4**, @hookform/resolvers **v5**, Tailwind **v4**, and Next.js **16** — all newer than CLAUDE.md documents. These are all backward-compatible for this phase's use cases, but the zod v4 string format API has changed (`.email()` method still works on fields but `z.email()` as a top-level function is preferred). The @hookform/resolvers v5.1+ adds explicit zod v4 support — the installed v5.2.2 is confirmed compatible.

**Primary recommendation:** Write a `002_students_subject_duration.sql` migration first, then implement students CRUD, then lesson scheduling. Build the calendar grid as a custom CSS Grid component using date-fns — no external calendar library needed.

---

## Standard Stack

### Core (already installed — do not re-install)
| Library | Installed Version | Purpose | Phase 2 Usage |
|---------|------------------|---------|---------------|
| Next.js | 16.2.1 | App Router, Server Components, Server Actions | All pages and mutations |
| React | 19.2.4 | UI | All components |
| TypeScript | 5.x | Type safety | All files |
| @supabase/supabase-js | 2.99.3 | DB client | Data fetching in server components |
| @supabase/ssr | 0.9.0 | Cookie auth | `createClient()` in server.ts |
| Tailwind CSS | 4.x | Utility CSS | All styling |
| date-fns | 4.1.0 | Date math | Week calculation, day grouping, lesson sorting |
| date-fns-tz | 3.2.0 | Timezone conversion | Display times in tutor's timezone |
| react-hook-form | 7.72.0 | Form state | Student form, lesson form |
| zod | 4.3.6 | Schema validation | Client + server validation |
| @hookform/resolvers | 5.2.2 | RHF + zod bridge | `zodResolver` in all forms |
| lucide-react | 0.577.0 | Icons | Navigation arrows, status icons |

### shadcn/ui Components to Add
The following components need to be added via `npx shadcn@latest add [name]`:

| Component | CLI Command | Used For |
|-----------|-------------|----------|
| Combobox | (built from `command` + `popover`) | Student picker in lesson form |
| Command | `npx shadcn@latest add command` | Powers the combobox |
| Popover | `npx shadcn@latest add popover` | Powers the combobox |
| Drawer | `npx shadcn@latest add drawer` | Bottom drawer on mobile for lesson form |
| Sheet | `npx shadcn@latest add sheet` | Side sheet on desktop for lesson form |
| Dialog | `npx shadcn@latest add dialog` | Confirmation dialog for Cancel/No-show |
| Alert Dialog | `npx shadcn@latest add alert-dialog` | Destructive confirmation pattern |
| Sonner | `npx shadcn@latest add sonner` | Toast for "Lesson marked complete" |
| Calendar | `npx shadcn@latest add calendar` | Date picker for lesson form (D-03) |
| Badge | `npx shadcn@latest add badge` | Lesson status chips |
| Separator | `npx shadcn@latest add separator` | List view day dividers |
| Switch | `npx shadcn@latest add switch` | "Repeat weekly" toggle |
| Textarea | `npx shadcn@latest add textarea` | Notes fields |
| Select | `npx shadcn@latest add select` | Duration picker dropdown |
| Tabs | `npx shadcn@latest add tabs` | Calendar/List view toggle (D-08) — alternative to button pair |

> Already installed: `button`, `card`, `input`, `label`

### Installation
```bash
npx shadcn@latest add command popover drawer sheet dialog alert-dialog sonner calendar badge separator switch textarea select
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)
```
src/
├── app/(app)/
│   ├── students/
│   │   ├── page.tsx              # Student list (Server Component)
│   │   ├── new/page.tsx          # Add student form page
│   │   └── [id]/
│   │       ├── page.tsx          # Student detail (Server Component)
│   │       └── edit/page.tsx     # Edit student form page
│   ├── schedule/
│   │   └── page.tsx              # Schedule page — calendar + list (Server Component shell)
│   └── profile/
│       └── page.tsx              # Tutor profile edit (AUTH-04)
├── components/
│   ├── students/
│   │   ├── StudentForm.tsx       # Add/edit student form (client)
│   │   ├── StudentList.tsx       # Filtered/searchable list (client)
│   │   └── DeactivateButton.tsx  # Soft-delete with confirmation (client)
│   ├── schedule/
│   │   ├── SchedulePage.tsx      # Client shell — owns view state (calendar vs list)
│   │   ├── WeekCalendar.tsx      # CSS Grid calendar component (client)
│   │   ├── LessonList.tsx        # Chronological list view (client)
│   │   ├── LessonBlock.tsx       # Single lesson tile (calendar + list) (client)
│   │   ├── LessonDrawer.tsx      # Mobile bottom + desktop side lesson form (client)
│   │   ├── LessonDetailPanel.tsx # Tap-to-expand lesson with status buttons (client)
│   │   └── WeekNav.tsx           # Week navigation arrows + date display (client)
│   └── ui/                       # shadcn/ui components (auto-managed)
├── lib/
│   ├── actions/
│   │   ├── students.ts           # createStudent, updateStudent, deactivateStudent
│   │   └── lessons.ts            # createLesson, createRecurringLessons, updateLessonStatus, updateLesson
│   └── queries/
│       ├── students.ts           # getStudents, getStudent (server-side DB reads)
│       └── lessons.ts            # getLessonsForWeek, getLessonsForList
└── types/
    └── database.types.ts         # Regenerate after migration
```

### Pattern 1: Server Component + Client Shell
**What:** Page is a Server Component that fetches initial data and passes it to a Client Component that owns interactive state (view toggle, week navigation, open drawer).
**When to use:** Schedule page — initial week of lessons fetched server-side, navigation triggers client-side re-fetch via server action or URL param.

```typescript
// src/app/(app)/schedule/page.tsx — Server Component
import { verifySession } from '@/lib/dal'
import { getLessonsForWeek } from '@/lib/queries/lessons'
import SchedulePage from '@/components/schedule/SchedulePage'
import { startOfWeek } from 'date-fns'

export default async function ScheduleRoute() {
  const { tutorId } = await verifySession()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const lessons = await getLessonsForWeek(tutorId, weekStart)
  return <SchedulePage initialLessons={lessons} initialWeekStart={weekStart.toISOString()} />
}
```

### Pattern 2: Server Action with verifySession Guard
**What:** Every mutation starts with `verifySession()` — confirmed from Phase 1 DAL pattern.
**When to use:** All `src/lib/actions/*.ts` files.

```typescript
// src/lib/actions/lessons.ts
'use server'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateStatusSchema = z.object({
  lessonId: z.string().uuid(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
})

export async function updateLessonStatus(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = UpdateStatusSchema.safeParse({
    lessonId: formData.get('lessonId'),
    status: formData.get('status'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('lessons')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.lessonId)
    .eq('tutor_id', tutorId)  // RLS belt-and-suspenders

  return error ? { error: error.message } : { success: true }
}
```

### Pattern 3: Recurring Lesson Bulk Insert
**What:** Generate N lesson rows in a loop with a shared `recurring_series_id`.
**When to use:** SCHED-02 — "Repeat weekly for N weeks" toggle.

```typescript
// src/lib/actions/lessons.ts
import { addWeeks } from 'date-fns'

export async function createRecurringLessons(data: LessonFormData) {
  const { tutorId } = await verifySession()
  const seriesId = crypto.randomUUID()
  const supabase = await createClient()

  const rows = Array.from({ length: data.repeatWeeks }, (_, i) => ({
    tutor_id: tutorId,
    student_id: data.studentId,
    scheduled_at: addWeeks(data.scheduledAt, i).toISOString(),
    duration_minutes: data.durationMinutes,
    rate: data.rate,
    status: 'scheduled' as const,
    recurring_series_id: seriesId,
  }))

  const { error } = await supabase.from('lessons').insert(rows)
  return error ? { error: error.message } : { success: true }
}
```

### Pattern 4: Zod v4 Schema (use installed v4 syntax)
**What:** zod v4 keeps `z.object()`, `z.string()`, `z.number()` unchanged. The main difference: string format validators like `.email()` and `.uuid()` still work as methods on `z.string()` in v4 (not removed), but `z.email()` is now also a top-level function. Error customization uses unified `error` param.

```typescript
import { z } from 'zod'

// Works in zod v4 — no changes needed for basic schemas
const StudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parent_name: z.string().optional(),
  parent_email: z.string().email().optional().or(z.literal('')),
  parent_phone: z.string().optional(),
  subject: z.string().optional(),
  default_rate: z.coerce.number().min(0).optional(),
  default_duration_minutes: z.coerce.number().int().min(15).optional(),
  notes: z.string().optional(),
})
```

### Pattern 5: React Hook Form with Zod v4 (resolvers v5.2.2)
**What:** `@hookform/resolvers` v5.1+ added explicit zod v4 support. Import `zodResolver` from `@hookform/resolvers/zod` — unchanged API.

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1) })
type FormValues = z.infer<typeof schema>

export function StudentForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })
  // ...
}
```

### Pattern 6: Combobox (Student Picker — D-01)
**What:** Built from shadcn/ui `Command` + `Popover`. Standard documented pattern.

```typescript
'use client'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'

export function StudentCombobox({ students, value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start min-h-[44px]">
          {value ? students.find(s => s.id === value)?.name : 'Select student...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search students..." />
          <CommandEmpty>No student found.</CommandEmpty>
          <CommandGroup>
            {students.map(s => (
              <CommandItem key={s.id} value={s.name} onSelect={() => { onChange(s.id); setOpen(false) }}>
                {s.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Pattern 7: Responsive Drawer/Sheet (D-04)
**What:** shadcn/ui `Drawer` (Vaul-based, bottom on mobile) + `Sheet` (side panel on desktop). Use `useMediaQuery` or Tailwind hidden classes to swap.

```typescript
'use client'
// Mobile: Drawer (bottom), Desktop: Sheet (right side)
// Simplest approach: render both, show one with Tailwind
<div className="flex md:hidden">
  <Drawer open={open} onOpenChange={setOpen}>
    <DrawerContent>{form}</DrawerContent>
  </Drawer>
</div>
<div className="hidden md:flex">
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="right">{form}</SheetContent>
  </Sheet>
</div>
```

### Pattern 8: CSS Grid Weekly Calendar (D-05, D-06, D-07)
**What:** Custom component. 7 columns (days), rows represent time slots. No external calendar library.

```typescript
// Grid column per day, position lessons by time offset
// Auto-fit: find earliest and latest lesson times, add 60 min padding
const SLOT_HEIGHT = 60 // px per hour

function timeToOffset(dateStr: string, timezone: string, dayStart: Date): number {
  const lessonDate = toZonedTime(new Date(dateStr), timezone)
  const startDate = toZonedTime(dayStart, timezone)
  const diffMinutes = differenceInMinutes(lessonDate, startDate)
  return (diffMinutes / 60) * SLOT_HEIGHT
}
```

### Pattern 9: Time Input Parsing (D-03)
**What:** Free text time entry must parse "3:45", "14:00", "2:15 pm". Use a simple parser utility.

```typescript
// src/lib/utils/time.ts
export function parseTimeInput(input: string): { hours: number; minutes: number } | null {
  const clean = input.trim().toLowerCase()
  const match = clean.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2] ?? '0')
  const period = match[3]
  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}
```

### Pattern 10: Sonner Toast (D-11)
**What:** shadcn/ui's recommended toast. Import `Toaster` once in the app layout, call `toast()` anywhere.

```typescript
// src/app/(app)/layout.tsx — add Toaster
import { Toaster } from '@/components/ui/sonner'
// ... existing layout
<Toaster position="bottom-center" /> {/* bottom-center is thumb-friendly on mobile */}

// In any client component:
import { toast } from 'sonner'
toast.success('Lesson marked complete')
```

### Anti-Patterns to Avoid
- **Fetching students client-side for the lesson form:** Fetch the student list server-side and pass as a prop to the lesson form. Avoids a waterfall and RLS complexity on the client.
- **Storing times as local time strings in the DB:** Always convert the user's local date + time input to UTC before inserting. Combine the date picker value + free text time + tutor's timezone, then use `fromZonedTime(localDate, timezone).toISOString()`.
- **Using `MAX()` to derive IDs or ordering:** Already caught in STATE.md. Apply to lessons too — never derive `recurring_series_id` from existing data; always `crypto.randomUUID()`.
- **Rendering all week lessons server-side with no navigation:** Week navigation requires client-side state for the current week. Pass initial data server-side, re-fetch client-side when week changes via server action or search params.
- **Skipping the `tutor_id` filter on mutations:** Even though RLS enforces this at the DB layer, always include `.eq('tutor_id', tutorId)` in UPDATE/DELETE calls for defense in depth and to ensure RLS policy conditions are met.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Student search/filter combobox | Custom dropdown with input | shadcn/ui Command + Popover | Keyboard nav, accessibility, typeahead — all handled |
| Toast notification | Custom div + setTimeout | Sonner (shadcn/ui Sonner) | Stacking, animations, accessibility, ARIA live region |
| Date picker UI | Custom calendar grid | shadcn/ui Calendar component | Keyboard nav, locale, accessible, already styled |
| Form validation | Custom error state | react-hook-form + zod | Error tracking, touched state, submission handling |
| Confirmation dialog | `window.confirm()` | shadcn/ui AlertDialog | Styled, accessible, non-blocking, mobile-friendly |
| Bottom drawer on mobile | Custom modal | shadcn/ui Drawer (Vaul) | Gesture dismiss, spring animation, safe-area aware |

**Key insight:** The project's entire UI toolkit (shadcn/ui) is already installed and configured. Every interactive pattern in this phase has a corresponding shadcn/ui component — add components as needed via CLI, never build from scratch.

---

## Schema Gap — Migration Required

**Finding:** The `students` table (from `001_initial_schema.sql`) is missing two columns that Phase 2 requirements need:

| Column | Required By | Type |
|--------|-------------|------|
| `subject` | STUD-01 ("add a student with...subject") | `TEXT` |
| `default_duration_minutes` | STUD-01, SCHED-07 ("pre-fill duration from student defaults") | `INTEGER` |

The `seed.ts` script will also need updating to include these columns.

```sql
-- supabase/migrations/002_students_subject_duration.sql
ALTER TABLE students ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER;
```

After running this migration, regenerate types:
```bash
npm run types:generate
```

**Confidence:** HIGH — confirmed by reading `001_initial_schema.sql` directly.

---

## Common Pitfalls

### Pitfall 1: Time + Date Combination is UTC, Not Local
**What goes wrong:** User selects "March 22" on the calendar and types "3:00 pm". If you naively construct `new Date('2026-03-22T15:00:00')`, JavaScript treats this as local time in some environments and UTC in others. The `scheduled_at` field stores UTC but must display in the tutor's timezone.
**Why it happens:** JavaScript `Date` constructor behavior differs between date-only strings (treated as UTC midnight) and datetime strings (treated as local).
**How to avoid:** Always combine the date and time in the tutor's timezone explicitly:
```typescript
import { fromZonedTime } from 'date-fns-tz'

function combineDateTime(dateStr: string, timeStr: string, timezone: string): Date {
  // dateStr = '2026-03-22', timeStr = '15:00'
  const localDatetime = `${dateStr}T${timeStr}:00`
  return fromZonedTime(new Date(localDatetime), timezone)  // returns UTC Date
}
```
**Warning signs:** Lessons appearing 10-11 hours off for Australian users.

### Pitfall 2: Recurring Lesson Insert — No Transaction
**What goes wrong:** If inserting 10 lessons in a loop and row 7 fails, you end up with a partial series. The UI shows inconsistent data.
**Why it happens:** Supabase JS client `.insert()` does not batch as a transaction by default.
**How to avoid:** Use a single `.insert(rows)` call with the full array. Supabase wraps multi-row inserts in an implicit transaction. Cap series at 52 rows to stay within Supabase free tier request limits.
```typescript
// Good — single insert call
const { error } = await supabase.from('lessons').insert(allRows)

// Bad — loop with individual inserts
for (const row of rows) {
  await supabase.from('lessons').insert(row)  // partial failure risk
}
```
**Warning signs:** Only some lessons of a series appearing in the schedule.

### Pitfall 3: Week Start Day Mismatch
**What goes wrong:** `startOfWeek(new Date())` defaults to Sunday (week start = 0) in date-fns, but Australian users expect Monday as the first day of the week. The calendar grid shows the wrong days.
**Why it happens:** date-fns `startOfWeek` locale default is Sunday.
**How to avoid:** Always pass `{ weekStartsOn: 1 }` (Monday) to `startOfWeek` and `endOfWeek`:
```typescript
import { startOfWeek, endOfWeek } from 'date-fns'
const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
```
**Warning signs:** Calendar showing Sunday–Saturday instead of Monday–Sunday.

### Pitfall 4: `students` Query Must Filter `is_active`
**What goes wrong:** Deactivated students still appear in the student picker and student list.
**Why it happens:** RLS only scopes by `tutor_id`, not `is_active`. The query must add this filter.
**How to avoid:**
- Student list page: provide an "Active"/"All" filter toggle; default to `is_active = true`
- Lesson form student combobox: always filter `.eq('is_active', true)` — tutor should not be able to book lessons for deactivated students
**Warning signs:** Deactivated students appearing in lesson creation combobox.

### Pitfall 5: Lesson Edit Cascade for Recurring Series
**What goes wrong:** User edits a lesson in a series. If the form modifies `recurring_series_id` or applies the change to all lessons in the series, it cascades unintended changes.
**Why it happens:** SCHED-06 says "defaults to this lesson only" but the intent might be ambiguous to implementers.
**How to avoid:** Phase 2 implements "this lesson only" — single `UPDATE` by `id`. Do not add "edit all in series" functionality in Phase 2 (it is deferred). Do not modify `recurring_series_id` on edit.

### Pitfall 6: Zod v4 — `z.string().email()` vs `z.email()`
**What goes wrong:** Confusion between zod v3 patterns (`.email()` as a method) and zod v4 new top-level validators. Both still work in v4, but mixing them inconsistently in a codebase creates confusion.
**Why it happens:** zod v4 added `z.email()`, `z.uuid()`, `z.url()` as top-level functions while keeping the method syntax for backward compatibility.
**How to avoid:** Pick one style and use it consistently. Recommendation: keep using `z.string().email()` (method syntax) for optional fields with `.or(z.literal(''))` to handle empty strings. Use `z.string().uuid()` for IDs.

---

## Code Examples

### Student list query (server-side)
```typescript
// src/lib/queries/students.ts
import { createClient } from '@/lib/supabase/server'

export async function getStudents(tutorId: string, includeInactive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('students')
    .select('id, name, parent_name, parent_phone, subject, default_rate, default_duration_minutes, is_active')
    .eq('tutor_id', tutorId)
    .order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

### Lessons for week query (server-side)
```typescript
// src/lib/queries/lessons.ts
import { createClient } from '@/lib/supabase/server'
import { endOfWeek } from 'date-fns'

export async function getLessonsForWeek(tutorId: string, weekStart: Date) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select('id, student_id, scheduled_at, duration_minutes, rate, status, recurring_series_id, students(name)')
    .eq('tutor_id', tutorId)
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', weekEnd.toISOString())
    .order('scheduled_at')

  if (error) throw error
  return data
}
```

### Lesson status update action
```typescript
// src/lib/actions/lessons.ts
'use server'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLessonStatus(
  lessonId: string,
  status: 'completed' | 'cancelled' | 'no_show'
) {
  const { tutorId } = await verifySession()
  const supabase = await createClient()

  const { error } = await supabase
    .from('lessons')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', lessonId)
    .eq('tutor_id', tutorId)

  if (error) return { error: error.message }
  revalidatePath('/schedule')
  return { success: true }
}
```

### date-fns v4 — grouping lessons by day
```typescript
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

type Lesson = { scheduled_at: string; [key: string]: unknown }

export function groupLessonsByDay(lessons: Lesson[], timezone: string) {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const zoned = toZonedTime(new Date(lesson.scheduled_at), timezone)
    const dayKey = format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(lesson)
    return acc
  }, {})
}
```

### Sonner toast setup
```typescript
// src/app/(app)/layout.tsx — add Toaster
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar className="hidden md:flex" />
      <main className="md:ml-64 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav className="flex md:hidden fixed bottom-0 left-0 right-0" />
      <Toaster position="bottom-center" />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `z.string().email()` only | Also `z.email()` top-level | zod v4 (2025) | Both work; prefer method syntax for backward compat |
| `@hookform/resolvers/zod` needed patch for zod v4 | v5.1+ has native zod v4 support | resolvers v5.1 (2025) | Installed v5.2.2 — no workaround needed |
| date-fns-tz separate package | date-fns v4 includes built-in TZ via `@date-fns/tz` | date-fns v4 (2024) | date-fns-tz still works fine; no migration needed |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 | Already on correct package; do not use auth-helpers |
| shadcn/ui Toast (deprecated) | Sonner | 2024 | The old `toast.tsx` component is deprecated; use `sonner.tsx` |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not add or reference. Already using `@supabase/ssr`.
- shadcn/ui `toast` component: The legacy toast.tsx is deprecated in shadcn/ui. Use Sonner for all notifications in this phase.
- `z.ostring()`, `z.onumber()` convenience helpers: Removed in zod v4. Use `z.string().optional()` instead.

---

## Open Questions

1. **Tutor timezone source for schedule rendering**
   - What we know: `tutors.timezone` column exists; `formatLessonDate(date, timezone)` utility already reads it
   - What's unclear: The schedule page Server Component must fetch the tutor's timezone alongside lessons. No query for `tutors` table exists yet.
   - Recommendation: Create a `getTutorProfile(tutorId)` query function in `src/lib/queries/tutors.ts`. Pass timezone as a prop to all calendar/list components.

2. **Week navigation — URL state or React state**
   - What we know: D-08 says same URL, instant switch (for calendar/list toggle). Week navigation direction was left to Claude's discretion.
   - What's unclear: Using URL search params (`?week=2026-03-23`) makes the schedule shareable/bookmarkable and allows server-side pre-fetch on navigation. Using React state is simpler but loses URL state.
   - Recommendation: Use URL search params for week (`?week=YYYY-MM-DD`) and view (`?view=calendar|list`). `useRouter().push()` + `useSearchParams()` on the client. Initial server render uses `searchParams` prop on the page component.

3. **Seed script update for new columns**
   - What we know: `scripts/seed.ts` inserts student rows; the schema now needs `subject` and `default_duration_minutes`
   - What's unclear: Whether the existing seed data already has representative durations (30, 45, 60, 90 min) for realistic testing
   - Recommendation: Update seed script in the same plan wave as the migration. Add `subject` and `default_duration_minutes` to all seed student rows.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read: `supabase/migrations/001_initial_schema.sql` — confirmed schema shape and gap
- Codebase direct read: `package.json` — confirmed all installed package versions
- Codebase direct read: `src/lib/actions/auth.ts`, `src/lib/dal.ts` — confirmed server action and DAL patterns
- Codebase direct read: `src/components/nav/Sidebar.tsx`, `BottomNav.tsx` — confirmed routes already wired
- Codebase direct read: `src/lib/utils/dates.ts` — confirmed `fromZonedTime`/`toZonedTime` pattern
- shadcn/ui official docs: https://ui.shadcn.com/docs/components — component availability confirmed

### Secondary (MEDIUM confidence)
- WebSearch verified: @hookform/resolvers v5.2.2 includes zod v4 support (v5.1.0+)
- WebSearch verified: Sonner is the current shadcn/ui recommended toast (old toast deprecated)
- WebSearch verified: shadcn/ui Combobox = Command + Popover composition pattern
- WebSearch verified: shadcn/ui Drawer (Vaul-based) supports bottom/side directions
- date-fns v4 blog: https://blog.date-fns.org/v40-with-time-zone-support/ — no major API breaking changes

### Tertiary (LOW confidence)
- zod v4 migration guide (WebSearch): String method syntax `.email()` still works; `z.email()` added as top-level — LOW because not verified against installed source directly

---

## Metadata

**Confidence breakdown:**
- Schema gap finding: HIGH — read migration SQL directly
- Standard stack versions: HIGH — read package.json directly
- shadcn/ui component patterns: HIGH — official docs confirmed
- zod v4 / resolvers v5 compatibility: MEDIUM — multiple sources agree, not verified from installed node_modules
- Date-fns v4 API stability: MEDIUM — official blog post + no breaking changes reported
- CSS Grid calendar pattern: MEDIUM — established React pattern, no library needed

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack, 30-day window)
