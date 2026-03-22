import { createClient } from '@/lib/supabase/server'

export async function getStudents(tutorId: string, includeInactive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('students')
    .select('id, name, parent_name, parent_email, parent_phone, subject, default_rate, default_duration_minutes, is_active, notes')
    .eq('tutor_id', tutorId)
    .order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudent(tutorId: string, studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, parent_name, parent_email, parent_phone, subject, default_rate, default_duration_minutes, is_active, notes, created_at')
    .eq('tutor_id', tutorId)
    .eq('id', studentId)
    .single()
  if (error) throw error
  return data
}

// For lesson form student combobox — only active students
export async function getActiveStudentsForPicker(tutorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, default_rate, default_duration_minutes, subject')
    .eq('tutor_id', tutorId)
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}
