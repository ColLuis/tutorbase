# Requirements: TutorBase

**Defined:** 2026-03-22
**Core Value:** A tutor can complete their entire weekly workflow — schedule lessons, mark them done, invoice parents with a professional PDF, and track payments — from their phone in minutes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: All routes except login are protected (redirect to login if unauthenticated)
- [ ] **AUTH-04**: User can view and edit their tutor profile (name, email)

### Students

- [ ] **STUD-01**: User can add a student with name, parent contact, subject, rate, and duration
- [ ] **STUD-02**: User can view a list of all students with search and filter
- [ ] **STUD-03**: User can view a student's detail page
- [ ] **STUD-04**: User can edit a student's information
- [ ] **STUD-05**: User can deactivate a student (soft delete)

### Scheduling

- [ ] **SCHED-01**: User can create a single lesson for a student with date, time, duration, and rate
- [ ] **SCHED-02**: User can create recurring weekly lessons for N weeks (pre-generated)
- [ ] **SCHED-03**: User can view lessons in a weekly calendar grid
- [ ] **SCHED-04**: User can view lessons in a chronological list grouped by day
- [ ] **SCHED-05**: User can mark a lesson as completed, cancelled, or no-show via quick action
- [ ] **SCHED-06**: User can edit a single lesson (defaults to "this lesson only" for recurring)
- [ ] **SCHED-07**: Lessons pre-fill duration and rate from student defaults

### Invoicing

- [ ] **INV-01**: User can create an invoice for a student auto-populated from un-invoiced completed lessons
- [ ] **INV-02**: Invoice receives a sequential number (INV-0001) via database sequence
- [ ] **INV-03**: User can set issue date and due date on an invoice
- [ ] **INV-04**: User can save invoice as draft or finalise (sets status to sent)
- [ ] **INV-05**: User can view all invoices filtered by status (all, draft, sent, paid, overdue)
- [ ] **INV-06**: User can view invoice detail with all line items
- [ ] **INV-07**: User can download invoice as a professional PDF with tutor business details
- [ ] **INV-08**: User can delete a draft invoice

### Payments

- [ ] **PAY-01**: User can mark an invoice as paid with payment date and method
- [ ] **PAY-02**: Marking as paid auto-generates a receipt record

### Dashboard

- [ ] **DASH-01**: Dashboard shows today's lessons with student name, time, and status
- [ ] **DASH-02**: Dashboard shows weekly lesson count, unpaid invoice count/total, monthly and yearly revenue
- [ ] **DASH-03**: Dashboard has quick action buttons for Add Lesson, Create Invoice, Add Student

### Revenue

- [ ] **REV-01**: User can view monthly revenue breakdown (lessons, invoiced, paid, outstanding)
- [ ] **REV-02**: User can view per-student revenue breakdown

### Infrastructure

- [ ] **INFRA-01**: Mobile-first responsive design with bottom nav (mobile) and sidebar (desktop)
- [ ] **INFRA-02**: Row Level Security enabled on all database tables
- [ ] **INFRA-03**: Seed script creates sample tutor, students, lessons, invoices for development
- [x] **INFRA-04**: All tables use TIMESTAMPTZ for date/time storage

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-05**: User can self-register via signup page
- **AUTH-06**: Primary tutor can invite a second tutor by email

### Students

- **STUD-06**: Student profile page with lesson history and invoices tabs

### Invoicing

- **INV-09**: User can add manual line items to invoices (materials, one-off charges)
- **INV-10**: Receipt PDF generation and download

### Settings

- **SET-01**: Business details editing (business name, ABN, phone, bank details)
- **SET-02**: Invoice defaults (payment terms, default notes, GST toggle)
- **SET-03**: Timezone setting (default Australia/Sydney)

### Infrastructure

- **INFRA-05**: Data export (JSON dump of all user data)
- **INFRA-06**: Dark mode

## Out of Scope

| Feature | Reason |
|---------|--------|
| Online payment integration (Stripe) | Not needed for v1 manual payment tracking |
| Parent-facing portal | Parents receive PDFs manually via WhatsApp/email |
| In-app email sending | Tutor downloads PDFs and sends manually |
| Calendar sync (Google/Apple) | Complexity vs value tradeoff |
| Student progress tracking / report cards | Separate concern from operations |
| Notification system (lesson reminders) | Nice-to-have, not core |
| Multi-timezone support | Single timezone per tutor sufficient |
| Multi-currency | AUD only for v1, design for flexibility |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Complete |
| AUTH-04 | Phase 2 | Pending |
| STUD-01 | Phase 2 | Pending |
| STUD-02 | Phase 2 | Pending |
| STUD-03 | Phase 2 | Pending |
| STUD-04 | Phase 2 | Pending |
| STUD-05 | Phase 2 | Pending |
| SCHED-01 | Phase 2 | Pending |
| SCHED-02 | Phase 2 | Pending |
| SCHED-03 | Phase 2 | Pending |
| SCHED-04 | Phase 2 | Pending |
| SCHED-05 | Phase 2 | Pending |
| SCHED-06 | Phase 2 | Pending |
| SCHED-07 | Phase 2 | Pending |
| INV-01 | Phase 3 | Pending |
| INV-02 | Phase 3 | Pending |
| INV-03 | Phase 3 | Pending |
| INV-04 | Phase 3 | Pending |
| INV-05 | Phase 3 | Pending |
| INV-06 | Phase 3 | Pending |
| INV-07 | Phase 3 | Pending |
| INV-08 | Phase 3 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| REV-01 | Phase 4 | Pending |
| REV-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
