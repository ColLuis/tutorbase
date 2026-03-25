# Phase 4: Dashboard and Revenue - Research

**Researched:** 2026-03-24
**Domain:** Read-only aggregate views over existing lesson, invoice, and payment data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Today's lessons section at top of page — "what's happening now" takes priority over metrics
- **D-02:** Metric cards below today's lessons — 2x2 grid on mobile, 4-across on desktop (weekly lesson count, unpaid invoices count+total, monthly revenue, yearly revenue)
- **D-03:** Quick action buttons (Add Lesson, Create Invoice, Add Student) sticky at bottom of dashboard — always visible and thumb-friendly on mobile
- **D-04:** When no lessons today, show all lessons for the next day that has lessons — header changes to "Next up: [Day]" so the dashboard is always useful
- **D-05:** Minimal per-lesson info: student name + time only (e.g., "Sarah — 3:30 PM") — dashboard is a glanceable summary
- **D-06:** View-only — no status actions on the dashboard; tapping a lesson navigates to the schedule page and auto-opens that lesson's detail panel
- **D-07:** Lessons shown in chronological order by time
- **D-08:** Revenue monthly breakdown columns: month, lessons delivered, hours taught, amount invoiced, amount paid, outstanding
- **D-09:** Shows data for the current financial context (time navigation at Claude's discretion)
- **D-10:** Revenue per-student columns: student name, total lessons, total invoiced, total paid, outstanding
- **D-11:** Sortable columns — tappable headers to sort by any column (default: most revenue first)
- **D-12:** Rows are non-interactive — just a data table, no navigation on tap

### Claude's Discretion

- Revenue page time navigation (default period, month picker, etc.)
- Dashboard metric card visual design (icons, colors, typography)
- Empty states for revenue page (no invoices yet, no students yet)
- Loading skeleton designs
- Exact layout of sticky quick actions bar (icon+label vs icon-only, spacing)
- How the "next day" fallback header is worded
- Revenue page section ordering (monthly first vs per-student first)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Dashboard shows today's lessons with student name, time, and status | New `getTodayLessons()` query using `startOfDay`/`endOfDay` with timezone conversion; render in a Server Component, pass to client card list |
| DASH-02 | Dashboard shows weekly lesson count, unpaid invoice count/total, monthly and yearly revenue | Three separate Supabase queries aggregated in a single `getDashboardStats()` function; all computed app-side from raw rows |
| DASH-03 | Dashboard has quick action buttons for Add Lesson, Create Invoice, Add Student | Sticky bottom bar with three `<Link>` buttons using existing `Button` + `render` prop pattern |
| REV-01 | User can view monthly revenue breakdown (lessons, invoiced, paid, outstanding) | New `getMonthlyRevenue()` query; group by `issued_date` month app-side (JS Map); hours derived from `duration_minutes` sum |
| REV-02 | User can view per-student revenue breakdown | New `getStudentRevenue()` query joining students + invoices; client-side sort state in a `'use client'` table component |
</phase_requirements>

---

## Summary

Phase 4 is entirely read-only. No new tables, no new Server Actions, no mutations. Every requirement is satisfied by querying existing `lessons`, `invoices`, and `students` tables and presenting the results in new page layouts.

The dashboard (`src/app/(app)/page.tsx`) is currently a placeholder. It becomes a Server Component that runs two parallel data fetches (today's lessons + dashboard stats) and renders a static layout. The revenue page (`src/app/(app)/revenue/page.tsx`) is a new route that performs heavier aggregation queries and renders two sections: a monthly breakdown table and a per-student table with client-side sort.

The one genuine complexity is the deep-link from a dashboard lesson to the schedule page with a specific lesson's detail panel auto-opened. The schedule page already accepts `searchParams` — extending it to accept a `?lesson=<id>` param and auto-open `LessonDetailPanel` is the cleanest approach and avoids any new routing infrastructure.

**Primary recommendation:** Write two new query files (`dashboard.ts`, `revenue.ts`) with aggregation logic in TypeScript (not SQL), keep both pages as Server Components for initial data fetch, and use a single `'use client'` component only for the sortable revenue table.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Next.js App Router | 15.x | Server Components for data fetch, `searchParams` for deep-link | Zero new installs needed |
| @supabase/supabase-js | 2.x | `.from().select().eq().gte().lte()` filter chains for date-ranged queries | Established pattern in codebase |
| date-fns | 3.x | `startOfDay`, `endOfDay`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear`, `format`, `parseISO` | Already used throughout |
| date-fns-tz | 3.x | `toZonedTime` — convert UTC timestamps to tutor timezone for day-boundary calculations | Already used in `dates.ts` |
| Tailwind CSS | 3.x | `grid`, `sticky`, `overflow-x-auto` for responsive tables | Established |
| shadcn/ui Card | copied | Metric cards, section containers | Already in `src/components/ui/card.tsx` |
| shadcn/ui Badge | copied | Lesson status display | Already in `src/components/ui/badge.tsx` |
| shadcn/ui Button | copied | Quick action buttons | Already in `src/components/ui/button.tsx` |
| lucide-react | latest | Icons for metric cards (Calendar, FileText, TrendingUp, DollarSign) and sort indicators (ChevronUp, ChevronDown) | Already used in nav |

### No New Installs Required

This phase introduces zero new dependencies. All required libraries are already in `package.json`.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── app/(app)/
│   ├── page.tsx                    # Dashboard — Server Component (replaces placeholder)
│   └── revenue/
│       └── page.tsx                # Revenue page — Server Component
├── components/
│   ├── dashboard/
│   │   ├── TodayLessons.tsx        # Pure display; receives lessons as props
│   │   ├── MetricCards.tsx         # 2x2 / 4-across grid; receives stats as props
│   │   └── QuickActions.tsx        # Sticky bar; 'use client' only if needed for active state
│   └── revenue/
│       ├── MonthlyBreakdown.tsx    # Table; pure display
│       └── StudentBreakdown.tsx    # 'use client' — owns sort state
├── lib/
│   └── queries/
│       ├── dashboard.ts            # getTodayLessons(), getDashboardStats()
│       └── revenue.ts              # getMonthlyRevenue(), getStudentRevenue()
```

### Pattern 1: Dashboard Server Component with Parallel Fetches

The dashboard page runs all fetches in parallel using `Promise.all`, then passes results down to pure display components. This is the established pattern used in `ScheduleRoute` (`schedule/page.tsx`).

```typescript
// src/app/(app)/page.tsx
import { verifySession } from '@/lib/dal'
import { getTutorProfile } from '@/lib/queries/tutors'
import { getTodayLessons, getDashboardStats } from '@/lib/queries/dashboard'

export default async function DashboardPage() {
  const { tutorId } = await verifySession()
  const [tutor, todayLessons, stats] = await Promise.all([
    getTutorProfile(tutorId),
    getTodayLessons(tutorId),
    getDashboardStats(tutorId),
  ])
  // render TodayLessons, MetricCards, QuickActions
}
```

### Pattern 2: Timezone-Aware Day Boundaries

Day-boundary queries MUST be computed in the tutor's timezone, not UTC. The lesson `scheduled_at` is stored as UTC TIMESTAMPTZ. "Today's lessons" means lessons whose `scheduled_at` falls within `[startOfDay(today, tz), endOfDay(today, tz)]` in UTC terms.

```typescript
// src/lib/queries/dashboard.ts
import { startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export async function getTodayLessons(tutorId: string) {
  const tutor = await getTutorProfile(tutorId) // fetch once per request; cached by Next.js fetch dedup
  const tz = tutor.timezone ?? 'Australia/Sydney'
  const nowInTz = toZonedTime(new Date(), tz)
  const dayStart = fromZonedTime(startOfDay(nowInTz), tz)  // UTC equivalent of tz midnight
  const dayEnd   = fromZonedTime(endOfDay(nowInTz), tz)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, status, students(name)')
    .eq('tutor_id', tutorId)
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString())
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}
```

**Critical:** `fromZonedTime` (not `toZonedTime`) converts a local-tz date to UTC for use in DB comparisons. This is the same pattern already working in the codebase via `date-fns-tz`.

### Pattern 3: "Next Day" Fallback

When today has no lessons, find the next calendar date that has at least one lesson. Query the next N days (e.g., 30) and return the earliest group. Implemented entirely in the query function — the component just checks `lessons.length === 0` on "today" and calls a second query if needed, or the query function returns a `{ label: string, lessons: Lesson[] }` shape.

Recommended approach: single query function returns `{ label: 'Today' | string, lessons: Lesson[] }`:

```typescript
export async function getDashboardLessons(tutorId: string, tz: string) {
  // 1. Try today
  const todayLessons = await queryLessonsBetween(tutorId, dayStart, dayEnd)
  if (todayLessons.length > 0) return { label: 'Today', lessons: todayLessons }

  // 2. Look ahead up to 30 days for next teaching day
  const lookaheadEnd = fromZonedTime(endOfDay(addDays(nowInTz, 30)), tz)
  const upcoming = await queryLessonsBetween(tutorId, dayEnd, lookaheadEnd)
  if (upcoming.length === 0) return { label: 'Today', lessons: [] }

  // Group by date and return first group
  const firstDate = toZonedTime(new Date(upcoming[0].scheduled_at), tz)
  const nextDayStart = fromZonedTime(startOfDay(firstDate), tz)
  const nextDayEnd   = fromZonedTime(endOfDay(firstDate), tz)
  const nextLessons  = upcoming.filter(l => new Date(l.scheduled_at) <= nextDayEnd)
  const label = format(toZonedTime(nextDayStart, tz), 'EEEE d MMM', { timeZone: tz }) // "Wednesday 26 Mar"
  return { label: `Next up: ${label}`, lessons: nextLessons }
}
```

### Pattern 4: Dashboard Stats Aggregation (App-Layer)

Supabase PostgREST does not support multi-table aggregates in a single RPC call without a custom PostgreSQL function. Rather than adding a migration, compute all four metric card values in TypeScript from raw row queries. Three queries run in parallel:

```typescript
export async function getDashboardStats(tutorId: string, tz: string) {
  const [weekLessons, unpaidInvoices, monthInvoices, yearInvoices] = await Promise.all([
    // 1. Lessons this week (any status — display raw count)
    queryLessonsBetween(tutorId, weekStart, weekEnd),
    // 2. Unpaid invoices (status = 'sent' or 'draft' — amounts)
    supabase.from('invoices').select('id, total, status').eq('tutor_id', tutorId).in('status', ['draft','sent']),
    // 3. Paid invoices this month (paid_date in current month)
    supabase.from('invoices').select('total, paid_date').eq('tutor_id', tutorId).eq('status','paid').gte('paid_date', monthStart).lte('paid_date', monthEnd),
    // 4. Paid invoices this year
    supabase.from('invoices').select('total, paid_date').eq('tutor_id', tutorId).eq('status','paid').gte('paid_date', yearStart).lte('paid_date', yearEnd),
  ])
  return {
    weeklyLessonCount: weekLessons.length,
    unpaidCount: unpaidInvoices.data?.length ?? 0,
    unpaidTotal: unpaidInvoices.data?.reduce((s, i) => s + Number(i.total), 0) ?? 0,
    monthlyRevenue: monthInvoices.data?.reduce((s, i) => s + Number(i.total), 0) ?? 0,
    yearlyRevenue: yearInvoices.data?.reduce((s, i) => s + Number(i.total), 0) ?? 0,
  }
}
```

**Note on monthly revenue definition:** Revenue is from paid invoices where `paid_date` falls in the target period — not `issued_date`. This correctly represents cash received. The metric card label should reflect this ("Revenue received this month").

### Pattern 5: Revenue Page — Monthly Breakdown

Revenue page fetches all invoices for the selected year (default: current year). Grouping by month is done in TypeScript using a `Map<string, MonthBucket>` keyed on `"YYYY-MM"`. The `issued_date` column is used for invoicing month attribution (standard accounting practice).

Lesson count per month comes from a separate lessons query for completed lessons in the same period, grouped by the month of `scheduled_at`.

```typescript
// src/lib/queries/revenue.ts
export async function getMonthlyRevenue(tutorId: string, year: number) {
  const supabase = await createClient()
  const [invoices, lessons] = await Promise.all([
    supabase.from('invoices')
      .select('id, issued_date, total, status')
      .eq('tutor_id', tutorId)
      .gte('issued_date', `${year}-01-01`)
      .lte('issued_date', `${year}-12-31`),
    supabase.from('lessons')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('tutor_id', tutorId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${year}-01-01T00:00:00Z`)
      .lte('scheduled_at', `${year}-12-31T23:59:59Z`),
  ])
  // Build 12-month map, aggregate in JS
}
```

The monthly breakdown table has these derived values:
- **lessons delivered**: count of completed lessons in that month
- **hours taught**: sum of `duration_minutes` / 60 for those lessons
- **amount invoiced**: sum of `total` from invoices with `issued_date` in month
- **amount paid**: sum of `total` from paid invoices with `paid_date` in month
- **outstanding**: amount invoiced minus amount paid (or sum of unpaid invoice totals)

### Pattern 6: Revenue Page — Per-Student Table with Client Sort

The per-student table requires client-side state for sort column/direction. This is the only component in the phase that needs `'use client'`.

```typescript
// src/components/revenue/StudentBreakdown.tsx
'use client'
import { useState } from 'react'

type SortKey = 'name' | 'lessons' | 'invoiced' | 'paid' | 'outstanding'

export default function StudentBreakdown({ rows }: { rows: StudentRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('invoiced')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    // string vs numeric comparison
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  // render table with tappable <th> buttons
}
```

### Pattern 7: Deep-Link to Schedule Detail Panel

Decision D-06 requires tapping a dashboard lesson to navigate to the schedule page with that lesson's detail panel auto-opened. The schedule page already reads `searchParams.week`. Extend it to also read `searchParams.lesson`:

1. Dashboard renders each lesson as a `<Link href={`/schedule?lesson=${lesson.id}`}>`.
2. `SchedulePage` client component reads `useSearchParams()` on mount.
3. If `lesson` param present, call `setSelectedLessonId(param)` in a `useEffect` — the existing `selectedLessonId` state already controls `LessonDetailPanel`.

This requires no new routes, no new state management, and no changes to the `LessonDetailPanel` component.

```typescript
// Inside SchedulePage.tsx — add after existing searchParams setup
const lessonParam = searchParams.get('lesson')
useEffect(() => {
  if (lessonParam && lessons.some(l => l.id === lessonParam)) {
    setSelectedLessonId(lessonParam)
  }
}, [lessonParam]) // run once on mount
```

### Pattern 8: Sticky Quick Actions Bar

The sticky bar sits at the bottom of the dashboard content area, above the bottom nav. On desktop it appears below the metric cards. Use `sticky bottom-0` with a white background and top border to prevent content overlap with bottom nav:

```tsx
<div className="sticky bottom-0 bg-background border-t pt-3 pb-4 -mx-4 px-4 md:relative md:mt-6 md:border-0">
  <div className="grid grid-cols-3 gap-2">
    <Button asChild variant="outline"><Link href="/schedule?action=new">Add Lesson</Link></Button>
    <Button asChild variant="outline"><Link href="/invoices/new">Create Invoice</Link></Button>
    <Button asChild variant="outline"><Link href="/students/new">Add Student</Link></Button>
  </div>
</div>
```

Note: The existing `Button` in this codebase uses Base UI's render prop pattern (`render={<Link>}`), not Radix UI's `asChild`. Use `render={<Link href="...">Label</Link>}` instead of `asChild`.

### Anti-Patterns to Avoid

- **UTC day boundaries:** Never use `new Date().toISOString().split('T')[0]` to get "today" — this gives UTC midnight, not the tutor's local midnight. Always use `toZonedTime` + `fromZonedTime`.
- **SQL aggregations via Supabase RPC for this phase:** Adding a new PostgreSQL function just for dashboard stats introduces migration complexity without benefit. The raw row counts are small enough for app-layer aggregation.
- **Client Component for pages:** The dashboard and revenue pages should be Server Components. Only `StudentBreakdown` (sort state) needs `'use client'`.
- **`asChild` on Base UI Button:** This codebase uses Base UI, not Radix UI. The `render` prop pattern is required for polymorphic buttons.
- **Caching tutor timezone in module scope:** Always fetch timezone inside the query function or pass it as a parameter — module-level state would be shared across requests in Next.js.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency display | Custom formatter | `formatCurrency()` from `src/lib/utils/currency.ts` | Already tested, handles AUD locale |
| Date display | Custom format strings | `formatTime()`, `formatShortDate()` from `src/lib/utils/dates.ts` | Already handles timezone via date-fns-tz |
| Card layout | Custom CSS grid | `Card`, `CardHeader`, `CardContent` from `src/components/ui/card.tsx` | Consistent visual language |
| Loading state | Custom spinner | `<Suspense fallback={...}>` with skeleton text | Established pattern (schedule page) |
| Sort icons | Unicode arrows | `ChevronUp`/`ChevronDown` from `lucide-react` | Already bundled, consistent with nav icons |
| Auth check | Re-implementing session logic | `verifySession()` from `src/lib/dal` | Single source of truth for auth |

---

## Common Pitfalls

### Pitfall 1: Timezone-Naive Day Queries

**What goes wrong:** `getTodayLessons` uses `new Date()` directly as a UTC date range. A tutor in Sydney at 11 PM sees "tomorrow's" lessons, or misses late-evening lessons.

**Why it happens:** UTC midnight !== Sydney midnight (offset is +10/+11 hours).

**How to avoid:** Always compute day boundaries using `toZonedTime` to shift NOW into the tutor's timezone, then `fromZonedTime` to convert the resulting local midnight back to UTC for the DB query.

**Warning signs:** Tests fail for timezones with +/- offsets; dashboard shows wrong lessons late at night.

### Pitfall 2: Deep-Link Stale Lesson Data

**What goes wrong:** Dashboard deep-link navigates to `?lesson=<id>` but the schedule page defaults to the current week — if the lesson is in a different week, the lesson ID won't be in `lessons` array and the panel silently fails to open.

**How to avoid:** When building the deep-link URL, include the week param: `/schedule?week=<lesson-week>&lesson=<id>`. Compute the Monday of the lesson's week from `scheduled_at` before building the href.

**Warning signs:** Panel never opens even though lesson ID is in URL.

### Pitfall 3: Revenue "Outstanding" Definition

**What goes wrong:** Outstanding computed as `invoiced - paid` gives wrong results when invoices are deleted or have draft status.

**How to avoid:** Outstanding = sum of `total` from invoices where `status IN ('draft', 'sent')` — not a derived difference. Paid invoices contribute to "paid", not "outstanding".

### Pitfall 4: Sticky Bar Overlapping Bottom Nav

**What goes wrong:** `sticky bottom-0` on the quick actions bar sits above the `pb-16` clearance from the layout, causing the bar to overlap with `BottomNav` on mobile.

**How to avoid:** The app layout already adds `pb-16 md:pb-0` to `<main>`. The sticky bar should use `bottom-16 md:bottom-0` on mobile, OR rely on normal document flow inside the scrollable content (just a visually-sticky card at the bottom of the scrollable area, not fixed). Simpler: place quick actions as the last block in the page content — they scroll into view on mobile, which is acceptable given the dashboard is short.

### Pitfall 5: `fromZonedTime` vs `toZonedTime` Confusion

**What goes wrong:** Developer uses `toZonedTime` in both directions, producing incorrect UTC values for DB queries.

**How to avoid:**
- `toZonedTime(utcDate, tz)` → gives you a "local-looking" Date for formatting/manipulation
- `fromZonedTime(localDate, tz)` → converts a local-tz Date back to UTC for DB storage/querying

The existing `dates.ts` only uses `toZonedTime` (for display). Revenue and dashboard queries need `fromZonedTime` for constructing DB query ranges.

### Pitfall 6: Hours Taught Precision

**What goes wrong:** `duration_minutes / 60` gives fractional hours (1.5, 0.75). Displaying "1.5 hours" in a table is ambiguous.

**How to avoid:** Format as `(totalMinutes / 60).toFixed(1)` with a "h" suffix, e.g., "1.5 h". For the monthly table where precision matters, this is cleaner than rounding to whole hours.

---

## Code Examples

### Lesson Deep-Link URL Construction

```typescript
// In dashboard query or component — build URL with week context
import { startOfWeek, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

function buildLessonDeepLink(scheduledAt: string, lessonId: string, tz: string): string {
  const zoned = toZonedTime(new Date(scheduledAt), tz)
  const weekStart = startOfWeek(zoned, { weekStartsOn: 1 })
  const weekParam = format(weekStart, 'yyyy-MM-dd')
  return `/schedule?week=${weekParam}&lesson=${lessonId}`
}
```

### Month Grouping for Revenue

```typescript
// Group invoices by issued_date month
const monthMap = new Map<string, { invoiced: number; paid: number }>()
for (const inv of invoices) {
  if (!inv.issued_date) continue
  const key = inv.issued_date.slice(0, 7) // "YYYY-MM"
  const bucket = monthMap.get(key) ?? { invoiced: 0, paid: 0 }
  bucket.invoiced += Number(inv.total)
  if (inv.status === 'paid') bucket.paid += Number(inv.total)
  monthMap.set(key, bucket)
}
```

### Metric Card Layout (2x2 mobile, 4-across desktop)

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <MetricCard label="This Week" value={String(stats.weeklyLessonCount)} unit="lessons" icon={<Calendar />} />
  <MetricCard label="Unpaid" value={formatCurrency(stats.unpaidTotal)} unit={`${stats.unpaidCount} invoices`} icon={<FileText />} />
  <MetricCard label="This Month" value={formatCurrency(stats.monthlyRevenue)} unit="received" icon={<DollarSign />} />
  <MetricCard label="This Year" value={formatCurrency(stats.yearlyRevenue)} unit="received" icon={<TrendingUp />} />
</div>
```

### Revenue Page Year Navigation (Claude's Discretion Recommendation)

Use simple `<` / `>` year navigation with a displayed year label. Default to current year. Implement as `searchParams.year` read by the Server Component and passed to queries — no client state needed.

```tsx
// Recommended: year selector in revenue page header
<div className="flex items-center gap-2">
  <Link href={`/revenue?year=${year - 1}`} className="..."><ChevronLeft /></Link>
  <span className="font-semibold">{year}</span>
  {year < currentYear && <Link href={`/revenue?year=${year + 1}`} className="..."><ChevronRight /></Link>}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| SQL GROUP BY via RPC | App-layer aggregation from raw rows | Avoids new migrations; acceptable for small datasets (1 tutor, <1000 lessons) |
| Fixed-date "today" via `new Date()` | Timezone-aware day boundaries via `date-fns-tz` | Correct across all Australian timezones |
| Client-side fetching for dashboards | Server Component parallel fetch | Faster initial load; no loading spinners for static data |

---

## Open Questions

1. **Weekly lesson count definition (DASH-02)**
   - What we know: "weekly lesson count" is in the metric cards
   - What's unclear: Does it mean lessons this calendar week (Mon–Sun) or the rolling past 7 days? Or scheduled lessons in the coming week?
   - Recommendation: Use current calendar week (Mon–Sun, matching the schedule page's `startOfWeek` convention). Label the card "This week" to set expectation.

2. **Revenue year boundary for monthly table**
   - What we know: D-09 says "current financial context" with navigation at Claude's discretion
   - What's unclear: Australian financial year (July–June) vs calendar year?
   - Recommendation: Default to calendar year (simpler, no edge cases). Australian financial year support can be added in v2. Label clearly: "Calendar Year 2026".

3. **"Amount invoiced" in monthly table — draft vs sent**
   - What we know: D-08 lists "amount invoiced" as a column
   - What's unclear: Should draft invoices count toward "invoiced" in the monthly table?
   - Recommendation: Include only `status IN ('sent', 'paid')` for "invoiced" — drafts haven't been sent to the client yet, so they don't represent billed work.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/queries/lessons.ts`, `src/lib/queries/invoices.ts` — existing query patterns confirmed
- Codebase inspection: `supabase/migrations/001_initial_schema.sql` — confirmed column names, types, and constraints
- Codebase inspection: `src/lib/utils/dates.ts` — confirmed `toZonedTime`/`fromZonedTime` API in use
- Codebase inspection: `src/components/nav/BottomNav.tsx`, `Sidebar.tsx` — confirmed `/revenue` route and nav items already wired
- Codebase inspection: `src/app/(app)/schedule/page.tsx` — confirmed `searchParams` pattern for deep-link extension
- Codebase inspection: `src/app/(app)/layout.tsx` — confirmed `pb-16 md:pb-0` bottom spacing for sticky bar planning

### Secondary (MEDIUM confidence)
- date-fns-tz documentation patterns: `fromZonedTime` is the correct function for UTC conversion (verified against codebase usage and date-fns-tz v3 naming)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, confirmed in package.json via codebase
- Architecture: HIGH — patterns directly derived from existing codebase conventions
- Query design: HIGH — schema confirmed from migration files
- Deep-link pattern: MEDIUM — SchedulePage internals read, but `useEffect` + searchParams interaction needs verification at implementation time
- Sticky bar layout: MEDIUM — layout constraints inferred from existing layout.tsx, may need adjustment

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable stack, no fast-moving dependencies added)
