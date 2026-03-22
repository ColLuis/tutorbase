'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTutorProfile } from '@/lib/actions/tutors'

const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Must be a valid email address'),
})

type FormValues = z.infer<typeof ProfileSchema>

interface ProfileFormProps {
  defaultValues: { name: string; email: string }
}

export default function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
  })

  async function onSubmit(values: FormValues) {
    setServerMessage(null)
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('email', values.email)

    const result = await updateTutorProfile(formData)
    if ('error' in result) {
      setServerMessage({ type: 'error', text: result.error ?? 'An error occurred' })
    } else {
      setServerMessage({ type: 'success', text: 'Profile updated.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Your full name"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Server message */}
      {serverMessage && (
        <p
          className={
            serverMessage.type === 'success'
              ? 'text-sm text-green-600'
              : 'text-sm text-destructive'
          }
        >
          {serverMessage.text}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[44px]"
      >
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
