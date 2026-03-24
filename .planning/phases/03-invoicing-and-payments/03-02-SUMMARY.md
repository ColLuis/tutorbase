---
phase: 03-invoicing-and-payments
plan: "02"
subsystem: pdf
tags: [react-pdf, pdf-generation, next.js, route-handler, ssr, dynamic-import]

# Dependency graph
requires:
  - phase: 03-01
    provides: getInvoice, getTutorForInvoice queries and InvoiceDetail type from invoices.ts
provides:
  - InvoicePDF @react-pdf/renderer Document component (InvoicePDF.tsx)
  - GET /api/invoices/[id]/pdf Route Handler returning application/pdf
  - InvoicePDFViewer client component with SSR-safe dynamic import and mobile fallback
affects:
  - 03-03-invoice-detail-page (will render InvoicePDFViewer)
  - 03-04-invoice-list (may link to PDF download)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderToBuffer with React.createElement for @react-pdf/renderer in Route Handlers (cast to any to bypass DocumentProps type mismatch)"
    - "dynamic import with ssr:false for @react-pdf/renderer PDFViewer to prevent window-is-not-defined crash"
    - "useMediaQuery('(min-width: 768px)') to branch between iframe preview and download link"
    - "Simple amount.toFixed(2) currency formatting in PDF components (Intl.NumberFormat not used in PDF layer)"

key-files:
  created:
    - src/components/invoices/pdf/InvoicePDF.tsx
    - src/components/invoices/pdf/InvoicePDFViewer.tsx
    - src/app/api/invoices/[id]/pdf/route.ts
  modified: []

key-decisions:
  - "Cast renderToBuffer argument to any — @react-pdf/renderer DocumentProps type does not match FunctionComponentElement; runtime works correctly"
  - "Cast Buffer to unknown as BodyInit — Node.js Buffer is not directly assignable to Web API BodyInit in TypeScript strict mode; runtime works correctly in Next.js Route Handlers"
  - "bill_to falls back from parent_name to student name as per D-08 spec"

patterns-established:
  - "PDF Route Handler pattern: verifySession -> getInvoice -> getTutorForInvoice -> build InvoicePDFData -> renderToBuffer -> Response with Content-Type: application/pdf"

requirements-completed: [INV-07]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 3 Plan 02: PDF Generation Summary

**@react-pdf/renderer Document component, authenticated PDF download Route Handler at /api/invoices/[id]/pdf, and SSR-safe in-browser preview with mobile download fallback**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-24T10:14:58Z
- **Completed:** 2026-03-24T10:18:23Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments
- InvoicePDF Document component with header (tutor name, invoice number, issued/due dates), bill-to section, line items table (description/qty/rate/amount), total row, and optional notes
- GET /api/invoices/[id]/pdf Route Handler with verifySession auth guard, fetches invoice + tutor name, serves PDF as attachment
- InvoicePDFViewer client component with dynamic import (ssr:false), desktop PDFViewer iframe, mobile download link fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: InvoicePDF document component and Route Handler** - `2e4b7ed` (feat)
2. **Task 2: In-browser PDF preview client component** - `13ebf6b` (feat)

## Files Created/Modified
- `src/components/invoices/pdf/InvoicePDF.tsx` - @react-pdf/renderer Document with InvoicePDFData interface and full invoice layout
- `src/app/api/invoices/[id]/pdf/route.ts` - Authenticated GET Route Handler serving PDF buffer as application/pdf
- `src/components/invoices/pdf/InvoicePDFViewer.tsx` - Client component with SSR-safe dynamic PDFViewer and mobile download fallback

## Decisions Made
- Cast `renderToBuffer` element argument to `any` — @react-pdf/renderer's TypeScript types expect `ReactElement<DocumentProps>` but `React.createElement(InvoicePDF, ...)` produces `FunctionComponentElement<InvoicePDFProps>`; the cast avoids the incompatibility and runtime behaviour is correct
- Cast `Buffer` return from `renderToBuffer` to `unknown as BodyInit` — Node.js `Buffer` is not directly assignable to Web API `BodyInit` in TypeScript strict mode; Next.js Route Handlers handle Buffer correctly at runtime
- `bill_to` uses `parent_name || name` fallback per D-08: prefer parent name, fall back to student name

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatches for renderToBuffer and Buffer in Route Handler**
- **Found during:** Task 1 (Route Handler creation)
- **Issue:** `issued_date`/`due_date` are `string | null` in DB types; `renderToBuffer` argument type mismatch with DocumentProps; `Buffer` not assignable to `BodyInit`
- **Fix:** Added `?? ''` fallbacks for nullable date fields; cast element to `any` for renderToBuffer; cast buffer to `unknown as BodyInit`
- **Files modified:** src/app/api/invoices/[id]/pdf/route.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 2e4b7ed (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — TypeScript type compatibility)
**Impact on plan:** Fix necessary for TypeScript to compile. Runtime behaviour identical to plan intent. No scope creep.

## Issues Encountered
None beyond the TypeScript type issues documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- InvoicePDF and InvoicePDFViewer are ready to embed in the invoice detail page (Plan 03)
- PDF download endpoint is live at /api/invoices/[id]/pdf once auth is in place
- No blockers

---
*Phase: 03-invoicing-and-payments*
*Completed: 2026-03-24*
