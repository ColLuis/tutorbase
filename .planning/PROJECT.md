# TutorBase

## What This Is

TutorBase is a mobile-first responsive web application for solo tutors to manage their tutoring operations — scheduling lessons, tracking students, generating professional PDF invoices and receipts, and monitoring revenue. It replaces spreadsheets and manual tracking with a purpose-built tool that works seamlessly on a phone or laptop.

## Core Value

A tutor can complete their entire weekly workflow — schedule lessons, mark them done, invoice parents with a professional PDF, and track payments — from their phone in minutes.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Full student CRUD — add, view, edit, deactivate students with parent contact info, rates, and notes (Validated in Phase 2: Students and Scheduling)
- [x] Lesson scheduling with single and recurring lessons (weekly recurrence for N weeks) (Validated in Phase 2)
- [x] Week view calendar and list view for schedule with forward/backward navigation (Validated in Phase 2)
- [x] Quick lesson status updates (completed, cancelled, no-show) without full edit (Validated in Phase 2)
- [x] Recurring lesson editing defaults to "this lesson only" (Validated in Phase 2)
- [x] Dashboard with today's lessons, weekly counts, unpaid invoices, revenue metrics, and quick actions (Validated in Phase 4: Dashboard and Revenue)
- [x] Revenue page with monthly breakdown, student breakdown, and summary metrics (Validated in Phase 4: Dashboard and Revenue)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Password-protected login with Supabase Auth (email/password, no signup page for v1)
- [ ] Invoice creation auto-populated from un-invoiced completed lessons, with manual line item support
- [ ] Invoice lifecycle: draft → sent → paid, with invoice number generation (INV-0001)
- [ ] Professional PDF invoice generation with tutor business details, line items, payment info
- [ ] Mark as Paid flow with auto-generated receipt record and PDF
- [ ] Settings page for profile, business details (ABN, bank details), and invoice defaults
- [ ] Mobile-first responsive design with bottom nav (mobile) and sidebar (desktop)
- [ ] Row Level Security on all Supabase tables for data isolation
- [ ] Timezone stored in tutor profile settings (default Australia/Sydney)
- [ ] AUD currency for v1, designed so currency/tax can be swapped later
- [ ] Seed script for development data (tutor, students, lessons, invoices, receipt)

### Out of Scope

- Online payment integration (Stripe, etc.) — not needed for v1 manual payment tracking
- Parent-facing portal — parents receive PDFs manually via WhatsApp/email
- In-app email sending — tutor downloads PDFs and sends manually
- Calendar sync (Google/Apple Calendar) — complexity vs value tradeoff
- Student progress tracking / report cards — separate concern from operations
- Notification system (lesson reminders) — nice-to-have, not core
- Multi-timezone support — single timezone per tutor profile is sufficient
- Dark mode — cosmetic, defer to v2
- Self-service signup page — create users via Supabase Dashboard for v1, plan for v2

## Context

- Built for a solo tutor based in Australia, with potential for a second tutor later
- Tutors currently use spreadsheets — the pain point is manual invoice generation and revenue tracking
- Must work well on iPhone (primary device for between-lesson use) and laptop (for invoicing/admin)
- Supabase free tier (500 MB storage, 50K MAU) is more than sufficient for solo/duo tutor use
- Render free tier has cold start (~30 seconds after 15 min idle) — acceptable for personal tool
- PDF invoices need to look professional enough to send to parents
- Australian business context: optional ABN, optional GST, bank transfer details (BSB/account)

## Constraints

- **Tech stack**: Next.js 14+ (App Router), TypeScript, Supabase, Tailwind CSS, shadcn/ui, @react-pdf/renderer
- **Hosting**: Render free tier (750 hrs/mo) + Supabase free tier (no credit card required)
- **Auth**: Supabase Auth email/password — no NextAuth.js
- **DB Client**: @supabase/supabase-js with generated TypeScript types
- **Date handling**: date-fns
- **Mobile**: minimum 44×44px tap targets, thumb-friendly forms, bottom navigation
- **Accessibility**: WCAG AA colour contrast, labelled inputs, keyboard navigable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over custom auth/DB | Free tier, hosted PostgreSQL, built-in auth, RLS, type generation | — Pending |
| Render over Vercel | Free tier with no credit card, commercial use allowed | — Pending |
| No signup page for v1 | Only 1-2 tutors needed, create via Supabase Dashboard | — Pending |
| AUD-only but flexible design | User is Australian, but wants to support other currencies eventually | — Pending |
| Recurring edit = this lesson only | Simpler default, avoids complex cascade edits | — Pending |
| Timezone in profile settings | Default Sydney but allow tutor to change | — Pending |
| Manual line items on invoices | Supports materials, one-off charges beyond lesson fees | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after Phase 4 completion — Dashboard and Revenue*
