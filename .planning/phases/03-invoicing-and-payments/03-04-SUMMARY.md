---
phase: 03-invoicing-and-payments
plan: "04"
subsystem: ui-invoice-management
tags: [invoices, ui, invoice-list, invoice-detail, pdf-preview, mark-paid, delete-draft, navigation]
dependency_graph:
  requires: [src/lib/queries/invoices.ts, src/lib/actions/invoices.ts, src/components/invoices/pdf/InvoicePDFViewer.tsx, src/components/invoices/pdf/InvoicePDF.tsx]
  provides: [src/app/(app)/invoices/page.tsx, src/components/invoices/InvoiceList.tsx, src/app/(app)/invoices/[id]/page.tsx, src/components/invoices/InvoiceDetail.tsx, src/components/invoices/MarkPaidForm.tsx, src/components/invoices/DeleteDraftButton.tsx]
  affects: [src/components/nav/Sidebar.tsx, src/components/nav/BottomNav.tsx]
tech_stack:
  added: []
  patterns: [server-components, client-components, useTransition, AlertDialog, sonner-toast, status-filter-tabs, conditional-ui-by-status]
key_files:
  created:
    - src/app/(app)/invoices/page.tsx
    - src/components/invoices/InvoiceList.tsx
    - src/app/(app)/invoices/[id]/page.tsx
    - src/components/invoices/InvoiceDetail.tsx
    - src/components/invoices/MarkPaidForm.tsx
    - src/components/invoices/DeleteDraftButton.tsx
  modified:
    - src/components/nav/Sidebar.tsx
    - src/components/nav/BottomNav.tsx
decisions:
  - "InvoiceList uses Link-based status tabs rather than useRouter push to preserve SSR-friendly navigation with searchParams"
  - "Invoice.issued_date and due_date typed as string | null to match Supabase return types — null guarded before date formatting"
  - "MarkPaidForm uses inline form with select (not free-text) for payment method — four fixed options cover all common cases"
  - "BottomNav uses icon-only display on mobile (sm:block for labels) to fit 5 items within limited horizontal space"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_changed: 8
---

# Phase 3 Plan 4: Invoice UI — List, Detail, and Navigation Summary

**One-liner:** Complete invoice management UI with status-filtered list page, detail page with PDF preview and conditional actions (send/mark paid/delete), and icon-enhanced navigation wired to /invoices in both Sidebar and BottomNav.

---

## What Was Built

### Task 1: Invoice List Page, InvoiceList Component, Nav Updates

**`src/app/(app)/invoices/page.tsx`** — Server Component:
- Calls `verifySession()` for session protection
- Reads `searchParams.status` (default: 'all')
- Calls `getInvoices(tutorId, status)` and passes result to `InvoiceList`

**`src/components/invoices/InvoiceList.tsx`** — `'use client'` component:
- Horizontal scrollable status filter tabs: All, Draft, Sent, Paid, Overdue — Link-based with active highlight
- Card-based invoice rows: invoice number, student name, status badge, issue date, total
- Status badge variants: secondary (draft), outline (sent), default/green (paid), destructive/red (overdue)
- Overdue computed as: status === 'sent' AND due_date < today (client-side guard on null dates)
- Empty state: "No invoices yet. Create one from a student's page." with link to /students

**`src/components/nav/Sidebar.tsx`** — Updated:
- Added `lucide-react` icon imports: Home, Users, Calendar, FileText, TrendingUp
- All nav items now include icon alongside label
- FileText icon for Invoices entry, active on `pathname.startsWith('/invoices')`

**`src/components/nav/BottomNav.tsx`** — Updated:
- Same icon set as Sidebar for visual consistency
- Icon-only layout on mobile (`sm:block` for labels) — accommodates 5 items in limited space
- `aria-label` on each link for accessibility

### Task 2: Invoice Detail Page, MarkPaidForm, DeleteDraftButton

**`src/app/(app)/invoices/[id]/page.tsx`** — Server Component:
- Calls `verifySession()`, awaits `params.id`
- Fetches invoice + tutor in parallel with `Promise.all`
- Builds `InvoicePDFData` from invoice + tutor data
- Calls `notFound()` if invoice not found
- Passes invoice, pdfData, invoiceId to `InvoiceDetail`

**`src/components/invoices/InvoiceDetail.tsx`** — `'use client'` component:
- Header: invoice number, status badge, back link to /invoices
- Summary section: student name, issued date, due date, total
- Line items table: responsive — stacked layout on mobile, grid on sm+
- Notes display when present
- Paid status line (D-16): "Paid on dd MMM yyyy via Method"
- Receipt display (D-15): "Receipt REC-0001 — Paid dd MMM yyyy"
- Conditional actions by status:
  - Draft: Send Invoice button (calls sendInvoice via useTransition), DeleteDraftButton, Download PDF link
  - Sent: Mark as Paid toggle button (shows MarkPaidForm inline), Download PDF link
  - Paid: Download PDF link only
- PDF Preview section at bottom via InvoicePDFViewer (D-12)

**`src/components/invoices/MarkPaidForm.tsx`** — `'use client'` component (PAY-01, D-13, D-14):
- Props: `invoiceId` string
- Inline form (no modal): date input defaulting to today, payment method select (Bank Transfer / Cash / Card / Other)
- Calls `markInvoicePaid` server action on submit
- `useTransition` for pending state during submission
- `toast.success('Payment recorded')` on success, `toast.error(message)` on error

**`src/components/invoices/DeleteDraftButton.tsx`** — `'use client'` component (INV-08):
- Follows DeactivateButton.tsx AlertDialog pattern exactly
- AlertDialog title: "Delete Invoice?", description explains permanence and lesson unlinking
- On confirm: calls `deleteInvoice`, redirects to `/invoices` on success, `toast.error` on failure

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 31c5dda | feat(03-04): invoice list page with status filtering and nav icons |
| 2 | 7143587 | feat(03-04): invoice detail page with PDF preview, mark paid, send, and delete actions |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Invoice type to allow nullable dates**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** Supabase returns `issued_date: string | null` and `due_date: string | null` — InvoiceList interface had them typed as `string`
- **Fix:** Changed interface to `string | null` and added null guards before date formatting
- **Files modified:** src/components/invoices/InvoiceList.tsx
- **Commit:** 31c5dda (inline fix before commit)

---

## Known Stubs

None — all components are wired to real data from the data layer. No hardcoded values, placeholder text, or mock data.

---

## Self-Check: PASSED

Files verified to exist:
- src/app/(app)/invoices/page.tsx — FOUND
- src/components/invoices/InvoiceList.tsx — FOUND
- src/app/(app)/invoices/[id]/page.tsx — FOUND
- src/components/invoices/InvoiceDetail.tsx — FOUND
- src/components/invoices/MarkPaidForm.tsx — FOUND
- src/components/invoices/DeleteDraftButton.tsx — FOUND
- src/components/nav/Sidebar.tsx (modified) — FOUND
- src/components/nav/BottomNav.tsx (modified) — FOUND

Commits verified:
- 31c5dda — FOUND
- 7143587 — FOUND

TypeScript: `npx tsc --noEmit` — PASSED (0 errors)
