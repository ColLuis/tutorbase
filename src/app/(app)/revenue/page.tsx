import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { verifySession } from '@/lib/dal'
import { getMonthlyRevenue, getStudentRevenue } from '@/lib/queries/revenue'
import { Button } from '@/components/ui/button'
import MonthlyBreakdown from '@/components/revenue/MonthlyBreakdown'
import StudentBreakdown from '@/components/revenue/StudentBreakdown'

interface RevenueRouteProps {
  searchParams: Promise<{ year?: string }>
}

async function RevenueContent({ searchParams }: RevenueRouteProps) {
  const { tutorId } = await verifySession()
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const parsedYear = params.year ? parseInt(params.year, 10) : currentYear
  const year = isNaN(parsedYear) ? currentYear : parsedYear

  const [monthly, students] = await Promise.all([
    getMonthlyRevenue(tutorId, year),
    getStudentRevenue(tutorId, year),
  ])

  const hasData = students.length > 0 || monthly.some(row => row.amountInvoiced > 0 || row.lessonsDelivered > 0)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-heading">Revenue</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" render={<Link href={`/revenue?year=${year - 1}`} aria-label="Previous year"><ChevronLeft className="size-4" /></Link>} />
          <span className="text-base font-bold">{year}</span>
          {year < currentYear && (
            <Button variant="ghost" size="icon-sm" render={<Link href={`/revenue?year=${year + 1}`} aria-label="Next year"><ChevronRight className="size-4" /></Link>} />
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <h2 className="text-base font-bold">No revenue data for {year}</h2>
          <p className="text-sm text-muted-foreground mt-1">Revenue appears here once you create and send invoices.</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-base font-bold mt-6 mb-3">Monthly Breakdown</h2>
            <MonthlyBreakdown rows={monthly} year={year} />
          </section>

          <section>
            <h2 className="text-base font-bold mt-8 mb-3">By Student</h2>
            <StudentBreakdown rows={students} year={year} />
          </section>
        </>
      )}
    </div>
  )
}

export default async function RevenueRoute(props: RevenueRouteProps) {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded mb-2" />
        ))}
      </div>
    }>
      <RevenueContent {...props} />
    </Suspense>
  )
}
