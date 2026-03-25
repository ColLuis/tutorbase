# Phase 4: Dashboard and Revenue - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A tutor can open the app and immediately see their day and financial position, and drill into monthly and per-student revenue. This phase adds the dashboard (home page) and a dedicated revenue reporting page. No new data entry — these are read-only views over existing lessons, invoices, and payment data.

</domain>

<decisions>
## Implementation Decisions

### Dashboard information hierarchy
- **D-01:** Today's lessons section at top of page — "what's happening now" takes priority over metrics
- **D-02:** Metric cards below today's lessons — 2x2 grid on mobile, 4-across on desktop (weekly lesson count, unpaid invoices count+total, monthly revenue, yearly revenue)
- **D-03:** Quick action buttons (Add Lesson, Create Invoice, Add Student) sticky at bottom of dashboard — always visible and thumb-friendly on mobile
- **D-04:** When no lessons today, show all lessons for the next day that has lessons — header changes to "Next up: [Day]" so the dashboard is always useful

### Today's lessons display
- **D-05:** Minimal per-lesson info: student name + time only (e.g., "Sarah — 3:30 PM") — dashboard is a glanceable summary
- **D-06:** View-only — no status actions on the dashboard; tapping a lesson navigates to the schedule page and auto-opens that lesson's detail panel
- **D-07:** Lessons shown in chronological order by time

### Revenue monthly breakdown
- **D-08:** Detailed columns: month, lessons delivered, hours taught, amount invoiced, amount paid, outstanding
- **D-09:** Shows data for the current financial context (time navigation at Claude's discretion)

### Revenue per-student breakdown
- **D-10:** Columns: student name, total lessons, total invoiced, total paid, outstanding
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements DASH-01 through DASH-03 and REV-01 through REV-02 define acceptance criteria

### Project constraints
- `.planning/PROJECT.md` — Mobile-first (44px tap targets, WCAG AA), tech stack, Australian business context (AUD currency)

### Prior phase patterns
- `.planning/phases/03-invoicing-and-payments/03-CONTEXT.md` — Invoice data model decisions, payment recording patterns, established UI conventions
- `.planning/phases/02-students-and-scheduling/02-CONTEXT.md` — Lesson status patterns, schedule page navigation, drawer/sheet conventions

</canonical_refs>

<specifics>
## Specific Ideas

- Tapping a dashboard lesson deep-links to the schedule page with that lesson's detail panel open — not just the day view
- "Next up" fallback when today is empty shows all lessons for the next teaching day, not just the next single lesson
- Revenue per-student table is purely analytical — a reference table the tutor glances at, not a navigation hub

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — Card, CardHeader, CardTitle, CardContent for metric cards and section containers
- `src/components/ui/badge.tsx` — Status badges (scheduled, completed, cancelled, no_show) for lesson display
- `src/components/ui/button.tsx` — Quick action buttons with `render={<Link>}` for navigation
- `src/lib/utils/currency.ts` — `formatCurrency()` for all revenue and invoice amounts
- `src/lib/utils/dates.ts` — `formatLessonDate()`, `formatShortDate()`, `formatTime()` for lesson display with timezone
- `src/lib/queries/lessons.ts` — `getLessonsForWeek()` pattern to extend for today/next-day queries
- `src/lib/queries/invoices.ts` — `getInvoices()` with status filtering, extendable for unpaid totals and revenue aggregation
- `src/lib/dal.ts` — `verifySession()` for all server components and actions

### Established Patterns
- Server Components for data fetching, client components for interactivity
- Page layout: `p-4 md:p-6 max-w-2xl mx-auto` with `h1 text-2xl font-bold` header
- All timestamps TIMESTAMPTZ — display using `formatTime(date, tutor.timezone)`
- Responsive grid: `hidden sm:grid` for desktop table headers, stacked cards on mobile

### Integration Points
- `src/app/(app)/page.tsx` — Current home page placeholder, becomes the dashboard
- `src/app/(app)/revenue/page.tsx` — New page (route already in nav)
- `src/components/nav/Sidebar.tsx` and `BottomNav.tsx` — Home and Revenue nav items already wired
- Schedule page deep-linking — needs to accept lesson ID param to auto-open detail panel
- Invoice and lesson queries — extend for aggregation (counts, sums, grouping)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-dashboard-and-revenue*
*Context gathered: 2026-03-24*
