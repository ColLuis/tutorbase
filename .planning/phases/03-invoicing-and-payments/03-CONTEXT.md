# Phase 3: Invoicing and Payments - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate professional PDF invoices from completed lessons, manage invoice lifecycle (draft → sent → paid), and record payments with auto-generated receipt records. Manual line items (INV-09) and receipt PDFs (INV-10) are deferred to v2.

</domain>

<decisions>
## Implementation Decisions

### Invoice creation flow
- **D-01:** Entry point is from student detail page — "Create Invoice" button navigates to `/invoices/new?studentId=X`
- **D-02:** Full-page form (not drawer/sheet) — more room for lesson selection and preview
- **D-03:** Shows all un-invoiced completed lessons for that student with checkboxes — tutor can deselect any they don't want on this invoice
- **D-04:** After selecting lessons, shows a draft preview with issue date, due date, line items, and total — tutor can adjust dates and notes before saving
- **D-05:** Saving creates a draft invoice; separate "Send" action finalises it (sets status to sent)

### PDF invoice layout
- **D-06:** Clean text-only PDF — no logo, no accent colors, no "TutorBase" branding. It's the tutor's invoice.
- **D-07:** Header shows tutor name only — no bank details, no ABN, no phone for v1 (settings page in v2 adds more)
- **D-08:** "Bill to:" shows parent name from student record — falls back to student name if no parent contact
- **D-09:** One line item per lesson: date, duration, rate, amount — parents see exactly which sessions they're paying for
- **D-10:** Footer has a freeform notes field per-invoice (e.g. "Payment due within 14 days") — no structured payment info section
- **D-11:** Invoice number (INV-0001 format) and issue/due dates displayed prominently
- **D-12:** In-browser PDF preview before download — tutor can verify before sending to parents

### Payment recording
- **D-13:** "Mark as Paid" button on invoice detail opens a small inline form: payment date (defaults to today) + optional payment method (cash, bank transfer, etc.)
- **D-14:** Marking as paid auto-generates a receipt record in DB silently — toast: "Payment recorded"
- **D-15:** Receipt visible on invoice detail page but no PDF generation for v1 (INV-10 deferred)
- **D-16:** Simple status line on invoice detail when paid: "Paid on [date] via [method]" — no separate payment section

### Invoice list and actions
- **D-17:** Claude's discretion on invoice list layout, filtering by status (all/draft/sent/paid/overdue), and delete draft flow — carry forward existing patterns (confirmation dialog for destructive actions, toast for success)

### Claude's Discretion
- Invoice list page layout and filtering UX
- Delete draft confirmation pattern (carry forward AlertDialog pattern from Phase 2)
- Empty state for invoice list
- Exact PDF typography and spacing
- How "Send" action works (just status change, no actual email)
- Navigation — where "Invoices" appears in nav

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project references
- `.planning/REQUIREMENTS.md` — Requirements INV-01 through INV-08 and PAY-01 through PAY-02 define acceptance criteria
- `.planning/PROJECT.md` — Constraints (44px tap targets, WCAG AA, mobile-first), tech stack (shadcn/ui, @react-pdf/renderer, date-fns)
- `supabase/migrations/001_initial_schema.sql` — Invoices, invoice_items, receipts table schemas, RLS policies, invoice_number_seq sequence, lessons.invoice_id FK

### Phase 2 patterns
- `.planning/phases/02-students-and-scheduling/02-CONTEXT.md` — Established UI patterns (drawer/sheet, toast, confirmation dialogs) that should carry forward

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/dal.ts` — `verifySession()` for all server actions
- `src/lib/utils/currency.ts` — `formatCurrency()` for displaying amounts
- `src/lib/utils/dates.ts` — `formatLessonDate()`, `formatShortDate()`, `formatTime()` for date display
- `src/lib/utils/time.ts` — `parseTimeInput()`, `combineDateTime()` for time handling
- `src/lib/hooks/use-media-query.ts` — viewport detection hook
- `src/components/ui/` — Full shadcn/ui primitive set (button, card, input, label, select, alert-dialog, badge, sheet, drawer, calendar, command, popover, switch, textarea, separator)
- `src/components/schedule/LessonDetailPanel.tsx` — Pattern for detail side panels with action buttons
- Sonner toast already in app layout at bottom-center

### Established Patterns
- Server Actions in `src/lib/actions/` with FormData + Zod validation
- Queries in `src/lib/queries/` returning typed data
- App routes under `src/app/(app)/` for authenticated pages
- `verifySession()` call at top of every server action and server component page
- String-based Zod schemas in forms, server actions coerce to numbers
- AlertDialog for destructive actions, no confirmation for happy-path

### Integration Points
- `src/components/nav/Sidebar.tsx` and `BottomNav.tsx` — need "Invoices" nav entry
- Student detail page (`src/app/(app)/students/[id]/page.tsx`) — "Create Invoice" button entry point
- Lessons table has `invoice_id` column (nullable FK) — set when lessons are attached to an invoice
- `invoice_number_seq` PostgreSQL sequence already exists for INV-0001 numbering

### Schema Notes
- `invoices` table: id, tutor_id, student_id, invoice_number, status (draft/sent/paid), issued_date, due_date, paid_date, subtotal, total, notes
- `invoice_items` table: id, invoice_id, tutor_id, description, quantity(?), unit_price(?), amount(?) — need to verify full column list
- `receipts` table: id, tutor_id, invoice_id, receipt_number, paid_at, amount_paid, payment_method
- `lessons.invoice_id` FK exists — links lessons to invoices

</code_context>

<specifics>
## Specific Ideas

- PDF preview in-browser before download — tutor verifies before sending to parents via WhatsApp/email
- Parent name as "Bill to:" recipient — falls back to student name
- Notes field is the only payment instruction mechanism for v1 (no structured bank details)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-invoicing-and-payments*
*Context gathered: 2026-03-22*
