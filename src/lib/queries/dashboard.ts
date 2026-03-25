import { createClient } from '@/lib/supabase/server'
import { getTutorProfile } from '@/lib/queries/tutors'
import {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns'
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz'

export type DashboardLesson = {
  id: string
  scheduled_at: string
  status: string
  students: { name: string } | null
}

export type DashboardLessonsResult = {
  label: string
  lessons: DashboardLesson[]
}

export type DashboardStats = {
  weeklyLessonCount: number
  unpaidCount: number
  unpaidTotal: number
  monthlyRevenue: number
  yearlyRevenue: number
}

export async function getDashboardLessons(tutorId: string): Promise<DashboardLessonsResult> {
  const supabase = await createClient()
  const tutor = await getTutorProfile(tutorId)
  const tz = tutor.timezone ?? 'Australia/Sydney'

  const nowInTz = toZonedTime(new Date(), tz)
  const dayStart = fromZonedTime(startOfDay(nowInTz), tz)
  const dayEnd = fromZonedTime(endOfDay(nowInTz), tz)

  const { data: todayData, error: todayError } = await supabase
    .from('lessons')
    .select('id, scheduled_at, status, students!lessons_student_id_fkey(name)')
    .eq('tutor_id', tutorId)
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString())
    .order('scheduled_at')

  if (todayError) throw todayError

  if (todayData && todayData.length > 0) {
    return { label: 'Today', lessons: todayData as DashboardLesson[] }
  }

  // Fallback: look ahead up to 30 days for the next teaching day
  const lookaheadEnd = fromZonedTime(endOfDay(addDays(nowInTz, 30)), tz)

  const { data: upcomingData, error: upcomingError } = await supabase
    .from('lessons')
    .select('id, scheduled_at, status, students!lessons_student_id_fkey(name)')
    .eq('tutor_id', tutorId)
    .gt('scheduled_at', dayEnd.toISOString())
    .lte('scheduled_at', lookaheadEnd.toISOString())
    .order('scheduled_at')

  if (upcomingError) throw upcomingError

  if (!upcomingData || upcomingData.length === 0) {
    return { label: 'Today', lessons: [] }
  }

  // Take the first lesson's date and get all lessons on that day
  const firstDate = new Date(upcomingData[0].scheduled_at)
  const firstDateInTz = toZonedTime(firstDate, tz)
  const nextDayStart = fromZonedTime(startOfDay(firstDateInTz), tz)
  const nextDayEnd = fromZonedTime(endOfDay(firstDateInTz), tz)

  const nextDayLessons = upcomingData.filter((lesson) => {
    const lessonAt = new Date(lesson.scheduled_at)
    return lessonAt >= nextDayStart && lessonAt <= nextDayEnd
  })

  const label = 'Next up: ' + formatTz(toZonedTime(firstDate, tz), 'EEEE d MMM', { timeZone: tz })

  return { label, lessons: nextDayLessons as DashboardLesson[] }
}

export async function getDashboardStats(tutorId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  const tutor = await getTutorProfile(tutorId)
  const tz = tutor.timezone ?? 'Australia/Sydney'

  const nowInTz = toZonedTime(new Date(), tz)
  const weekStart = fromZonedTime(startOfWeek(nowInTz, { weekStartsOn: 1 }), tz)
  const weekEnd = fromZonedTime(endOfWeek(nowInTz, { weekStartsOn: 1 }), tz)
  const monthStart = fromZonedTime(startOfMonth(nowInTz), tz)
  const monthEnd = fromZonedTime(endOfMonth(nowInTz), tz)
  const yearStart = fromZonedTime(startOfYear(nowInTz), tz)
  const yearEnd = fromZonedTime(endOfYear(nowInTz), tz)

  const [weekLessons, unpaidInvoices, monthPaid, yearPaid] = await Promise.all([
    supabase
      .from('lessons')
      .select('id')
      .eq('tutor_id', tutorId)
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', weekEnd.toISOString()),
    supabase
      .from('invoices')
      .select('id, total')
      .eq('tutor_id', tutorId)
      .in('status', ['draft', 'sent']),
    supabase
      .from('invoices')
      .select('total')
      .eq('tutor_id', tutorId)
      .eq('status', 'paid')
      .gte('paid_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('paid_date', format(monthEnd, 'yyyy-MM-dd')),
    supabase
      .from('invoices')
      .select('total')
      .eq('tutor_id', tutorId)
      .eq('status', 'paid')
      .gte('paid_date', format(yearStart, 'yyyy-MM-dd'))
      .lte('paid_date', format(yearEnd, 'yyyy-MM-dd')),
  ])

  if (weekLessons.error) throw weekLessons.error
  if (unpaidInvoices.error) throw unpaidInvoices.error
  if (monthPaid.error) throw monthPaid.error
  if (yearPaid.error) throw yearPaid.error

  return {
    weeklyLessonCount: weekLessons.data?.length ?? 0,
    unpaidCount: unpaidInvoices.data?.length ?? 0,
    unpaidTotal: unpaidInvoices.data?.reduce((sum, inv) => sum + Number(inv.total), 0) ?? 0,
    monthlyRevenue: monthPaid.data?.reduce((sum, inv) => sum + Number(inv.total), 0) ?? 0,
    yearlyRevenue: yearPaid.data?.reduce((sum, inv) => sum + Number(inv.total), 0) ?? 0,
  }
}
