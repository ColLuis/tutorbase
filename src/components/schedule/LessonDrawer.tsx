'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { createLesson, createRecurringLessons, updateLesson } from '@/lib/actions/lessons'

const LessonFormSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  durationMinutes: z.string().min(1, 'Duration is required'),
  rate: z.string().min(1, 'Rate is required'),
  notes: z.string().optional(),
  location: z.string().optional(),
})

type LessonFormValues = z.infer<typeof LessonFormSchema>

interface Student {
  id: string
  name: string
  default_rate: number | null
  default_duration_minutes: number | null
}

interface EditLesson {
  id: string
  studentId: string
  date: string
  time: string
  durationMinutes: number
  rate: number
  notes: string | null
  location: string | null
}

interface LessonDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  timezone: string
  editLesson?: EditLesson | null
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '75', label: '75 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '2 hours' },
]

function LessonForm({
  students,
  timezone,
  editLesson,
  onSuccess,
}: {
  students: Student[]
  timezone: string
  editLesson?: EditLesson | null
  onSuccess: () => void
}) {
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(4)
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEdit = !!editLesson

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(LessonFormSchema),
    defaultValues: {
      studentId: editLesson?.studentId ?? '',
      date: editLesson?.date ?? format(new Date(), 'yyyy-MM-dd'),
      time: editLesson?.time ?? '',
      durationMinutes: editLesson ? String(editLesson.durationMinutes) : '',
      rate: editLesson ? String(editLesson.rate) : '',
      notes: editLesson?.notes ?? '',
      location: editLesson?.location ?? '',
    },
  })

  const selectedStudentId = form.watch('studentId')
  const selectedDate = form.watch('date')

  // Auto-fill rate and duration from student defaults (SCHED-07)
  useEffect(() => {
    if (!isEdit && selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId)
      if (student) {
        if (student.default_rate != null) {
          form.setValue('rate', String(student.default_rate))
        }
        if (student.default_duration_minutes != null) {
          form.setValue('durationMinutes', String(student.default_duration_minutes))
        }
      }
    }
  }, [selectedStudentId, students, isEdit, form])

  const selectedStudentName = students.find(s => s.id === selectedStudentId)?.name

  const onSubmit = async (values: LessonFormValues) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('studentId', values.studentId)
    formData.append('date', values.date)
    formData.append('time', values.time)
    formData.append('durationMinutes', values.durationMinutes)
    formData.append('rate', values.rate)
    formData.append('notes', values.notes ?? '')
    formData.append('location', values.location ?? '')
    formData.append('timezone', timezone)

    type ActionResult = { success: true } | { error: string }

    let result: ActionResult

    if (isEdit && editLesson) {
      result = await updateLesson(editLesson.id, formData) as ActionResult
    } else if (repeatEnabled) {
      formData.append('repeatWeeks', String(repeatWeeks))
      result = await createRecurringLessons(formData) as ActionResult
    } else {
      result = await createLesson(formData) as ActionResult
    }

    setIsSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    if (isEdit) {
      toast.success('Lesson updated')
    } else if (repeatEnabled) {
      toast.success(`${repeatWeeks} lessons scheduled`)
    } else {
      toast.success('Lesson scheduled')
    }

    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4" aria-busy={isSubmitting}>
      {/* Student picker (combobox — D-01) */}
      <div className="space-y-1">
        <Label>Student</Label>
        <Popover open={studentPickerOpen} onOpenChange={setStudentPickerOpen}>
          <PopoverTrigger
            className="w-full min-h-[44px] inline-flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent"
          >
            {selectedStudentName ?? 'Select student...'}
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[320px]" align="start">
            <Command>
              <CommandInput placeholder="Search students..." />
              <CommandEmpty>No student found.</CommandEmpty>
              <CommandGroup>
                {students.map(s => (
                  <CommandItem
                    key={s.id}
                    value={s.name}
                    onSelect={() => {
                      form.setValue('studentId', s.id)
                      setStudentPickerOpen(false)
                    }}
                  >
                    {s.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {form.formState.errors.studentId && (
          <p className="text-xs text-destructive">{form.formState.errors.studentId.message}</p>
        )}
      </div>

      {/* Date picker (D-03) */}
      <div className="space-y-1">
        <Label>Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className="w-full min-h-[44px] inline-flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent gap-2"
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'd MMM yyyy') : 'Pick a date'}
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(format(date, 'yyyy-MM-dd'))
                      setCalendarOpen(false)
                    }
                  }}
                  initialFocus
                />
              )}
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Time input — free text (D-03) */}
      <div className="space-y-1">
        <Label htmlFor="time">Time</Label>
        <Input
          id="time"
          placeholder="e.g. 3:45 or 14:00"
          className="min-h-[44px]"
          {...form.register('time')}
        />
        {form.formState.errors.time && (
          <p className="text-xs text-destructive">{form.formState.errors.time.message}</p>
        )}
      </div>

      {/* Duration select */}
      <div className="space-y-1">
        <Label>Duration</Label>
        <Controller
          control={form.control}
          name="durationMinutes"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.durationMinutes && (
          <p className="text-xs text-destructive">{form.formState.errors.durationMinutes.message}</p>
        )}
      </div>

      {/* Rate input */}
      <div className="space-y-1">
        <Label htmlFor="rate">Rate (AUD)</Label>
        <Input
          id="rate"
          type="number"
          step="0.01"
          placeholder="75.00"
          className="min-h-[44px]"
          {...form.register('rate')}
        />
        {form.formState.errors.rate && (
          <p className="text-xs text-destructive">{form.formState.errors.rate.message}</p>
        )}
      </div>

      {/* Repeat weekly toggle (D-02) — only show when creating */}
      {!isEdit && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="repeat"
              checked={repeatEnabled}
              onCheckedChange={setRepeatEnabled}
            />
            <Label htmlFor="repeat">Repeat weekly</Label>
          </div>
          {repeatEnabled && (
            <div className="space-y-1 ml-8">
              <Label htmlFor="repeatWeeks">For how many weeks?</Label>
              <Input
                id="repeatWeeks"
                type="number"
                min={1}
                max={52}
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                className="min-h-[44px] w-32"
              />
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div className="space-y-1">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          placeholder="e.g. Student's home, Library, Online"
          className="min-h-[44px]"
          {...form.register('location')}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes..."
          rows={3}
          {...form.register('notes')}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[44px]"
      >
        {isSubmitting
          ? 'Saving...'
          : isEdit
            ? 'Update Lesson'
            : repeatEnabled
              ? `Schedule ${repeatWeeks} lessons`
              : 'Schedule Lesson'}
      </Button>
    </form>
  )
}

export default function LessonDrawer({ open, onOpenChange, students, timezone, editLesson }: LessonDrawerProps) {
  const title = editLesson ? 'Edit Lesson' : 'New Lesson'
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const formContent = (
    <LessonForm
      students={students}
      timezone={timezone}
      editLesson={editLesson}
      onSuccess={handleSuccess}
    />
  )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  )
}
