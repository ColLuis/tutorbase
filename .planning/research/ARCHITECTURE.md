# Architecture Patterns

**Domain:** Solo tutor operations management web app
**Stack:** Next.js 14+ App Router, TypeScript, Supabase (PostgreSQL + Auth + RLS)
**Researched:** 2026-03-22
**Confidence:** HIGH (Next.js patterns verified against official docs v16.2.1; Supabase patterns MEDIUM — @supabase/ssr integration confirmed via Next.js auth guide references, core pattern is well-established)

---

## Recommended Architecture

TutorBase is a server-rendered, single-tenant web app with one authenticated user (the tutor) in v1. The architecture leverages Next.js App Router's server-first model: most pages are Server Components that fetch directly from Supabase, mutations go through Server Actions, and Supabase RLS enforces data isolation at the database layer.

```
Browser / Mobile
     |
     v
[ proxy.ts ]  ← auth guard: redirect unauthenticated requests to /login
     |
     v
[ Next.js App Router ]
  ├── Server Components  → fetch data via Supabase server client (direct DB)
  ├── Client Components  → interactive UI (forms, calendar controls, PDF trigger)
  └── Server Actions     → mutations (create/update/delete) via Supabase server client
     |
     v
[ Supabase ]
  ├── PostgreSQL   → tutors, students, lessons, invoices, receipts, invoice_items
  ├── Auth         → session in httpOnly cookie, managed by @supabase/ssr
  └── RLS Policies → auth.uid() = tutor_id on every table
     |
     v
[ @react-pdf/renderer ]  ← PDF generation runs server-side in Route Handler
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `proxy.ts` | Session check on every request; redirect unauthenticated users to `/login` | Supabase auth cookie (reads only — no DB calls) |
| `lib/supabase/server.ts` | Creates Supabase client for Server Components, Server Actions, Route Handlers | Supabase API; reads/writes auth cookie |
| `lib/supabase/client.ts` | Creates Supabase browser client for Client Components | Supabase API; reads cookie |
| `lib/dal.ts` (Data Access Layer) | `verifySession()` — validates session and returns `tutor_id`; reusable across all server code | `lib/supabase/server.ts` |
| `app/(auth)/login/` | Login page and login Server Action | Supabase Auth API via server client |
| `app/(app)/layout.tsx` | Authenticated shell: sidebar (desktop) + bottom nav (mobile) | `lib/dal.ts` for tutor profile |
| `app/(app)/dashboard/` | Today's lessons, weekly counts, unpaid invoices, quick actions | Students, Lessons, Invoices tables |
| `app/(app)/students/` | Student CRUD — list, create, view, edit, deactivate | Students table |
| `app/(app)/schedule/` | Week view calendar + list view; lesson status updates | Lessons table |
| `app/(app)/invoices/` | Invoice list, create (auto-populated), lifecycle (draft/sent/paid) | Invoices, Invoice Items, Lessons, Students tables |
| `app/(app)/receipts/` | Receipt list; auto-created when invoice marked paid | Receipts table |
| `app/(app)/revenue/` | Monthly breakdown, student breakdown, summary metrics | Lessons, Invoices, Receipts tables |
| `app/(app)/settings/` | Tutor profile, business details, invoice defaults | Tutors table |
| `app/api/pdf/invoice/[id]/` | Route Handler: generate PDF invoice, return as `application/pdf` | Invoices, Invoice Items, Students, Tutors tables; `@react-pdf/renderer` |
| `app/api/pdf/receipt/[id]/` | Route Handler: generate PDF receipt, return as `application/pdf` | Receipts, Invoices, Students, Tutors tables; `@react-pdf/renderer` |
| `lib/actions/` | Server Actions grouped by domain (students, lessons, invoices, etc.) | `lib/dal.ts`, Supabase server client |
| `lib/pdf/` | `@react-pdf/renderer` document components — InvoiceDocument, ReceiptDocument | Used only by PDF Route Handlers |
| `components/ui/` | shadcn/ui primitives (Button, Input, Card, etc.) — Client Components | None (presentation only) |
| `components/` | Domain UI components (StudentCard, LessonRow, InvoiceStatus, etc.) | Mix of Server and Client Components |

---

## Route Structure

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx          ← public route
├── (app)/
│   ├── layout.tsx            ← authenticated shell (nav, sidebar)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── students/
│   │   ├── page.tsx          ← list
│   │   ├── new/page.tsx      ← create form
│   │   └── [id]/
│   │       ├── page.tsx      ← view
│   │       └── edit/page.tsx ← edit form
│   ├── schedule/
│   │   └── page.tsx          ← week view + list view (searchParams: week, view)
│   ├── invoices/
│   │   ├── page.tsx          ← list
│   │   ├── new/page.tsx      ← create (auto-populated from lessons)
│   │   └── [id]/
│   │       └── page.tsx      ← view + status actions
│   ├── receipts/
│   │   └── [id]/page.tsx     ← view receipt
│   ├── revenue/
│   │   └── page.tsx          ← metrics + breakdowns
│   └── settings/
│       └── page.tsx          ← profile + business details
└── api/
    └── pdf/
        ├── invoice/[id]/route.ts
        └── receipt/[id]/route.ts
```

**Route group `(auth)`** — no auth check, accessible pre-login.
**Route group `(app)`** — all protected; the layout can call `verifySession()` for the nav, but auth is also enforced at the `proxy.ts` level and inside each Server Action.

---

## Data Flow

### Read Flow (Server Component page)

```
User navigates → proxy.ts checks cookie → route renders
  → Server Component calls lib/dal.ts verifySession() → gets tutor_id
  → Server Component queries Supabase with server client
  → Supabase RLS enforces auth.uid() = tutor_id
  → Data returned → Server Component renders HTML → sent to browser
```

Pages that need multiple independent data sets use `Promise.all` to fetch in parallel:

```typescript
// app/(app)/dashboard/page.tsx
const [todaysLessons, unpaidInvoices, revenueMetrics] = await Promise.all([
  getTodaysLessons(tutorId),
  getUnpaidInvoices(tutorId),
  getRevenueMetrics(tutorId),
])
```

### Mutation Flow (Server Action)

```
User submits form → Client Component calls Server Action
  → Server Action calls verifySession() → validates tutor_id
  → Server Action mutates Supabase (INSERT / UPDATE / DELETE)
  → RLS prevents touching other tutors' data even if tutor_id is spoofed
  → Server Action calls revalidatePath('/invoices') or revalidateTag(...)
  → Next.js re-fetches affected pages → updated UI returned in same roundtrip
```

### PDF Generation Flow (Route Handler)

```
User clicks "Download PDF" → browser navigates to /api/pdf/invoice/[id]
  → Route Handler calls verifySession() → validates tutor_id
  → Route Handler fetches invoice + line items + student + tutor details
  → Passes data to @react-pdf/renderer renderToBuffer()
  → Returns Response with Content-Type: application/pdf
  → Browser offers download / opens in PDF viewer
```

PDF generation is server-side only. `@react-pdf/renderer` runs in Node.js environment via Route Handler, not in the browser or Server Components (rendering to buffer blocks the response — acceptable for a personal tool, no streaming needed).

### Auth Flow

```
User visits any (app) route → proxy.ts reads session cookie
  → If no valid session: redirect to /login
  → If valid session: request proceeds

User submits login form → Server Action calls supabase.auth.signInWithPassword()
  → @supabase/ssr writes session to httpOnly cookie
  → redirect to /dashboard

User clicks logout → Server Action calls supabase.auth.signOut()
  → @supabase/ssr clears cookie → redirect to /login
```

---

## Supabase Client Pattern

Two distinct clients — never mix them:

```
lib/supabase/server.ts   → createServerClient() from @supabase/ssr
                           Used in: Server Components, Server Actions, Route Handlers
                           Reads/writes cookies via next/headers

lib/supabase/client.ts   → createBrowserClient() from @supabase/ssr
                           Used in: Client Components only
                           For real-time subscriptions or client-side queries (rare in this app)
```

**For TutorBase specifically:** almost all data access goes through the server client. The browser client is only needed if real-time features are added in a future phase.

---

## Data Model (High-Level)

```
tutors
  id (auth.uid())
  name, email
  business_name, abn
  bsb, account_number, bank_name
  invoice_prefix (default 'INV'), next_invoice_number
  timezone (default 'Australia/Sydney')
  currency (default 'AUD')

students
  id, tutor_id
  name
  parent_name, parent_email, parent_phone
  default_rate (decimal)
  notes
  is_active (bool)

lessons
  id, tutor_id, student_id
  scheduled_at (timestamptz)
  duration_minutes
  status (scheduled | completed | cancelled | no_show)
  rate (decimal)  ← copied from student at lesson creation
  notes
  recurring_group_id (uuid, nullable)  ← groups recurring lesson sets
  invoice_id (nullable)  ← set when lesson added to invoice

invoices
  id, tutor_id, student_id
  invoice_number (e.g. INV-0001)
  status (draft | sent | paid)
  issued_date, due_date, paid_date
  subtotal, total
  notes

invoice_items
  id, invoice_id, tutor_id
  description
  quantity, unit_price, amount
  lesson_id (nullable)  ← links item back to lesson if auto-generated

receipts
  id, tutor_id, invoice_id
  receipt_number
  paid_at
  amount_paid
```

**RLS pattern on every table:**
```sql
CREATE POLICY "tutor_isolation" ON lessons
  USING (tutor_id = auth.uid());
```

All tables have `tutor_id = auth.uid()` policy covering SELECT, INSERT, UPDATE, DELETE.

---

## Patterns to Follow

### Pattern 1: Server Component + Server Action co-location

Pages own their data fetch. Actions live in `lib/actions/[domain].ts`. No API routes for CRUD — use Server Actions directly.

```typescript
// app/(app)/students/[id]/edit/page.tsx (Server Component)
export default async function EditStudentPage({ params }) {
  const { tutorId } = await verifySession()
  const student = await getStudent(params.id, tutorId) // throws if not found / wrong tutor
  return <EditStudentForm student={student} action={updateStudent} />
}

// lib/actions/students.ts (Server Action)
export async function updateStudent(id: string, formData: FormData) {
  'use server'
  const { tutorId } = await verifySession()
  // Supabase UPDATE with .eq('tutor_id', tutorId) — RLS also enforces this
  await supabase.from('students').update({...}).eq('id', id).eq('tutor_id', tutorId)
  revalidatePath('/students')
  redirect('/students/' + id)
}
```

### Pattern 2: Recurring lesson group pattern

Recurring lessons share a `recurring_group_id`. Editing "this lesson only" clears the group link (or leaves it — just changes one row). Editing "all future" is a future concern (out of scope for v1). Store the group ID; don't implement cascade edits yet.

### Pattern 3: Invoice auto-population

```
1. User clicks "New Invoice" for a student
2. Server Action queries lessons WHERE student_id = X AND invoice_id IS NULL AND status = 'completed'
3. Each lesson becomes an invoice_item (description = lesson date, quantity = 1, unit_price = lesson rate)
4. User can add manual line items before saving
5. On save: invoice is created (draft), lessons are updated with invoice_id
```

### Pattern 4: PDF Route Handler (not Server Action)

PDF generation returns a binary response, which Server Actions cannot do. Use Route Handlers:

```typescript
// app/api/pdf/invoice/[id]/route.ts
export async function GET(request: Request, { params }) {
  const { tutorId } = await verifySession()
  const data = await getInvoiceForPDF(params.id, tutorId)
  const pdfBuffer = await renderToBuffer(<InvoiceDocument data={data} />)
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.invoiceNumber}.pdf"`,
    },
  })
}
```

### Pattern 5: Navigation layout split

```typescript
// app/(app)/layout.tsx
// Detects mobile vs desktop via user-agent or CSS (prefer CSS)
// Mobile: <BottomNav /> fixed at bottom, main content scrolls
// Desktop: <Sidebar /> fixed left, main content in right panel
// Both are Client Components (need onClick for active states)
```

Use Tailwind responsive classes for the split. Sidebar hidden on mobile (`hidden md:block`), bottom nav hidden on desktop (`block md:hidden`).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Supabase from Client Components

**What:** Importing `createBrowserClient` and querying the DB directly in `'use client'` components for CRUD operations.
**Why bad:** Bypasses server-side authorization logic. Service key exposure risk. Can't trust client-side RLS alone for writes.
**Instead:** Keep mutations in Server Actions. Keep reads in Server Components or pass data down as props.

### Anti-Pattern 2: Auth checks only in proxy.ts

**What:** Relying solely on the proxy route guard and skipping `verifySession()` inside Server Actions and Route Handlers.
**Why bad:** Server Actions are reachable via direct POST requests — proxy.ts does not protect them (confirmed in Next.js docs: "Always verify authentication and authorization inside every Server Function").
**Instead:** Call `verifySession()` at the top of every Server Action and Route Handler.

### Anti-Pattern 3: Generating PDFs in Server Components

**What:** Trying to use `renderToBuffer` inside a Server Component.
**Why bad:** Server Components stream HTML; they cannot return binary responses. `@react-pdf/renderer` renderToBuffer is async and blocks — not compatible with RSC streaming model.
**Instead:** Use Route Handlers (`app/api/pdf/*/route.ts`) for all PDF generation.

### Anti-Pattern 4: Storing timezone in every record

**What:** Saving `Australia/Sydney` or UTC offsets on every lesson and invoice row.
**Why bad:** Unnecessary complexity. For a single-tutor app, all times are in one timezone.
**Instead:** Store `timezone` once on the tutor profile. Convert to/from UTC in the application layer using date-fns-tz. Store all timestamps as UTC in PostgreSQL (timestamptz).

### Anti-Pattern 5: Sequential data fetching in dashboard

**What:** `await getStudents(); await getLessons(); await getInvoices()` sequentially.
**Why bad:** Each await blocks the next — 3x latency on the dashboard.
**Instead:** Use `Promise.all([getStudents(), getLessons(), getInvoices()])` for parallel fetching.

---

## Scalability Considerations

This is a personal tool for 1-2 tutors. Supabase free tier (500 MB, 50K MAU) is far more than enough. These notes are here to prevent over-engineering.

| Concern | At 1-2 tutors (current) | If ever scaled |
|---------|------------------------|----------------|
| DB queries | Direct Supabase queries per request — fine | Add query result caching with React.cache |
| PDF generation | Synchronous renderToBuffer in Route Handler — fine | Move to background job queue |
| Auth | Supabase Auth email/password — fine | Add OAuth providers |
| Multi-tenancy | Single tutor per install effectively — fine | RLS already handles isolation, just add users |
| File storage | No file uploads in v1 | Use Supabase Storage for uploaded receipts/documents |

---

## Build Order (Phase Dependencies)

The component dependency graph drives build order:

```
Phase 1: Foundation
  → Project scaffolding (Next.js, TypeScript, Tailwind, shadcn/ui)
  → Supabase project + local dev setup (@supabase/ssr, client helpers)
  → proxy.ts auth guard + login page + session management
  → Database schema (all tables with RLS policies)
  → TypeScript types generated from schema
  → Shell layout (sidebar + bottom nav, authenticated wrapper)
  → Seed script for development data

  Reason: Everything else depends on auth and DB schema.
  No features can be built without the schema being final.

Phase 2: Students
  → Student CRUD (list, create, edit, deactivate)

  Reason: Students are a foreign key dependency for lessons and invoices.
  Must exist before scheduling.

Phase 3: Scheduling
  → Lesson creation (single + recurring)
  → Week view calendar + list view with navigation
  → Lesson status updates (completed, cancelled, no-show)

  Reason: Lessons must exist and be marked completed before invoicing.
  Recurring lesson infrastructure (group_id) must be built here.

Phase 4: Invoicing
  → Invoice creation (auto-populated from un-invoiced completed lessons)
  → Manual line item support
  → Invoice lifecycle (draft → sent → paid)
  → Invoice number generation
  → Mark as Paid flow + receipt creation
  → PDF generation for invoices and receipts

  Reason: Requires students (Phase 2) and completed lessons (Phase 3).
  PDF generation is isolated in Route Handlers — can be built independently
  of the UI flow but needs the invoice data model to exist.

Phase 5: Revenue + Settings
  → Revenue page (monthly breakdown, student breakdown, summary metrics)
  → Settings page (profile, business details, invoice defaults)

  Reason: Revenue queries aggregate existing invoices/lessons — no new data model.
  Settings page writes tutor profile data — schema exists from Phase 1 but
  UI can be deferred until the core workflow is complete.
```

**Critical path:** Foundation → Students → Scheduling → Invoicing
Revenue and Settings can be interleaved with Invoicing or done after.

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Server Components for all reads | Direct Supabase access, no API layer, no client-side fetch complexity, credentials never sent to browser |
| Server Actions for all mutations | No custom API routes for CRUD, type-safe, form-native, revalidation built in |
| Route Handlers for PDF only | Binary responses cannot be returned from Server Actions or Server Components |
| proxy.ts for redirect guard + verifySession() in every action | Defense in depth — proxy gives UX redirect, DAL gives actual security |
| RLS on every table | Data isolation is enforced at the DB layer even if application code has bugs |
| Timezone in tutor profile only | Single tutor, single timezone — store UTC in DB, convert at display |
| No API routes for CRUD | Simpler architecture; Server Actions replace REST endpoints for this app's complexity level |

---

## Sources

- Next.js App Router routing docs: https://nextjs.org/docs/app/getting-started/layouts-and-pages (verified, v16.2.1, 2026-03-20)
- Next.js data fetching patterns: https://nextjs.org/docs/app/getting-started/fetching-data (verified, v16.2.1, 2026-03-13)
- Next.js Server Actions / mutations: https://nextjs.org/docs/app/getting-started/mutating-data (verified, v16.2.1, 2026-03-10)
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication (verified, v16.2.1, 2026-03-03)
- Next.js proxy.ts (formerly middleware): https://nextjs.org/docs/app/api-reference/file-conventions/proxy (verified, v16.2.1, 2026-03-13)
- Supabase @supabase/ssr integration pattern: referenced in Next.js auth guide Auth Libraries section (MEDIUM confidence — core pattern well established, exact API surface not re-verified against current Supabase docs)
