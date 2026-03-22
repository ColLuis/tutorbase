'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'

const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
})

export async function updateTutorProfile(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase
    .from('tutors')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', tutorId)
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true }
}
