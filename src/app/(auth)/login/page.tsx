import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TutorBase</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your tutoring business
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
