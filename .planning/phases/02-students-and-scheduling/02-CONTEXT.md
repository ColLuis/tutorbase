# Phase 2: Students and Scheduling - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Full student roster management (CRUD, search, filter, deactivate) and lesson scheduling (single + recurring, calendar + list views, quick status updates). Tutor profile editing (AUTH-04) also included. Invoicing and payments are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Lesson creation flow
- **D-01:** Student picker is a searchable dropdown (combobox) — type to filter student names
- **D-02:** Recurring lessons use a "Repeat weekly for N weeks" toggle on the lesson form — all lessons pre-generated at once with shared `recurring_series_id`
- **D-03:** Date input via calendar picker, time input is free text (allows non-standard times like 3:45, 2:15)
- **D-04:** Lesson form presented as a bottom drawer on mobile, side drawer on desktop — stays in context of the schedule

### Schedule views
- **D-05:** Weekly calendar auto-fits time range to lessons (1 hour padding before/after earliest and latest lessons)
- **D-06:** On mobile, calendar shows a compressed week grid with minimal info (colored blocks) — tap to expand a day
- **D-07:** Each lesson block shows student name + time only, color-coded by status. Tap for full details.
- **D-08:** Calendar and list views toggle via a button on the same page (same URL, instant switch)

### Quick status updates
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in REQUIREMENTS.md and decisions above.

### Project references
- `.planning/REQUIREMENTS.md` — Requirements STUD-01 through STUD-05 and SCHED-01 through SCHED-07 define acceptance criteria
- `.planning/PROJECT.md` — Constraints (44px tap targets, WCAG AA, mobile-first), tech stack (shadcn/ui, date-fns, react-hook-form + zod)
- `supabase/migrations/001_initial_schema.sql` — Students and lessons table schemas, RLS policies, status constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx` — shadcn/ui primitives ready to use
- `src/lib/dal.ts` — `verifySession()` for protecting server actions
- `src/lib/actions/auth.ts` — Pattern for server actions (login/logout)
- `src/lib/utils/currency.ts` — `formatCurrency()` for displaying rates
- `src/lib/utils/dates.ts` — `formatLessonDate()`, `formatShortDate()`, `formatTime()` utilities
- `src/lib/supabase/server.ts` and `client.ts` — Supabase client factories

### Established Patterns
- Server Actions pattern via `src/lib/actions/` directory
- DAL pattern: `verifySession()` before any data access
- App routes under `src/app/(app)/` for authenticated pages
- Auth routes under `src/app/(auth)/` for login
- Responsive pattern: `hidden md:flex` for desktop-only, `flex md:hidden` for mobile-only

### Integration Points
- Nav items in `src/components/nav/Sidebar.tsx` and `BottomNav.tsx` already have Students and Schedule entries — pages just need to exist at the right routes
- `src/app/(app)/page.tsx` is the home/dashboard placeholder — Phase 4 will populate it

### Schema Notes
- Students table has no `subject` or `default_duration` column — requirements mention both. Migration may need adding these columns.
- Lessons table has `recurring_series_id` (UUID) ready for recurring lesson grouping
- Lesson status CHECK constraint: `scheduled`, `completed`, `cancelled`, `no_show`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-students-and-scheduling*
*Context gathered: 2026-03-22*
