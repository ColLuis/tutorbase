---
phase: 01-foundation
verified: 2026-03-22T12:00:00Z
status: gaps_found
score: 12/13 must-haves verified
gaps:
  - truth: "Middleware refreshes auth session on every request using getClaims() or getUser()"
    status: partial
    reason: "src/middleware.ts uses only getUser() with no getClaims() attempt. The plan specified getClaims() with getUser() fallback for future Supabase SDK compatibility. The SUMMARY explicitly documents this pattern as implemented, but the actual code omits the getClaims() branch. The middleware does function for auth protection — getUser() is valid — but diverges from the specified dual-path pattern."
    artifacts:
      - path: "src/middleware.ts"
        issue: "Only getUser() used at line 28. No getClaims() conditional. DAL (src/lib/dal.ts) correctly implements getClaims() fallback to getUser(), but middleware does not."
    missing:
      - "Add getClaims() conditional before getUser() fallback in src/middleware.ts, matching the pattern in src/lib/dal.ts"
human_verification:
  - test: "Login flow end-to-end"
    expected: "Navigating to / redirects to /login, login with jane@example.com / password123 after seeding redirects to /, sidebar visible on desktop, bottom nav visible on mobile"
    why_human: "Requires Supabase project connection and running dev server — cannot verify programmatically"
  - test: "Responsive navigation breakpoint"
    expected: "At < 768px viewport: sidebar hidden, bottom nav visible. At >= 768px: sidebar visible (left-fixed), bottom nav hidden"
    why_human: "Visual/browser rendering check — cannot verify CSS class behaviour programmatically"
  - test: "Login form error state"
    expected: "Submitting with wrong credentials shows red error text below the form without page reload"
    why_human: "Requires server action execution and DOM inspection — cannot verify programmatically"
  - test: "44px touch targets on nav items"
    expected: "All nav items in Sidebar and BottomNav are at least 44x44px when rendered"
    why_human: "Requires browser rendering to verify computed dimensions"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Scaffold the Next.js project with authentication infrastructure, database schema, and app shell — the technical foundation everything else builds on.
**Verified:** 2026-03-22T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Next.js project scaffolded with App Router, TypeScript, Tailwind 4, src/ directory | VERIFIED | next@16.2.1 in package.json; src/ directory layout in use; tsconfig.json confirms |
| 2 | All production dependencies installed and resolvable | VERIFIED | package.json contains @supabase/supabase-js, @supabase/ssr, date-fns, date-fns-tz, react-hook-form, zod, @hookform/resolvers |
| 3 | Supabase server and browser clients exist with correct env var names | VERIFIED | src/lib/supabase/server.ts uses createServerClient + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; src/lib/supabase/client.ts uses createBrowserClient |
| 4 | Middleware refreshes auth session on every request using getClaims() or getUser() | PARTIAL | src/middleware.ts exists at src/ (valid for src-dir layout) and uses getUser() for auth. However the plan specified getClaims() with getUser() fallback; only getUser() is used. DAL correctly has both. |
| 5 | verifySession() function exists for Server Action protection | VERIFIED | src/lib/dal.ts exports verifySession(), uses getClaims() with getUser() fallback, returns {tutorId} |
| 6 | formatCurrency and formatLessonDate utility functions exist and are importable | VERIFIED | src/lib/utils/currency.ts exports formatCurrency with Intl.NumberFormat; src/lib/utils/dates.ts exports formatLessonDate using toZonedTime/format from date-fns-tz |
| 7 | All database tables are created with RLS enabled and tutor_id isolation policies | VERIFIED | supabase/migrations/001_initial_schema.sql: 6 ENABLE ROW LEVEL SECURITY + 6 CREATE POLICY statements confirmed by grep |
| 8 | All timestamp columns use TIMESTAMPTZ, not TIMESTAMP | VERIFIED | Grep for TIMESTAMP[^Z] returns only TIMESTAMPTZ lines — no bare TIMESTAMP anywhere in migration |
| 9 | Invoice number sequence exists for race-condition-safe numbering | VERIFIED | Line 5: CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1 |
| 10 | Seed script creates a tutor, students, lessons, and invoices without errors | VERIFIED | scripts/seed.ts: full implementation — admin.createUser, tutors upsert, 3 students, 4 lessons, 1 invoice + item. Idempotent. |
| 11 | Login page renders a form with email and password fields and a submit button | VERIFIED | src/app/(auth)/login/page.tsx renders LoginForm in a Card; LoginForm has name="email", name="password", type="submit" |
| 12 | Login form submits to the login Server Action and shows errors on failure | VERIFIED | LoginForm imports login from @/lib/actions/auth, wraps in loginAction for useActionState, displays state?.error in red text, shows "Signing in..." pending |
| 13 | App shell has sidebar on md+ and bottom nav on mobile | VERIFIED | src/app/(app)/layout.tsx: Sidebar className="hidden md:flex", BottomNav className="flex md:hidden fixed bottom-0 left-0 right-0" |

**Score:** 12/13 truths verified (1 partial — middleware getClaims omission)

---

## Required Artifacts

### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/middleware.ts` | Auth session refresh and route protection | VERIFIED (location) / PARTIAL (implementation) | Exists at src/middleware.ts — valid for src/ layout projects. Uses getUser() only; missing getClaims() branch specified in plan |
| `src/lib/supabase/server.ts` | Server-side Supabase client factory | VERIFIED | Exports createClient, uses createServerClient from @supabase/ssr, correct env var names |
| `src/lib/supabase/client.ts` | Browser-side Supabase client factory | VERIFIED | Exports createClient, uses createBrowserClient from @supabase/ssr |
| `src/lib/dal.ts` | Session verification for Server Actions | VERIFIED | Exports verifySession(), getClaims() with getUser() fallback, returns {tutorId} |
| `src/lib/actions/auth.ts` | Login and logout Server Actions | VERIFIED | 'use server', exports login (signInWithPassword + error return) and logout (signOut + redirect) |
| `src/lib/utils/currency.ts` | AUD currency formatting | VERIFIED | Exports formatCurrency using Intl.NumberFormat('en-AU') |
| `src/lib/utils/dates.ts` | Timezone-aware date formatting | VERIFIED | Exports formatLessonDate, formatShortDate, formatTime using date-fns-tz toZonedTime/format |

### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/001_initial_schema.sql` | Complete database schema with RLS | VERIFIED | 6 tables, 6 RLS enables, 6 auth.uid() policies, invoice_number_seq, all TIMESTAMPTZ, UNIQUE constraints |
| `scripts/seed.ts` | Development seed data script | VERIFIED | Full implementation: auth user, tutor upsert, 3 students, 4 lessons, 1 invoice + item. SUPABASE_SERVICE_ROLE_KEY present |

### Plan 01-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(auth)/login/page.tsx` | Public login page | VERIFIED | Server Component, renders LoginForm in shadcn Card, "TutorBase" title |
| `src/components/auth/LoginForm.tsx` | Client-side login form component | VERIFIED | 'use client', useActionState, email/password fields, error display, pending state |
| `src/app/(app)/layout.tsx` | Authenticated app shell with responsive nav | VERIFIED | Imports Sidebar + BottomNav, correct Tailwind responsive classes |
| `src/components/nav/Sidebar.tsx` | Desktop sidebar navigation | VERIFIED | 'use client', usePathname, w-64, 5 nav items, active state, logout via form action |
| `src/components/nav/BottomNav.tsx` | Mobile bottom navigation | VERIFIED | 'use client', usePathname, safe-area-inset-bottom, 5 nav items, active state |

---

## Key Link Verification

### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/middleware.ts` | `@supabase/ssr` | createServerClient import | VERIFIED | Line 1: `import { createServerClient } from '@supabase/ssr'` |
| `src/lib/dal.ts` | `src/lib/supabase/server.ts` | createClient import | VERIFIED | Line 1: `import { createClient } from '@/lib/supabase/server'` |

### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/migrations/001_initial_schema.sql` | `auth.uid()` | RLS policies on every table | VERIFIED | 6 occurrences of `auth.uid()` in policy USING clauses — one per table |
| `scripts/seed.ts` | `@supabase/supabase-js` | service role client | VERIFIED | Imports createClient from @supabase/supabase-js, uses SUPABASE_SERVICE_ROLE_KEY |

### Plan 01-03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/auth/LoginForm.tsx` | `src/lib/actions/auth.ts` | login Server Action import | VERIFIED | Line 4: `import { login } from '@/lib/actions/auth'` |
| `src/app/(app)/layout.tsx` | `src/components/nav/Sidebar.tsx` | Sidebar component import | VERIFIED | Line 1: `import Sidebar from '@/components/nav/Sidebar'` |
| `src/app/(app)/layout.tsx` | `src/components/nav/BottomNav.tsx` | BottomNav component import | VERIFIED | Line 2: `import BottomNav from '@/components/nav/BottomNav'` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 01-03 | User can log in with email and password | SATISFIED | LoginForm with email/password fields wired to login Server Action; error display working |
| AUTH-02 | 01-01 | User session persists across browser refresh | SATISFIED | Middleware uses createServerClient with cookie read/write handlers for session refresh on every request |
| AUTH-03 | 01-03 | All routes except login are protected | SATISFIED | src/middleware.ts: unauthenticated non-login requests redirect to /login; authenticated users on /login redirect to / |
| INFRA-01 | 01-03 | Mobile-first responsive design with bottom nav (mobile) and sidebar (desktop) | SATISFIED | layout.tsx: Sidebar hidden md:flex, BottomNav flex md:hidden. Both use min-h-[44px] touch targets |
| INFRA-02 | 01-02 | Row Level Security enabled on all database tables | SATISFIED | 6 ENABLE ROW LEVEL SECURITY + 6 auth.uid() policies in migration — all 6 tables covered |
| INFRA-03 | 01-02 | Seed script creates sample tutor, students, lessons, invoices | SATISFIED | scripts/seed.ts creates tutor, 3 students, 4 lessons (mixed status), 1 invoice + invoice_item |
| INFRA-04 | 01-01, 01-02 | All tables use TIMESTAMPTZ for date/time storage | SATISFIED | No bare TIMESTAMP found in migration; all datetime columns use TIMESTAMPTZ |

All 7 required Phase 1 requirements are satisfied. No orphaned requirements detected.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/types/database.types.ts` | 11-19 | `Tables: Record<string, never>` — placeholder Database interface | INFO | Intentional stub; documented in SUMMARY. Will be replaced after Supabase project connects and types:generate is run. Does not affect runtime behaviour for Phase 1. |
| `src/app/(app)/page.tsx` | 1-8 | Static placeholder home page | INFO | Intentional; documented as "Phase 4 will replace with real dashboard." Not a goal failure for Phase 1. |
| `src/middleware.ts` | 28 | `getUser()` only — no getClaims() branch | WARNING | Plan specified getClaims() with getUser() fallback for compatibility with newer Supabase SDK. DAL has the full pattern; middleware does not. Auth protection still functions. |

---

## Human Verification Required

### 1. Login flow end-to-end

**Test:** Run `npm run dev`, navigate to http://localhost:3000, confirm redirect to /login. After connecting Supabase and running `npm run seed`, log in with jane@example.com / password123.
**Expected:** Redirected to / with sidebar visible (desktop) or bottom nav (mobile). App shell renders with nav items.
**Why human:** Requires Supabase project connection, running dev server, and browser interaction.

### 2. Responsive navigation breakpoint

**Test:** With dev server running, open browser at http://localhost:3000/login and resize viewport below and above 768px.
**Expected:** Below 768px — bottom nav visible at screen bottom, sidebar absent. At or above 768px — sidebar visible on left, bottom nav absent.
**Why human:** CSS breakpoint rendering requires a browser.

### 3. Login form error display

**Test:** Submit the login form with an incorrect password.
**Expected:** Red error text appears below the form without a full page reload. Button returns from "Signing in..." to "Sign in" after failure.
**Why human:** Requires server action execution and real-time DOM inspection.

### 4. Touch target sizes

**Test:** Open DevTools, inspect nav item elements in Sidebar and BottomNav.
**Expected:** Computed height of each nav item is at least 44px.
**Why human:** Computed styles require browser rendering.

---

## Gaps Summary

One gap was found that is worth addressing before Phase 2 work relies on the middleware pattern.

**Gap: Middleware getClaims() omission**

The plan specified that `middleware.ts` should attempt `getClaims()` before falling back to `getUser()` — matching the pattern in `src/lib/dal.ts`. In the actual `src/middleware.ts`, only `getUser()` is called (line 28). The `if (typeof supabase.auth.getClaims === 'function')` conditional present in `src/lib/dal.ts` is absent from middleware.

**Impact:** Low for Phase 1 — `getUser()` is a valid method and auth protection works. Medium for future compatibility — if the Supabase SDK deprecates `getUser()` in favour of `getClaims()`, middleware will be the only file needing a fix rather than following the established pattern.

**Fix:** Apply the same getClaims() try/catch → getUser() fallback from `src/lib/dal.ts` to `src/middleware.ts`, replacing the current direct `getUser()` call. This brings middleware into alignment with the documented pattern.

This gap does not block Phase 2 work — auth protection is functional. It is a consistency issue against the stated must-have, recorded here for the planner to decide whether a gap-closure plan is warranted or whether the current implementation is acceptable.

---

_Verified: 2026-03-22T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
