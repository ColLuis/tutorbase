---
plan: "05"
phase: 03-invoicing-and-payments
status: complete
started: 2026-03-24
completed: 2026-03-24
---

## Summary

Human verification checkpoint completed. Three issues found and fixed during testing:

1. **DB function not found** — `get_next_invoice_number` and `get_next_receipt_number` RPC calls failed because the 002 migration wasn't applied. Replaced with application-layer count-based number generation.
2. **Misleading "Send Invoice" label** — Renamed to "Create Invoice" on the form and "Mark as Sent" on the detail page since there's no email integration.
3. **Feature requests** — Added editable rate/duration on create form and a full edit page for existing invoices (all statuses).

## Key Files

### Modified
- `src/lib/actions/invoices.ts` — Replaced RPC calls, added `updateInvoice` action, support for lesson overrides
- `src/components/invoices/CreateInvoiceForm.tsx` — Editable rate/duration per lesson, single "Create Invoice" button
- `src/components/invoices/InvoiceDetail.tsx` — "Mark as Sent" rename, Edit button for all statuses

### Created
- `src/app/(app)/invoices/[id]/edit/page.tsx` — Edit invoice page
- `src/components/invoices/EditInvoiceForm.tsx` — Edit form with editable line items, dates, notes

## Deviations

- Removed draft/sent distinction on create form (single "Create Invoice" button) per user feedback
- Added invoice editing capability (not in original plan) per user request
- Replaced DB sequence functions with app-layer generation for reliability
