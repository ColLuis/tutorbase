# Feature Landscape

**Domain:** Solo tutor operations management (scheduling, invoicing, payment tracking)
**Researched:** 2026-03-22
**Confidence:** MEDIUM — based on training knowledge of tutoring management software ecosystem (TutorBird, Teachworks, TutorCruncher, Acuity Scheduling, and general SMB service-business patterns). Web research tools unavailable; findings reflect knowledge through August 2025. Flag for live competitor validation before roadmap is finalised.

---

## Table Stakes

Features users expect from any tutoring management tool. Missing = product feels incomplete or forces the tutor back to spreadsheets.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Student roster with contact info | Every tutor tracks students by name; parent contact is the billing relationship | Low | Name, parent name/email/phone, subject, notes |
| Per-student rate configuration | Tutors charge different rates per student or subject | Low | Hourly rate; flat rate option nice but not required for v1 |
| Lesson scheduling (single lessons) | Core workflow — booking a session | Low-Med | Date, time, duration, student, location |
| Recurring lesson scheduling | Most tutor-student relationships are weekly; manual entry per lesson is a deal-breaker | Med | Weekly recurrence for N weeks is the dominant pattern |
| Calendar/schedule view | Tutors need to see their week at a glance before/after booking | Med | Week view is table stakes; month view is nice-to-have |
| Lesson status tracking (completed/cancelled/no-show) | Revenue tracking depends on knowing what actually happened | Low | Quick-update flow matters; full edit is overkill per-lesson |
| Invoice generation | This is the primary pain point tutors pay to solve | Med | Auto-populate from completed lessons; sequential numbering |
| PDF invoice output | Parents expect a professional document, not a screenshot | Med | Must look credible enough to email or WhatsApp |
| Invoice lifecycle (draft → sent → paid) | Tutors need to know what's outstanding | Low | Minimum: unpaid vs paid; draft is useful for review before sending |
| Mark as paid flow | Closes the billing loop | Low | Date of payment; generate receipt |
| PDF receipt generation | Some families request receipts for tax/expense purposes | Low-Med | Auto-generated from payment record |
| Revenue summary | Tutors need to know how much they earned this month | Med | Monthly totals; per-student breakdown |
| Business details on invoices | ABN, bank details (BSB/account) must appear on the invoice | Low | Settings page stores these; stamped on every invoice |
| Mobile-usable interface | Tutors log lessons between sessions, often on a phone | Med | Bottom nav, large tap targets, readable at arm's length |
| Secure login | This is financial data; must be protected | Low | Email/password auth; no shared login |
| Data isolation (RLS) | If a second tutor is added, data must never bleed | Med | Row Level Security at the database layer |

---

## Differentiators

Features that go beyond baseline expectations. Not required to ship, but create competitive advantage or delight.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dashboard with today's snapshot | Replaces the "check my calendar then check my spreadsheet" habit; the app becomes the morning routine | Med | Today's lessons, weekly count, unpaid invoices total, quick actions |
| Quick lesson status update (no full form) | Reduces friction dramatically for the most common post-lesson action | Low | Tap-to-complete from schedule view or dashboard |
| Manual line items on invoices | Handles materials, travel, one-off charges; tutors are often asked to buy workbooks | Low-Med | Free-text description + amount; appears alongside auto-populated lesson lines |
| Recurring edit scoped to "this lesson only" | Avoids the feared "I changed one lesson and it broke all of them" experience | Med | Most apps default to "all future" which is the wrong default for tutors |
| Unpaid invoices widget on dashboard | Forces attention to outstanding payments without a separate chasing workflow | Low | Count + total amount; link to invoice list |
| Revenue page with monthly + student breakdown | Helps tutors understand their business, not just log transactions | Med | Monthly bar/line, per-student table, YTD total |
| Timezone stored per tutor profile | Future-proofing for tutors who move or work across zones | Low | Already in scope; low cost, high value signal to tutor |
| Seed/demo data script | Dramatically accelerates onboarding for new users or testing | Low | Dev-facing feature but produces a better first-run experience |
| Invoice defaults (payment terms, notes) | Tutors often use the same payment instructions every invoice; autofill removes repetition | Low | Stored in settings; injected into new invoices |
| Student deactivation (not deletion) | Preserves invoice history for past students; tutors often revisit students after gaps | Low | Soft delete / inactive flag; filter from active view |
| List view of schedule (alongside week view) | Some tutors prefer a scrollable list to a grid calendar, especially on mobile | Low | Toggle between views; list is easier to scan on small screens |

---

## Anti-Features

Features to explicitly NOT build in v1. Building these creates maintenance debt and scope creep without proportional user value at solo-tutor scale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online payment integration (Stripe/PayPal) | Setup friction, fees, and compliance overhead that exceeds value for a tutor collecting $50-$200 payments manually | Include BSB/account details on PDF invoice; mark paid manually |
| Parent-facing portal (login, booking, history) | Doubles the product scope; parents are happy to receive PDFs via WhatsApp; adding a portal requires auth, notifications, and a whole separate UX surface | Tutor downloads PDF and sends manually |
| In-app email sending | Requires email infrastructure (SendGrid/SES), deliverability management, and adds privacy surface; marginal gain | Tutor sends the PDF from their own email/WhatsApp |
| Calendar sync (Google/Apple) | OAuth complexity, sync conflicts, edge cases with recurring events are a significant engineering investment; the app IS the calendar | Build a clean in-app schedule instead |
| Student progress tracking / report cards | Separate domain from operations; tutors who need this use dedicated tools (e.g., Google Docs templates) | Keep notes field per student for ad-hoc observations |
| Lesson reminders / notifications | Push notification infra, permission flows, and unsubscribe handling; benefit is real but cost is high for v1 | Tutor relies on their own calendar for reminders |
| Self-service signup page | Unnecessary for 1-2 users; creates account management complexity (password reset flows, email verification) for zero additional users | Provision accounts via Supabase Dashboard; plan signup for v2 |
| Multi-currency support | Scope creep; the tutor is in Australia and invoices in AUD | Design the data model to be currency-aware (store currency code) but only render AUD in v1 |
| GST/tax line item automation | Australian GST rules (registered vs non-registered) add edge-case complexity; most private tutors are not GST-registered | Allow free-text notes on invoices to mention GST if needed |
| Dark mode | Cosmetic; zero functional value; doubles CSS QA surface | Ship a clean light mode; defer to v2 |
| Monthly subscription / billing management | No recurring billing needed for a personal tool | N/A |
| Multi-timezone scheduling | Single timezone per tutor profile is sufficient; tutors don't schedule across zones | Store timezone in profile; convert display times to that zone |
| Bulk lesson import (CSV) | Edge case for initial setup; manually booking a typical tutor's 10-15 students is feasible | Consider if a second tutor is onboarded at scale |
| Time-tracking / clock-in-out | Tutors know their lesson times in advance; real-time tracking adds no value | Schedule is the source of truth |

---

## Feature Dependencies

These dependency relationships determine build order.

```
Auth / RLS
  └── All other features (nothing works without identity + data isolation)

Student CRUD
  └── Lesson scheduling (lessons belong to students)
      └── Invoice creation (invoices auto-populate from lessons)
          └── Invoice PDF generation (PDF renders invoice data)
              └── Mark as Paid / Receipt PDF

Settings (business details, timezone, invoice defaults)
  └── Invoice PDF generation (stamped on PDF)
  └── Lesson display (timezone affects displayed times)

Lesson status tracking (completed/cancelled/no-show)
  └── Invoice auto-population (only completed, un-invoiced lessons appear)
  └── Revenue page (only completed lessons count as earned)

Revenue page
  └── Lesson status tracking
  └── Invoice lifecycle (paid invoices drive revenue)

Dashboard
  └── Lesson scheduling (today's lessons)
  └── Invoice lifecycle (unpaid invoices widget)
  └── Revenue page (summary metrics)
```

---

## MVP Recommendation

The minimum that replaces a spreadsheet and delivers the core promise ("schedule, mark done, invoice, track payment from your phone"):

**Must ship in MVP:**
1. Auth (Supabase email/password) — everything gates on this
2. Student CRUD — the entity everything else belongs to
3. Lesson scheduling (single + weekly recurring)
4. Week view + list view of schedule
5. Quick lesson status update
6. Invoice creation auto-populated from completed lessons
7. Invoice PDF generation with business details
8. Invoice lifecycle (draft → sent → paid)
9. Mark as Paid + receipt PDF
10. Settings (profile, business details, invoice defaults, timezone)
11. Mobile-first responsive design (bottom nav / sidebar)

**Prioritise early because other features depend on them:**
- Auth and RLS (blocks everything)
- Student CRUD (blocks lessons)
- Lesson scheduling + status (blocks invoicing and revenue)
- Settings / business details (blocks PDF generation being useful)

**Defer to v2 (validated or not yet needed):**
- Revenue page with full breakdown (useful, but not blocking invoicing)
- Dashboard (convenient, but user can navigate directly)
- Manual line items on invoices (needed eventually; schedule as phase 2 of invoicing work)
- Signup page (only needed when adding users beyond founder)

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — direct user requirements)
- Domain knowledge: TutorBird, Teachworks, TutorCruncher, Acuity Scheduling feature sets as known through August 2025 (MEDIUM confidence — training data, not live-verified)
- SMB service-business invoicing patterns (general, MEDIUM confidence)
- NOTE: Web research tools were unavailable during this session. Recommend live competitor feature audit (TutorBird /features, Teachworks /features, TutorCruncher /features) before finalising roadmap phase boundaries.
