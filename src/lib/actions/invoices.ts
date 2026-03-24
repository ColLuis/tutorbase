'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { format } from 'date-fns'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'

const CreateInvoiceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  lessonIds: z.string().min(1, 'At least one lesson is required'),
  lessonOverrides: z.string().optional(),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued date must be YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent']),
})

const SendInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
})

const DeleteInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
})

const MarkInvoicePaidSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Paid date must be YYYY-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  paymentMethod: z.string().optional(),
})

export async function createInvoice(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = CreateInvoiceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { studentId, lessonIds, lessonOverrides: overridesJson, issuedDate, dueDate, notes, status } = parsed.data

  // Parse per-lesson overrides: { lessonId: { rate, duration } }
  let overrides: Record<string, { rate: number; duration: number }> = {}
  if (overridesJson) {
    try { overrides = JSON.parse(overridesJson) } catch { /* use DB values */ }
  }

  // Parse and validate lesson IDs
  const lessonIdList = lessonIds.split(',').map(id => id.trim()).filter(Boolean)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (lessonIdList.length === 0) return { error: 'At least one lesson is required' }
  if (!lessonIdList.every(id => uuidRegex.test(id))) return { error: 'One or more lesson IDs are invalid' }

  const supabase = await createClient()

  // Fetch lessons to calculate amounts
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, scheduled_at, duration_minutes, rate')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .in('id', lessonIdList)

  if (lessonsError) return { error: lessonsError.message }
  if (!lessons || lessons.length === 0) return { error: 'No matching lessons found' }

  // Generate next invoice number from existing count
  const { count: invoiceCount, error: countError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', tutorId)
  if (countError) return { error: countError.message }
  const invoiceNumber = `INV-${String((invoiceCount ?? 0) + 1).padStart(4, '0')}`

  // Calculate subtotal using overrides if provided
  const lessonAmounts = lessons.map(lesson => {
    const o = overrides[lesson.id]
    const duration = o?.duration ?? lesson.duration_minutes
    const rate = o?.rate ?? Number(lesson.rate)
    return { ...lesson, duration_used: duration, rate_used: rate, amount: (duration / 60) * rate }
  })
  const subtotal = lessonAmounts.reduce((sum, l) => sum + l.amount, 0)
  const total = subtotal // No tax in v1

  // Insert invoice
  const { data: newInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tutor_id: tutorId,
      student_id: studentId,
      invoice_number: invoiceNumber,
      status,
      issued_date: issuedDate,
      due_date: dueDate,
      subtotal,
      total,
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (invoiceError) return { error: invoiceError.message }

  // Insert invoice_items — one per lesson (using overridden values)
  const invoiceItems = lessonAmounts.map(lesson => ({
    invoice_id: newInvoice.id,
    tutor_id: tutorId,
    description: `${format(new Date(lesson.scheduled_at), 'dd MMM yyyy')} -- ${lesson.duration_used} min lesson`,
    quantity: 1,
    unit_price: lesson.rate_used,
    amount: lesson.amount,
    lesson_id: lesson.id,
  }))

  const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
  if (itemsError) return { error: itemsError.message }

  // Update lessons to link to this invoice
  const { error: updateError } = await supabase
    .from('lessons')
    .update({ invoice_id: newInvoice.id, updated_at: new Date().toISOString() })
    .in('id', lessonIdList)
    .eq('tutor_id', tutorId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/invoices')
  revalidatePath('/students/' + studentId)

  return { success: true, invoiceId: newInvoice.id }
}

const UpdateInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued date must be YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  notes: z.string().optional(),
  items: z.string().min(1, 'Items JSON is required'),
})

export async function updateInvoice(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = UpdateInvoiceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { invoiceId, issuedDate, dueDate, notes, items: itemsJson } = parsed.data

  let items: { id: string; description: string; quantity: number; unit_price: number; amount: number }[]
  try { items = JSON.parse(itemsJson) } catch { return { error: 'Invalid items data' } }

  if (items.length === 0) return { error: 'At least one line item is required' }

  const supabase = await createClient()

  // Verify ownership
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice not found' }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

  // Update invoice header
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      issued_date: issuedDate,
      due_date: dueDate,
      subtotal,
      total: subtotal,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)

  if (updateError) return { error: updateError.message }

  // Update each line item
  for (const item of items) {
    const { error } = await supabase
      .from('invoice_items')
      .update({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      })
      .eq('id', item.id)
      .eq('invoice_id', invoiceId)

    if (error) return { error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/invoices/' + invoiceId)

  return { success: true }
}

export async function sendInvoice(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = SendInvoiceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { invoiceId } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidatePath('/invoices')
  revalidatePath('/invoices/' + invoiceId)

  return { success: true }
}

export async function deleteInvoice(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = DeleteInvoiceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { invoiceId } = parsed.data
  const supabase = await createClient()

  // Only draft invoices can be deleted
  // ON DELETE CASCADE on invoice_items handles item cleanup
  // ON DELETE SET NULL on lessons.invoice_id handles lesson unlinking
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidatePath('/invoices')

  return { success: true }
}

export async function markInvoicePaid(formData: FormData) {
  const { tutorId } = await verifySession()
  const parsed = MarkInvoicePaidSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { invoiceId, paidDate, paymentMethod } = parsed.data
  const supabase = await createClient()

  // Fetch invoice total for receipt amount_paid
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)
    .single()

  if (fetchError) return { error: fetchError.message }

  // Update invoice to paid
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_date: paidDate, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('tutor_id', tutorId)

  if (updateError) return { error: updateError.message }

  // Generate next receipt number from existing count
  const { count: receiptCount, error: rcountError } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', tutorId)
  if (rcountError) return { error: rcountError.message }
  const receiptNumber = `REC-${String((receiptCount ?? 0) + 1).padStart(4, '0')}`

  // Insert receipt record
  const { error: receiptError } = await supabase.from('receipts').insert({
    tutor_id: tutorId,
    invoice_id: invoiceId,
    receipt_number: receiptNumber,
    paid_at: new Date(paidDate).toISOString(),
    amount_paid: Number(invoice.total),
    payment_method: paymentMethod ?? null,
  })

  if (receiptError) return { error: receiptError.message }

  revalidatePath('/invoices')
  revalidatePath('/invoices/' + invoiceId)

  return { success: true }
}
