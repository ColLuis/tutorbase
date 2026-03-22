# Domain Pitfalls

**Domain:** Tutoring management / lesson scheduling / PDF invoicing web app
**Stack:** Next.js 14+ (App Router), Supabase, @react-pdf/renderer, TypeScript, Tailwind, shadcn/ui
**Researched:** 2026-03-22
**Confidence:** MEDIUM (training data to Aug 2025, no live search available — flag any rapidly-evolving areas for validation)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or fundamental rethinking.

---

### Pitfall 1: Timezone Naive Date Storage Causes Silent Data Corruption

**What goes wrong:**
Lesson start/end times are stored as bare date strings (`2026-03-22 10:00:00`) without timezone anchoring. The Next.js server (Render, likely UTC) interprets them differently than the tutor's browser (Australia/Sydney, UTC+10/11). A lesson booked at 10am appears as midnight or the wrong day depending on where code runs.

**Why it happens:**
Developers reach for `new Date()` everywhere, store ISO strings, and assume the database and UI agree. PostgreSQL `TIMESTAMP WITHOUT TIME ZONE` is the default and silently strips timezone info. JavaScript `Date` objects always use the local timezone of the runtime — which differs between server and client.

**Consequences:**
- Lessons appear on the wrong day in the week view
- "Today's lessons" dashboard widget shows wrong lessons
- Recurring lesson generation off by one day across DST transitions
- Invoice line items show wrong lesson dates on PDFs sent to parents
- Revenue monthly breakdown bucketing is wrong

**Prevention:**
- Store all lesson times as `TIMESTAMPTZ` (PostgreSQL timestamp with time zone) — stores UTC, displays correctly per timezone
- Never use `new Date()` for lesson date construction on the server — always use `date-fns-tz` or derive from the tutor's stored `timezone` profile field
- The tutor's timezone (e.g. `Australia/Sydney`) should be loaded at session start and passed into all date formatting functions
- Use `date-fns` `zonedTimeToUtc()` when writing to DB and `utcToZonedTime()` when reading for display
- Write a shared `formatLessonDate(date, timezone)` utility used everywhere — never inline date formatting

**Detection (warning signs):**
- Tests pass locally but fail on CI (different system timezones)
- "Today's lessons" shows zero lessons but there are lessons scheduled for today
- DST changeover dates (October and April in Australia) cause off-by-one errors

**Phase to address:** Foundational — must be correct in the database schema and `date-fns` utility layer before any scheduling features are built. Fixing later requires migrating stored data.

---

### Pitfall 2: @react-pdf/renderer Cannot Run in Next.js Server Components

**What goes wrong:**
`@react-pdf/renderer` uses browser APIs (`canvas`, `Blob`, `URL.createObjectURL`) internally. Importing it in a Next.js Server Component or route handler that runs in the Node.js edge/server runtime will throw `ReferenceError: document is not defined` or similar. If it does work on Node.js runtime, the font loading and layout engine still behave differently from the browser.

**Why it happens:**
Developers assume "it's a React library, I can use it anywhere." Next.js App Router blurs the server/client boundary. The instinct is to generate PDFs in a server action or API route because "PDF generation is a backend concern."

**Consequences:**
- Build succeeds but runtime crashes when invoice PDF is requested
- Workarounds introduce complex `dynamic(() => import(...), { ssr: false })` patterns that break type safety
- PDF generation logic ends up scattered across client/server in confusing ways

**Prevention:**
- Generate PDFs exclusively on the **client side** using `@react-pdf/renderer`'s `<PDFDownloadLink>` or `pdf().toBlob()` in a Client Component
- Never import `@react-pdf/renderer` in a Server Component, Server Action, or API route
- Create a dedicated `InvoicePDFDocument` Client Component (`'use client'`) that holds all PDF rendering logic
- The API/server layer provides the invoice data as JSON; the client component renders it into PDF
- Test PDF generation early (Phase 1 or 2 spike) to validate this pattern before it becomes load-bearing

**Detection (warning signs):**
- `ReferenceError: document is not defined` in server logs
- PDF button works in dev but fails in production build
- Trying to call `renderToStream()` from a route handler

**Phase to address:** PDF spike should happen before the full invoice feature is built — validate the client-side rendering approach with a throwaway `<TestPDF>` component early.

---

### Pitfall 3: Supabase Row Level Security Not Enabled Leaves All Data Exposed

**What goes wrong:**
RLS is disabled by default on new Supabase tables. If a developer builds the entire app using the service role key (which bypasses RLS), everything appears to work — until the app goes live and any authenticated user can query any tutor's students, lessons, and invoices directly via the Supabase REST API.

**Why it happens:**
Service role key works seamlessly during development. RLS policies are an extra step that feels premature when you're focused on features. `supabase-js` on the client side uses the anon key which respects RLS — but server-side code that accidentally uses the service key bypasses it.

**Consequences:**
- Privacy violation: parents or other users can access another tutor's records
- Invoice amounts, student names, contact details exposed
- For a future two-tutor scenario, Tutor A sees all of Tutor B's data

**Prevention:**
- Enable RLS on every table at the time of creation — add it to the migration, not as an afterthought
- Write the policy first: `tutor_id = auth.uid()` on all tables that belong to a tutor
- In Next.js server code, use the **user-scoped** Supabase client (initialized with the user's JWT from the cookie) — never use the service role key in client-facing routes
- Service role key is only for: seed scripts, DB migrations, admin-only background jobs
- Add a smoke test that queries `students` with a different user's JWT and verifies zero results

**Detection (warning signs):**
- All DB queries work perfectly without a logged-in session
- The Supabase project shows `anon` role performing selects that return rows
- No RLS policies listed in the Supabase Dashboard for a table that has user data

**Phase to address:** Foundation — enable RLS in the initial schema migration. Never disable "to make development easier."

---

### Pitfall 4: Recurring Lesson Expansion Strategy — Pre-Generate vs On-the-Fly

**What goes wrong:**
Two failure modes exist. (A) Pre-generating all recurrence instances as individual DB rows on creation — then editing "this lesson only" requires removing from a series which demands a complex parent/child relationship. (B) Storing only the recurrence rule and expanding on read — then querying "all lessons this week" requires application-level date math on every request, can't be indexed, and breaks pagination.

**Why it happens:**
Neither pattern is obvious. Pre-generation feels simpler initially. On-the-fly expansion feels clever. Both have sharp edges for a scheduling app.

**Consequences:**
- Pre-generation: editing "this lesson only" without a parent/child design means the edit silently disconnects from the series, making future bulk edits impossible
- On-the-fly: un-invoiced lesson queries and revenue reports need full recurrence expansion in application code — slow, complex, and hard to test
- Mid-project switch between strategies requires schema migration and data rewrite

**Prevention:**
- Use **pre-generation with a series link**: generate all instances as rows at creation time; store a `recurring_series_id` FK on each instance; "this lesson only" edit just updates that row; "all future" edit updates rows where `starts_at >= now()` with matching `recurring_series_id`
- The project has already decided "recurring edit = this lesson only" — pre-generation with series ID is the right fit for this decision; it keeps queries simple and SQL-friendly
- Cap recurrence generation at a reasonable horizon (e.g. 52 weeks) to bound row count; document this cap in comments
- Add `recurring_series_id UUID REFERENCES recurring_series(id)` to the `lessons` table from day one

**Detection (warning signs):**
- "All lessons for week view" query runs a recurrence expansion loop in TypeScript
- Editing a lesson removes it from its series with no trace
- Invoice "un-invoiced lessons" query requires application-level expansion

**Phase to address:** Scheduling phase — schema design decision that must be made before first lesson is created.

---

### Pitfall 5: Invoice Number Generation Race Condition

**What goes wrong:**
Two invoice creations happening concurrently (unlikely but possible if a user double-taps) both read `MAX(invoice_number)` as `INV-0004`, both increment to `INV-0005`, and one of them fails with a unique constraint violation — or worse, if there is no unique constraint, two invoices share a number.

**Why it happens:**
Invoice number generation is often implemented as: `SELECT MAX(invoice_number) FROM invoices` → increment → insert. This is a read-modify-write race with no locking.

**Consequences:**
- Duplicate invoice numbers — legally and professionally problematic for a tutor sending to parents
- Unique constraint violation causes a confusing 500 error mid-flow
- Invoice numbers skip values unpredictably

**Prevention:**
- Use a PostgreSQL sequence: `CREATE SEQUENCE invoice_number_seq START 1;` and `DEFAULT nextval('invoice_number_seq')` on the `invoice_number` column — the DB generates the next number atomically
- Or use a `SERIAL`/`BIGSERIAL` backing column and format as `INV-` + zero-padded value in application code
- Never derive the next invoice number in TypeScript application code using MAX queries
- The sequence is per-tutor or global — for a single-tutor app, a single global sequence is fine; design for per-tutor if multi-tenancy is planned

**Detection (warning signs):**
- Invoice number logic is `parseInt(lastNumber.replace('INV-', '')) + 1` in TypeScript
- No unique constraint on `invoice_number` column
- Invoice creation is a multi-step SELECT then INSERT without a transaction

**Phase to address:** Invoice creation phase — sequence must be set up in the schema migration before invoice creation is built.

---

### Pitfall 6: Next.js App Router Auth Cookie Handling — Middleware vs Page-Level Checks

**What goes wrong:**
Supabase Auth with Next.js App Router requires the `@supabase/ssr` package (not the legacy `auth-helpers-nextjs`) and correct middleware configuration to refresh sessions. Without proper middleware, the session token expires after 1 hour and users get silently logged out with confusing "not authenticated" errors mid-session. Worse, some routes may be server-rendered with stale auth state.

**Why it happens:**
The Supabase docs have historically had multiple competing patterns (`createClient` from `@supabase/supabase-js` directly, `createClientComponentClient`, `createServerComponentClient`, `createRouteHandlerClient` — now replaced by `@supabase/ssr`'s `createBrowserClient`/`createServerClient`). Developers copy examples from older blog posts.

**Consequences:**
- Users lose session after ~1 hour with no visible feedback
- Protected pages are accessible via direct URL on first load if middleware is missing
- Server Components and Client Components see different auth states (hydration mismatch)
- PDF download triggers a 401 because the server-side client has a stale token

**Prevention:**
- Use `@supabase/ssr` exclusively — `createBrowserClient` for Client Components, `createServerClient` for Server Components and Route Handlers, with cookies passed correctly
- Implement `middleware.ts` that calls `supabase.auth.getUser()` on every request to refresh the session token — this is the official Supabase Next.js pattern as of 2024+
- Middleware should redirect unauthenticated requests to `/login` — do not rely solely on page-level auth checks
- Store the Supabase URL and anon key in `NEXT_PUBLIC_` env vars; store service role key (if used) only in non-prefixed server env vars
- Test session refresh by waiting 65 minutes in a test account before filing "works for me"

**Detection (warning signs):**
- Using `createClientComponentClient` or `createServerComponentClient` (legacy `auth-helpers` API)
- No `middleware.ts` in the project root
- `auth.getSession()` used instead of `auth.getUser()` (sessions can be spoofed; `getUser()` hits the server)
- Users report "randomly logged out"

**Phase to address:** Authentication foundation — correct pattern must be established before any protected routes are built.

---

### Pitfall 7: PDF Font Embedding — Custom Fonts Not Loaded, Fallback Looks Unprofessional

**What goes wrong:**
`@react-pdf/renderer` uses its own PDF layout engine with a limited default font set (Helvetica, Times, Courier). If a tutor's invoice uses Tailwind-styled components for the preview but the PDF uses the default font, the PDF looks completely different from what the tutor expects. Worse, custom fonts must be explicitly registered using `Font.register()` with a URL or file path — and in Next.js this path differs between dev and production.

**Why it happens:**
The gap between the web UI (styled with Tailwind/shadcn) and the PDF (rendered by react-pdf's layout engine) is easy to underestimate. Developers assume the PDF will look like the web preview.

**Consequences:**
- Invoice PDF looks amateur — defeating the "professional enough to send to parents" requirement
- Custom font files not bundled in the production build, causing `Font.register()` to 404
- Different font rendering between local dev and Render deployment

**Prevention:**
- Use fonts available via a stable CDN (Google Fonts) in `Font.register()` — e.g. Inter or Nunito served from `https://fonts.gstatic.com` — rather than local file paths
- Or bundle font files in `public/fonts/` and reference them with an absolute URL constructed from `NEXT_PUBLIC_BASE_URL`
- Design the PDF layout separately from the web UI — accept they will look different and design the PDF to look good natively, not like a screenshot of the web app
- Spike PDF font registration as part of the early PDF proof-of-concept

**Detection (warning signs):**
- PDF renders in dev but shows "font not found" warnings in production logs
- PDF uses Helvetica everywhere despite the code referencing "Inter"
- Invoice PDF preview looks nothing like the design mockup

**Phase to address:** PDF spike (early, before full invoice implementation).

---

## Moderate Pitfalls

Mistakes that cause significant rework but not full rewrites.

---

### Pitfall 8: Mobile Tap Targets and Form UX Not Tested on Real Device

**What goes wrong:**
The project requires mobile-first design with 44x44px minimum tap targets. Developers test in Chrome DevTools device emulation, which does not faithfully simulate iOS Safari touch behavior, viewport safe areas (iPhone notch/home bar), or the virtual keyboard pushing the viewport up.

**Prevention:**
- Test on a real iPhone (the tutor's primary device) at least once per major feature
- Use `env(safe-area-inset-bottom)` for bottom nav padding to avoid home bar overlap
- Bottom nav should be `fixed bottom-0` with padding that accounts for `safe-area-inset-bottom`
- Form inputs: `font-size: 16px` minimum to prevent iOS auto-zoom on focus — Tailwind's `text-base` (16px) handles this
- Test the lesson scheduling form (date picker, time picker) on mobile before the scheduling phase is "done"

**Phase to address:** Any phase introducing new forms or navigation — validate on device before marking complete.

---

### Pitfall 9: Supabase Free Tier Cold Starts on Render Are Not the Only Cold Start

**What goes wrong:**
The project notes Render free tier has ~30 second cold start after 15 min idle. Developers may also be surprised that Supabase free tier projects pause after 1 week of inactivity (as of Supabase's free tier policy in 2024). Unpausing requires visiting the Supabase Dashboard and clicking "Restore project" — it does not auto-resume on request.

**Prevention:**
- Document the Supabase inactivity pause behavior in project README so the tutor knows what to do if the app seems down
- For development: keep the Supabase project active by visiting it weekly or using a simple ping script
- For v1 personal tool use, this is acceptable — plan a "how to restore" runbook

**Phase to address:** Deployment phase — include in deployment documentation.

---

### Pitfall 10: Invoice "Un-Invoiced Lessons" Query Misses Edge Cases

**What goes wrong:**
The invoice creation flow must auto-populate from "completed lessons that haven't been invoiced yet." The query logic is easy to get wrong: lessons that were partially invoiced (rare but possible with manual line items), lessons on cancelled invoices that were never paid, lessons on draft invoices the tutor abandoned.

**Prevention:**
- Define "un-invoiced" precisely in the data model: a lesson is un-invoiced if it has no `invoice_id` FK (or the FK points to an invoice in `cancelled` status)
- When an invoice is cancelled, set `invoice_id = NULL` on its lesson rows so they become available again
- Add a DB constraint or trigger comment documenting this invariant
- Write a unit test for the "un-invoiced lessons" query covering: completed+no invoice, completed+draft invoice, completed+sent invoice, completed+paid invoice, completed+cancelled invoice

**Phase to address:** Invoice creation phase — get the query right before the invoice list view is built.

---

### Pitfall 11: Supabase Type Generation Drift

**What goes wrong:**
The project uses `@supabase/supabase-js` with generated TypeScript types. After any schema migration (adding a column, changing a nullable to not-null), the generated types go stale. TypeScript continues to compile because the old types are still valid code — but runtime behavior differs from the schema.

**Prevention:**
- Add `npm run types:generate` (alias for `npx supabase gen types typescript --local > src/types/database.types.ts`) to the migration workflow — run it after every schema change
- Document this step in CONTRIBUTING.md or the project README
- Use a `postmigrate` script or Makefile target to automate it
- Never hand-edit the generated types file — always regenerate

**Phase to address:** Foundation — establish the type generation workflow before the first schema migration.

---

## Minor Pitfalls

---

### Pitfall 12: Revenue Calculations Done in Application Code Instead of SQL

**What goes wrong:**
Monthly revenue totals, student breakdowns, and summary metrics are calculated by fetching all invoice line items into JavaScript and summing them. For a solo tutor this is fine at 50 invoices — but it sets a bad pattern and makes the revenue page slow as data grows.

**Prevention:**
- Use PostgreSQL aggregate queries (`SUM`, `GROUP BY month`, `GROUP BY student_id`) for revenue calculations
- Return pre-aggregated data from Supabase — not raw rows that TypeScript sums
- This also makes the queries simpler and easier to validate

**Phase to address:** Revenue/reporting phase.

---

### Pitfall 13: Hardcoded AUD Symbol Instead of Locale-Aware Formatting

**What goes wrong:**
The project is AUD-only for v1 but is designed so "currency/tax can be swapped later." If currency symbols, decimal separators, and number formatting are hardcoded as `$` and `toFixed(2)` throughout, swapping them later requires a grep-and-replace across the whole codebase.

**Prevention:**
- Create a single `formatCurrency(amount: number, currency: string = 'AUD'): string` utility using `Intl.NumberFormat`
- Use it everywhere — UI, PDF, revenue page — never inline `$` + `.toFixed(2)`
- The `currency` value comes from the tutor's settings (defaulting to `AUD`)

**Phase to address:** Foundation — utility written before any currency display is implemented.

---

### Pitfall 14: Lesson Status Updates Not Optimistic — UI Feels Sluggish on Mobile

**What goes wrong:**
Quick lesson status updates (completed, cancelled, no-show) from the week view or list view require a round-trip to Supabase before the UI updates. On a slow mobile connection this creates a noticeable lag — the tutor taps a button and nothing happens for 1-2 seconds.

**Prevention:**
- Implement optimistic updates for lesson status changes: update local state immediately, then sync to Supabase; revert on error
- Next.js Server Actions with `useOptimistic` (available in React 18+) handles this pattern cleanly
- This is especially important for the "mark as completed" button used between lessons on a phone

**Phase to address:** Scheduling/lesson management phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| DB Schema / Foundation | Timezone-naive timestamps (Pitfall 1) | Use `TIMESTAMPTZ` from day one, validate with a test query |
| DB Schema / Foundation | RLS disabled (Pitfall 3) | Enable RLS in migration file, not as a follow-up task |
| DB Schema / Foundation | Type generation drift (Pitfall 11) | Add `types:generate` script to migration workflow |
| DB Schema / Foundation | Currency hardcoding (Pitfall 13) | Write `formatCurrency` utility before first UI |
| DB Schema / Foundation | Invoice number race condition (Pitfall 5) | Create PostgreSQL sequence in schema migration |
| Authentication | Wrong Supabase/Next.js auth package (Pitfall 6) | Use `@supabase/ssr` + `middleware.ts` from day one |
| Scheduling | Recurring lesson expansion strategy (Pitfall 4) | Pre-generate rows + `recurring_series_id` from schema design |
| PDF Spike | react-pdf in Server Component (Pitfall 2) | Spike client-side PDF generation before invoice feature |
| PDF Spike | Font embedding fails in production (Pitfall 7) | Use CDN fonts or `public/fonts/` with absolute URL |
| Invoice Creation | Un-invoiced lesson query edge cases (Pitfall 10) | Define "un-invoiced" precisely, write unit tests |
| Revenue / Reporting | Client-side aggregation (Pitfall 12) | Use SQL `SUM + GROUP BY`, not JS `.reduce()` |
| Mobile UX | Tap targets not tested on device (Pitfall 8) | Test on real iPhone at end of every phase |
| Deployment | Supabase project pause (Pitfall 9) | Document restore procedure for the tutor |
| Lesson Management | Sluggish status updates (Pitfall 14) | Use optimistic updates with `useOptimistic` |

---

## Sources

- Training knowledge (Next.js 14 App Router, Supabase, @react-pdf/renderer) — confidence MEDIUM; knowledge cutoff August 2025
- Supabase official documentation patterns for Next.js App Router (`@supabase/ssr` package) — HIGH confidence for auth pattern
- @react-pdf/renderer known browser-API dependency — HIGH confidence (fundamental library constraint)
- PostgreSQL TIMESTAMPTZ vs TIMESTAMP behavior — HIGH confidence (well-documented standard)
- PostgreSQL sequence for auto-increment — HIGH confidence
- React `useOptimistic` (React 18 / Next.js 14) — HIGH confidence
- Supabase free tier inactivity pause policy — MEDIUM confidence (policy details may have changed since August 2025; verify at supabase.com/pricing)
- Render free tier cold start — MEDIUM confidence (verify current idle timeout at render.com/docs)
