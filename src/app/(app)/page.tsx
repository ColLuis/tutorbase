import { Suspense } from 'react'
import { verifySession } from '@/lib/dal'
import { getTutorProfile } from '@/lib/queries/tutors'
import { getDashboardLessons, getDashboardStats } from '@/lib/queries/dashboard'
import TodayLessons from '@/components/dashboard/TodayLessons'
import MetricCards from '@/components/dashboard/MetricCards'
import QuickActions from '@/components/dashboard/QuickActions'

async function DashboardContent() {
  const { tutorId } = await verifySession()
  const tutor = await getTutorProfile(tutorId)
  const tz = tutor.timezone ?? 'Australia/Sydney'

  const [dashboardLessons, stats] = await Promise.all([
    getDashboardLessons(tutorId),
    getDashboardStats(tutorId),
  ])

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{dashboardLessons.label}</h1>
      <TodayLessons lessons={dashboardLessons.lessons} timezone={tz} />
      <div className="mt-6">
        <MetricCards stats={stats} />
      </div>
      <QuickActions />
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
      {/* Skeleton lesson rows */}
      <div className="flex flex-col gap-1">
        <div className="h-[44px] bg-muted animate-pulse rounded-lg" />
        <div className="h-[44px] bg-muted animate-pulse rounded-lg" />
      </div>
      {/* Skeleton metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
      </div>
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
