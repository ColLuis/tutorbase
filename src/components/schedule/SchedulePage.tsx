'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseISO, isValid, addWeeks, subWeeks, startOfWeek, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import WeekNav from './WeekNav'
import WeekCalendar from './WeekCalendar'
import LessonList from './LessonList'
import LessonDetailPanel from './LessonDetailPanel'
import LessonDrawer from './LessonDrawer'

interface Lesson {
  id: string
  student_id: string
  scheduled_at: string
  duration_minutes: number
  rate: number
  status: string
  recurring_series_id: string | null
  notes: string | null
  location: string | null
  students: { name: string } | null
}

interface Student {
  id: string
  name: string
  default_rate: number | null
  default_duration_minutes: number | null
}

interface SchedulePageProps {
  initialLessons: Lesson[]
  initialWeekStart: string
  timezone: string
  students: Student[]
}

function buildEditLessonData(
  lessons: Lesson[],
  lessonId: string,
  timezone: string
): {
  id: string
  studentId: string
  date: string
  time: string
  durationMinutes: number
  rate: number
  notes: string | null
  location: string | null
} | null {
  const lesson = lessons.find(l => l.id === lessonId)
  if (!lesson) return null

  const zoned = toZonedTime(new Date(lesson.scheduled_at), timezone)
  const date = format(zoned, 'yyyy-MM-dd')
  const time = format(zoned, 'HH:mm')

  return {
    id: lesson.id,
    studentId: lesson.student_id,
    date,
    time,
    durationMinutes: lesson.duration_minutes,
    rate: lesson.rate,
    notes: lesson.notes,
    location: lesson.location,
  }
}

export default function SchedulePage({ initialLessons, initialWeekStart, timezone, students }: SchedulePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse week from URL or use initial
  const weekParam = searchParams.get('week')
  const parsedWeek = weekParam ? parseISO(weekParam) : null
  const weekStart = (parsedWeek && isValid(parsedWeek))
    ? startOfWeek(parsedWeek, { weekStartsOn: 1 })
    : startOfWeek(parseISO(initialWeekStart), { weekStartsOn: 1 })

  // View from URL param
  const viewParam = searchParams.get('view') as 'calendar' | 'list' | null
  const view = viewParam === 'list' ? 'list' : 'calendar'

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  // Deep-link support: auto-open lesson detail panel when navigated from dashboard
  const lessonParam = searchParams.get('lesson')
  useEffect(() => {
    if (lessonParam && initialLessons.some(l => l.id === lessonParam)) {
      setSelectedLessonId(lessonParam)
    }
  }, [lessonParam, initialLessons])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editLessonId, setEditLessonId] = useState<string | null>(null)

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev'
      ? subWeeks(weekStart, 1)
      : addWeeks(weekStart, 1)
    const weekStr = format(newWeek, 'yyyy-MM-dd')
    router.push(`/schedule?week=${weekStr}&view=${view}`)
  }, [weekStart, view, router])

  const setView = useCallback((newView: 'calendar' | 'list') => {
    const weekStr = format(weekStart, 'yyyy-MM-dd')
    router.push(`/schedule?week=${weekStr}&view=${newView}`)
  }, [weekStart, router])

  const handleOpenDrawer = () => {
    setEditLessonId(null)
    setDrawerOpen(true)
  }

  const handleDrawerChange = (open: boolean) => {
    setDrawerOpen(open)
    if (!open) setEditLessonId(null)
  }

  const selectedLesson = selectedLessonId
    ? initialLessons.find(l => l.id === selectedLessonId) ?? null
    : null

  const editLessonData = editLessonId
    ? buildEditLessonData(initialLessons, editLessonId, timezone)
    : null

  return (
    <div className="min-h-screen">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b">
        <WeekNav
          weekStart={weekStart}
          onPrev={() => navigateWeek('prev')}
          onNext={() => navigateWeek('next')}
        />
        <div className="flex gap-2 items-center">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
            className="min-h-[36px]"
          >
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
            className="min-h-[36px]"
          >
            List
          </Button>
          <Button
            onClick={handleOpenDrawer}
            size="sm"
            className="min-h-[36px]"
          >
            + Lesson
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <WeekCalendar
          lessons={initialLessons}
          timezone={timezone}
          weekStart={weekStart}
          onLessonClick={setSelectedLessonId}
        />
      ) : (
        <LessonList
          lessons={initialLessons}
          timezone={timezone}
          onLessonClick={setSelectedLessonId}
        />
      )}

      {/* Lesson detail panel */}
      {selectedLesson && (
        <LessonDetailPanel
          lesson={selectedLesson}
          timezone={timezone}
          onClose={() => setSelectedLessonId(null)}
          onEdit={(id) => {
            setEditLessonId(id)
            setDrawerOpen(true)
            setSelectedLessonId(null)
          }}
        />
      )}

      {/* Lesson create/edit drawer */}
      <LessonDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerChange}
        students={students}
        timezone={timezone}
        editLesson={editLessonData}
      />
    </div>
  )
}
