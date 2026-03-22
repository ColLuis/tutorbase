# Phase 3: Invoicing and Payments - Research

**Researched:** 2026-03-22
**Domain:** @react-pdf/renderer, invoice lifecycle, Next.js Route Handlers, Supabase sequences
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Entry point from student detail page — "Create Invoice" button navigates to `/invoices/new?studentId=X`
- **D-02:** Full-page form (not drawer/sheet) for invoice creation
- **D-03:** Shows all un-invoiced completed lessons for that student with checkboxes
- **D-04:** After selecting lessons, shows a draft preview with issue date, due date, line items, and total — tutor can adjust dates and notes before saving
- **D-05:** Saving creates a draft invoice; separate "Send" action finalises it (sets status to sent)
- **D-06:** Clean text-only PDF — no logo, no accent colors, no "TutorBase" branding
- **D-07:** Header shows tutor name only — no bank details, no ABN, no phone for v1
- **D-08:** "Bill to:" shows parent name from student record — falls back to student name
- **D-09:** One line item per lesson: date, duration, rate, amount
- **D-10:** Footer has freeform notes field per-invoice — no structured payment info section
- **D-11:** Invoice number (INV-0001 format) and issue/due dates displayed prominently
- **D-12:** In-browser PDF preview before download
- **D-13:** "Mark as Paid" button on invoice detail opens a small inline form: payment date (defaults to today) + optional payment method
- **D-14:** Marking as paid auto-generates a receipt record in DB silently — toast: "Payment recorded"
- **D-15:** Receipt visible on invoice detail page — no PDF for v1
- **D-16:** Simple status line on invoice detail when paid: "Paid on [date] via [method]"
- **D-17:** Claude's discretion on invoice list layout, filtering by status, and delete draft flow

### Claude's Discretion

- Invoice list page layout and filtering UX
- Delete draft confirmation pattern (carry forward AlertDialog pattern from Phase 2)
- Empty state for invoice list
- Exact PDF typography and spacing
- How "Send" action works (just status change, no actual email)
- Navigation — where "Invoices" appears in nav

### Deferred Ideas (OUT OF SCOPE)

- Manual line items (INV-09) — v2
- Receipt PDF generation (INV-10) — v2
- Bank details / ABN in PDF header — v2 (requires settings page)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INV-01 | User can create an invoice for a student auto-populated from un-invoiced completed lessons | Query `lessons` where `invoice_id IS NULL AND status = 'completed' AND student_id = X`; insert invoice + items in server action |
| INV-02 | Invoice receives a sequential number (INV-0001) via database sequence | `SELECT nextval('invoice_number_seq')` in server action; format as `INV-${String(n).padStart(4, '0')}` |
| INV-03 | User can set issue date and due date on an invoice | `issued_date` and `due_date` DATE columns already in schema; form fields with react-day-picker |
| INV-04 | User can save invoice as draft or finalise (sets status to sent) | Two submit buttons: "Save Draft" (status=draft) and "Send" (status=sent); server action handles both |
| INV-05 | User can view all invoices filtered by status (all, draft, sent, paid, overdue) | `/invoices` page with searchParam `?status=`; query with conditional `.eq('status', filter)`; overdue = sent + due_date < today |
| INV-06 | User can view invoice detail with all line items | `/invoices/[id]` page; join `invoice_items` + `students`; show receipt if paid |
| INV-07 | User can download invoice as professional PDF | `@react-pdf/renderer` via Route Handler `GET /api/invoices/[id]/pdf`; `<PDFViewer>` for in-browser preview (client component) |
| INV-08 | User can delete a draft invoice | Server action deletes invoice (cascade deletes items); sets `lessons.invoice_id = NULL` via FK `ON DELETE SET NULL`; AlertDialog confirmation |
| PAY-01 | User can mark an invoice as paid with payment date and method | Inline form on invoice detail; server action updates `invoices.status = 'paid'`, sets `paid_date` |
| PAY-02 | Marking as paid auto-generates a receipt record | Same server action inserts into `receipts` table with `receipt_number` from a counter pattern |
</phase_requirements>

---

## Summary

Phase 3 adds the invoice lifecycle (draft → sent → paid) with PDF generation using `@react-pdf/renderer`. The schema is already complete in `001_initial_schema.sql` — all tables (`invoices`, `invoice_items`, `receipts`), the `invoice_number_seq` PostgreSQL sequence, and the `lessons.invoice_id` FK are in place. No migrations are needed.

The critical architectural constraint is that `@react-pdf/renderer` **cannot run in Server Components or Server Actions**. PDF generation must be served via a Next.js Route Handler (`src/app/api/invoices/[id]/pdf/route.ts`). In-browser preview uses `<PDFViewer>` which is a client component and must be wrapped carefully to avoid SSR errors.

The package is not yet installed — `@react-pdf/renderer` must be added. The project uses **Tailwind 4** (not 3), **Next.js 16.2.1**, **zod v4** (`.issues` not `.errors`), and **date-fns v4** (API is largely unchanged from v3 for the functions used here).

**Primary recommendation:** Install `@react-pdf/renderer@4.3.2`, implement PDF via Route Handler, spike the preview component first before building full invoice UI, follow the established server action pattern with `verifySession()` + Zod + `revalidatePath()`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 (latest) | PDF document generation | Only pure-Node PDF library that works on Render free tier; no headless browser needed |
| date-fns | 4.1.0 (already installed) | Date arithmetic and formatting | Already in project; `format`, `isAfter`, `isBefore`, `parseISO` cover all invoice date needs |
| date-fns-tz | 3.2.0 (already installed) | Timezone-aware display | Already in project; used for lesson date display in PDF line items |
| zod | 4.3.6 (already installed) | Server action validation | Already in project; use `.issues[0].message` not `.errors` |
| react-hook-form | 7.x (already installed) | Invoice creation form | Already in project; same string-field pattern as LessonDrawer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 (already installed) | Toast notifications | Payment recorded, draft saved, send confirmation |
| shadcn AlertDialog | already installed | Delete draft confirmation | Destructive action guard — same pattern as Phase 2 |
| shadcn Badge | already installed | Invoice status display | Draft/sent/paid/overdue badges in list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route Handler for PDF | Puppeteer | Puppeteer requires headless Chrome binary — won't work on Render free tier |
| Route Handler for PDF | Server Action returning Blob | Server Actions can't return file responses; Route Handler is correct |
| react-day-picker (already in project) | Custom date input | Already installed for Phase 2 calendar; reuse the same Calendar + Popover pattern |

**Installation (only new dependency):**
```bash
npm install @react-pdf/renderer@4.3.2
```

**Version verified:** `npm show @react-pdf/renderer version` returned `4.3.2` on 2026-03-22.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── app/
│   ├── (app)/
│   │   └── invoices/
│   │       ├── page.tsx                    # INV-05: invoice list with status filter
│   │       ├── new/
│   │       │   └── page.tsx                # INV-01: create invoice form (full-page)
│   │       └── [id]/
│   │           └── page.tsx                # INV-06: invoice detail + pay action
│   └── api/
│       └── invoices/
│           └── [id]/
│               └── pdf/
│                   └── route.ts            # INV-07: PDF download endpoint
├── lib/
│   ├── actions/
│   │   └── invoices.ts                     # createInvoice, sendInvoice, deleteInvoice, markPaid
│   └── queries/
│       └── invoices.ts                     # getInvoices, getInvoice, getUnInvoicedLessons
└── components/
    └── invoices/
        ├── InvoiceList.tsx                 # list with status tabs/filter
        ├── CreateInvoiceForm.tsx           # lesson selection + date form
        ├── InvoiceDetail.tsx               # detail view with pay button
        ├── MarkPaidForm.tsx                # inline payment form
        ├── DeleteDraftButton.tsx           # AlertDialog-wrapped delete
        └── pdf/
            ├── InvoicePDF.tsx             # @react-pdf Document component
            └── InvoicePDFViewer.tsx       # client component wrapping <PDFViewer>
```

### Pattern 1: PDF Route Handler (INV-07)
**What:** Server-side PDF generation via GET Route Handler — fetches invoice data, renders to buffer, streams as `application/pdf`.
**When to use:** Any time a file download is needed from a Next.js App Router app.
**Example:**
```typescript
// src/app/api/invoices/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoices/pdf/InvoicePDF'
import { verifySession } from '@/lib/dal'
import { getInvoice } from '@/lib/queries/invoices'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tutorId } = await verifySession()
  const { id } = await params
  const invoice = await getInvoice(tutorId, id)
  if (!invoice) return new Response('Not found', { status: 404 })

  const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} />)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
```

### Pattern 2: In-Browser PDF Preview (D-12)
**What:** `<PDFViewer>` is a client component from `@react-pdf/renderer` that renders an iframe with the PDF. Must be `'use client'` and dynamically imported to avoid SSR.
**When to use:** Invoice detail page preview before download.
**Example:**
```typescript
// src/components/invoices/pdf/InvoicePDFViewer.tsx
'use client'
import dynamic from 'next/dynamic'
import { PDFViewer } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'

// CRITICAL: dynamic import with ssr:false prevents "window is not defined" error
const PDFViewerNoSSR = dynamic(
  () => import('@react-pdf/renderer').then((mod) => {
    const { PDFViewer } = mod
    return function Viewer({ invoice }: { invoice: InvoiceData }) {
      return (
        <PDFViewer width="100%" height={600} showToolbar={false}>
          <InvoicePDF invoice={invoice} />
        </PDFViewer>
      )
    }
  }),
  { ssr: false }
)
```

### Pattern 3: Invoice Number from PostgreSQL Sequence (INV-02)
**What:** Call `SELECT nextval('invoice_number_seq')` via Supabase RPC before inserting the invoice. Never use `MAX(invoice_number) + 1` in application code.
**Example:**
```typescript
// In createInvoice server action
const { data: seqData, error: seqError } = await supabase
  .rpc('get_next_invoice_number')

// OR use raw query via supabase:
const { data } = await supabase
  .from('invoices')
  .select() // placeholder — use rpc or raw SQL
```

**Preferred approach** — create a Supabase DB function:
```sql
-- In a new migration or run via Supabase dashboard
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('invoice_number_seq');
  RETURN 'INV-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;
```
Then call `supabase.rpc('get_next_invoice_number')` in the server action.

**Alternative** (no new migration): Use `supabase.rpc` with a raw SQL approach, or call the sequence directly if Supabase allows `SELECT nextval(...)` via `.from('').select()`. The DB function approach is cleaner and safer.

### Pattern 4: Create Invoice Server Action (INV-01, INV-02, INV-03, INV-04)
**What:** Single server action that atomically: gets next invoice number, inserts invoice, inserts invoice_items rows, updates lessons.invoice_id.
**Example:**
```typescript
// src/lib/actions/invoices.ts
'use server'
export async function createInvoice(formData: FormData) {
  const { tutorId } = await verifySession()
  // 1. Validate with Zod (string fields, coerce numbers server-side)
  // 2. Get next invoice number via RPC
  // 3. Insert invoice row
  // 4. Insert invoice_items rows (one per selected lesson)
  // 5. Update lessons SET invoice_id = newInvoiceId WHERE id IN (selectedLessonIds)
  // 6. revalidatePath('/invoices') + revalidatePath('/students/[id]')
  // 7. Return { success: true, invoiceId } for redirect
}
```

### Pattern 5: Mark as Paid + Auto-Receipt (PAY-01, PAY-02)
**What:** Single server action updates invoice status + inserts receipt atomically.
```typescript
export async function markInvoicePaid(formData: FormData) {
  const { tutorId } = await verifySession()
  // 1. Validate invoiceId, paidDate, paymentMethod
  // 2. Update invoices SET status='paid', paid_date=paidDate
  // 3. Get invoice.total for amount_paid
  // 4. Generate receipt_number (e.g., REC-0001 via a second sequence, or derive from invoice_number)
  // 5. Insert receipt row
  // 6. revalidatePath('/invoices/[id]')
  // 7. Return { success: true }
}
```

**Note on receipt_number:** Schema has `UNIQUE (tutor_id, receipt_number)`. For v1, use the same sequence pattern as invoices — create `receipt_number_seq` in a new migration, or derive as `REC-` prefix on same numeric value as the invoice number. Simplest v1 approach: use the invoice's own ID suffix or create a separate sequence.

### Pattern 6: Overdue Status (INV-05)
**What:** "Overdue" is not a DB status — compute it in the query layer.
```typescript
// In queries/invoices.ts
// Fetch status='sent' rows and compare due_date client-side, OR
// Use Supabase filter: .or('status.eq.draft,status.eq.sent,status.eq.paid')
// For overdue tab: .eq('status', 'sent').lt('due_date', today.toISOString())
```

### @react-pdf/renderer Document Pattern
**What:** The PDF document itself is a plain React component using `@react-pdf/renderer` primitives only — no HTML, no Tailwind, no shadcn.
```typescript
// src/components/invoices/pdf/InvoicePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { marginBottom: 24 },
  tutorName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  section: { marginBottom: 16 },
  table: { display: 'flex', flexDirection: 'column' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6 },
  col: { flex: 1 },
  total: { textAlign: 'right', fontWeight: 'bold', marginTop: 8 },
})

export function InvoicePDF({ invoice }: { invoice: InvoiceWithItems }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.tutorName}>{invoice.tutor_name}</Text>
          <Text>{invoice.invoice_number}</Text>
          <Text>Issued: {invoice.issued_date}</Text>
          <Text>Due: {invoice.due_date}</Text>
        </View>
        <View style={styles.section}>
          <Text>Bill to: {invoice.bill_to}</Text>
        </View>
        {/* Line items table */}
        <View style={styles.table}>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.col}>{item.description}</Text>
              <Text style={styles.col}>{item.amount}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>Total: {invoice.total}</Text>
        {invoice.notes && <Text>{invoice.notes}</Text>}
      </Page>
    </Document>
  )
}
```

### Anti-Patterns to Avoid
- **Putting `<PDFViewer>` in a Server Component** — will throw "window is not defined". Always `'use client'` + `dynamic({ ssr: false })`.
- **Using `renderToStream` in a Server Action** — Server Actions can't return streams/files. Use a Route Handler for PDF download.
- **Using MAX(invoice_number)+1 for numbering** — race condition. Always use `nextval('invoice_number_seq')`.
- **Importing @react-pdf/renderer components in Server Components** — the renderer has browser globals. Import only in client components or Route Handlers.
- **Using HTML elements in InvoicePDF** — `@react-pdf/renderer` has its own primitives (`View`, `Text`, `Image`). No `<div>`, `<p>`, `<table>`.
- **Using Tailwind classes in InvoicePDF** — PDF rendering uses `StyleSheet.create()` not Tailwind. Styles are inline-only.
- **Deleting a draft invoice without clearing lessons.invoice_id** — the FK has `ON DELETE SET NULL` so this is handled automatically by the DB, but verify it works.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas/SVG renderer | @react-pdf/renderer | Handles page breaks, text wrapping, fonts automatically |
| PDF download in browser | `window.open()` hacks | Route Handler returning `application/pdf` | Clean streaming response with correct headers |
| PDF preview iframe | Raw `<iframe src="data:...">` | `<PDFViewer>` from @react-pdf/renderer | Handles cross-browser PDF rendering in the component |
| Invoice numbering | `SELECT MAX() + 1` | PostgreSQL `nextval('invoice_number_seq')` | Race-condition-safe; already created in 001_initial_schema.sql |
| Date comparison for overdue | Manual string comparison | `isBefore(new Date(due_date), new Date())` from date-fns | Handles edge cases, already installed |

**Key insight:** The schema is 100% complete. This phase is pure application layer — no migrations needed for the core tables. Only potential migration: a DB function for `get_next_invoice_number()` to expose the sequence via Supabase RPC, and optionally a `receipt_number_seq`.

---

## Common Pitfalls

### Pitfall 1: @react-pdf/renderer SSR crash
**What goes wrong:** Next.js tries to render `<PDFViewer>` or import `@react-pdf/renderer` on the server; throws `window is not defined` or `canvas is not defined`.
**Why it happens:** The library uses browser globals internally.
**How to avoid:** Any component that imports from `@react-pdf/renderer` must be `'use client'` AND dynamically imported with `{ ssr: false }`. The `InvoicePDF` document component (which uses only `Document`, `Page`, `Text`, `View`) can be imported in Route Handlers (Node.js environment) without the browser globals issue — only `PDFViewer` and `BlobProvider` have the browser dependency.
**Warning signs:** Build succeeds but runtime crashes on page load; or `next build` fails with canvas/window errors.

### Pitfall 2: next.config.ts PDF worker configuration
**What goes wrong:** PDF rendering fails silently or throws worker errors in production.
**Why it happens:** `@react-pdf/renderer` may need webpack configuration to handle its worker/canvas dependencies.
**How to avoid:** Check `next.config.ts` — the CLAUDE.md notes mention a "PDF Worker" config section. Verify if `canvas` needs to be excluded from server-side bundling:
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}
```
In Next.js 16, this may be `serverExternalPackages` (not under `experimental`). Verify at implementation time.

### Pitfall 3: zod v4 API difference
**What goes wrong:** `parsed.error.errors[0].message` throws TypeError at runtime.
**Why it happens:** zod v4 changed `.errors` to `.issues` on `ZodError`.
**How to avoid:** Always use `parsed.error.issues[0].message` — already established in project (see STATE.md pitfalls). All invoice server actions must follow this pattern.

### Pitfall 4: Invoice creation not atomic
**What goes wrong:** Invoice row inserted but invoice_items fail, or lessons.invoice_id not updated — leaving orphaned invoice.
**Why it happens:** Multiple separate DB operations without a transaction.
**How to avoid:** Supabase JS client doesn't expose explicit transactions easily. Use a Supabase DB function (RPC) for the full create operation, OR accept eventual consistency by doing: insert invoice → insert items → update lessons, and clean up on error. For v1 the RPC approach is cleaner. Alternative: use Supabase's batching — insert invoice first, then items (which cascade-delete if invoice is deleted), then lessons update. If lessons update fails, the invoice/items still exist (not ideal but not data-losing since invoice_id on lessons can be repaired).

### Pitfall 5: PDF preview iframe height on mobile
**What goes wrong:** `<PDFViewer>` renders at fixed height that doesn't fit mobile screens.
**Why it happens:** `PDFViewer` requires explicit `width` and `height` props.
**How to avoid:** Use `width="100%"` and set a responsive height. On mobile, consider linking to the download URL instead of showing the inline preview (`/api/invoices/[id]/pdf`). The `useMediaQuery` hook is already in the project for this branching pattern.

### Pitfall 6: "Overdue" status not in DB
**What goes wrong:** Filtering `?status=overdue` hits the DB with `.eq('status', 'overdue')` — returns zero rows since 'overdue' is not a valid DB status.
**Why it happens:** Overdue is a derived state (sent + past due date), not stored.
**How to avoid:** In the query, handle `overdue` as a special case: `.eq('status', 'sent').lt('due_date', new Date().toISOString().split('T')[0])`.

### Pitfall 7: receipt_number sequence missing
**What goes wrong:** `markInvoicePaid` server action has no way to generate a unique `receipt_number` without a sequence or counter.
**Why it happens:** Schema has `UNIQUE (tutor_id, receipt_number)` but no `receipt_number_seq` was created in the initial migration.
**How to avoid:** Add a `receipt_number_seq` via a new migration, OR use the invoice's own number as the receipt number (e.g., `REC-0001` maps to `INV-0001`). Simplest v1 approach: create a `receipt_number_seq` in a `002_receipt_seq.sql` migration.

---

## Code Examples

### Un-invoiced Lessons Query (INV-01)
```typescript
// src/lib/queries/invoices.ts
export async function getUnInvoicedLessons(tutorId: string, studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, duration_minutes, rate, notes')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .is('invoice_id', null)
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}
```

### Invoice List Query with Status Filter (INV-05)
```typescript
export async function getInvoices(tutorId: string, status?: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('invoices')
    .select('id, invoice_number, status, issued_date, due_date, paid_date, total, students(name)')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })

  if (status === 'overdue') {
    query = query.eq('status', 'sent').lt('due_date', today)
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
```

### Invoice Detail Query (INV-06)
```typescript
export async function getInvoice(tutorId: string, invoiceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, status, issued_date, due_date, paid_date,
      subtotal, total, notes, created_at,
      students(name, parent_name),
      invoice_items(id, description, quantity, unit_price, amount, lesson_id),
      receipts(id, receipt_number, paid_at, amount_paid, payment_method)
    `)
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)
    .single()
  if (error) throw error
  return data
}
```

### Line Item Description Format (D-09)
```typescript
// Generate description for a lesson line item
function lessonDescription(lesson: UnInvoicedLesson, timezone: string): string {
  const date = formatShortDate(lesson.scheduled_at, timezone)
  const duration = `${lesson.duration_minutes} min`
  return `${date} — ${duration} lesson`
}

// Amount calculation
const amount = (lesson.duration_minutes / 60) * lesson.rate
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `renderToStream` for PDF in Next.js API routes | `renderToBuffer` in Route Handlers | @react-pdf/renderer v3+ | Buffer approach works cleanly with `new Response(buffer)` |
| `experimental.serverComponentsExternalPackages` | `serverExternalPackages` (top-level) | Next.js 15+ | Config key moved; verify in next.config.ts |
| zod `.error.errors` | zod `.error.issues` | zod v4 | Already known in project; don't use old API |
| date-fns v2 `zonedTimeToUtc` | date-fns-tz v3 `fromZonedTime` / `toZonedTime` | v3 | Already correct in project utils |

**Deprecated/outdated:**
- `PDFDownloadLink`: The `<PDFDownloadLink>` component from @react-pdf/renderer works but is client-only. For this project, the Route Handler approach is preferred because it enables server-side data fetching and cleaner security (tutor_id check server-side).

---

## Open Questions

1. **`get_next_invoice_number()` DB function vs raw RPC**
   - What we know: Supabase exposes PostgreSQL functions via `.rpc()`. The sequence `invoice_number_seq` exists.
   - What's unclear: Whether calling `SELECT nextval('invoice_number_seq')` directly works via Supabase without a wrapper function, or if a DB function must be created.
   - Recommendation: Create a `get_next_invoice_number()` DB function in a migration (safe, clean). Same for `receipt_number_seq` / `get_next_receipt_number()`.

2. **`serverExternalPackages` config for @react-pdf/renderer**
   - What we know: Next.js 15/16 moved this from `experimental.serverComponentsExternalPackages` to top-level `serverExternalPackages`.
   - What's unclear: Whether @react-pdf/renderer v4.3.2 requires this config or works without it in Next.js 16.
   - Recommendation: Add `serverExternalPackages: ['@react-pdf/renderer', 'canvas']` to `next.config.ts` during the spike wave and verify build succeeds.

3. **Receipt number generation**
   - What we know: Schema requires `UNIQUE (tutor_id, receipt_number)`. No `receipt_number_seq` was created.
   - What's unclear: Whether to add a migration or derive from invoice number.
   - Recommendation: Add `002_receipt_seq.sql` migration with `CREATE SEQUENCE receipt_number_seq START 1` and a `get_next_receipt_number()` DB function.

---

## Validation Architecture

Validation for this phase is **manual verification** against acceptance criteria — the project has no automated test suite configured (no `jest.config.*`, `vitest.config.*`, or test directories found).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Verification |
|--------|----------|-----------|--------------|
| INV-01 | Un-invoiced lessons populate form | Manual | Navigate to student with completed lessons, click Create Invoice |
| INV-02 | Sequential invoice number INV-0001 | Manual | Create two invoices, verify numbers increment |
| INV-03 | Issue/due date fields editable | Manual | Verify date pickers work on create form |
| INV-04 | Draft save and Send | Manual | Save as draft, verify status=draft; click Send, verify status=sent |
| INV-05 | List filtered by status | Manual | Navigate to /invoices?status=draft, sent, paid, overdue |
| INV-06 | Invoice detail shows line items | Manual | View created invoice, verify all lessons appear as items |
| INV-07 | PDF downloads with correct content | Manual | Download PDF, open in viewer, verify tutor name, line items, total |
| PAY-01 | Mark as paid with date + method | Manual | Click Mark Paid on sent invoice, fill form, submit |
| PAY-02 | Receipt auto-generated | Manual | After marking paid, verify receipt record visible on detail page |
| INV-08 | Delete draft | Manual | On draft invoice, delete, verify AlertDialog, verify gone from list |

### Wave 0 Gaps
- No test framework installed — no gaps to fill (manual verification only for this phase)

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/001_initial_schema.sql` — Full verified schema for invoices, invoice_items, receipts tables
- `package.json` — Verified exact versions of all installed dependencies (date-fns 4.1.0, zod 4.3.6, Next.js 16.2.1)
- `npm show @react-pdf/renderer version` — Verified latest version 4.3.2 on 2026-03-22
- Existing codebase (`src/lib/actions/lessons.ts`, `src/lib/dal.ts`, `src/lib/queries/`) — Verified patterns in use

### Secondary (MEDIUM confidence)
- CLAUDE.md project stack documentation — confirmed @react-pdf/renderer in tech stack, Render hosting constraint re: Puppeteer
- STATE.md accumulated decisions — zod v4 `.issues` pitfall, Route Handler for PDF (confirmed as known decision)
- @react-pdf/renderer GitHub/npm — API surface (`renderToBuffer`, `PDFViewer`, `Document`, `Page`, `StyleSheet`) based on training data (August 2025 cutoff); version 4.x API is stable but verify at implementation

### Tertiary (LOW confidence — verify at implementation)
- `serverExternalPackages` config key name for Next.js 16 — may differ from training data
- Whether `SELECT nextval()` works directly via Supabase RPC without a wrapper function

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and npm registry
- Architecture: HIGH — established patterns from Phase 2 codebase, confirmed DB schema
- @react-pdf/renderer patterns: MEDIUM — training data August 2025, v4.x API, spike recommended before full build
- Pitfalls: HIGH — derived from existing codebase patterns and STATE.md accumulated decisions

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable libraries; @react-pdf/renderer API rarely breaks between patch versions)
