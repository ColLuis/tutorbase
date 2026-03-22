<!-- GSD:project-start source:PROJECT.md -->
## Project

**TutorBase**

TutorBase is a mobile-first responsive web application for solo tutors to manage their tutoring operations — scheduling lessons, tracking students, generating professional PDF invoices and receipts, and monitoring revenue. It replaces spreadsheets and manual tracking with a purpose-built tool that works seamlessly on a phone or laptop.

**Core Value:** A tutor can complete their entire weekly workflow — schedule lessons, mark them done, invoice parents with a professional PDF, and track payments — from their phone in minutes.

### Constraints

- **Tech stack**: Next.js 14+ (App Router), TypeScript, Supabase, Tailwind CSS, shadcn/ui, @react-pdf/renderer
- **Hosting**: Render free tier (750 hrs/mo) + Supabase free tier (no credit card required)
- **Auth**: Supabase Auth email/password — no NextAuth.js
- **DB Client**: @supabase/supabase-js with generated TypeScript types
- **Date handling**: date-fns
- **Mobile**: minimum 44×44px tap targets, thumb-friendly forms, bottom navigation
- **Accessibility**: WCAG AA colour contrast, labelled inputs, keyboard navigable
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Verdict: Stack is Solid with Two Gotchas
## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (latest stable) | Full-stack React framework | App Router gives file-based routing, server components, server actions, and route handlers — all needed here. Docs site shows `next@latest` resolves to 15+ as of early 2026. |
| React | 19.x | UI library | Peer dependency of Next.js 15. React 19 stable ships with concurrent features and improved server component support. |
| TypeScript | 5.x | Type safety | Non-negotiable for a codebase that will evolve; Supabase type generation only pays off with TypeScript. |
### Authentication and Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | hosted (free tier) | PostgreSQL database + Auth + RLS | Hosted Postgres eliminates infra ops. Built-in Row Level Security means data isolation is enforced at the DB layer, not the application layer — critical for a tool that may later serve 2+ tutors. |
| @supabase/supabase-js | 2.x | DB client with TypeScript types | The primary client SDK; supports generated types via `supabase gen types typescript`. |
| @supabase/ssr | 0.x | Server-side auth helpers for Next.js | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Required for App Router — handles cookie-based session refresh in middleware and server components. |
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.x | Utility-first CSS | Native Next.js support; no build-time overhead. Mobile-first utilities (`sm:`, `md:`) map directly to the bottom nav / sidebar responsive requirement. |
| shadcn/ui | latest (not versioned — copied source) | Accessible component primitives | shadcn/ui components are copied into `src/components/ui/` rather than installed as a package, giving full control. Built on Radix UI primitives with WCAG AA accessibility baked in. Ideal for forms, dialogs, and calendar pickers. |
### PDF Generation
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | 3.x | PDF generation | React-based PDF layout engine; produces professional invoices and receipts from component trees. No browser dependency — runs on Node.js. |
### Date and Time
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 3.x | Date manipulation and formatting | Tree-shakeable, immutable, no global state. Functions like `addWeeks`, `startOfWeek`, `format`, `parseISO` cover all scheduling and display requirements. Works well with TypeScript. |
### Forms and Validation
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | 7.x | Form state management | Uncontrolled form pattern with minimal re-renders. Essential for mobile performance on lesson scheduling forms. |
| zod | 3.x | Schema validation | Type-safe validation that integrates with `react-hook-form` via `@hookform/resolvers/zod`. Same schemas can validate both client and server-side (in Server Actions). |
| @hookform/resolvers | 3.x | Bridge between react-hook-form and zod | Required glue package. |
### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Render | free tier | Hosting Next.js app | Free tier allows 750 hrs/month and commercial use without a credit card. Acceptable for a personal tool. |
| Supabase | free tier | Database + Auth hosting | 500 MB storage, 50K MAU — vastly more than a 1-2 tutor deployment needs. |
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
## Installation
# Bootstrap
# Supabase
# PDF
# Date
# Forms + validation
# shadcn/ui (interactive CLI — run after project scaffold)
# Dev tooling
## Key Configuration Notes
### Environment Variables
# .env.local
### Middleware (Required for Auth)
### next.config.js — PDF Worker
## Sources
- Next.js App Router docs: https://nextjs.org/docs/app (fetched 2026-03-22, docs version 16.2.1)
- Supabase Auth + Next.js App Router: https://supabase.com/docs/guides/auth/server-side/nextjs (training data, August 2025 cutoff — MEDIUM confidence)
- @react-pdf/renderer GitHub issues re: Server Components: training data (MEDIUM confidence — verify before implementation)
- date-fns v3 migration guide: https://date-fns.org/v3.x/docs/Getting-Started (training data — HIGH confidence, v3 released late 2023)
- shadcn/ui + Tailwind compatibility: https://ui.shadcn.com/docs/installation/next (training data — MEDIUM confidence, verify Tailwind 3 vs 4 at scaffold time)
- Render + Next.js deployment: https://render.com/docs/deploy-nextjs-app (training data — MEDIUM confidence)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
