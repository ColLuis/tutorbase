---
phase: 03-invoicing-and-payments
plan: "01"
subsystem: data-layer
tags: [invoices, receipts, server-actions, queries, pdf, database]
dependency_graph:
  requires: [supabase/migrations/001_initial_schema.sql, src/lib/dal.ts, src/lib/supabase/server.ts]
  provides: [src/lib/queries/invoices.ts, src/lib/actions/invoices.ts, supabase/migrations/002_invoice_receipt_functions.sql]
  affects: [src/app/(app)/invoices, src/app/(app)/students]
tech_stack:
  added: ["@react-pdf/renderer@4.3.2"]
  patterns: [server-actions, zod-v4, supabase-rpc, db-sequences]
key_files:
  created:
    - supabase/migrations/002_invoice_receipt_functions.sql
    - src/lib/queries/invoices.ts
    - src/lib/actions/invoices.ts
  modified:
    - next.config.ts
    - package.json
    - package-lock.json
decisions:
  - "Cast status string to 'draft' | 'sent' | 'paid' union type in getInvoices() to satisfy Supabase-generated TypeScript types"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_changed: 6
---

# Phase 3 Plan 1: Invoice Data Layer Summary

**One-liner:** JWT-protected invoice data layer with DB sequence numbering, atomic receipt creation, and @react-pdf/renderer installed for PDF generation.

---

## What Was Built

### Task 1: @react-pdf/renderer, DB Migration, next.config.ts

- Installed `@react-pdf/renderer@4.3.2` as a runtime dependency
- Created `supabase/migrations/002_invoice_receipt_functions.sql` with:
  - `CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1` — mirrors the existing `invoice_number_seq`
  - `get_next_invoice_number()` — SECURITY DEFINER function returning `'INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0')`
  - `get_next_receipt_number()` — SECURITY DEFINER function returning `'REC-' || LPAD(nextval('receipt_number_seq')::TEXT, 4, '0')`
- Updated `next.config.ts` to add `serverExternalPackages: ['@react-pdf/renderer']` preventing SSR bundling of the PDF renderer

### Task 2: Invoice Queries and Server Actions

**`src/lib/queries/invoices.ts`** — 4 exported query functions:
- `getUnInvoicedLessons(tutorId, studentId)` — completed lessons with no invoice_id, ordered by scheduled_at
- `getInvoices(tutorId, status?)` — all invoices with student name join; supports status filter including 'overdue' (sent + due_date < today, computed client-side)
- `getInvoice(tutorId, invoiceId)` — single invoice with full join: students, invoice_items, receipts
- `getTutorForInvoice(tutorId)` — tutor name only (per D-07: header shows tutor name only for v1)

**`src/lib/actions/invoices.ts`** — 4 exported server actions with `'use server'`:
- `createInvoice(formData)` — validates with Zod, fetches lessons for amounts, calls RPC for invoice number, inserts invoice + items, updates lessons.invoice_id, revalidates
- `sendInvoice(formData)` — sets status to 'sent' for draft invoices only
- `deleteInvoice(formData)` — deletes draft invoices only; CASCADE removes items, SET NULL unlinks lessons
- `markInvoicePaid(formData)` — updates invoice to paid, calls RPC for receipt number, inserts receipt record atomically

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | beac843 | feat(03-01): install @react-pdf/renderer, add DB sequence functions, configure next.config |
| 2 | 35cf14e | feat(03-01): create invoice queries and server actions data layer |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch in getInvoices status filter**
- **Found during:** Task 2 (tsc --noEmit verification)
- **Issue:** Supabase-generated types constrain `.eq('status', value)` to `'draft' | 'sent' | 'paid'` union — passing a plain `string` from the function parameter fails type checking
- **Fix:** Added `as 'draft' | 'sent' | 'paid'` cast at the filter call site; the value is already validated by the function's own logic
- **Files modified:** src/lib/queries/invoices.ts (line 29)
- **Commit:** 35cf14e

---

## Known Stubs

None — all query functions return real data from the database. No hardcoded values or placeholder text.

---

## Self-Check: PASSED

Files verified to exist:
- supabase/migrations/002_invoice_receipt_functions.sql — FOUND
- src/lib/queries/invoices.ts — FOUND
- src/lib/actions/invoices.ts — FOUND
- next.config.ts (modified) — FOUND

Commits verified:
- beac843 — FOUND
- 35cf14e — FOUND

TypeScript: `npx tsc --noEmit` — PASSED (0 errors)
