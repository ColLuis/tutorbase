import { createClient } from '@/lib/supabase/server'

export async function getUnInvoicedLessons(tutorId: string, studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, duration_minutes, rate, notes, location')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .is('invoice_id', null)
    .order('scheduled_at')
  if (error) throw error
  return data ?? []
}

export async function getInvoices(tutorId: string, status?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('invoices')
    .select('id, invoice_number, status, issued_date, due_date, paid_date, subtotal, total, notes, created_at, students(name)')
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })

  if (status === 'overdue') {
    const today = new Date().toISOString().split('T')[0]
    query = query.eq('status', 'sent').lt('due_date', today)
  } else if (status && status !== 'all') {
    query = query.eq('status', status as 'draft' | 'sent' | 'paid')
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getInvoice(tutorId: string, invoiceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issued_date, due_date, paid_date, subtotal, total, notes, created_at, students(name, parent_name), invoice_items(id, description, quantity, unit_price, amount, lesson_id), receipts(id, receipt_number, paid_at, amount_paid, payment_method)')
    .eq('tutor_id', tutorId)
    .eq('id', invoiceId)
    .single()
  if (error) throw error
  return data
}

export async function getTutorForInvoice(tutorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tutors')
    .select('name')
    .eq('id', tutorId)
    .single()
  if (error) throw error
  return data
}
