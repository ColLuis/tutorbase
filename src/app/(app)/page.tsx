import { Suspense } from 'react'
import { verifySession } from '@/lib/dal'
import { getTutorProfile } from '@/lib/queries/tutors'
import { getDashboardLessons, getDashboardStats } from '@/lib/queries/dashboard'
import TodayLessons from '@/components/dashboard/TodayLessons'
import MetricCards from '@/components/dashboard/MetricCards'
import QuickActions from '@/components/dashboard/QuickActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

async function DashboardContent() {
  const { tutorId } = await verifySession()
  const tutor = await getTutorProfile(tutorId)
  const tz = tutor.timezone ?? 'Australia/Sydney'

  const [dashboardLessons, stats] = await Promise.all([
    getDashboardLessons(tutorId),
    getDashboardStats(tutorId),
  ])

  const greeting = getGreeting()

  return (
    <>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your overview for today</p>
      </div>

      {/* Metrics */}
      <MetricCards stats={stats} />

      {/* Today's lessons */}
      <Card className="mt-6">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <CalendarDays className="size-3.5 text-indigo-600" />
            </div>
            <CardTitle className="font-heading">{dashboardLessons.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <TodayLessons lessons={dashboardLessons.lessons} timezone={tz} />
        </CardContent>
      </Card>

      {/* Quick actions */}
      <QuickActions />
    </>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="h-28 bg-muted animate-pulse rounded-xl" />
        <div className="h-28 bg-muted animate-pulse rounded-xl" />
        <div className="h-28 bg-muted animate-pulse rounded-xl" />
        <div className="h-28 bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="h-48 bg-muted animate-pulse rounded-xl mt-6" />
    </>
  )
}

export default function HomePage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
