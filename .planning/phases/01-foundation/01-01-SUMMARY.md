---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, supabase, auth, middleware, typescript, tailwind, shadcn]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with App Router, TypeScript, Tailwind 4, src/ directory
  - All Phase 1 production dependencies installed and resolvable
  - Supabase server client factory (cookie-based, Server Components/Actions)
  - Supabase browser client factory (Client Components)
  - Middleware at project root for auth session refresh and route protection
  - verifySession() DAL function for Server Action protection
  - login/logout Server Actions with Supabase signInWithPassword
  - formatCurrency() utility with Intl.NumberFormat (AUD default)
  - formatLessonDate/formatShortDate/formatTime utilities with date-fns-tz
  - Placeholder database.types.ts for generated Supabase TypeScript types
  - shadcn/ui initialized with Tailwind 4 CSS-first config
  - .env.local.example with all required env vars documented
affects: [all subsequent phases — every plan depends on this scaffold and auth infrastructure]

# Tech tracking
tech-stack:
  added:
    - next@16.2.1 (App Router, TypeScript, Tailwind 4)
    - react@19.2.4
    - "@supabase/supabase-js@2.99.3"
    - "@supabase/ssr@0.9.0"
    - date-fns@4.1.0
    - date-fns-tz@3.2.0
    - react-hook-form@7.72.0
    - zod@4.3.6
    - "@hookform/resolvers@5.2.2"
    - supabase CLI (dev dep)
    - shadcn/ui@4.1.0 (button, input, label, card components)
    - tailwindcss@4 (CSS-first config, no tailwind.config.js)
    - tw-animate-css (replaces tailwindcss-animate in Tailwind 4)
  patterns:
    - Server-first architecture — Server Components for reads, Server Actions for mutations
    - Two Supabase client factories — server.ts and client.ts, never mixed
    - getClaims() with getUser() fallback for session validation (no getSession())
    - Middleware at project root for auth session refresh on every request
    - verifySession() DAL pattern for per-action auth protection
    - Intl.NumberFormat for currency (future multi-currency ready)
    - date-fns-tz toZonedTime/format for timezone-aware date display

key-files:
  created:
    - middleware.ts (project root)
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/lib/dal.ts
    - src/lib/actions/auth.ts
    - src/lib/utils/currency.ts
    - src/lib/utils/dates.ts
    - src/types/database.types.ts
    - .env.local.example
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/card.tsx
  modified:
    - package.json (added all deps + types:generate script)
    - .gitignore (added !.env.local.example exception)

key-decisions:
  - "Use getClaims() with getUser() fallback — getClaims() is available in @supabase/auth-js but return type is data|null, not {data:{claims}}, requiring optional chaining"
  - "Scaffold via temp directory — create-next-app refuses existing directories with files; scaffolded tutorbase-temp then moved files"
  - "Tailwind 4 CSS-first config — shadcn@latest init auto-selects Tailwind 4; no tailwind.config.js needed"
  - "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY used throughout — new Supabase naming convention over legacy ANON_KEY"

patterns-established:
  - "Pattern: Two Supabase clients — server.ts for Server Components/Actions, client.ts for Client Components"
  - "Pattern: middleware.ts at project root — never inside src/ or it will be silently ignored"
  - "Pattern: verifySession() called at top of every Server Action for auth protection"
  - "Pattern: getClaims() optional chaining — data?.claims not data.claims due to nullable return type"

requirements-completed: [AUTH-02, INFRA-04]

# Metrics
duration: 12min
completed: 2026-03-22
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 16 project scaffolded with Supabase auth middleware, two client factories, verifySession DAL, login/logout Server Actions, and currency/date utilities — all TypeScript-clean with a passing build.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-22T04:52:34Z
- **Completed:** 2026-03-22T05:04:34Z
- **Tasks:** 2 completed
- **Files modified:** 16

## Accomplishments

- Scaffolded Next.js 16 with App Router, TypeScript, Tailwind 4, shadcn/ui — build passes
- Created complete Supabase auth infrastructure: two client factories, middleware at project root, verifySession() DAL, login/logout Server Actions
- Created formatCurrency (Intl.NumberFormat, AUD) and formatLessonDate/formatShortDate/formatTime (date-fns-tz) utilities

## Task Commits

1. **Task 1: Scaffold Next.js and install Phase 1 dependencies** - `7b407eb` (feat)
2. **Task 2: Create Supabase clients, middleware, DAL, auth actions, utilities** - `9014dd2` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `middleware.ts` — Auth session refresh + route protection (getClaims fallback to getUser)
- `src/lib/supabase/server.ts` — Server-side createClient factory using createServerClient
- `src/lib/supabase/client.ts` — Browser-side createClient factory using createBrowserClient
- `src/lib/dal.ts` — verifySession() for Server Action protection; returns {tutorId}
- `src/lib/actions/auth.ts` — login/logout Server Actions with signInWithPassword
- `src/lib/utils/currency.ts` — formatCurrency(amount, currency?) using Intl.NumberFormat
- `src/lib/utils/dates.ts` — formatLessonDate/formatShortDate/formatTime using date-fns-tz
- `src/types/database.types.ts` — Database interface placeholder (replace with generated types)
- `.env.local.example` — Documents all required env vars for new developer setup
- `src/components/ui/button.tsx` — shadcn Button component
- `src/components/ui/input.tsx` — shadcn Input component
- `src/components/ui/label.tsx` — shadcn Label component
- `src/components/ui/card.tsx` — shadcn Card component
- `package.json` — Added all deps + types:generate script
- `.gitignore` — Added !.env.local.example exception

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getClaims() TypeScript type mismatch**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** Plan's destructuring `const { data: { claims } }` assumes `data` is always an object, but the actual @supabase/auth-js return type is `data: T | null`, causing TS2339 errors
- **Fix:** Changed to `const { data } = await supabase.auth.getClaims()` then `data?.claims` optional chaining in both middleware.ts and dal.ts
- **Files modified:** middleware.ts, src/lib/dal.ts
- **Commits:** Included in 9014dd2

**2. [Rule 3 - Blocking] Scaffolded via temp directory**
- **Found during:** Task 1
- **Issue:** `create-next-app .` refuses to scaffold into a non-empty directory (`.planning/` and `CLAUDE.md` exist)
- **Fix:** Scaffolded into `tutorbase-temp` sibling directory, then copied all files to `tutorbase/`
- **Commits:** Included in 7b407eb

## Known Stubs

- `src/types/database.types.ts` — Placeholder `Database` interface with empty tables/views/etc. Will be replaced by `npm run types:generate` after Supabase project is connected and migrations are run (Plan 02 creates the schema/migrations).

## Self-Check: PASSED

Files verified:
- middleware.ts: FOUND
- src/lib/supabase/server.ts: FOUND
- src/lib/supabase/client.ts: FOUND
- src/lib/dal.ts: FOUND
- src/lib/actions/auth.ts: FOUND
- src/lib/utils/currency.ts: FOUND
- src/lib/utils/dates.ts: FOUND
- src/types/database.types.ts: FOUND
- .env.local.example: FOUND

Commits verified:
- 7b407eb: FOUND (feat(01-01): scaffold Next.js project)
- 9014dd2: FOUND (feat(01-01): create Supabase clients, middleware, DAL)
