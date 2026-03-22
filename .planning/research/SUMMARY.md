# Project Research Summary

**Project:** TutorBase
**Domain:** Solo tutor operations management (scheduling, invoicing, payment tracking)
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH

## Executive Summary

TutorBase is a mobile-first, single-authenticated-user web application that replaces a tutor's spreadsheet workflow with a structured tool for scheduling lessons, generating invoices, and tracking payments. The research consensus is clear: this is a well-understood domain with established tooling, and the chosen stack (Next.js App Router, Supabase, TypeScript, Tailwind, shadcn/ui) is a strong match. The architecture should be server-first — Server Components for reads, Server Actions for mutations, and Route Handlers exclusively for PDF generation — all enforced by Supabase RLS at the database layer. The most productive path is to build in strict dependency order: auth and schema first, then students, scheduling, invoicing, and finally reporting.

The primary risks are not in the technology choices but in subtle implementation decisions made early. Three problems can corrupt data or require painful rewrites if not addressed in the foundation phase: timezone-naive timestamp storage (causes wrong lesson dates across the entire app), skipping RLS policies (leaves all financial data exposed), and using the deprecated `@supabase/auth-helpers-nextjs` package instead of `@supabase/ssr` (causes silent session expiry). A fourth issue — the `@react-pdf/renderer` library's incompatibility with Next.js Server Components — must be resolved with a PDF spike before the invoice feature is built. The PITFALLS research is highly specific and actionable; following it will prevent the most common rewrites in this domain.

The feature scope is well-defined and appropriately constrained. The research strongly recommends against online payments, parent portals, calendar sync, and email sending in v1. These are not features that are "nice to have later" — they are scope-doubling additions that provide marginal value to a solo tutor running a 10-15 student practice. The app's core promise ("schedule, mark done, invoice, track payment from your phone") can be delivered with 11 clearly identified features, all of which have established implementation patterns.

---

## Key Findings

### Recommended Stack

The validated stack requires no changes from the user's pre-chosen selections. Next.js 15 (App Router) with React 19 and TypeScript 5 is the current stable baseline. Supabase is the only free-tier option that bundles PostgreSQL, Auth, and RLS without a credit card requirement. Two version-specific gotchas need attention at scaffold time: (1) Tailwind CSS 4 was released in early 2025 and has a different configuration model from Tailwind 3 — verify which version `npx shadcn@latest init` scaffolds before proceeding; (2) use `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`) for all session handling in the App Router.

**Core technologies:**
- Next.js 15 + React 19 + TypeScript 5: full-stack framework with App Router, Server Components, Server Actions, and Route Handlers — all needed for this app's architecture
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`): hosted PostgreSQL + Auth + RLS; the SSR package is mandatory for cookie-based session refresh in middleware
- Tailwind CSS + shadcn/ui: utility-first CSS with accessible Radix-based component primitives; components are copied into source (not installed as a package) giving full control
- `@react-pdf/renderer` 3.x: React-based PDF layout engine that runs in Node.js; must be used exclusively via Route Handlers, never in Server Components
- `date-fns` 3.x + `date-fns-tz`: date manipulation and timezone conversion; use `TIMESTAMPTZ` in PostgreSQL and `date-fns-tz` for all UTC/local conversions
- `react-hook-form` + `zod` + `@hookform/resolvers`: the standard trio for performant, validated forms in Next.js App Router
- Render (free tier): hosting for the Next.js app; expect ~30 second cold start after 15 minutes idle — acceptable for a personal tool

### Expected Features

**Must have (table stakes) — ship in MVP:**
- Auth (Supabase email/password) — gates every other feature
- Student roster with contact info and per-student rate — the entity everything else belongs to
- Single and weekly recurring lesson scheduling — manual per-lesson entry is a deal-breaker
- Week view + list view of schedule — tutors need to see their week at a glance
- Quick lesson status update (completed / cancelled / no-show) — drives invoice auto-population
- Invoice creation auto-populated from completed un-invoiced lessons
- PDF invoice output with business details (ABN, bank BSB/account) — professional enough to email or WhatsApp
- Invoice lifecycle (draft → sent → paid)
- Mark as paid + PDF receipt generation
- Settings page (profile, business details, timezone, invoice defaults)
- Mobile-first responsive design with bottom nav on mobile, sidebar on desktop

**Should have (differentiators) — high priority but deferrable:**
- Dashboard with today's lessons, unpaid invoice count/total, and quick actions — makes the app a daily habit
- Revenue page with monthly and per-student breakdown — tutors need to understand their business
- Manual line items on invoices — materials, travel, one-off charges
- Student deactivation (not deletion) — preserves history for past students
- List view toggle alongside week view — easier to scan on mobile

**Defer to v2+:**
- Revenue page (useful, but not blocking invoicing — can ship after core workflow)
- Dashboard (convenient, but tutor can navigate directly until it's built)
- Self-service signup page (only needed when adding a second user)
- Seed/demo data script (dev-facing; valuable but not user-blocking)

**Anti-features — explicitly do not build:**
Online payment integration, parent-facing portal, in-app email sending, Google/Apple calendar sync, GST automation, dark mode, multi-currency rendering, bulk lesson import.

### Architecture Approach

TutorBase uses a server-first architecture: almost all pages are Server Components that query Supabase directly (no intermediate API layer), mutations go through Server Actions (no REST endpoints for CRUD), and PDFs are the only binary response requiring Route Handlers. Supabase RLS enforces `tutor_id = auth.uid()` on every table at the database layer — this is the real security boundary, not just the application-layer session checks. The middleware (`proxy.ts`) provides UX redirect guards, but every Server Action and Route Handler must independently call `verifySession()` because middleware does not protect direct POST requests to Server Actions.

**Major components:**
1. `proxy.ts` (middleware) — session check on every request; redirects unauthenticated users to `/login`
2. `lib/dal.ts` (Data Access Layer) — `verifySession()` called at the top of every Server Action and Route Handler; returns validated `tutor_id`
3. `lib/supabase/server.ts` + `lib/supabase/client.ts` — two distinct Supabase clients; server client for all mutations and server reads, browser client only if real-time is added later
4. `lib/actions/` — Server Actions grouped by domain (students, lessons, invoices); no custom REST endpoints
5. `app/api/pdf/invoice/[id]/` + `app/api/pdf/receipt/[id]/` — Route Handlers for PDF generation; the only place `@react-pdf/renderer` is imported
6. `lib/pdf/` — `InvoiceDocument` and `ReceiptDocument` React-PDF components, isolated from the rest of the app
7. `app/(app)/` route group — authenticated shell with all protected pages; layout provides sidebar (desktop) + bottom nav (mobile)
8. Route hierarchy: dashboard / students / schedule / invoices / receipts / revenue / settings

**Data model key decisions:**
- All timestamps stored as `TIMESTAMPTZ` (UTC in PostgreSQL, converted on display)
- `lessons.recurring_series_id` links pre-generated recurring rows (not on-the-fly expansion)
- `lessons.invoice_id` nullable FK — null means un-invoiced
- `invoices.invoice_number` backed by a PostgreSQL sequence (not application-code MAX)
- `tutors.timezone` stored once (default `Australia/Sydney`) — not per-record

### Critical Pitfalls

1. **Timezone-naive timestamps** — Store all times as `TIMESTAMPTZ` from day one; use `date-fns-tz` for all conversions; write a shared `formatLessonDate(date, timezone)` utility used everywhere. Fixing this post-migration requires a data rewrite.

2. **RLS not enabled at table creation** — Enable RLS and write `tutor_id = auth.uid()` policies in the initial migration SQL. Using the service role key during development masks the problem completely. A smoke test that queries with a different user's JWT and asserts zero rows should be added to the test suite.

3. **Wrong Supabase auth package + missing middleware** — Use `@supabase/ssr` exclusively. Implement `middleware.ts` calling `supabase.auth.getUser()` on every request. Do not use `createClientComponentClient` / `createServerComponentClient` (legacy `auth-helpers` API). Without middleware, sessions silently expire after ~1 hour.

4. **`@react-pdf/renderer` in Server Components** — This library uses browser APIs and will crash in the Next.js Node runtime when imported server-side. PDF generation must be client-triggered via a Route Handler. Spike this early (Phase 1 or 2) to validate the pattern; include font registration via CDN URLs to avoid production 404s.

5. **Invoice number race condition** — Never derive the next invoice number with a TypeScript `MAX()` query. Use a PostgreSQL sequence (`CREATE SEQUENCE invoice_number_seq`) in the schema migration. Add a unique constraint on the `invoice_number` column.

6. **Recurring lesson expansion strategy** — Pre-generate all recurrence instances as individual DB rows with a shared `recurring_series_id`. Do not expand on-the-fly. Cap generation at 52 weeks. This decision must be made before the first lesson is created — changing it later requires a data migration.

---

## Implications for Roadmap

Based on the combined research, the architecture and feature dependency graphs converge on the same five-phase build order. The critical path is Foundation → Students → Scheduling → Invoicing. Revenue and Settings can be interleaved with or done after Invoicing, as they require no new data model.

### Phase 1: Foundation

**Rationale:** Every other feature depends on auth, the database schema, and the navigation shell. Pitfalls 1, 3, 5, 6, and 11 must all be addressed here — they cannot be retrofitted. The cost of fixing timezone storage or RLS after data exists is a full data migration.

**Delivers:** Working authenticated app shell; complete DB schema with RLS; TypeScript types generated from schema; middleware session management; seed script for development data.

**Addresses:** Auth/RLS (table stakes), Settings data model, timezone infrastructure, invoice number sequence, type generation workflow.

**Avoids:** Pitfalls 1 (timezone), 3 (RLS), 5 (invoice sequence), 6 (auth package), 11 (type drift), 13 (currency utility).

**Research flag:** No additional research needed — patterns are well-documented (Next.js auth guide, Supabase @supabase/ssr docs). Follow patterns exactly as documented in ARCHITECTURE.md.

### Phase 2: Students

**Rationale:** Students are a foreign key dependency for lessons and invoices. Nothing else can be built without this entity. This is also the simplest CRUD surface and a good opportunity to establish the Server Component + Server Action pattern that all subsequent features will follow.

**Delivers:** Student list, create, edit, view, deactivate flows; validated forms with react-hook-form + zod.

**Addresses:** Student roster, per-student rate, student deactivation (differentiator).

**Avoids:** Sets up correct data access patterns before more complex features.

**Research flag:** Standard CRUD — skip research-phase. Well-documented Next.js App Router pattern.

### Phase 3: Scheduling

**Rationale:** Completed lessons are the prerequisite for invoice auto-population. The recurring lesson schema decision (pre-generate with `recurring_series_id`) must be implemented here before any lesson data exists. Schedule views and status updates make the app immediately useful to the tutor even before invoicing is built.

**Delivers:** Single and recurring lesson creation (capped at 52 weeks); week view + list view calendar; quick lesson status update (completed/cancelled/no-show); optimistic status UI.

**Addresses:** Lesson scheduling, recurring scheduling, calendar view, lesson status tracking (all table stakes), list view toggle (differentiator), optimistic UX (Pitfall 14).

**Avoids:** Pitfall 4 (recurring expansion strategy), Pitfall 1 (timezone display), Pitfall 8 (mobile tap targets — test on real device before phase is marked done), Pitfall 14 (optimistic updates).

**Research flag:** Recurring lesson scheduling has known complexity — the pre-generation + series ID pattern is defined in ARCHITECTURE.md and PITFALLS.md. No additional research needed if those patterns are followed. Verify `useOptimistic` usage with current Next.js 15 / React 19 API at implementation time.

### Phase 4: Invoicing and PDF

**Rationale:** Invoicing is the primary pain point the app exists to solve. It depends on completed lessons (Phase 3) and student data (Phase 2). PDF generation is isolated in Route Handlers and can be spiked early in this phase before the full invoice UI is built. The un-invoiced lesson query edge cases (Pitfall 10) must be resolved before the invoice list view is built.

**Delivers:** Invoice creation auto-populated from completed un-invoiced lessons; manual line items; invoice number generation (via DB sequence); invoice lifecycle (draft/sent/paid); mark as paid; PDF invoice and receipt downloads with proper font rendering; receipt auto-creation on payment.

**Addresses:** Invoice generation, PDF output, invoice lifecycle, mark as paid, receipt PDF (all table stakes); manual line items (differentiator).

**Avoids:** Pitfall 2 (react-pdf in Server Components — spike first), Pitfall 5 (invoice number race — sequence already created in Phase 1 schema), Pitfall 7 (font embedding — use CDN fonts), Pitfall 10 (un-invoiced lesson query edge cases).

**Research flag:** PDF generation with `@react-pdf/renderer` needs a spike at the start of this phase to validate client-side rendering pattern and font loading before it becomes load-bearing. This is the one area where a proof-of-concept should precede full feature development.

### Phase 5: Revenue, Settings, and Dashboard

**Rationale:** Revenue and Settings require no new data model — they aggregate existing records. Settings page writes tutor profile data (schema exists from Phase 1). Dashboard aggregates lessons and invoices. These are high-value features but do not block the core workflow.

**Delivers:** Revenue page with monthly breakdown and per-student table; Settings page (profile, business details, invoice defaults, timezone); Dashboard with today's lessons, unpaid invoice widget, and weekly count.

**Addresses:** Revenue summary (table stakes), business details on invoices (table stakes), dashboard (differentiator), invoice defaults (differentiator), timezone display.

**Avoids:** Pitfall 5 (sequential fetching in dashboard — use `Promise.all`), Pitfall 12 (revenue in JS — use SQL `SUM + GROUP BY`).

**Research flag:** Standard aggregation and settings patterns — skip research-phase. Follow ARCHITECTURE.md's `Promise.all` pattern for dashboard data fetching.

### Phase Ordering Rationale

- Strict dependency order prevents premature builds: auth gates all features; students are a FK for lessons; completed lessons drive invoice population; invoices and lessons drive revenue.
- RLS, timezone, and invoice sequence are Phase 1 concerns because they cannot be retrofitted without data migration.
- PDF is deferred to Phase 4 because it depends on the invoice data model, but a spike should happen early in Phase 4 before the full invoice UI is built.
- Settings and Revenue are last because they have no dependencies of their own and the tutor can use the app without them during development.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (PDF spike):** `@react-pdf/renderer` font loading and CDN URL construction in Next.js production builds — validate before full invoice UI is built. The pattern is defined but font path resolution in Render deployments should be confirmed empirically.
- **Phase 1 (Tailwind/shadcn version):** Verify at scaffold time whether `npx shadcn@latest init` defaults to Tailwind 3 or Tailwind 4 — class names and config differ. This is a "verify at start" flag, not a research-phase flag.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Student CRUD):** textbook Next.js App Router CRUD — well-documented in official Next.js examples.
- **Phase 3 (Scheduling):** pre-generation with series ID is a defined pattern; `useOptimistic` is documented in React 19 / Next.js 15.
- **Phase 5 (Revenue/Settings/Dashboard):** SQL aggregation and settings forms — no novel patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices validated; two version-mismatch risks (Tailwind 3 vs 4, Next.js 14 vs 15) require verification at scaffold time. Next.js version confirmed from docs metadata (v16.2.1 shown), but exact npm version should be checked before pinning. |
| Features | MEDIUM | Based on domain knowledge of TutorBird/Teachworks/TutorCruncher through August 2025 — not live-verified. Feature boundaries are well-reasoned but a live competitor feature audit before finalising phase 4 scope is recommended. |
| Architecture | HIGH | Core patterns (Server Components, Server Actions, Route Handlers for PDFs, RLS) verified against Next.js official docs v16.2.1 (fetched 2026-03-22). Supabase @supabase/ssr integration pattern is MEDIUM — established but not re-verified against current Supabase docs. |
| Pitfalls | HIGH | Timezone (TIMESTAMPTZ), RLS, invoice number sequence, and @react-pdf/renderer server-component constraint are well-documented, high-confidence findings. Supabase free-tier inactivity pause and Render cold-start details are MEDIUM — verify current policies before deployment. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Tailwind 3 vs 4 compatibility with shadcn/ui:** Verify at scaffold time which version `npx shadcn@latest init` installs. If Tailwind 4, confirm shadcn component class names and config are compatible. No blocking concern — just needs empirical check at project init.
- **Next.js exact version:** Docs metadata shows v16.2.1 but user specified "14+". Run `npm show next version` before pinning. Use `next@latest` and lock after scaffold.
- **Supabase free-tier inactivity pause duration:** Policy may have changed since August 2025. Verify at supabase.com/pricing before deployment. Include restore procedure in project README.
- **`date-fns-tz` + `date-fns` 3.x compatibility:** Widely used pattern but verify `toZonedTime`/`fromZonedTime` API surface against current date-fns-tz docs at install time (`zonedTimeToUtc`/`utcToZonedTime` were renamed in date-fns-tz 3.x).
- **Live competitor feature audit:** FEATURES.md was researched from training data only. Before finalising Phase 4/5 scope, a live review of TutorBird and Teachworks feature pages would confirm whether any table-stakes features were missed.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs v16.2.1 — App Router routing, data fetching, Server Actions, authentication, proxy.ts (fetched 2026-03-22)
- PostgreSQL TIMESTAMPTZ behaviour — standard, well-documented database behaviour
- PostgreSQL sequence for atomic ID generation — standard, well-documented
- `@react-pdf/renderer` browser-API dependency — fundamental library constraint, confirmed in project README and community issues

### Secondary (MEDIUM confidence)
- Supabase `@supabase/ssr` integration for Next.js App Router — established pattern, referenced in Next.js auth guide, not re-verified against current Supabase docs
- Feature landscape: TutorBird, Teachworks, TutorCruncher, Acuity Scheduling feature sets — training data through August 2025
- date-fns 3.x + date-fns-tz timezone handling — widely documented, but exact API surface of date-fns-tz 3.x should be verified at install
- Render free-tier cold start (~30s after 15 min idle) — training data; verify current policy at render.com/docs
- Supabase free-tier inactivity pause — training data; verify current policy at supabase.com/pricing
- shadcn/ui + Tailwind version compatibility — known moving target; verify at scaffold time

### Tertiary (LOW confidence — verify before implementation)
- React `useOptimistic` behaviour with Next.js 15 / React 19 Server Actions — established API but interaction with Next.js 15 revalidation should be tested empirically in Phase 3

---

*Research completed: 2026-03-22*
*Ready for roadmap: yes*
