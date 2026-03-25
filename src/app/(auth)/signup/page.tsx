import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-background to-violet-50">
      <Card className="w-full max-w-sm shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
            <GraduationCap className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">TutorBase</CardTitle>
          <CardDescription>
            Create an account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
