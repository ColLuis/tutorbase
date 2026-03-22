# Phase 1: Foundation - Research

**Researched:** 2026-03-22
**Domain:** Next.js App Router authentication, Supabase Auth + RLS, responsive shell layout, PostgreSQL schema design
**Confidence:** HIGH (core patterns verified against live docs and npm registry)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with email and password | Supabase `signInWithPassword` via Server Action + `@supabase/ssr` cookie handling |
| AUTH-02 | User session persists across browser refresh | `@supabase/ssr` middleware refreshes session token on every request via `getClaims()` |
| AUTH-03 | All routes except login are protected (redirect to login if unauthenticated) | `middleware.ts` (formerly `proxy.ts`) with `getClaims()` check + redirect to `/login` |
| INFRA-01 | Mobile-first responsive design with bottom nav (mobile) and sidebar (desktop) | Tailwind `md:` breakpoint split; `fixed bottom-0` bottom nav with `safe-area-inset-bottom`; `hidden md:block` sidebar |
| INFRA-02 | Row Level Security enabled on all database tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `tutor_id = auth.uid()` policies in migration SQL |
| INFRA-03 | Seed script creates sample tutor, students, lessons, invoices for development | Service-role Supabase client in Node.js seed script; bypasses RLS intentionally |
| INFRA-04 | All tables use TIMESTAMPTZ for date/time storage | PostgreSQL `TIMESTAMPTZ` column type in all migration SQL |
</phase_requirements>

---

## Summary

Phase 1 establishes every dependency that later phases build on: a working Supabase Auth login, cookie-based session management via `middleware.ts`, the complete database schema (all tables, all RLS policies, the invoice sequence), TypeScript types generated from that schema, the authenticated app shell with responsive navigation, and a seed script. Nothing in Phase 2 or beyond can be built without these pieces in place.

The technology is well-understood with one important update: Supabase's official Next.js documentation has moved from `getUser()` to `getClaims()` for server-side session validation, and the environment variable name for the Supabase anon key has changed to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the old `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works but is legacy). Both changes are reflected in the patterns below.

A second important update: `npx shadcn@latest init` now scaffolds with Tailwind CSS 4 by default (Tailwind 4.2.2 is current as of March 2026, not 3.x). This changes how components work — CSS-first config, no `tailwind.config.js`, colors in OKLCH, `tw-animate-css` instead of `tailwindcss-animate`. The planner must account for this.

**Primary recommendation:** Follow the Supabase official Next.js SSR guide exactly. Use `getClaims()` in middleware (not `getUser()` or `getSession()`). Enable RLS in the migration SQL before any data is written. Use `TIMESTAMPTZ` on every timestamp column. Write the `formatCurrency` and `formatLessonDate` utilities before any UI that displays money or dates.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | Full-stack React framework | App Router: Server Components, Server Actions, Route Handlers, file-based routing. Current stable as of March 2026. |
| react | 19.x | UI library | Peer dependency of Next.js 16. Required. |
| typescript | 5.x | Type safety | Non-negotiable; Supabase type generation only pays off with TypeScript |
| @supabase/supabase-js | 2.99.3 | Supabase DB client with TypeScript types | Primary SDK; `supabase gen types` outputs against this client |
| @supabase/ssr | 0.9.0 | Server-side auth helpers for Next.js App Router | Replaces deprecated `@supabase/auth-helpers-nextjs`; handles cookie-based session refresh in `middleware.ts` |
| tailwindcss | 4.2.2 | Utility-first CSS | shadcn/ui CLI now scaffolds Tailwind 4 by default; CSS-first config model |
| shadcn/ui | latest CLI | Accessible Radix-based component primitives | Components copied into `src/components/ui/`; Tailwind 4 and React 19 compatible as of March 2025 |
| date-fns | 4.1.0 | Date manipulation | Tree-shakeable; covers all scheduling and display date math |
| date-fns-tz | 3.2.0 | Timezone conversion | Peer-compatible with date-fns 3 or 4; `toZonedTime`/`fromZonedTime` for UTC↔tz conversion |

### Supporting (Phase 1 uses these for the login form)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.72.0 | Form state management | Login form and all future forms |
| zod | 4.3.6 | Schema validation | Login form validation; same schema validates client and server |
| @hookform/resolvers | 5.2.2 | zod adapter for react-hook-form | Required glue; supports zod 3 and 4 |
| supabase (CLI) | latest | Local dev + type generation | `supabase gen types typescript` after each migration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is deprecated; causes silent session expiry in App Router |
| date-fns-tz | manual UTC offset math | Offset math breaks at DST transitions (April/October in Australia) |
| Tailwind 4 (auto-scaffolded) | Pin to Tailwind 3 | Tailwind 3 requires manual config; shadcn CLI defaults to 4 — go with 4 |

**Installation:**
```bash
# Bootstrap (Next.js 16, TypeScript, Tailwind, ESLint, App Router, src/ dir)
npx create-next-app@latest tutorbase --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Date
npm install date-fns date-fns-tz

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# shadcn/ui (run after scaffold — now defaults to Tailwind 4)
npx shadcn@latest init

# Supabase CLI (dev dependency for type generation and local dev)
npm install -D supabase
```

**Version verification (confirmed 2026-03-22):**
- `next`: 16.2.1
- `@supabase/supabase-js`: 2.99.3
- `@supabase/ssr`: 0.9.0
- `tailwindcss`: 4.2.2
- `date-fns`: 4.1.0
- `date-fns-tz`: 3.2.0 (peer: `date-fns ^3.0.0 || ^4.0.0` — compatible)
- `zod`: 4.3.6
- `react-hook-form`: 7.72.0
- `@hookform/resolvers`: 5.2.2

---

## Architecture Patterns

### Recommended Project Structure
```
tutorbase/
├── middleware.ts                # Auth guard — lives at project root, NOT inside src/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx    # Public route (no auth check)
│   │   └── (app)/
│   │       ├── layout.tsx      # Authenticated shell: sidebar + bottom nav
│   │       └── page.tsx        # Placeholder home/dashboard redirect
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (Button, Input, Card...)
│   │   ├── nav/
│   │   │   ├── Sidebar.tsx     # Desktop nav — 'use client'
│   │   │   └── BottomNav.tsx   # Mobile nav — 'use client'
│   │   └── auth/
│   │       └── LoginForm.tsx   # 'use client' form component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts       # createServerClient — used in Server Components, Actions, Route Handlers
│   │   │   └── client.ts       # createBrowserClient — used in Client Components only
│   │   ├── dal.ts              # verifySession() — call at top of every Server Action
│   │   ├── actions/
│   │   │   └── auth.ts         # login, logout Server Actions
│   │   └── utils/
│   │       ├── currency.ts     # formatCurrency(amount, currency?) — Intl.NumberFormat
│   │       └── dates.ts        # formatLessonDate(date, timezone) — date-fns-tz wrapper
│   └── types/
│       └── database.types.ts   # Generated by: supabase gen types typescript
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # All tables, RLS, sequence, indexes
└── scripts/
    └── seed.ts                 # Development seed script (service role key)
```

### Pattern 1: Supabase Middleware (middleware.ts)

**What:** Refreshes the Supabase Auth token on every request and redirects unauthenticated users to `/login`.

**When to use:** Every request — this file protects the entire `(app)` route group.

**CRITICAL:** Use `getClaims()` (not `getUser()` or `getSession()`). The Supabase docs as of March 2026 specify `getClaims()` for server-side validation because it validates the JWT signature against published public keys without a network call to the Auth server on every request.

```typescript
// middleware.ts (project root — NOT inside src/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate session — getClaims() validates JWT locally, no network round-trip
  const { data: { claims } } = await supabase.auth.getClaims()

  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!claims && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (claims && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Source:** [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — verified 2026-03-22

### Pattern 2: Two Supabase Clients

**What:** Separate server and browser clients — never mix them.

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {} // Server Component — read-only cookies; middleware handles refresh
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Pattern 3: Data Access Layer (verifySession)

**What:** A single `verifySession()` function called at the top of every Server Action and Route Handler — not just at the page level.

```typescript
// src/lib/dal.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifySession() {
  const supabase = await createClient()
  const { data: { claims } } = await supabase.auth.getClaims()

  if (!claims) {
    redirect('/login')
  }

  return { tutorId: claims.sub }
}
```

### Pattern 4: Login Server Action

**What:** The login form submits to a Server Action; success redirects to the app home.

```typescript
// src/lib/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Pattern 5: Responsive Navigation Shell

**What:** Sidebar on desktop (`md:` and above), bottom nav on mobile (below `md:`). Both are Client Components for active state.

```typescript
// src/app/(app)/layout.tsx (Server Component)
import { Sidebar } from '@/components/nav/Sidebar'
import { BottomNav } from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sidebar: hidden on mobile, visible md and above */}
      <Sidebar className="hidden md:flex" />

      {/* Main content: offset for sidebar on desktop, padded for bottom nav on mobile */}
      <main className="md:ml-64 pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom nav: visible on mobile, hidden md and above */}
      <BottomNav className="flex md:hidden fixed bottom-0 left-0 right-0" />
    </div>
  )
}
```

**iOS safe area:** Bottom nav must include `pb-[env(safe-area-inset-bottom)]` padding to avoid overlap with the iPhone home indicator.

### Pattern 6: Full Database Schema with RLS

**What:** All tables created in a single migration, RLS enabled and policies written inline.

```sql
-- supabase/migrations/001_initial_schema.sql

-- Invoice number sequence (atomic, race-condition-safe)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Tutors (extends auth.users)
CREATE TABLE tutors (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  business_name TEXT,
  abn           TEXT,
  bsb           TEXT,
  account_number TEXT,
  bank_name     TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  timezone      TEXT NOT NULL DEFAULT 'Australia/Sydney',
  currency      TEXT NOT NULL DEFAULT 'AUD',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_self_only" ON tutors
  USING (id = auth.uid());

-- Students
CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  parent_name   TEXT,
  parent_email  TEXT,
  parent_phone  TEXT,
  default_rate  NUMERIC(10,2),
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON students
  USING (tutor_id = auth.uid());

-- Lessons
CREATE TABLE lessons (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id             UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id           UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scheduled_at         TIMESTAMPTZ NOT NULL,
  duration_minutes     INTEGER NOT NULL,
  rate                 NUMERIC(10,2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'scheduled'
                         CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes                TEXT,
  recurring_series_id  UUID,
  invoice_id           UUID,  -- FK to invoices added after invoices table
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON lessons
  USING (tutor_id = auth.uid());

-- Invoices
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid')),
  issued_date    DATE,
  due_date       DATE,
  paid_date      DATE,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, invoice_number)
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON invoices
  USING (tutor_id = auth.uid());

-- Add FK from lessons to invoices (now that invoices table exists)
ALTER TABLE lessons ADD CONSTRAINT lessons_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Invoice items
CREATE TABLE invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tutor_id     UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price   NUMERIC(10,2) NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  lesson_id    UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON invoice_items
  USING (tutor_id = auth.uid());

-- Receipts
CREATE TABLE receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  paid_at        TIMESTAMPTZ NOT NULL,
  amount_paid    NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, receipt_number)
);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON receipts
  USING (tutor_id = auth.uid());
```

### Pattern 7: Shared Utility Functions (write before any UI)

```typescript
// src/lib/utils/currency.ts
export function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

```typescript
// src/lib/utils/dates.ts
import { toZonedTime, format } from 'date-fns-tz'

export function formatLessonDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, timezone)
  return format(zoned, 'EEE d MMM yyyy, h:mm a', { timeZone: timezone })
}

export function toUTCForStorage(localDate: Date, timezone: string): Date {
  // date-fns-tz fromZonedTime converts a local time in a given tz to UTC
  const { fromZonedTime } = await import('date-fns-tz')
  return fromZonedTime(localDate, timezone)
}
```

### Anti-Patterns to Avoid

- **`getSession()` in middleware or Server Actions:** Not guaranteed to revalidate the token. Use `getClaims()`. The old `getUser()` was also previously recommended but `getClaims()` is the current Supabase guidance.
- **`@supabase/auth-helpers-nextjs`:** Deprecated. Do not install. Use `@supabase/ssr` exclusively.
- **RLS disabled or added as a follow-up:** Enable RLS in the migration SQL. Using the service role key during development masks RLS being missing.
- **`TIMESTAMP` without timezone:** All datetime columns must be `TIMESTAMPTZ`. `TIMESTAMP` silently drops timezone info.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** The new env var name is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The old name still works but use the new naming convention.
- **`middleware.ts` inside `src/`:** Must be at the project root (same level as `package.json`), not inside `src/`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session token refresh | Manual JWT decode + refresh | `@supabase/ssr` middleware pattern | Cookie handling, token rotation, and httpOnly flags are all handled; hand-rolled sessions have subtle timing bugs |
| Responsive nav detection | JS `window.innerWidth` listener | Tailwind `md:` utility classes | CSS-based — no hydration mismatch, no JS overhead, works without JS |
| Currency formatting | `'$' + amount.toFixed(2)` | `Intl.NumberFormat` via `formatCurrency()` | Handles thousands separators, edge cases, future multi-currency |
| Date timezone conversion | Manual UTC offset math | `date-fns-tz` `toZonedTime`/`fromZonedTime` | DST transition correctness, tz database lookup — manual math fails at DST boundaries |
| Invoice number generation | `SELECT MAX(...) + 1` in TypeScript | PostgreSQL sequence (`CREATE SEQUENCE`) | Race condition safety; the MAX approach fails under concurrent requests |
| Form validation | Manual `onChange` validation | `react-hook-form` + `zod` | Uncontrolled pattern (better mobile perf), accessible error wiring via shadcn Form components |
| TypeScript DB types | Hand-written interfaces | `supabase gen types typescript` | Drift-free; regenerate after every migration |

**Key insight:** Every one of these hand-rolled approaches looks simpler for the first 100 lines and creates hard-to-debug problems at the first edge case. Use the established solutions from the start.

---

## Common Pitfalls

### Pitfall 1: `getSession()` or `getUser()` in Middleware — Sessions Expire Silently
**What goes wrong:** Sessions silently expire after ~1 hour; users get logged out mid-session with no error message.
**Why it happens:** `getSession()` reads the cookie without revalidating; `getUser()` was the previous recommendation but `getClaims()` is now the Supabase standard.
**How to avoid:** Use `supabase.auth.getClaims()` in middleware. The cookie is refreshed on every request via `setAll`.
**Warning signs:** Users report "randomly logged out." `getSession()` appears anywhere in server code.

### Pitfall 2: RLS Not Enabled — All Data Exposed
**What goes wrong:** Any authenticated user can query any tutor's data via the Supabase REST API directly.
**Why it happens:** RLS is disabled by default. The service role key used in development bypasses RLS entirely, masking the problem.
**How to avoid:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is in the migration SQL. Every table has a `tutor_id = auth.uid()` policy. Never use the service role key in client-facing code.
**Warning signs:** DB queries return data without a logged-in session. Supabase Dashboard shows no RLS policies.

### Pitfall 3: `TIMESTAMP` Instead of `TIMESTAMPTZ`
**What goes wrong:** Lesson times appear on the wrong day or at the wrong time depending on where the code runs (server vs browser, UTC vs Australia/Sydney).
**Why it happens:** `TIMESTAMP` is PostgreSQL's default. It silently strips timezone information.
**How to avoid:** Every migration column that stores a date-time uses `TIMESTAMPTZ`. Check the migration file before running it.
**Warning signs:** Tests pass locally (developer is in UTC+10) but fail in CI (CI is UTC). "Today's lessons" shows wrong lessons.

### Pitfall 4: `middleware.ts` Inside `src/` Directory
**What goes wrong:** Middleware is silently ignored; no auth protection on any route.
**Why it happens:** Developers put `middleware.ts` inside `src/` thinking it belongs with other source files.
**How to avoid:** `middleware.ts` must be in the project root (same level as `package.json`).
**Warning signs:** Navigating to a protected route while logged out does not redirect to `/login`.

### Pitfall 5: Tailwind 4 Class Name Assumptions
**What goes wrong:** Copying Tailwind 3 component patterns (e.g., from old shadcn docs) into a Tailwind 4 project causes styling failures or broken themes.
**Why it happens:** `npx shadcn@latest init` now scaffolds Tailwind 4. The config model changed (no `tailwind.config.js`; CSS-first `@theme` directive; `tw-animate-css` instead of `tailwindcss-animate`; OKLCH colors).
**How to avoid:** Use the Tailwind 4 shadcn docs. Do not paste Tailwind 3 configuration examples.
**Warning signs:** `tailwind.config.js` file exists in a new project (shouldn't). `tailwindcss-animate` in `package.json` (deprecated).

### Pitfall 6: Env Variable Naming — Old vs New Supabase Convention
**What goes wrong:** App works in dev (because old key name is accepted) but docs examples fail to copy-paste correctly; future Supabase features may drop old key support.
**Why it happens:** Supabase renamed the anon key to "publishable key" with the new `sb_publishable_xxx` format.
**How to avoid:** Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Update any tutorial code that references `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Pitfall 7: Type Generation Never Set Up
**What goes wrong:** TypeScript types drift from the actual schema; runtime errors that TypeScript should have caught.
**Why it happens:** Developers generate types once and forget to re-run after migrations.
**How to avoid:** Add `"types:generate": "supabase gen types typescript --local > src/types/database.types.ts"` to `package.json` scripts. Run it after every migration.

---

## Code Examples

Verified patterns from official sources and npm registry (2026-03-22):

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<key>
# Only for seed script and migrations — never NEXT_PUBLIC
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Type Generation Script (package.json)
```json
{
  "scripts": {
    "types:generate": "supabase gen types typescript --local > src/types/database.types.ts"
  }
}
```

### Seed Script Pattern (scripts/seed.ts)
```typescript
// scripts/seed.ts — run with: npx tsx scripts/seed.ts
import { createClient } from '@supabase/supabase-js'

// Service role key bypasses RLS — only for seed/admin scripts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  // 1. Upsert a tutor (must match an existing auth.users record)
  const TUTOR_ID = '<existing-auth-user-uuid>'

  await supabase.from('tutors').upsert({
    id: TUTOR_ID,
    name: 'Jane Tutor',
    email: 'jane@example.com',
    business_name: 'Jane\'s Tutoring',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
  })

  // 2. Insert sample students
  const { data: students } = await supabase.from('students').insert([
    { tutor_id: TUTOR_ID, name: 'Alice Smith', default_rate: 75.00 },
    { tutor_id: TUTOR_ID, name: 'Bob Jones', default_rate: 80.00 },
  ]).select()

  // 3. Insert sample lessons (past, completed)
  // ... etc.
}

seed().catch(console.error)
```

**Note:** The tutor user must be created first via the Supabase Dashboard (Auth > Users) because v1 has no signup page. The seed script uses the resulting UUID.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023–2024 | Old package deprecated; causes session expiry bugs in App Router |
| `getSession()` in server code | `getClaims()` | 2025–2026 | `getClaims()` validates JWT locally; `getSession()` is unreliable server-side |
| `getUser()` in middleware | `getClaims()` | 2025–2026 | Supabase updated their official Next.js guide to `getClaims()`  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 2025–2026 | New "publishable key" format (`sb_publishable_xxx`); old format still accepted |
| Tailwind 3 (`tailwind.config.js`) | Tailwind 4 (CSS-first `@theme`) | 2025 | shadcn CLI now scaffolds Tailwind 4 by default; different config model |
| `tailwindcss-animate` | `tw-animate-css` | 2025 | shadcn deprecated the old package in new projects |
| `date-fns` v3 | `date-fns` v4.1.0 | 2025–2026 | Current stable; `date-fns-tz` 3.x is compatible with both v3 and v4 |
| `zod` v3 | `zod` v4.3.6 | 2025 | Current stable; `@hookform/resolvers` 5.x supports both v3 and v4 |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated — do not install
- `createClientComponentClient`, `createServerComponentClient`: Legacy auth-helpers API — do not use
- `zonedTimeToUtc` / `utcToZonedTime` from `date-fns-tz` v2: Renamed in v3 to `fromZonedTime` / `toZonedTime`

---

## Open Questions

1. **`getClaims()` availability in `@supabase/ssr` 0.9.0**
   - What we know: Supabase official docs (fetched 2026-03-22) specify `getClaims()` as the recommended method. `@supabase/ssr` 0.9.0 is the current npm version.
   - What's unclear: Whether `getClaims()` is in `@supabase/ssr` 0.9.0 or if it requires a newer version. The Supabase docs reference this as current but the ssr package changelog wasn't directly verified.
   - Recommendation: At implementation time, test `supabase.auth.getClaims()` after `npm install`. If unavailable (e.g., on an older version), fall back to `supabase.auth.getUser()` which is still a valid and secure alternative — it makes a network call to validate the JWT but is also confirmed secure.

2. **Tutor seed user creation**
   - What we know: v1 has no signup page. Users are created via Supabase Dashboard. The seed script needs an existing `auth.users` UUID to create the tutor record.
   - What's unclear: Whether the seed script should create the auth user via the service role API or whether that step is documented separately.
   - Recommendation: The seed script should accept the tutor UUID as an environment variable or create the auth user itself using `supabase.auth.admin.createUser()` (available with the service role key). Document this in the script header.

---

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, `getClaims()`, cookie handling, env var names — fetched 2026-03-22
- [Supabase creating SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createServerClient` / `createBrowserClient` patterns, publishable key naming — fetched 2026-03-22
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind 4 now default in `npx shadcn@latest init` — fetched 2026-03-22
- npm registry (verified 2026-03-22): `next@16.2.1`, `@supabase/ssr@0.9.0`, `@supabase/supabase-js@2.99.3`, `tailwindcss@4.2.2`, `date-fns@4.1.0`, `date-fns-tz@3.2.0`, `zod@4.3.6`, `react-hook-form@7.72.0`, `@hookform/resolvers@5.2.2`
- PostgreSQL `TIMESTAMPTZ` behavior — standard, well-documented DB behavior (HIGH)
- PostgreSQL sequence for atomic ID generation — standard, well-documented (HIGH)

### Secondary (MEDIUM confidence)
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) — `tw-animate-css` change, Tailwind 4 migration details
- `date-fns-tz` peer dependency verified via `npm show date-fns-tz peerDependencies` (`date-fns ^3.0.0 || ^4.0.0`)
- [@hookform/resolvers zod v4 support](https://github.com/react-hook-form/resolvers) — v5.x supports zod 3 and 4 (confirmed via WebSearch cross-reference)

### Tertiary (LOW confidence — verify at implementation)
- `getClaims()` exact availability in `@supabase/ssr@0.9.0` — referenced in official Supabase docs but changelog not directly reviewed; fall back to `getUser()` if not available

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-03-22
- Architecture: HIGH — patterns verified against official Supabase docs and Next.js docs
- Schema/RLS: HIGH — standard PostgreSQL, verified patterns
- Pitfalls: HIGH — three (RLS, TIMESTAMPTZ, middleware placement) are verifiable facts; two (Tailwind 4 config, env var naming) verified via shadcn/Supabase docs
- Open questions: LOW for `getClaims()` version availability — needs empirical check at install

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Supabase and shadcn move fast — re-verify middleware pattern if implementation is delayed)
