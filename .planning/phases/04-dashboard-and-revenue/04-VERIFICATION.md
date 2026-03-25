---
phase: 04-dashboard-and-revenue
verified: 2026-03-25T08:30:00Z
status: human_needed
score: 13/13 automated must-haves verified
re_verification: false
human_verification:
  - test: "Dashboard heading shows 'Today' or 'Next up: [Day Date]' based on lessons"
    expected: "Heading reads 'Today' when lessons exist for today; reads 'Next up: Wednesday 26 Mar' (example) when today is empty and future lessons exist"
    why_human: "Depends on live database data and current date — cannot assert which branch will fire without running app"
  - test: "Tapping a dashboard lesson navigates to /schedule with detail panel auto-opened"
    expected: "URL becomes /schedule?week=YYYY-MM-DD&lesson=<id> and the lesson detail panel opens without additional interaction"
    why_human: "Requires browser interaction to confirm URL params are parsed and detail panel responds; useEffect timing is not verifiable via static analysis"
  - test: "Metric cards show real database values (not zeros)"
    expected: "At least one of weekly lesson count, unpaid total, monthly/yearly revenue is non-zero when test data exists"
    why_human: "Values depend on seeded database state — requires live app check"
  - test: "Revenue tables scroll horizontally on mobile with sticky first column"
    expected: "On a ~375px viewport, the Month and Student columns stay fixed while Invoiced/Paid/Outstanding columns scroll right"
    why_human: "CSS sticky behaviour and overflow-x-auto require visual inspection on a real mobile viewport"
  - test: "Per-student table sort toggles ascending/descending on repeated header tap"
    expected: "First tap sets sort asc; second tap reverses to desc; chevron icon flips direction"
    why_human: "Requires browser interaction to exercise useState toggle in StudentBreakdown"
  - test: "Year navigation right chevron is hidden when viewing current year"
    expected: "On /revenue (no year param), the > button is absent; navigating to /revenue?year=2025 shows both < and > buttons"
    why_human: "Requires browser navigation to confirm conditional rendering at runtime"
---

# Phase 4: Dashboard and Revenue — Verification Report

**Phase Goal:** A tutor can open the app and immediately see their day and financial position, and drill into monthly and per-student revenue.
**Verified:** 2026-03-25T08:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Dashboard query returns today's lessons with student name, time, and status in chronological order | VERIFIED | `getDashboardLessons` queries `lessons` table with tutor-timezone day boundaries, orders by `scheduled_at`, returns `{ label, lessons }` with `students(name)` join |
| 2 | Dashboard query falls back to next teaching day when today has no lessons | VERIFIED | 30-day lookahead implemented; first upcoming lesson's day boundaries computed; label formatted as `'Next up: ' + formatTz(...)` |
| 3 | Dashboard stats return weekly lesson count, unpaid invoice count/total, monthly and yearly revenue | VERIFIED | `getDashboardStats` runs 4 parallel queries via `Promise.all`; returns `weeklyLessonCount`, `unpaidCount`, `unpaidTotal`, `monthlyRevenue`, `yearlyRevenue` |
| 4 | Revenue monthly breakdown returns lessons delivered, hours taught, amount invoiced, amount paid, and outstanding per month | VERIFIED | `getMonthlyRevenue` initialises 12-entry Map; groups lessons by `scheduled_at.slice(0,7)`; groups invoices by `issued_date` (invoiced) and `paid_date` (paid); computes outstanding |
| 5 | Revenue per-student breakdown returns total lessons, total invoiced, total paid, and outstanding per student | VERIFIED | `getStudentRevenue` builds student Map; counts completed lessons; accumulates sent/paid invoice totals; sorts by `invoiced` descending |
| 6 | Dashboard shows today's lessons at the top with student name and time per D-01, D-05 | VERIFIED | `TodayLessons.tsx` renders `{studentName} — {timeStr}` with `min-h-[44px]` rows; wired in `page.tsx` via `<TodayLessons lessons={...} timezone={tz} />` |
| 7 | Dashboard shows 'Next up: [Day]' header when today has no lessons per D-04 | VERIFIED | `page.tsx` uses `{dashboardLessons.label}` as h1 text — passes through whatever `getDashboardLessons` returns |
| 8 | Dashboard shows 2x2 metric grid on mobile, 4-across on desktop per D-02 | VERIFIED | `MetricCards.tsx` uses `grid grid-cols-2 md:grid-cols-4 gap-3` |
| 9 | Dashboard has quick action buttons for Add Lesson, Create Invoice, Add Student per D-03 | VERIFIED | `QuickActions.tsx` renders all three buttons with `h-11` height and `render={<Link>}` pattern |
| 10 | Tapping a lesson on the dashboard navigates to the schedule page and auto-opens the lesson detail panel per D-06 | HUMAN NEEDED | `buildLessonDeepLink` constructs `/schedule?week=...&lesson=...`; `SchedulePage.tsx` useEffect reads `searchParams.get('lesson')` and calls `setSelectedLessonId`; runtime browser interaction required to confirm panel opens |
| 11 | Revenue page shows monthly breakdown with all D-08 columns | VERIFIED | `MonthlyBreakdown.tsx` renders 6-column table: Month, Lessons, Hours, Invoiced, Paid, Outstanding; hours as `N.N h`; dashes for zero values |
| 12 | Revenue page shows per-student breakdown with sortable columns, default invoiced descending, non-interactive rows per D-10/D-11/D-12 | VERIFIED | `StudentBreakdown.tsx` has `useState<SortKey>('invoiced')` + `useState<'asc' | 'desc'>('desc')`; `SortHeader` with `aria-sort`; no `onClick` on `<tr>` |
| 13 | Revenue page has year navigation with < and > buttons, right hidden for current year per D-09 | VERIFIED | `revenue/page.tsx` renders `ChevronLeft` always; `ChevronRight` behind `{year < currentYear &&...}` guard; both use `render={<Link>}` with `aria-label` |

**Score:** 13/13 automated truths verified (6 items additionally require human browser confirmation)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/queries/dashboard.ts` | `getDashboardLessons()`, `getDashboardStats()` | VERIFIED | Both exports present; timezone-aware UTC boundaries via `fromZonedTime`; `Promise.all` for stats; 147 lines of substantive implementation |
| `src/lib/queries/revenue.ts` | `getMonthlyRevenue()`, `getStudentRevenue()`, `MonthlyRow`, `StudentRow` | VERIFIED | All 4 exports present; 12-month Map initialisation; draft-invoice exclusion; `paid_date` attribution; sorted by invoiced desc; 183 lines |
| `src/app/(app)/page.tsx` | Dashboard Server Component replacing placeholder | VERIFIED | Calls `verifySession`, `getTutorProfile`, `Promise.all([getDashboardLessons, getDashboardStats])`; `<Suspense>` with skeleton; `p-4 md:p-6 max-w-2xl mx-auto` wrapper |
| `src/components/dashboard/TodayLessons.tsx` | Lesson list display component | VERIFIED | `buildLessonDeepLink` function; `min-h-[44px]` rows; `formatTime` import; `Badge` for status; empty state handled |
| `src/components/dashboard/MetricCards.tsx` | 2x2/4-across metric card grid | VERIFIED | `grid grid-cols-2 md:grid-cols-4`; `text-xl font-bold` values; `formatCurrency` for monetary fields; all 4 cards present |
| `src/components/dashboard/QuickActions.tsx` | Quick action button bar | VERIFIED | `h-11` buttons; `render={<Link>}` pattern (no `asChild`); all 3 labels present |
| `src/components/revenue/MonthlyBreakdown.tsx` | Monthly revenue table | VERIFIED | No `'use client'`; `<caption className="sr-only">`; `sticky left-0 bg-background` first column; `.toFixed(1)` for hours; `formatCurrency` |
| `src/components/revenue/StudentBreakdown.tsx` | Per-student sortable table | VERIFIED | `'use client'` present; `useState<SortKey>('invoiced')`; `aria-sort` on `<th>`; `min-h-[44px]` on sort buttons; no `onClick` on `<tr>` |
| `src/app/(app)/revenue/page.tsx` | Revenue Server Component with year navigation | VERIFIED | `await searchParams` (Next.js 15 pattern); `Promise.all`; `verifySession`; year < currentYear guard; `aria-label` on both chevrons; no `'use client'` |
| `src/components/schedule/SchedulePage.tsx` | Deep-link support via useEffect | VERIFIED | `searchParams.get('lesson')`; `useEffect` with `lessonParam` dependency; `initialLessons.some(l => l.id === lessonParam)` guard before `setSelectedLessonId` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/app/(app)/page.tsx` | `src/lib/queries/dashboard.ts` | `getDashboardLessons + getDashboardStats` parallel fetch | WIRED | Line 4 imports both; line 14-17 `Promise.all` |
| `src/components/dashboard/TodayLessons.tsx` | `/schedule?week=...&lesson=...` | `buildLessonDeepLink` returning `/schedule?week=${weekParam}&lesson=${lessonId}` | WIRED | Lines 12-17 define function; line 34 calls it; line 39 used as `href` |
| `src/components/schedule/SchedulePage.tsx` | `selectedLessonId` state | `useEffect` reading `searchParams.get('lesson')` | WIRED | Line 92-97; `lessonParam` used in useEffect dependency and conditional |
| `src/app/(app)/revenue/page.tsx` | `src/lib/queries/revenue.ts` | `getMonthlyRevenue + getStudentRevenue` parallel fetch | WIRED | Line 5 imports both; line 21-24 `Promise.all` |
| `src/components/revenue/StudentBreakdown.tsx` | sort state | `useState` for `sortKey` and `sortDir` | WIRED | Lines 16-17 declare state; `sorted` derived array used in render at line 74 |
| `src/app/(app)/revenue/page.tsx` | `src/components/nav/BottomNav.tsx` + `Sidebar.tsx` | `/revenue` href in nav items | WIRED | BottomNav line 13 and Sidebar line 14 both include `/revenue` |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| DASH-01 | 04-01, 04-02, 04-04 | Dashboard shows today's lessons with student name, time, and status | SATISFIED | `TodayLessons.tsx` renders `{studentName} — {timeStr}` with Badge for status; wired to `getDashboardLessons` |
| DASH-02 | 04-01, 04-02, 04-04 | Dashboard shows weekly lesson count, unpaid invoice count/total, monthly and yearly revenue | SATISFIED | `MetricCards.tsx` displays all 4 stats from `getDashboardStats`; responsive 2x2/4-across grid |
| DASH-03 | 04-02, 04-04 | Dashboard has quick action buttons for Add Lesson, Create Invoice, Add Student | SATISFIED | `QuickActions.tsx` renders all 3 buttons with correct labels and navigation targets |
| REV-01 | 04-01, 04-03, 04-04 | User can view monthly revenue breakdown (lessons, invoiced, paid, outstanding) | SATISFIED | `MonthlyBreakdown.tsx` + `getMonthlyRevenue` deliver 12-month table with all required columns including hours |
| REV-02 | 04-01, 04-03, 04-04 | User can view per-student revenue breakdown | SATISFIED | `StudentBreakdown.tsx` + `getStudentRevenue` deliver sortable per-student table with all required columns |

No orphaned requirements. All 5 IDs declared across plans (04-01 through 04-04) map to implementations above. REQUIREMENTS.md traceability table marks all 5 as Phase 4 / Complete.

---

### Anti-Patterns Found

No blockers or warnings found. Scanned all 10 phase-04 files for:
- TODO/FIXME/PLACEHOLDER comments — none
- Empty return (`return null`, `return {}`, `return []`) as stubs — none (empty states are user-visible fallbacks with content, not stubs)
- Hardcoded static data in place of DB queries — none
- `asChild` usage (forbidden by Base UI constraint) — none

---

### Human Verification Required

The following items are correct in code but require a running browser to confirm end-to-end behaviour.

#### 1. Dashboard heading branch (Today vs Next up)

**Test:** Log in. If lessons exist for today, confirm h1 reads "Today". Then advance the system date or use a test account with no lessons today and confirm h1 reads "Next up: [Day Date]".
**Expected:** The correct branch fires based on whether the tutor has lessons scheduled today.
**Why human:** Branch selection depends on live database data and the current wall-clock time in the tutor's timezone.

#### 2. Deep-link lesson auto-open

**Test:** On the dashboard, tap any lesson row. Confirm the URL becomes `/schedule?week=YYYY-MM-DD&lesson=<id>` and the lesson detail panel slides open without any additional tap.
**Expected:** `useEffect` in `SchedulePage` fires, reads the `lesson` param, and calls `setSelectedLessonId` — causing `LessonDetailPanel` to open.
**Why human:** `useEffect` timing and panel open/close state require browser interaction; static analysis confirms the wiring is present but not the runtime behaviour.

#### 3. Metric cards show real data

**Test:** With a seeded database containing lessons and invoices, confirm at least one metric card shows a non-zero value.
**Expected:** "This week" count, "Unpaid" total, or revenue figures reflect actual DB data.
**Why human:** Values depend on seeded database state.

#### 4. Revenue table horizontal scroll with sticky first column

**Test:** Open `/revenue` on a ~375px mobile viewport (or DevTools responsive mode). Scroll the Monthly Breakdown table horizontally.
**Expected:** The "Month" column stays pinned on the left while "Lessons", "Hours", "Invoiced", "Paid", "Outstanding" scroll out of view.
**Why human:** `sticky left-0 bg-background` CSS behaviour requires visual inspection; static analysis confirms the classes are present.

#### 5. StudentBreakdown sort toggle

**Test:** On `/revenue`, tap the "Invoiced" column header twice. Then tap "Student".
**Expected:** First tap: sort direction reverses (asc); second tap: reverses back (desc); tapping "Student": changes sort key and resets to desc.
**Why human:** Requires browser interaction to exercise `useState` toggles in `StudentBreakdown`.

#### 6. Year navigation right chevron visibility

**Test:** Visit `/revenue` (no year param, defaults to current year 2026). Confirm only the left `<` chevron is visible. Then visit `/revenue?year=2025` and confirm both `<` and `>` chevrons appear.
**Expected:** `{year < currentYear && <ChevronRight />}` conditional renders correctly.
**Why human:** Conditional rendering based on `new Date().getFullYear()` requires a running Next.js server to evaluate.

---

### Gaps Summary

No gaps found. All 13 observable truths verified against the actual codebase. All 5 requirement IDs (DASH-01, DASH-02, DASH-03, REV-01, REV-02) have implementation evidence. All 10 planned artifacts exist, are substantive, and are wired. All 6 key links are confirmed connected.

The 6 human verification items above are confirmation checks for correct runtime behaviour — the underlying implementation is complete and correctly structured.

---

_Verified: 2026-03-25T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
