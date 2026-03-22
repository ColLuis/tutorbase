# Phase 2: Students and Scheduling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 02-students-and-scheduling
**Areas discussed:** Lesson creation flow, Schedule views, Quick status updates

---

## Lesson creation flow

### Student picker

| Option | Description | Selected |
|--------|-------------|----------|
| Searchable dropdown | Type to filter student names in a combobox — fast for 5-50 students | ✓ |
| Student list then schedule | Pick student first from list page, then tap 'Add Lesson' | |
| Recent students + search | Show last 3-5 students at top, with search below | |

**User's choice:** Searchable dropdown (Recommended)

### Recurring lessons

| Option | Description | Selected |
|--------|-------------|----------|
| "Repeat weekly for N weeks" toggle | Simple toggle on the lesson form, all lessons pre-generated | ✓ |
| Separate recurring setup page | Dedicated page with day picker, time, and end date | |
| Duplicate lesson action | Create one, then 'Duplicate to next N weeks' | |

**User's choice:** "Repeat weekly for N weeks" toggle (Recommended)

### Date and time input

| Option | Description | Selected |
|--------|-------------|----------|
| Calendar picker + time dropdown | Tap date, pick from 30-min slots | |
| Calendar picker + free text time | Tap date, type time freely (allows 3:45, 2:15) | ✓ |
| Tap a slot on the schedule | Tap empty slot to create — date+time set by position | |

**User's choice:** Calendar picker + free text time

### Form presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom drawer | Slides up on mobile, side drawer on desktop — stays in context | ✓ |
| Full page | Navigates to /lessons/new — more room for fields | |
| Modal dialog | Centered overlay — can feel cramped on mobile | |

**User's choice:** Bottom drawer (Recommended)

---

## Schedule views

### Weekly calendar time range

| Option | Description | Selected |
|--------|-------------|----------|
| Tutor hours only (8am-8pm) | Fixed range, less scrolling | |
| Auto-fit to lessons | 1 hour before earliest to 1 hour after latest | ✓ |
| Full day (6am-10pm) | Wide range, lots of empty space | |

**User's choice:** Auto-fit to lessons

### Mobile calendar

| Option | Description | Selected |
|--------|-------------|----------|
| Day view with swipe | One day at a time, swipe to change | |
| Compressed week grid | All 7 days with minimal info (colored blocks), tap to expand | ✓ |
| List view only on mobile | Skip calendar, show chronological list | |

**User's choice:** Compressed week grid

### Lesson block info

| Option | Description | Selected |
|--------|-------------|----------|
| Student name + time | Minimal, tap for details, color-coded by status | ✓ |
| Student name + time + subject | More context at a glance | |
| Student name + time + rate | Shows money aspect | |

**User's choice:** Student name + time (Recommended)

### View toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle button on same page | Calendar/List toggle at top, instant switch, same URL | ✓ |
| Tabs | Two tabs: 'Calendar' and 'List' | |
| Separate nav items | Schedule and Agenda as two sidebar entries | |

**User's choice:** Toggle button on same page (Recommended)

---

## Quick status updates

### Status change method

| Option | Description | Selected |
|--------|-------------|----------|
| Tap lesson → action buttons | Tap to expand, then tap Complete/Cancel/No-show | ✓ |
| Swipe actions | Swipe right = complete, left = cancel, long press = no-show | |
| Three-dot menu | Tap ⋮, pick status from dropdown | |

**User's choice:** Tap lesson → action buttons (Recommended)

### Confirmation behavior

| Option | Description | Selected |
|--------|-------------|----------|
| No confirm for complete, confirm cancel/no-show | Complete is happy path, cancel/no-show are destructive | ✓ |
| No confirmation for any | One tap and done for all | |
| Confirm all status changes | Always 'Are you sure?' | |

**User's choice:** No confirmation for complete, confirm cancel/no-show (Recommended)

### Post-action feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification only | Brief 'Lesson marked complete' toast, non-disruptive | ✓ |
| Toast + visual update | Toast plus lesson block changes color/icon | |
| Prompt to add notes | After completing, ask about session notes | |

**User's choice:** Toast notification only (Recommended)

---

## Claude's Discretion

- Student list & forms (entire area deferred to Claude)
- Empty states for student list and empty schedule
- Color scheme for lesson statuses
- Week navigation UI details
- Toast component and positioning

## Deferred Ideas

None — discussion stayed within phase scope
