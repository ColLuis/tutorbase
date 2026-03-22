---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-22T10:21:57.013Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 8
  completed_plans: 5
---

# Project State: TutorBase

*This file is the single source of truth for session continuity. Updated after every plan completion and phase transition.*

---

## Project Reference

**Core Value:** A tutor can complete their entire weekly workflow — schedule lessons, mark them done, invoice parents with a professional PDF, and track payments — from their phone in minutes.

**Stack:** Next.js 15 (App Router), TypeScript, Supabase (Auth + PostgreSQL + RLS), Tailwind CSS, shadcn/ui, @react-pdf/renderer, date-fns + date-fns-tz

**Hosting:** Render free tier + Supabase free tier

---

## Current Position

Phase: 02 (students-and-scheduling) — EXECUTING
Plan: 3 of 5

## Phase Summary

| Phase | Goal | Status |
|-------|------|--------|
| 1. Foundation | Authenticated shell, complete DB schema with RLS, seed data | Not started |
| 2. Students and Scheduling | Full student roster and lesson scheduling with calendar views | Not started |
| 3. Invoicing and Payments | Invoice lifecycle, PDF generation, and payment tracking | Not started |
| 4. Dashboard and Revenue | Daily summary dashboard and revenue reporting | Not started |

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 0 |
| Plans total | TBD |
| Requirements shipped | 0/35 |
| Phases completed | 0/4 |

---
| Phase 01-foundation P01 | 12 | 2 tasks | 16 files |
| Phase 01-foundation P03 | 2 | 2 tasks | 7 files |
| Phase 01-foundation P02 | 4 | 2 tasks | 3 files |
| Phase 02-students-and-scheduling P01 | 2 | 2 tasks | 3 files |
| Phase 02-students-and-scheduling P02 | 6 | 2 tasks | 7 files |

## Accumulated Context

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Server-first architecture | Server Components for reads, Server Actions for mutations, Route Handlers only for PDF generation |
| Pre-generate recurring lessons | Individual DB rows with shared `recurring_series_id`; cap at 52 weeks; no on-the-fly expansion |
| `@supabase/ssr` (not auth-helpers) | Cookie-based session refresh in middleware; legacy package causes silent expiry |
| PostgreSQL sequence for invoice numbers | `invoice_number_seq` prevents race conditions; never derive from MAX() in application code |
| All timestamps as TIMESTAMPTZ | UTC storage; convert to `tutors.timezone` on display using date-fns-tz |
| Recurring edit defaults to "this lesson only" | Simpler default; avoids complex cascade edits |
| database.types.ts hand-maintained until Supabase connected | Stub placeholder typed tables as `never`; full schema required for TypeScript-correct mutations |
| zod v4 uses .issues not .errors on ZodError | API changed in zod v4; all server actions must use `parsed.error.issues[0].message` |

### Critical Pitfalls to Avoid

1. **Timezone-naive timestamps** — Use TIMESTAMPTZ from day one; write `formatLessonDate(date, timezone)` utility used everywhere
2. **RLS not enabled at table creation** — Enable RLS and write `tutor_id = auth.uid()` policies in initial migration SQL
3. **Wrong Supabase auth package** — Use `@supabase/ssr` exclusively; implement `middleware.ts` calling `supabase.auth.getUser()` on every request
4. **`@react-pdf/renderer` in Server Components** — PDF generation must be client-triggered via a Route Handler; spike in Phase 3 before full invoice UI
5. **Invoice number race condition** — Use `CREATE SEQUENCE invoice_number_seq` in schema migration; add unique constraint
6. **Verify Tailwind version** — Confirm whether `npx shadcn@latest init` installs Tailwind 3 or 4 at scaffold time (class names differ)

### Todos / Follow-ups

- [ ] Verify `npx shadcn@latest init` Tailwind version at scaffold time
- [ ] Run `npm show next version` before pinning to confirm v15
- [ ] Spike `@react-pdf/renderer` Route Handler pattern early in Phase 3
- [ ] Verify `date-fns-tz` 3.x API surface (`toZonedTime`/`fromZonedTime`) at install time
- [ ] Verify Supabase free-tier inactivity pause duration before deployment

### Blockers

None.

---

## Session Continuity

**To resume work:** Read ROADMAP.md for phase structure, then read the current phase's plan file in `.planning/plans/`.

**Next action:** Run `/gsd:plan-phase 1` to create the plan for Phase 1: Foundation.

---

*State initialized: 2026-03-22*
*Last updated: 2026-03-22 after 02-02 data layer completion*
*Stopped at: Completed 02-students-and-scheduling/02-02-PLAN.md*
