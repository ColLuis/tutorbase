import { Calendar, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'

interface MetricCardsProps {
  stats: {
    weeklyLessonCount: number
    unpaidCount: number
    unpaidTotal: number
    monthlyRevenue: number
    yearlyRevenue: number
  }
}

export default function MetricCards({ stats }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Weekly lessons */}
      <Card size="sm">
        <CardContent className="relative pt-3">
          <div className="absolute top-3 right-3">
            <Calendar className="size-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{String(stats.weeklyLessonCount)}</div>
          <div className="text-sm text-muted-foreground">This week</div>
          <div className="text-sm text-muted-foreground">lessons</div>
        </CardContent>
      </Card>

      {/* Unpaid invoices */}
      <Card size="sm">
        <CardContent className="relative pt-3">
          <div className="absolute top-3 right-3">
            <FileText className="size-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{formatCurrency(stats.unpaidTotal)}</div>
          <div className="text-sm text-muted-foreground">Unpaid</div>
          <div className="text-sm text-muted-foreground">
            {stats.unpaidCount} invoice{stats.unpaidCount !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Monthly revenue */}
      <Card size="sm">
        <CardContent className="relative pt-3">
          <div className="absolute top-3 right-3">
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          <div className="text-sm text-muted-foreground">This month</div>
          <div className="text-sm text-muted-foreground">received</div>
        </CardContent>
      </Card>

      {/* Yearly revenue */}
      <Card size="sm">
        <CardContent className="relative pt-3">
          <div className="absolute top-3 right-3">
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{formatCurrency(stats.yearlyRevenue)}</div>
          <div className="text-sm text-muted-foreground">This year</div>
          <div className="text-sm text-muted-foreground">received</div>
        </CardContent>
      </Card>
    </div>
  )
}
