'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'

const StudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parent_name: z.string().optional(),
  parent_email: z.string().email().optional().or(z.literal('')),
  parent_phone: z.string().optional(),
  subject: z.string().optional(),
  default_rate: z.coerce.number().min(0).optional(),
  default_duration_minutes: z.coerce.number().int().min(15).optional(),
  notes: z.string().optional(),
})

export async function createStudent(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = StudentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.from('students').insert({
    tutor_id: tutorId,
    ...parsed.data,
  })
  if (error) return { error: error.message }
  revalidatePath('/students')
  return { success: true }
}

export async function updateStudent(studentId: string, formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = StudentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .eq('tutor_id', tutorId)
  if (error) return { error: error.message }
  revalidatePath('/students')
  revalidatePath(`/students/${studentId}`)
  return { success: true }
}

export async function deactivateStudent(studentId: string) {
  const { tutorId } = await verifySession()
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .eq('tutor_id', tutorId)
  if (error) return { error: error.message }
  revalidatePath('/students')
  return { success: true }
}
