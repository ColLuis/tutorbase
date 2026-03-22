import { createClient } from '@/lib/supabase/server'

export async function getTutorProfile(tutorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tutors')
    .select('id, name, email, business_name, abn, bsb, account_number, bank_name, invoice_prefix, timezone, currency')
    .eq('id', tutorId)
    .single()
  if (error) throw error
  return data
}
