---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [supabase, postgresql, rls, schema, seed, database]

# Dependency graph
requires:
  - "01-01 (Next.js scaffold with all dependencies installed)"
provides:
  - Complete PostgreSQL database schema with 6 tables and RLS on every table
  - invoice_number_seq PostgreSQL sequence for race-condition-safe invoice numbering
  - auth.uid() isolation policies on all tables (tutor_id = auth.uid())
  - TIMESTAMPTZ on all timestamp columns
  - Development seed script creating tutor, 3 students, 4 lessons, 1 invoice with line item
  - npm run seed command via tsx scripts/seed.ts
affects:
  - All subsequent phases — every feature depends on this schema being deployed
  - Phase 3 invoicing — invoice sequence and invoice_items table structure
  - Phase 4 dashboard — revenue queries depend on lessons and invoices tables

# Tech tracking
tech-stack:
  added:
    - tsx@4.21.0 (dev dep — runs TypeScript scripts without compiling)
  patterns:
    - RLS enabled at table creation time — never added as a follow-up
    - auth.uid() policy on every table — tutors use id = auth.uid(), others use tutor_id = auth.uid()
    - PostgreSQL SEQUENCE for invoice numbering — prevents race conditions from MAX()+1 approach
    - Service role client in seed script — intentionally bypasses RLS for seed data population
    - admin.createUser() for seed auth user — handles existing user gracefully via listUsers() fallback
    - Upsert pattern for tutor profile — seed script is idempotent on repeated runs

key-files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - scripts/seed.ts
  modified:
    - package.json (added "seed" script + tsx devDependency)

key-decisions:
  - "PostgreSQL SEQUENCE for invoice numbers — invoice_number_seq prevents race conditions; never use MAX()+1 in application code"
  - "RLS enabled inline in migration — ALTER TABLE + CREATE POLICY immediately after each CREATE TABLE to ensure policies can never be missed"
  - "Service role key in seed script — intentional RLS bypass for development data population; never expose SUPABASE_SERVICE_ROLE_KEY to client code"
  - "admin.createUser() with listUsers() fallback — seed script creates auth user or finds existing one; supports idempotent re-runs"

requirements-completed: [INFRA-02, INFRA-03, INFRA-04]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 1 Plan 02: Database Schema and Seed Summary

**Complete PostgreSQL schema migration with RLS and auth.uid() policies on all 6 tables, plus an idempotent development seed script creating a tutor, students, lessons, and invoices.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T05:09:10Z
- **Completed:** 2026-03-22T05:14:00Z
- **Tasks:** 2 completed
- **Files modified:** 3 (001_initial_schema.sql, scripts/seed.ts, package.json)

## Accomplishments

- Created complete database migration: 6 tables (tutors, students, lessons, invoices, invoice_items, receipts) with RLS enabled on every table and auth.uid() isolation policies
- Created invoice_number_seq PostgreSQL sequence for race-condition-safe invoice number generation
- Used TIMESTAMPTZ on all 12 timestamp columns — no plain TIMESTAMP anywhere
- Created seed script that creates or finds a Jane Tutor auth user, upserts the tutor profile, inserts 3 students, 4 mixed-status lessons, 1 sent invoice, 1 invoice item
- Added `npm run seed` to package.json via tsx

## Task Commits

1. **Task 1: Create complete database migration with RLS policies** - `05f4eda` (feat)
2. **Task 2: Create development seed script** - `2b21ac2` (feat)

## Files Created/Modified

- `supabase/migrations/001_initial_schema.sql` — Full schema: 6 tables, 6 RLS enables, 6 policies, invoice sequence, FK constraints, UNIQUE constraints, CHECK constraints
- `scripts/seed.ts` — Development seed: auth user creation, tutor upsert, 3 students, 4 lessons, 1 invoice + line item; handles existing users gracefully
- `package.json` — Added `"seed": "tsx scripts/seed.ts"` script + `"tsx": "^4.21.0"` dev dependency

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — migration file is complete and seed script is fully wired.

## Self-Check: PASSED

Files verified:
- supabase/migrations/001_initial_schema.sql: FOUND
- scripts/seed.ts: FOUND
- package.json: FOUND (seed script + tsx added)

Commits verified:
- 05f4eda: FOUND (feat(01-02): create complete database migration with RLS policies)
- 2b21ac2: FOUND (feat(01-02): create development seed script and add tsx dependency)
