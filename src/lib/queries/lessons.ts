import { createClient } from '@/lib/supabase/server'
import { endOfWeek } from 'date-fns'

export async function getLessonsForWeek(tutorId: string, weekStart: Date) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('id, student_id, scheduled_at, duration_minutes, rate, status, recurring_series_id, notes, location, students!lessons_student_id_fkey(name)')
    .eq('tutor_id', tutorId)
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', weekEnd.toISOString())
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}

export async function getLessonsForList(tutorId: string, weekStart: Date) {
  // Returns same data shape as getLessonsForWeek — caller groups by day
  return getLessonsForWeek(tutorId, weekStart)
}
