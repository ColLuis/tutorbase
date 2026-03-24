---
phase: 03-invoicing-and-payments
verified: 2026-03-24T12:00:00Z
status: gaps_found
score: 8/10 must-haves verified
gaps:
  - truth: "Invoice receives a sequential number via database sequence"
    status: failed
    reason: "INV-02 requirement specifies 'via database sequence' but the current implementation uses a count-based app-layer formula (COUNT(*)+1). The DB sequence functions exist in the migration but are never called. Count-based numbering is not race-condition-safe and does not match the requirement text."
    artifacts:
      - path: "src/lib/actions/invoices.ts"
        issue: "Lines 65-70: uses SELECT COUNT(*) + 1 instead of supabase.rpc('get_next_invoice_number'). Lines 278-283: same for receipts."
      - path: "supabase/migrations/002_invoice_receipt_functions.sql"
        issue: "DB sequence functions exist and are correct but are never called from application code."
    missing:
      - "Replace count-based numbering in createInvoice() with supabase.rpc('get_next_invoice_number')"
      - "Replace count-based numbering in markInvoicePaid() with supabase.rpc('get_next_receipt_number')"
      - "Ensure the 002 migration is applied to the Supabase instance before switching"

  - truth: "Tutor can save invoice as draft or finalise (create as sent) in one step"
    status: failed
    reason: "INV-04 requires the tutor to 'save as draft or finalise'. The CreateInvoiceForm was changed in plan 05 from a two-button (Save Draft / Send Invoice) pattern to a single 'Create Invoice' button that always submits with status='draft'. There is no path to create an invoice directly in 'sent' status from the creation form. Sending requires a separate 'Mark as Sent' step on the detail page."
    artifacts:
      - path: "src/components/invoices/CreateInvoiceForm.tsx"
        issue: "Line 254: onClick calls handleSubmit('draft') — only one button exists. The handleSubmit function accepts a status param but only 'draft' is ever passed."
    missing:
      - "Add a second action button (e.g. 'Create & Send') that calls handleSubmit('sent'), OR document this as an intentional deviation from INV-04 and update the requirement"
human_verification:
  - test: "PDF renders correctly in browser"
    expected: "InvoicePDFViewer shows an inline iframe preview on desktop (min-width 768px) with tutor name, invoice number, dates, bill-to, line items, total, and optional notes visible"
    why_human: "Cannot verify @react-pdf/renderer iframe rendering programmatically"
  - test: "PDF download produces correct file"
    expected: "GET /api/invoices/[id]/pdf returns a valid PDF file with correct invoice data and filename matching invoice number"
    why_human: "Cannot execute the API endpoint or inspect binary PDF output without a running server"
  - test: "Mobile layout — download link instead of iframe"
    expected: "On a viewport narrower than 768px the PDF preview section shows a 'Download PDF' link rather than an iframe"
    why_human: "Requires browser viewport simulation"
  - test: "Overdue filter tab shows correct invoices"
    expected: "Selecting 'Overdue' on /invoices shows only sent invoices whose due_date is before today"
    why_human: "Requires live database with test data"
  - test: "Delete draft releases lessons"
    expected: "After deleting a draft invoice, the linked lessons reappear as un-invoiced when creating a new invoice for the same student"
    why_human: "Requires live DB and multi-step user interaction"
---

# Phase 3: Invoicing and Payments — Verification Report

**Phase Goal:** Invoice lifecycle, PDF generation, and payment tracking
**Verified:** 2026-03-24
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Server actions can create an invoice with a sequential invoice number | PARTIAL | `createInvoice()` exists and inserts invoices with sequential numbers, but uses count-based formula (not DB sequence as INV-02 requires) |
| 2 | Server actions can mark an invoice paid and auto-generate a receipt | VERIFIED | `markInvoicePaid()` at line 250 updates invoice status, generates receipt number, inserts receipt record |
| 3 | Queries can fetch invoices filtered by status including overdue | VERIFIED | `getInvoices()` handles 'overdue' with `.eq('status','sent').lt('due_date', today)` |
| 4 | Un-invoiced completed lessons for a student are queryable | VERIFIED | `getUnInvoicedLessons()` queries lessons with status='completed' and invoice_id IS NULL |
| 5 | Tutor can download a PDF via GET /api/invoices/[id]/pdf | VERIFIED | Route handler exists, calls `renderToBuffer`, returns `Content-Type: application/pdf` |
| 6 | PDF contains tutor name, invoice number, dates, bill-to, line items, total, notes | VERIFIED | `InvoicePDF.tsx` renders all required sections via @react-pdf/renderer primitives |
| 7 | In-browser PDF preview renders without SSR errors | VERIFIED (human check needed) | `InvoicePDFViewer.tsx` uses `dynamic(..., { ssr: false })` — SSR crash prevented by design |
| 8 | Tutor can navigate from student detail to create invoice page | VERIFIED | `src/app/(app)/students/[id]/page.tsx` line 72: `<Button render={<Link href="/invoices/new?studentId=${id}">Create Invoice</Link>} />` — only shown for active students |
| 9 | Tutor can save invoice as draft or finalise as sent in one step | FAILED | `CreateInvoiceForm.tsx` has only one button (`handleSubmit('draft')`); no path to create as 'sent' from the form |
| 10 | Invoice receives a sequential number via database sequence | FAILED | Uses `COUNT(*) + 1` formula, not `supabase.rpc('get_next_invoice_number')`. DB sequence functions exist in migration but are undeployed/uncalled |

**Score:** 8/10 truths verified (2 failed)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `supabase/migrations/002_invoice_receipt_functions.sql` | VERIFIED | Exists — contains `get_next_invoice_number()` and `get_next_receipt_number()` SECURITY DEFINER functions |
| `src/lib/queries/invoices.ts` | VERIFIED | Exports `getInvoices`, `getInvoice`, `getUnInvoicedLessons`, `getTutorForInvoice` — all substantive |
| `src/lib/actions/invoices.ts` | VERIFIED (with gap) | Exports `createInvoice`, `sendInvoice`, `deleteInvoice`, `markInvoicePaid`, `updateInvoice` — all substantive. Numbering gap noted |

### Plan 02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/invoices/pdf/InvoicePDF.tsx` | VERIFIED | Full `@react-pdf/renderer` Document component with `InvoicePDFData` interface, all required sections |
| `src/components/invoices/pdf/InvoicePDFViewer.tsx` | VERIFIED | `'use client'`, `dynamic(..., { ssr: false })`, `useMediaQuery` for desktop/mobile branching |
| `src/app/api/invoices/[id]/pdf/route.ts` | VERIFIED | Exports `GET`, calls `verifySession`, `renderToBuffer`, returns `application/pdf` |

### Plan 03 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/(app)/invoices/new/page.tsx` | VERIFIED | Server component, calls `verifySession`, `getUnInvoicedLessons`, renders `CreateInvoiceForm` |
| `src/components/invoices/CreateInvoiceForm.tsx` | PARTIAL | `'use client'`, checkbox lesson selection, running subtotal, date fields, notes. Only one action button (always creates as draft). INV-04 gap. |

### Plan 04 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/(app)/invoices/page.tsx` | VERIFIED | Server component, calls `verifySession`, `getInvoices`, passes to `InvoiceList` |
| `src/components/invoices/InvoiceList.tsx` | VERIFIED | Status filter tabs (All/Draft/Sent/Paid/Overdue), Badge variants, card layout, empty state |
| `src/app/(app)/invoices/[id]/page.tsx` | VERIFIED | Server component, calls `verifySession`, `getInvoice` + `getTutorForInvoice` in parallel, builds `InvoicePDFData`, calls `notFound()` |
| `src/components/invoices/InvoiceDetail.tsx` | VERIFIED | Line items table, PDF preview, conditional action buttons by status, "Paid on" line (D-16), receipt info (D-15) |
| `src/components/invoices/MarkPaidForm.tsx` | VERIFIED | Calls `markInvoicePaid`, `toast.success('Payment recorded')`, date input + method select |
| `src/components/invoices/DeleteDraftButton.tsx` | VERIFIED | `AlertDialog` with correct title/description, calls `deleteInvoice`, redirects to `/invoices` |
| `src/components/nav/Sidebar.tsx` | VERIFIED | `FileText` icon, `/invoices` href, active on `pathname.startsWith('/invoices')` |
| `src/components/nav/BottomNav.tsx` | VERIFIED | Same nav items as Sidebar, icon-only on mobile with `aria-label` |

### Plan 05 Artifacts (additions from human checkpoint)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/(app)/invoices/[id]/edit/page.tsx` | VERIFIED | Exists — edit page with `verifySession`, fetches invoice, renders `EditInvoiceForm` |
| `src/components/invoices/EditInvoiceForm.tsx` | VERIFIED | Exists per file listing |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/actions/invoices.ts` | `supabase.rpc('get_next_invoice_number')` | `rpc(...)` call | NOT WIRED | Uses `COUNT(*)+1` instead — gap for INV-02 |
| `src/lib/actions/invoices.ts` | `invoices + invoice_items + lessons` | atomic insert/update | WIRED | Lines 83-122: insert invoice, insert items, update lessons.invoice_id |
| `src/app/api/invoices/[id]/pdf/route.ts` | `InvoicePDF.tsx` | `renderToBuffer(<InvoicePDF />)` | WIRED | Line 38: `renderToBuffer(element)` |
| `src/app/api/invoices/[id]/pdf/route.ts` | `src/lib/queries/invoices.ts` | `getInvoice` + `getTutorForInvoice` | WIRED | Lines 11, 16 |
| `src/app/(app)/students/[id]/page.tsx` | `/invoices/new?studentId=` | Link component | WIRED | Line 72 |
| `src/components/invoices/CreateInvoiceForm.tsx` | `src/lib/actions/invoices.ts` | `createInvoice` server action | WIRED | Line 120 |
| `src/components/invoices/InvoiceDetail.tsx` | `InvoicePDFViewer.tsx` | component embed | WIRED | Line 273 |
| `src/components/invoices/MarkPaidForm.tsx` | `markInvoicePaid` action | form submit | WIRED | Line 24 |
| `src/components/invoices/DeleteDraftButton.tsx` | `deleteInvoice` action | AlertDialog confirm | WIRED | Line 33 |
| `src/components/nav/Sidebar.tsx` | `/invoices` | nav Link | WIRED | navItems array line 13 |
| `src/components/nav/BottomNav.tsx` | `/invoices` | nav Link | WIRED | navItems array line 13 |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| INV-01 | 03-01, 03-03 | Create invoice auto-populated from un-invoiced completed lessons | SATISFIED | `getUnInvoicedLessons()` + `createInvoice()` wired through `CreateInvoiceForm` |
| INV-02 | 03-01 | Sequential invoice number via database sequence | BLOCKED | DB sequence functions exist in migration but `createInvoice()` uses count-based formula — not a DB sequence |
| INV-03 | 03-01, 03-03 | User can set issue date and due date | SATISFIED | `CreateInvoiceForm` has date inputs with defaults (today / today+14); passed to `createInvoice()` |
| INV-04 | 03-03 | Save as draft or finalise (status = sent) | BLOCKED | Only one button in `CreateInvoiceForm` (always draft). Sending requires a separate "Mark as Sent" step from detail page |
| INV-05 | 03-04 | View invoices filtered by status (all/draft/sent/paid/overdue) | SATISFIED | `InvoiceList` status tabs + `getInvoices()` overdue filter |
| INV-06 | 03-04 | View invoice detail with all line items | SATISFIED | `InvoiceDetail` renders full line items table from `invoice_items` join |
| INV-07 | 03-02 | Download invoice as professional PDF | SATISFIED | `/api/invoices/[id]/pdf` route handler returns `application/pdf`; `InvoicePDF` renders all required fields |
| INV-08 | 03-04 | Delete a draft invoice | SATISFIED | `DeleteDraftButton` uses AlertDialog + `deleteInvoice()` action with `.eq('status','draft')` guard |
| PAY-01 | 03-04 | Mark invoice as paid with date and method | SATISFIED | `MarkPaidForm` submits date + method to `markInvoicePaid()` |
| PAY-02 | 03-04 | Marking paid auto-generates receipt record | SATISFIED | `markInvoicePaid()` inserts into `receipts` table with tutor_id, invoice_id, receipt_number, amount_paid |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/lib/actions/invoices.ts:65-70` | `COUNT(*)+1` for invoice numbering | Warning | Not race-condition-safe under concurrent invoicing; violates INV-02 requirement text ("via database sequence") |
| `src/lib/actions/invoices.ts:278-283` | `COUNT(*)+1` for receipt numbering | Warning | Same concurrency risk as invoice numbering |
| `src/components/invoices/CreateInvoiceForm.tsx:254` | Single button always submits `status='draft'` | Warning | INV-04 violation — no "create as sent" path from the form |

No TODO/FIXME/placeholder comments found. TypeScript compiles with zero errors (`npx tsc --noEmit` exits clean).

---

## Human Verification Required

### 1. PDF In-Browser Rendering

**Test:** Open a sent or draft invoice detail page on a desktop viewport. Scroll to the PDF Preview section.
**Expected:** An embedded iframe appears showing the full invoice PDF — tutor name at the top, invoice number, issue/due dates, bill-to recipient, line items with description/qty/rate/amount, total, and notes (if present).
**Why human:** @react-pdf/renderer iframe rendering cannot be verified programmatically.

### 2. PDF Download File Content

**Test:** Click any "Download PDF" link on an invoice detail page.
**Expected:** A PDF file downloads with a filename matching the invoice number (e.g. `INV-0001.pdf`). Opening it shows correct tutor name, all invoice data, and no rendering errors.
**Why human:** Requires a running server and binary PDF inspection.

### 3. Mobile PDF Fallback

**Test:** Open an invoice detail page on a viewport narrower than 768px (or use browser devtools mobile emulation).
**Expected:** The PDF Preview section shows a "Download PDF" button link instead of an iframe viewer.
**Why human:** Requires browser viewport control.

### 4. Overdue Invoice Filtering

**Test:** Create a "sent" invoice with a due date in the past. Navigate to `/invoices?status=overdue`.
**Expected:** The overdue invoice appears in the list. Switching to the "Sent" tab also shows it (with an Overdue badge). Switching to "Paid" does not show it.
**Why human:** Requires a live Supabase instance with time-sensitive test data.

### 5. Delete Draft Releases Lessons

**Test:** Create an invoice (which links lessons). Then delete the draft. Navigate back to the student and click "Create Invoice".
**Expected:** The previously linked lessons reappear as selectable in the new invoice form.
**Why human:** Requires multi-step DB interaction with ON DELETE SET NULL cascade behavior.

---

## Gaps Summary

Two requirements are not fully satisfied:

**INV-02 (invoice number via DB sequence):** The migration file `002_invoice_receipt_functions.sql` correctly defines `get_next_invoice_number()` and `get_next_receipt_number()` using PostgreSQL sequences. However, during the human verification checkpoint (plan 05), the RPC calls were replaced with an app-layer `COUNT(*)+1` formula because the migration had not been applied to the Supabase instance. The current implementation is functionally sequential for a single-user tool but does not match the requirement ("via database sequence") and is technically not race-condition-safe.

**INV-04 (save as draft or finalise):** Plan 05 collapsed the two-button pattern (Save Draft / Send Invoice) to a single "Create Invoice" button that always creates a draft. The "send" step now requires navigating to the invoice detail and clicking "Mark as Sent" — a two-step flow. The requirement says the tutor should be able to finalise at creation time. Whether this is an intentional product decision or an oversight needs resolution.

Both gaps are addressable without architectural changes:
- INV-02: Apply the 002 migration and restore the two `rpc(...)` calls in `invoices.ts` (lines 65-70 and 278-283).
- INV-04: Restore the second action button in `CreateInvoiceForm.tsx` (e.g. "Create & Send" calling `handleSubmit('sent')`), or formally update REQUIREMENTS.md to reflect the two-step send design.

---

_Verified: 2026-03-24_
_Verifier: Claude (gsd-verifier)_
