-- supabase/migrations/002_students_subject_duration.sql
-- Phase 2: Add subject and default_duration_minutes to students table

ALTER TABLE students ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER;
