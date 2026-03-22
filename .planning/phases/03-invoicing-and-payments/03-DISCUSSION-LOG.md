# Phase 3: Invoicing and Payments - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 03-invoicing-and-payments
**Areas discussed:** Invoice creation flow, PDF invoice layout, Payment recording

---

## Invoice Creation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| From student page | Go to student's page, tap "Create Invoice" — auto-pulls un-invoiced completed lessons | ✓ |
| From invoices page | Tap "New Invoice" on invoices list, pick student | |
| Both entry points | Either path works | |

**User's choice:** From student page
**Notes:** Most natural for per-student billing

---

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox list | Show all un-invoiced lessons with checkboxes — tutor can deselect | ✓ |
| All or nothing | All un-invoiced lessons go on invoice automatically | |

**User's choice:** Checkbox list
**Notes:** Flexibility to split billing across invoices

---

| Option | Description | Selected |
|--------|-------------|----------|
| Preview with edit | Draft preview with dates, line items, total — adjust before saving | ✓ |
| Save immediately | Create draft instantly, edit later | |

**User's choice:** Preview with edit

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full page | Dedicated /invoices/new route | ✓ |
| Drawer/sheet | Bottom drawer / side sheet pattern | |

**User's choice:** Full page
**Notes:** More room for lesson list + preview

---

## PDF Invoice Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Name + bank only | Tutor name, bank details | |
| Full business header | Business name, ABN, phone, email, address | |
| Hardcoded for now | Hardcode specific details | |

**User's choice:** Other — "Don't need the bank details"
**Notes:** Just tutor name on header. No bank details, no ABN for v1.

---

| Option | Description | Selected |
|--------|-------------|----------|
| One row per lesson | Each lesson as its own line: date, duration, rate, amount | ✓ |
| Grouped summary | "4 x 60min lessons @ $75/hr = $300" | |

**User's choice:** One row per lesson
**Notes:** Parents can see exactly which sessions they're paying for

---

| Option | Description | Selected |
|--------|-------------|----------|
| Clean text only | Professional typography, no logo or colors | ✓ |
| Logo upload | Let tutor upload a logo | |
| Accent color | Subtle colored header bar | |

**User's choice:** Clean text only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Notes field only | Freeform notes area per-invoice | ✓ |
| Due date + notes | Due date prominently + notes | |
| Minimal — total only | Just total amount | |

**User's choice:** Notes field only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Parent name | "Bill to: [Parent Name]" — falls back to student name | ✓ |
| Student name | "Student: [Name]" | |
| Both | Student name + parent name | |

**User's choice:** Parent name

---

| Option | Description | Selected |
|--------|-------------|----------|
| Download button | "Download PDF" button on invoice detail | |
| Preview + download | In-browser PDF preview first, then download | ✓ |

**User's choice:** Preview + download
**Notes:** Tutor can verify before sending

---

## Payment Recording

| Option | Description | Selected |
|--------|-------------|----------|
| Button + date picker | "Mark as Paid" opens small form: date + method | ✓ |
| One-tap paid | Sets paid_date to today immediately | |
| Full payment form | Separate page with amount, partial payments | |

**User's choice:** Button + date picker

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent record | Receipt auto-created in DB, toast confirmation | ✓ |
| Prompt to download | Show prompt to download receipt PDF | |
| No receipt for v1 | Skip receipt generation | |

**User's choice:** Silent record

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple status line | "Paid on [date] via [method]" on invoice detail | ✓ |
| Payment section | Dedicated payment section with receipt link | |

**User's choice:** Simple status line

---

## Claude's Discretion

- Invoice list page layout, filtering, and empty state
- Delete draft confirmation pattern
- PDF typography and spacing
- "Send" action behavior (status change only)
- Navigation placement for Invoices
