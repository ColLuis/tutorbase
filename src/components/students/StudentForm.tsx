'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createStudent, updateStudent } from '@/lib/actions/students'

// Keep string fields for form — server action handles coercion via zod
const StudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parent_name: z.string().optional(),
  parent_email: z.string().optional(),
  parent_phone: z.string().optional(),
  subject: z.string().optional(),
  default_rate: z.string().optional(),
  default_duration_minutes: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof StudentSchema>

export interface StudentDefaultValues {
  name?: string
  parent_name?: string
  parent_email?: string
  parent_phone?: string
  subject?: string
  default_rate?: number | null
  default_duration_minutes?: number | null
  notes?: string
}

interface StudentFormProps {
  mode: 'create' | 'edit'
  studentId?: string
  defaultValues?: StudentDefaultValues
}

export default function StudentForm({ mode, studentId, defaultValues }: StudentFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      parent_name: defaultValues?.parent_name ?? '',
      parent_email: defaultValues?.parent_email ?? '',
      parent_phone: defaultValues?.parent_phone ?? '',
      subject: defaultValues?.subject ?? '',
      default_rate: defaultValues?.default_rate != null ? String(defaultValues.default_rate) : '',
      default_duration_minutes:
        defaultValues?.default_duration_minutes != null
          ? String(defaultValues.default_duration_minutes)
          : '',
      notes: defaultValues?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value)
      }
    })

    let result
    if (mode === 'create') {
      result = await createStudent(formData)
    } else {
      if (!studentId) return
      result = await updateStudent(studentId, formData)
    }

    if ('error' in result) {
      setServerError(result.error ?? 'An error occurred')
    } else {
      router.push('/students')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Student Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g. Alex Smith"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Parent Name */}
      <div className="space-y-1.5">
        <Label htmlFor="parent_name">Parent / Guardian Name</Label>
        <Input
          id="parent_name"
          {...register('parent_name')}
          placeholder="e.g. Jane Smith"
        />
      </div>

      {/* Parent Email */}
      <div className="space-y-1.5">
        <Label htmlFor="parent_email">Parent Email</Label>
        <Input
          id="parent_email"
          type="email"
          {...register('parent_email')}
          placeholder="jane@example.com"
          aria-invalid={!!errors.parent_email}
        />
        {errors.parent_email && (
          <p className="text-sm text-destructive">{errors.parent_email.message}</p>
        )}
      </div>

      {/* Parent Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="parent_phone">Parent Phone</Label>
        <Input
          id="parent_phone"
          type="tel"
          {...register('parent_phone')}
          placeholder="e.g. 0412 345 678"
        />
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          {...register('subject')}
          placeholder="e.g. Mathematics, English"
        />
      </div>

      {/* Default Rate */}
      <div className="space-y-1.5">
        <Label htmlFor="default_rate">Default Rate (per hour)</Label>
        <Input
          id="default_rate"
          type="number"
          min={0}
          step={0.01}
          {...register('default_rate')}
          placeholder="75.00"
          aria-invalid={!!errors.default_rate}
        />
        {errors.default_rate && (
          <p className="text-sm text-destructive">{errors.default_rate.message}</p>
        )}
      </div>

      {/* Default Duration */}
      <div className="space-y-1.5">
        <Label htmlFor="default_duration_minutes">Default Session Duration</Label>
        <Controller
          name="default_duration_minutes"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger id="default_duration_minutes" className="w-full min-h-[44px]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="75">75 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.default_duration_minutes && (
          <p className="text-sm text-destructive">{errors.default_duration_minutes.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Any additional notes about this student..."
          rows={3}
        />
      </div>

      {/* Server Error */}
      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[44px]"
      >
        {isSubmitting
          ? mode === 'create' ? 'Adding...' : 'Saving...'
          : mode === 'create' ? 'Add Student' : 'Save Changes'}
      </Button>
    </form>
  )
}
