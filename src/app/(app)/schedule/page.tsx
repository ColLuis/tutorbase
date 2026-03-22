import { Suspense } from 'react'
import { verifySession } from '@/lib/dal'
import { getLessonsForWeek } from '@/lib/queries/lessons'
import { getTutorProfile } from '@/lib/queries/tutors'
import { getActiveStudentsForPicker } from '@/lib/queries/students'
import SchedulePage from '@/components/schedule/SchedulePage'
import { startOfWeek, parseISO, isValid } from 'date-fns'

interface ScheduleRouteProps {
  searchParams: Promise<{ week?: string; view?: string }>
}

async function ScheduleContent({ searchParams }: ScheduleRouteProps) {
  const { tutorId } = await verifySession()
  const params = await searchParams

  // Parse week from URL or default to current week (Monday-first per Pitfall 3)
  let weekStart: Date
  if (params.week) {
    const parsed = parseISO(params.week)
    weekStart = isValid(parsed)
      ? startOfWeek(parsed, { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  } else {
    weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  }

  const [lessons, tutor, students] = await Promise.all([
    getLessonsForWeek(tutorId, weekStart),
    getTutorProfile(tutorId),
    getActiveStudentsForPicker(tutorId),
  ])

  return (
    <SchedulePage
      initialLessons={lessons}
      initialWeekStart={weekStart.toISOString()}
      timezone={tutor.timezone ?? 'Australia/Sydney'}
      students={students}
    />
  )
}

export default async function ScheduleRoute(props: ScheduleRouteProps) {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Loading schedule...</div>}>
      <ScheduleContent {...props} />
    </Suspense>
  )
}
