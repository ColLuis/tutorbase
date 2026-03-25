import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export type MonthlyRow = {
  month: string       // "YYYY-MM" format
  monthLabel: string  // "Jan", "Feb", etc.
  lessonsDelivered: number
  hoursTaught: number // decimal, e.g. 1.5
  amountInvoiced: number
  amountPaid: number
  outstanding: number
}

export type StudentRow = {
  name: string
  lessons: number
  invoiced: number
  paid: number
  outstanding: number
}

export async function getMonthlyRevenue(tutorId: string, year: number): Promise<MonthlyRow[]> {
  const supabase = await createClient()

  const [invoicesResult, lessonsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, issued_date, paid_date, total, status')
      .eq('tutor_id', tutorId)
      .gte('issued_date', `${year}-01-01`)
      .lte('issued_date', `${year}-12-31`),
    supabase
      .from('lessons')
      .select('id, scheduled_at, duration_minutes')
      .eq('tutor_id', tutorId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${year}-01-01T00:00:00Z`)
      .lte('scheduled_at', `${year}-12-31T23:59:59Z`),
  ])

  if (invoicesResult.error) throw invoicesResult.error
  if (lessonsResult.error) throw lessonsResult.error

  // Initialize Map with 12 month entries
  const monthMap = new Map<string, MonthlyRow>()
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${String(m).padStart(2, '0')}`
    const monthLabel = format(new Date(year, m - 1, 1), 'MMM')
    monthMap.set(monthKey, {
      month: monthKey,
      monthLabel,
      lessonsDelivered: 0,
      hoursTaught: 0,
      amountInvoiced: 0,
      amountPaid: 0,
      outstanding: 0,
    })
  }

  // Group lessons by month of scheduled_at
  for (const lesson of lessonsResult.data ?? []) {
    const monthKey = lesson.scheduled_at.slice(0, 7)
    const row = monthMap.get(monthKey)
    if (row) {
      row.lessonsDelivered += 1
      row.hoursTaught += (lesson.duration_minutes ?? 0) / 60
    }
  }

  // Group invoices: amountInvoiced by issued_date month, amountPaid by paid_date month
  for (const inv of invoicesResult.data ?? []) {
    if (!inv.issued_date) continue
    const issuedMonth = inv.issued_date.slice(0, 7)
    const issuedRow = monthMap.get(issuedMonth)

    if (issuedRow && (inv.status === 'sent' || inv.status === 'paid')) {
      issuedRow.amountInvoiced += Number(inv.total)
    }

    // Paid attribution: use paid_date month (may differ from issued_date month)
    if (inv.status === 'paid' && inv.paid_date) {
      const paidMonth = inv.paid_date.slice(0, 7)
      const paidRow = monthMap.get(paidMonth)
      if (paidRow) {
        paidRow.amountPaid += Number(inv.total)
      }
    }
  }

  // Compute outstanding per month
  for (const row of monthMap.values()) {
    row.outstanding = row.amountInvoiced - row.amountPaid
  }

  // Convert Map to sorted array (already in order 01-12)
  return Array.from(monthMap.values())
}

export async function getStudentRevenue(tutorId: string, year: number): Promise<StudentRow[]> {
  const supabase = await createClient()

  const [invoicesResult, lessonsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, total, status, student_id, students(name)')
      .eq('tutor_id', tutorId)
      .gte('issued_date', `${year}-01-01`)
      .lte('issued_date', `${year}-12-31`),
    supabase
      .from('lessons')
      .select('id, student_id')
      .eq('tutor_id', tutorId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${year}-01-01T00:00:00Z`)
      .lte('scheduled_at', `${year}-12-31T23:59:59Z`),
  ])

  if (invoicesResult.error) throw invoicesResult.error
  if (lessonsResult.error) throw lessonsResult.error

  // Build Map keyed by student_id
  const studentMap = new Map<string, StudentRow>()

  // Count completed lessons per student
  for (const lesson of lessonsResult.data ?? []) {
    if (!lesson.student_id) continue
    const existing = studentMap.get(lesson.student_id)
    if (existing) {
      existing.lessons += 1
    } else {
      studentMap.set(lesson.student_id, {
        name: '',
        lessons: 1,
        invoiced: 0,
        paid: 0,
        outstanding: 0,
      })
    }
  }

  // Accumulate invoice amounts per student
  for (const inv of invoicesResult.data ?? []) {
    if (!inv.student_id) continue
    const studentName = Array.isArray(inv.students)
      ? (inv.students[0]?.name ?? '')
      : (inv.students?.name ?? '')

    const existing = studentMap.get(inv.student_id)
    if (existing) {
      // Update name if not yet set
      if (!existing.name && studentName) {
        existing.name = studentName
      }
      if (inv.status === 'sent' || inv.status === 'paid') {
        existing.invoiced += Number(inv.total)
      }
      if (inv.status === 'paid') {
        existing.paid += Number(inv.total)
      }
    } else {
      studentMap.set(inv.student_id, {
        name: studentName,
        lessons: 0,
        invoiced: inv.status === 'sent' || inv.status === 'paid' ? Number(inv.total) : 0,
        paid: inv.status === 'paid' ? Number(inv.total) : 0,
        outstanding: 0,
      })
    }
  }

  // Compute outstanding and convert to array
  const rows: StudentRow[] = []
  for (const row of studentMap.values()) {
    row.outstanding = row.invoiced - row.paid
    rows.push(row)
  }

  // Sort by invoiced descending (most revenue first)
  rows.sort((a, b) => b.invoiced - a.invoiced)

  return rows
}
