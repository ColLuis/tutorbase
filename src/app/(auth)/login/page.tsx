import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-background to-violet-50">
      <Card className="w-full max-w-sm shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
            <GraduationCap className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">TutorBase</CardTitle>
          <CardDescription>
            Sign in to manage your tutoring business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
