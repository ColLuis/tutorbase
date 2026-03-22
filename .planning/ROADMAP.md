# Roadmap: TutorBase

**Project:** TutorBase
**Core Value:** A tutor can complete their entire weekly workflow — schedule lessons, mark them done, invoice parents with a professional PDF, and track payments — from their phone in minutes.
**Created:** 2026-03-22
**Granularity:** Coarse (4 phases)
**Coverage:** 35/35 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation** - Authenticated shell, complete DB schema with RLS, and dev seed data (completed 2026-03-22)
- [ ] **Phase 2: Students and Scheduling** - Full student roster and lesson scheduling with calendar views
- [ ] **Phase 3: Invoicing and Payments** - Invoice lifecycle, PDF generation, and payment tracking
- [ ] **Phase 4: Dashboard and Revenue** - Daily summary dashboard and revenue reporting

---

## Phase Details

### Phase 1: Foundation

**Goal**: A tutor can log in, see a protected shell, and the database is fully provisioned with RLS and correct timezone/currency infrastructure.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Tutor can log in with email and password and reach a protected home route
  2. Refreshing the browser does not log the tutor out
  3. Navigating to any protected route while unauthenticated redirects to the login page
  4. The app renders a mobile bottom nav on small screens and a sidebar on desktop
  5. A developer can run the seed script and have sample data in all tables without errors
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold project, install deps, create Supabase auth infra and utility functions
- [x] 01-02-PLAN.md — Database migration with RLS policies and seed script
- [x] 01-03-PLAN.md — Login page UI and responsive app shell (sidebar + bottom nav)

### Phase 2: Students and Scheduling

**Goal**: A tutor can manage their full student roster and build a weekly schedule, marking lessons as completed, cancelled, or no-show.
**Depends on**: Phase 1
**Requirements**: AUTH-04, STUD-01, STUD-02, STUD-03, STUD-04, STUD-05, SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07
**Success Criteria** (what must be TRUE):
  1. Tutor can add a student with name, parent contact, subject, hourly rate, and lesson duration and see them in the student list
  2. Tutor can edit a student's details and deactivate them without losing their lesson history
  3. Tutor can create a single lesson or a recurring weekly series, and new lessons pre-fill the student's default rate and duration
  4. Tutor can view their schedule in both a week calendar grid and a chronological list, and navigate forward and backward by week
  5. Tutor can tap a lesson and mark it completed, cancelled, or no-show without opening a full edit form
**Plans**: 5 plans
Plans:
- [x] 02-01-PLAN.md — Schema migration (subject + default_duration_minutes), seed update, time parsing utility
- [x] 02-02-PLAN.md — Data layer: queries and server actions for students, lessons, and tutor profile
- [x] 02-03-PLAN.md — Student CRUD pages and tutor profile edit (AUTH-04, STUD-01 through STUD-05)
- [ ] 02-04-PLAN.md — Schedule page: calendar + list views, lesson form drawer, status quick actions (SCHED-01 through SCHED-07)
- [ ] 02-05-PLAN.md — Human verify checkpoint: end-to-end functional verification

### Phase 3: Invoicing and Payments

**Goal**: A tutor can generate a professional PDF invoice from completed lessons, manage its lifecycle from draft to paid, and record payment with a receipt.
**Depends on**: Phase 2
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, PAY-01, PAY-02
**Success Criteria** (what must be TRUE):
  1. Tutor can create an invoice for a student that is auto-populated with all un-invoiced completed lessons, each with the correct rate and duration
  2. Each new invoice receives a unique sequential number (e.g. INV-0001) with no duplicates or gaps under concurrent use
  3. Tutor can set issue and due dates, save as draft, or finalise (status moves to sent), and view all invoices filtered by status
  4. Tutor can download a professional PDF of the invoice showing their business details, ABN, line items, totals, and bank payment info
  5. Tutor can mark an invoice as paid with a payment date and method, which auto-generates a receipt record
**Plans**: TBD

### Phase 4: Dashboard and Revenue

**Goal**: A tutor can open the app and immediately see their day and financial position, and drill into monthly and per-student revenue.
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, REV-01, REV-02
**Success Criteria** (what must be TRUE):
  1. Dashboard shows today's lessons with student name, time, and current status
  2. Dashboard shows weekly lesson count, unpaid invoice count and total amount, and monthly and yearly revenue figures
  3. Dashboard has one-tap quick actions to add a lesson, create an invoice, and add a student
  4. Revenue page shows a monthly breakdown of lessons delivered, amounts invoiced, paid, and outstanding
  5. Revenue page shows a per-student breakdown so the tutor can see their most and least active students by revenue
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-22 |
| 2. Students and Scheduling | 3/5 | In Progress|  |
| 3. Invoicing and Payments | 0/? | Not started | - |
| 4. Dashboard and Revenue | 0/? | Not started | - |

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| INFRA-01 | Phase 1 |
| INFRA-02 | Phase 1 |
| INFRA-03 | Phase 1 |
| INFRA-04 | Phase 1 |
| AUTH-04 | Phase 2 |
| STUD-01 | Phase 2 |
| STUD-02 | Phase 2 |
| STUD-03 | Phase 2 |
| STUD-04 | Phase 2 |
| STUD-05 | Phase 2 |
| SCHED-01 | Phase 2 |
| SCHED-02 | Phase 2 |
| SCHED-03 | Phase 2 |
| SCHED-04 | Phase 2 |
| SCHED-05 | Phase 2 |
| SCHED-06 | Phase 2 |
| SCHED-07 | Phase 2 |
| INV-01 | Phase 3 |
| INV-02 | Phase 3 |
| INV-03 | Phase 3 |
| INV-04 | Phase 3 |
| INV-05 | Phase 3 |
| INV-06 | Phase 3 |
| INV-07 | Phase 3 |
| INV-08 | Phase 3 |
| PAY-01 | Phase 3 |
| PAY-02 | Phase 3 |
| DASH-01 | Phase 4 |
| DASH-02 | Phase 4 |
| DASH-03 | Phase 4 |
| REV-01 | Phase 4 |
| REV-02 | Phase 4 |

**Total mapped:** 35/35 requirements

---

*Roadmap created: 2026-03-22*
*Last updated: 2026-03-22 after Phase 2 planning*
