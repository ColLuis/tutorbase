'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addWeeks } from 'date-fns'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { combineDateTime } from '@/lib/utils/time'

const LessonSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().min(1, 'Time is required'),
  durationMinutes: z.coerce.number().int().min(15),
  rate: z.coerce.number().min(0),
  notes: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().min(1),
})

const RecurringLessonSchema = LessonSchema.extend({
  repeatWeeks: z.coerce.number().int().min(1).max(52),
})

const UpdateStatusSchema = z.object({
  lessonId: z.string().uuid(),
  status: z.enum(['completed', 'cancelled', 'no_show']),
})

export async function createLesson(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = LessonSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const scheduledAt = combineDateTime(parsed.data.date, parsed.data.time, parsed.data.timezone)
  if (!scheduledAt) return { error: 'Invalid time format. Use HH:MM or H:MM AM/PM' }

  const supabase = await createClient()
  const { error } = await supabase.from('lessons').insert({
    tutor_id: tutorId,
    student_id: parsed.data.studentId,
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: parsed.data.durationMinutes,
    rate: parsed.data.rate,
    notes: parsed.data.notes ?? null,
    location: parsed.data.location ?? null,
    status: 'scheduled',
  })
  if (error) return { error: error.message }
  revalidatePath('/schedule')
  return { success: true }
}

export async function createRecurringLessons(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = RecurringLessonSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const baseDate = combineDateTime(parsed.data.date, parsed.data.time, parsed.data.timezone)
  if (!baseDate) return { error: 'Invalid time format. Use HH:MM or H:MM AM/PM' }

  const seriesId = crypto.randomUUID()
  const rows = Array.from({ length: parsed.data.repeatWeeks }, (_, i) => ({
    tutor_id: tutorId,
    student_id: parsed.data.studentId,
    scheduled_at: addWeeks(baseDate, i).toISOString(),
    duration_minutes: parsed.data.durationMinutes,
    rate: parsed.data.rate,
    notes: parsed.data.notes ?? null,
    location: parsed.data.location ?? null,
    status: 'scheduled' as const,
    recurring_series_id: seriesId,
  }))

  const supabase = await createClient()
  const { error } = await supabase.from('lessons').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/schedule')
  return { success: true }
}

export async function updateLessonStatus(lessonId: string, status: 'completed' | 'cancelled' | 'no_show') {
  const { tutorId } = await verifySession()
  const parsed = UpdateStatusSchema.safeParse({ lessonId, status })
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('lessons')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.lessonId)
    .eq('tutor_id', tutorId)
  if (error) return { error: error.message }
  revalidatePath('/schedule')
  return { success: true }
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = LessonSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const scheduledAt = combineDateTime(parsed.data.date, parsed.data.time, parsed.data.timezone)
  if (!scheduledAt) return { error: 'Invalid time format' }

  const supabase = await createClient()
  // SCHED-06: "this lesson only" — update single row by id, never touch recurring_series_id
  const { error } = await supabase
    .from('lessons')
    .update({
      student_id: parsed.data.studentId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: parsed.data.durationMinutes,
      rate: parsed.data.rate,
      notes: parsed.data.notes ?? null,
      location: parsed.data.location ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .eq('tutor_id', tutorId)
  if (error) return { error: error.message }
  revalidatePath('/schedule')
  return { success: true }
}
