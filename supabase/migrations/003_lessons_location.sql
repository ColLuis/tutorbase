-- Add optional free-text location field to lessons
-- Tutors often teach at different locations (student's home, library, online)
ALTER TABLE lessons ADD COLUMN location TEXT;
