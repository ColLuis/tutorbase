'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  total: number
  students: { name: string } | null
}

interface InvoiceListProps {
  invoices: Invoice[]
  currentStatus: string
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

function getStatusBadgeVariant(status: string, isOverdue: boolean): 'secondary' | 'default' | 'destructive' | 'outline' {
  if (isOverdue) return 'destructive'
  if (status === 'draft') return 'secondary'
  if (status === 'sent') return 'outline'
  if (status === 'paid') return 'default'
  return 'secondary'
}

function getStatusLabel(status: string, isOverdue: boolean): string {
  if (isOverdue) return 'Overdue'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function InvoiceList({ invoices, currentStatus }: InvoiceListProps) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/invoices' : `/invoices?status=${tab.value}`}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[36px] flex items-center',
              currentStatus === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-muted-foreground">No invoices yet. Create one from a student&apos;s page.</p>
          <Link
            href="/students"
            className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Go to Students
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => {
            const isOverdue =
              invoice.status === 'sent' && !!invoice.due_date && invoice.due_date < today

            const badgeVariant = getStatusBadgeVariant(invoice.status, isOverdue)
            const statusLabel = getStatusLabel(invoice.status, isOverdue)

            return (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex flex-col gap-1.5 rounded-xl border bg-card px-4 py-3 min-h-[64px] transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{invoice.invoice_number}</span>
                      {invoice.students && (
                        <span className="text-sm text-muted-foreground">{invoice.students.name}</span>
                      )}
                    </div>
                    <Badge variant={badgeVariant}>{statusLabel}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {invoice.issued_date
                        ? `Issued ${format(parseISO(invoice.issued_date), 'dd MMM yyyy')}`
                        : 'No issue date'}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(Number(invoice.total))}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
