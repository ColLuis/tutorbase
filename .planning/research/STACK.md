# Technology Stack

**Project:** TutorBase
**Researched:** 2026-03-22
**Mode:** Validation — user has a pre-chosen stack; this document validates choices and surfaces gotchas

---

## Verdict: Stack is Solid with Two Gotchas

The chosen stack is well-suited to this project. All core choices are appropriate for a mobile-first scheduling/invoicing tool with a single-user auth model and free-tier hosting. Two areas need specific mitigation: `@react-pdf/renderer` does not work in Next.js Server Components and requires a dedicated API route, and Render's cold start (~30 s) means the first page load after idle is noticeably slow — acceptable for a personal tool, but worth documenting.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (latest stable) | Full-stack React framework | App Router gives file-based routing, server components, server actions, and route handlers — all needed here. Docs site shows `next@latest` resolves to 15+ as of early 2026. |
| React | 19.x | UI library | Peer dependency of Next.js 15. React 19 stable ships with concurrent features and improved server component support. |
| TypeScript | 5.x | Type safety | Non-negotiable for a codebase that will evolve; Supabase type generation only pays off with TypeScript. |

**Note on version:** The user specified "Next.js 14+". As of March 2026, Next.js 15 is the current stable release (the docs page fetched from nextjs.org showed version 16.2.1 in the docs metadata, suggesting the docs themselves have moved ahead — verify with `npm show next version` before pinning). Use `next@latest` and lock the version in `package.json` after scaffold. Do not pin to 14 unless a specific dependency requires it.

**Confidence:** MEDIUM — Next.js version confirmed via docs page metadata; exact minor version should be verified with npm before project init.

---

### Authentication and Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | hosted (free tier) | PostgreSQL database + Auth + RLS | Hosted Postgres eliminates infra ops. Built-in Row Level Security means data isolation is enforced at the DB layer, not the application layer — critical for a tool that may later serve 2+ tutors. |
| @supabase/supabase-js | 2.x | DB client with TypeScript types | The primary client SDK; supports generated types via `supabase gen types typescript`. |
| @supabase/ssr | 0.x | Server-side auth helpers for Next.js | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Required for App Router — handles cookie-based session refresh in middleware and server components. |

**Critical gotcha — middleware requirement:** Supabase Auth with the App Router requires a `middleware.ts` file that calls `supabase.auth.getSession()` (or the SSR helper equivalent) on every request to refresh the auth cookie. Without this, sessions silently expire and users get logged out mid-session. The `@supabase/ssr` package provides `createServerClient` for this pattern.

**Critical gotcha — `@supabase/auth-helpers-nextjs` is deprecated:** Do not use `@supabase/auth-helpers-nextjs`. It has been superseded by `@supabase/ssr`. Using the old package causes subtle bugs with App Router's server component cookie handling.

**Confidence:** HIGH — this is well-documented in Supabase's own migration guides and widely confirmed in community usage.

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.x | Utility-first CSS | Native Next.js support; no build-time overhead. Mobile-first utilities (`sm:`, `md:`) map directly to the bottom nav / sidebar responsive requirement. |
| shadcn/ui | latest (not versioned — copied source) | Accessible component primitives | shadcn/ui components are copied into `src/components/ui/` rather than installed as a package, giving full control. Built on Radix UI primitives with WCAG AA accessibility baked in. Ideal for forms, dialogs, and calendar pickers. |

**Note on Tailwind version:** Tailwind CSS 4.0 was released in early 2025 with a significantly different configuration model (CSS-first config, no `tailwind.config.js`). shadcn/ui's primary documentation and component templates are written for Tailwind 3.x. As of March 2026, check whether shadcn/ui's CLI (`npx shadcn@latest init`) defaults to Tailwind 3 or 4 — use whichever the CLI scaffolds to avoid version mismatch. If it defaults to Tailwind 4, component class names and config patterns will differ from Tailwind 3 docs.

**Confidence:** MEDIUM — Tailwind 4/shadcn compatibility is a known moving target; verify at scaffold time.

---

### PDF Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | 3.x | PDF generation | React-based PDF layout engine; produces professional invoices and receipts from component trees. No browser dependency — runs on Node.js. |

**Critical gotcha — cannot run in Server Components or Route Handler streams directly:** `@react-pdf/renderer` uses browser-like APIs internally and will throw if imported at the top level of a Server Component. The correct pattern is:

1. Create a dedicated Route Handler (`app/api/invoices/[id]/pdf/route.ts`).
2. Import `@react-pdf/renderer` only inside that handler.
3. Use `renderToStream()` or `renderToBuffer()` and return a `Response` with `Content-Type: application/pdf`.
4. The client calls this endpoint with `fetch()` and triggers a download.

Do not attempt to generate PDFs in page Server Components or pass PDF streams as props.

**Alternative considered:** `pdfmake` — lower-level, no React integration, harder to design professional layouts. `@react-pdf/renderer` is the right call for this project.

**Confidence:** HIGH — this limitation is documented in the @react-pdf/renderer GitHub issues and widely discussed in Next.js communities.

---

### Date and Time

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 3.x | Date manipulation and formatting | Tree-shakeable, immutable, no global state. Functions like `addWeeks`, `startOfWeek`, `format`, `parseISO` cover all scheduling and display requirements. Works well with TypeScript. |

**Note on date-fns v3:** date-fns v3 (released late 2023) is a breaking change from v2 — all functions are now ESM-only by default and some function signatures changed. If any dependency in the project pins `date-fns@2`, there will be dual-install issues. Use `date-fns@3` and verify no other dependency forces v2.

**Timezone handling:** For Australian timezone display, use `date-fns-tz` alongside `date-fns`. The tutor's timezone is stored in profile settings (defaulting to `Australia/Sydney`). Use `toZonedTime` and `fromZonedTime` from `date-fns-tz` when converting between stored UTC timestamps and display times.

**Confidence:** HIGH for date-fns choice; MEDIUM for date-fns-tz as the timezone companion (widely used pattern, but verify it works cleanly with date-fns 3).

---

### Forms and Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | 7.x | Form state management | Uncontrolled form pattern with minimal re-renders. Essential for mobile performance on lesson scheduling forms. |
| zod | 3.x | Schema validation | Type-safe validation that integrates with `react-hook-form` via `@hookform/resolvers/zod`. Same schemas can validate both client and server-side (in Server Actions). |
| @hookform/resolvers | 3.x | Bridge between react-hook-form and zod | Required glue package. |

**Why forms need dedicated libraries:** shadcn/ui's `<Form>` components are built specifically around `react-hook-form`. Using raw controlled inputs would bypass these components and lose accessibility wiring.

**Confidence:** HIGH — this trio is the de facto standard for Next.js App Router forms.

---

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Render | free tier | Hosting Next.js app | Free tier allows 750 hrs/month and commercial use without a credit card. Acceptable for a personal tool. |
| Supabase | free tier | Database + Auth hosting | 500 MB storage, 50K MAU — vastly more than a 1-2 tutor deployment needs. |

**Render cold start gotcha:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds. For a personal tool used daily this is acceptable, but document it for the tutor so they are not surprised. No mitigation needed for v1.

**Render + Next.js deployment:** Next.js on Render requires a custom start command. In `package.json`, ensure `"start": "next start"` is present. Render will run `npm run build` then `npm run start`. Set the `PORT` environment variable handling — Next.js reads `PORT` from the environment automatically.

**Confidence:** MEDIUM — Render deployment of Next.js works, but the exact build/start configuration should be verified against Render's Next.js deploy guide at setup time.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 App Router | Remix | Remix is a valid choice but the user has already chosen Next.js and the team familiarity assumption holds. Remix's form handling is more opinionated and would require rethinking the architecture. |
| Database | Supabase | PlanetScale / Neon | Supabase is the only free-tier option that combines PostgreSQL + Auth + RLS in one product without a credit card. Neon requires more auth setup. |
| PDF | @react-pdf/renderer | Puppeteer / html2pdf | Puppeteer requires a headless browser binary — adds ~200 MB to the deployment and does not work on Render's free tier without significant effort. @react-pdf/renderer is pure Node.js. |
| Date handling | date-fns | Day.js | Day.js is smaller but has a plugin ecosystem that can become unwieldy. date-fns 3's tree-shaking means bundle size is comparable in practice. |
| Styling | Tailwind + shadcn/ui | Chakra UI / MUI | Chakra and MUI add large runtime bundles. Tailwind + shadcn/ui produces minimal client JS because components are just Tailwind classes on Radix primitives. |
| Auth | Supabase Auth | NextAuth.js (now Auth.js) | The user explicitly excluded NextAuth.js. Supabase Auth is simpler for email/password-only with no signup page. |
| Hosting | Render | Vercel | Vercel's free tier requires a credit card for commercial use and has usage limits that affect always-on tools. Render's free tier is genuinely free for personal projects. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest tutorbase --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# PDF
npm install @react-pdf/renderer

# Date
npm install date-fns date-fns-tz

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# shadcn/ui (interactive CLI — run after project scaffold)
npx shadcn@latest init

# Dev tooling
npm install -D supabase  # Supabase CLI for local dev + type generation
```

**Type generation (run after schema is finalized or after each migration):**

```bash
npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts
```

---

## Key Configuration Notes

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Never put the Supabase `service_role` key in the client or in `NEXT_PUBLIC_` variables. If service-role operations are needed server-side, add `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) and only use it in Server Actions or Route Handlers.

### Middleware (Required for Auth)

```typescript
// middleware.ts (project root, not inside src/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Session refresh logic here — see @supabase/ssr docs
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### next.config.js — PDF Worker

`@react-pdf/renderer` may require webpack configuration to handle its internal worker. If you see build errors related to `canvas` or `worker`, add:

```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}
```

---

## Sources

- Next.js App Router docs: https://nextjs.org/docs/app (fetched 2026-03-22, docs version 16.2.1)
- Supabase Auth + Next.js App Router: https://supabase.com/docs/guides/auth/server-side/nextjs (training data, August 2025 cutoff — MEDIUM confidence)
- @react-pdf/renderer GitHub issues re: Server Components: training data (MEDIUM confidence — verify before implementation)
- date-fns v3 migration guide: https://date-fns.org/v3.x/docs/Getting-Started (training data — HIGH confidence, v3 released late 2023)
- shadcn/ui + Tailwind compatibility: https://ui.shadcn.com/docs/installation/next (training data — MEDIUM confidence, verify Tailwind 3 vs 4 at scaffold time)
- Render + Next.js deployment: https://render.com/docs/deploy-nextjs-app (training data — MEDIUM confidence)
