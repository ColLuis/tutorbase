'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'

interface WeekNavProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
}

export default function WeekNav({ weekStart, onPrev, onNext }: WeekNavProps) {
  const weekEnd = addDays(weekStart, 6)
  const startLabel = format(weekStart, 'd MMM')
  const endLabel = format(weekEnd, 'd MMM yyyy')
  const label = `${startLabel} – ${endLabel}`

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        aria-label="Previous week"
        className="min-h-[44px] min-w-[44px]"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[160px] text-center">{label}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        aria-label="Next week"
        className="min-h-[44px] min-w-[44px]"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
