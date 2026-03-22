---
phase: quick
plan: 260322-unn
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/003_lessons_location.sql
  - src/types/database.types.ts
  - src/lib/actions/lessons.ts
  - src/lib/queries/lessons.ts
  - src/components/schedule/LessonDrawer.tsx
  - src/components/schedule/LessonDetailPanel.tsx
  - src/components/schedule/SchedulePage.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Tutor can enter a free-text location when creating or editing a lesson"
    - "Location is displayed in the lesson detail panel"
    - "Location persists across page refresh (stored in DB)"
    - "Location is optional — lessons without location still work"
  artifacts:
    - path: "supabase/migrations/003_lessons_location.sql"
      provides: "ALTER TABLE adding location column"
    - path: "src/types/database.types.ts"
      provides: "location field on lessons Row/Insert/Update types"
    - path: "src/components/schedule/LessonDrawer.tsx"
      provides: "Location input field in lesson form"
  key_links:
    - from: "src/components/schedule/LessonDrawer.tsx"
      to: "src/lib/actions/lessons.ts"
      via: "FormData with location field"
      pattern: "formData\\.append.*location"
    - from: "src/lib/actions/lessons.ts"
      to: "supabase lessons table"
      via: "insert/update with location field"
      pattern: "location:"
---

<objective>
Add an optional free-text "location" field to the lessons table and surface it throughout the lesson create/edit form and detail view.

Purpose: Tutors often teach at different locations (student's home, library, online) and need to record where each lesson takes place.
Output: A `location` column on the `lessons` table, a text input in the lesson form, and display in the lesson detail panel.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/types/database.types.ts
@src/lib/actions/lessons.ts
@src/lib/queries/lessons.ts
@src/components/schedule/LessonDrawer.tsx
@src/components/schedule/LessonDetailPanel.tsx
@src/components/schedule/SchedulePage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add location column to DB schema and TypeScript types</name>
  <files>supabase/migrations/003_lessons_location.sql, src/types/database.types.ts</files>
  <action>
1. Create `supabase/migrations/003_lessons_location.sql` with:
   ```sql
   ALTER TABLE lessons ADD COLUMN location TEXT;
   ```
   No NOT NULL constraint — location is optional. No default value needed (NULL is fine).

2. Update `src/types/database.types.ts` lessons types:
   - `Row`: add `location: string | null` (after `notes`)
   - `Insert`: add `location?: string | null` (after `notes`)
   - `Update`: add `location?: string | null` (after `notes`)

3. Update `src/lib/queries/lessons.ts` — add `location` to the `.select()` column list in `getLessonsForWeek` so the field is fetched. The select string should become:
   `'id, student_id, scheduled_at, duration_minutes, rate, status, recurring_series_id, notes, location, students(name)'`
  </action>
  <verify>TypeScript compilation passes: `npx tsc --noEmit`</verify>
  <done>Migration file exists, database.types.ts includes location on all three lesson type variants (Row/Insert/Update), query fetches location field.</done>
</task>

<task type="auto">
  <name>Task 2: Wire location through form, server actions, and detail view</name>
  <files>src/lib/actions/lessons.ts, src/components/schedule/LessonDrawer.tsx, src/components/schedule/LessonDetailPanel.tsx, src/components/schedule/SchedulePage.tsx</files>
  <action>
1. **Server actions** (`src/lib/actions/lessons.ts`):
   - Add `location: z.string().optional()` to `LessonSchema` (after `notes`).
   - In `createLesson`: include `location: parsed.data.location ?? null` in the insert object.
   - In `createRecurringLessons`: include `location: parsed.data.location ?? null` in each row of the rows array.
   - In `updateLesson`: include `location: parsed.data.location ?? null` in the update object.

2. **LessonDrawer form** (`src/components/schedule/LessonDrawer.tsx`):
   - Add `location: z.string().optional()` to `LessonFormSchema` (after `notes`).
   - Add `location` to the `EditLesson` interface: `location: string | null`.
   - Set defaultValues: `location: editLesson?.location ?? ''`.
   - Add a text input field for location BEFORE the Notes field. Use the same pattern as Time input:
     ```tsx
     {/* Location */}
     <div className="space-y-1">
       <Label htmlFor="location">Location (optional)</Label>
       <Input
         id="location"
         placeholder="e.g. Student's home, Library, Online"
         className="min-h-[44px]"
         {...form.register('location')}
       />
     </div>
     ```
   - In `onSubmit`, append location to FormData: `formData.append('location', values.location ?? '')`

3. **SchedulePage** (`src/components/schedule/SchedulePage.tsx`):
   - Add `location: string | null` to the `Lesson` interface.
   - Add `location: string | null` to the return type of `buildEditLessonData`.
   - In `buildEditLessonData`, add `location: lesson.location` to the returned object (after `notes`).

4. **LessonDetailPanel** (`src/components/schedule/LessonDetailPanel.tsx`):
   - Add `location: string | null` to the `lesson` prop type in `LessonDetailPanelProps`.
   - Display location in the info section (after the Status row, before the Recurring row), same pattern as other fields:
     ```tsx
     {lesson.location && (
       <div className="flex justify-between">
         <span className="text-muted-foreground">Location</span>
         <span className="font-medium">{lesson.location}</span>
       </div>
     )}
     ```
  </action>
  <verify>TypeScript compilation passes: `npx tsc --noEmit`</verify>
  <done>Location field appears in the lesson create/edit form. Location displays in the detail panel when set. Existing lessons without location render normally (no errors). All TypeScript types are consistent across the stack.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` completes successfully
3. Visual check: open the schedule page, click "+ Lesson", confirm Location input is visible between Rate and Notes
4. Visual check: create a lesson with a location, click on it, confirm location shows in the detail panel
</verification>

<success_criteria>
- Location field is optional text input in the lesson create/edit form
- Location displays in lesson detail panel when populated
- Location is omitted from detail panel when empty (no "Location: —" clutter)
- Existing lessons (with NULL location) render without errors
- TypeScript compiles cleanly
- SQL migration is idempotent-safe (ALTER TABLE ADD COLUMN)
</success_criteria>

<output>
After completion, create `.planning/quick/260322-unn-add-free-text-location-field-to-lessons/260322-unn-SUMMARY.md`
</output>
