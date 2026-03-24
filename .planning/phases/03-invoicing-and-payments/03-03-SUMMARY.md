---
phase: 03-invoicing-and-payments
plan: "03"
subsystem: invoice-creation-ui
tags: [invoices, ui, client-component, server-component, forms, lessons]
dependency_graph:
  requires: [src/lib/actions/invoices.ts, src/lib/queries/invoices.ts, src/lib/queries/students.ts, src/lib/queries/tutors.ts]
  provides: [src/app/(app)/invoices/new/page.tsx, src/components/invoices/CreateInvoiceForm.tsx]
  affects: [src/app/(app)/students/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [server-component, client-component, useTransition, sonner-toast, date-fns-tz]
key_files:
  created:
    - src/app/(app)/invoices/new/page.tsx
    - src/components/invoices/CreateInvoiceForm.tsx
  modified:
    - src/app/(app)/students/[id]/page.tsx
decisions:
  - "Tutor timezone fetched via getTutorProfile() in server page and passed as prop to form — avoids client-side DB calls"
  - "Selected lesson IDs tracked via Set<string> in state; serialized to comma-separated string for FormData submission"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-24"
  tasks_completed: 1
  files_changed: 3
---

# Phase 3 Plan 3: Invoice Creation Flow Summary

**One-liner:** Full-page invoice creation UI from student detail entry point — checkbox lesson selection, running subtotal, date fields, and save-draft/send actions via server action.

---

## What Was Built

### Task 1: Add "Create Invoice" button to student detail and build create invoice page

**`src/app/(app)/students/[id]/page.tsx`** (modified):
- Added "Create Invoice" Button with `render={<Link href="/invoices/new?studentId=...">}` in the action buttons row
- Only shown when `student.is_active === true`

**`src/app/(app)/invoices/new/page.tsx`** (created — Server Component):
- Reads `studentId` from `searchParams` — redirects to `/students` if missing
- Calls `verifySession()`, `getStudent()`, `getUnInvoicedLessons()`, and `getTutorProfile()` in parallel
- Renders heading "New Invoice for {student.name}" with back link to `/students/{studentId}`
- Shows empty state "No completed lessons to invoice" when no un-invoiced lessons exist
- Passes `lessons`, `studentId`, `studentName`, `timezone` to `CreateInvoiceForm`

**`src/components/invoices/CreateInvoiceForm.tsx`** (created — Client Component):
- Checkbox rows for each un-invoiced lesson showing formatted date, duration, rate, and calculated amount
- All lessons checked by default via `Set<string>` state
- Running subtotal recomputed on every checkbox toggle
- Issue date defaults to today, due date defaults to today + 14 days (via `date-fns` `addDays`)
- Notes textarea with placeholder "Payment due within 14 days"
- "Save Draft" and "Send Invoice" buttons both use `useTransition` for pending state
- Builds FormData manually and calls `createInvoice` server action
- On success: `router.push('/invoices/' + invoiceId)` via returned invoiceId
- On error: `toast.error(result.error)` via sonner
- Mobile-first layout with 44px minimum tap targets

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 2e4b7ed | feat(03-02): InvoicePDF document component and PDF download Route Handler (files committed by parallel agent) |

---

## Deviations from Plan

None - plan executed exactly as written. The three target files were implemented per specification. Files were committed as part of a parallel agent's commit during plan 03-02 execution.

---

## Known Stubs

None — all data is fetched from real database queries. Lesson amounts are computed from actual `duration_minutes` and `rate` values.

---

## Self-Check: PASSED

Files verified to exist:
- src/app/(app)/invoices/new/page.tsx — FOUND
- src/components/invoices/CreateInvoiceForm.tsx — FOUND
- src/app/(app)/students/[id]/page.tsx (modified) — FOUND

Acceptance criteria:
- grep "invoices/new" src/app/(app)/students/[id]/page.tsx — PASSED
- grep "use client" src/components/invoices/CreateInvoiceForm.tsx — PASSED
- grep "createInvoice" src/components/invoices/CreateInvoiceForm.tsx — PASSED
- grep "Save Draft" src/components/invoices/CreateInvoiceForm.tsx — PASSED
- grep "checkbox" src/components/invoices/CreateInvoiceForm.tsx — PASSED
- grep "verifySession" src/app/(app)/invoices/new/page.tsx — PASSED
- grep "getUnInvoicedLessons" src/app/(app)/invoices/new/page.tsx — PASSED
- File src/app/(app)/invoices/new/page.tsx exists — PASSED
- npx tsc --noEmit exits cleanly — PASSED (0 errors)
