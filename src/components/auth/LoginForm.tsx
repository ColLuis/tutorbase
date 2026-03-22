'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LoginState = { error: string } | null

async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const result = await login(formData)
  if (result?.error) {
    return { error: result.error }
  }
  return null
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="jane@example.com"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
