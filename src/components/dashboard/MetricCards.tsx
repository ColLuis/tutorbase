import Link from 'next/link'
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

const metrics = [
  {
    key: 'weekly',
    icon: Calendar,
    iconBg: 'bg-indigo-100 text-indigo-600',
    href: '/schedule',
    getValue: (s: MetricCardsProps['stats']) => String(s.weeklyLessonCount),
    label: 'Lessons',
    sublabel: 'this week',
  },
  {
    key: 'unpaid',
    icon: FileText,
    iconBg: 'bg-amber-100 text-amber-600',
    href: '/invoices',
    getValue: (s: MetricCardsProps['stats']) => String(s.unpaidCount),
    label: 'Unpaid',
    sublabel: (s: MetricCardsProps['stats']) =>
      `invoice${s.unpaidCount !== 1 ? 's' : ''}`,
  },
  {
    key: 'monthly',
    icon: DollarSign,
    iconBg: 'bg-emerald-100 text-emerald-600',
    href: '/revenue',
    getValue: (s: MetricCardsProps['stats']) => formatCurrency(s.monthlyRevenue),
    label: 'Earned',
    sublabel: 'this month',
  },
  {
    key: 'yearly',
    icon: TrendingUp,
    iconBg: 'bg-violet-100 text-violet-600',
    href: '/revenue',
    getValue: (s: MetricCardsProps['stats']) => formatCurrency(s.yearlyRevenue),
    label: 'Earned',
    sublabel: 'this year',
  },
] as const

export default function MetricCards({ stats }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon
        const sublabel = typeof m.sublabel === 'function' ? m.sublabel(stats) : m.sublabel
        return (
          <Link key={m.key} href={m.href}>
            <Card size="sm" className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-3">
                <div className={`inline-flex items-center justify-center size-8 rounded-lg ${m.iconBg} mb-2`}>
                  <Icon className="size-4" />
                </div>
                <div className="text-xl font-bold">{m.getValue(stats)}</div>
                <div className="text-sm text-muted-foreground">{m.label}</div>
                <div className="text-sm text-muted-foreground">{sublabel}</div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
