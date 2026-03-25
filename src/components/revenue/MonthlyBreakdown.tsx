import { formatCurrency } from '@/lib/utils/currency'
import type { MonthlyRow } from '@/lib/queries/revenue'

interface MonthlyBreakdownProps {
  rows: MonthlyRow[]
  year: number
}

export default function MonthlyBreakdown({ rows, year }: MonthlyBreakdownProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Monthly revenue breakdown for {year}</caption>
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 bg-background py-3 px-2 text-left text-sm font-bold text-muted-foreground">Month</th>
            <th className="py-3 px-2 text-right text-sm font-bold text-muted-foreground">Lessons</th>
            <th className="py-3 px-2 text-right text-sm font-bold text-muted-foreground">Hours</th>
            <th className="py-3 px-2 text-right text-sm font-bold text-muted-foreground">Invoiced</th>
            <th className="py-3 px-2 text-right text-sm font-bold text-muted-foreground">Paid</th>
            <th className="py-3 px-2 text-right text-sm font-bold text-muted-foreground">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.month} className="border-b last:border-0">
              <td className="sticky left-0 bg-background py-3 px-2 font-bold">{row.monthLabel}</td>
              <td className="py-3 px-2 text-right">{row.lessonsDelivered || '—'}</td>
              <td className="py-3 px-2 text-right">{row.hoursTaught > 0 ? `${row.hoursTaught.toFixed(1)} h` : '—'}</td>
              <td className="py-3 px-2 text-right">{row.amountInvoiced > 0 ? formatCurrency(row.amountInvoiced) : '—'}</td>
              <td className="py-3 px-2 text-right">{row.amountPaid > 0 ? formatCurrency(row.amountPaid) : '—'}</td>
              <td className="py-3 px-2 text-right">{row.outstanding > 0 ? formatCurrency(row.outstanding) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
