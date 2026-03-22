'use client'

import { formatTime } from '@/lib/utils/dates'

interface LessonBlockProps {
  lesson: {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
    students: { name: string } | null
  }
  timezone: string
  onClick: (lessonId: string) => void
  compact?: boolean
}

const statusStyles: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  no_show: 'bg-amber-100 text-amber-800 border-amber-200',
}

export default function LessonBlock({ lesson, timezone, onClick, compact = false }: LessonBlockProps) {
  const studentName = lesson.students?.name ?? 'Unknown'
  const timeStr = formatTime(lesson.scheduled_at, timezone)
  const colorClass = statusStyles[lesson.status] ?? statusStyles.scheduled

  return (
    <button
      onClick={() => onClick(lesson.id)}
      className={`
        w-full text-left rounded border px-2 py-1 min-h-[44px]
        flex flex-col justify-center transition-opacity hover:opacity-80
        ${colorClass}
        ${compact ? 'text-xs' : 'text-sm'}
      `}
    >
      <span className={`font-medium leading-tight ${compact ? 'truncate block' : ''}`}>
        {studentName}
      </span>
      <span className="opacity-75 text-xs leading-tight">{timeStr}</span>
    </button>
  )
}
