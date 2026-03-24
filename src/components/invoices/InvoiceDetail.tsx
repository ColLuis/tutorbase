'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'
import { format, parseISO } from 'date-fns'
import { sendInvoice } from '@/lib/actions/invoices'
import { toast } from 'sonner'
import InvoicePDFViewer from '@/components/invoices/pdf/InvoicePDFViewer'
import type { InvoicePDFData } from '@/components/invoices/pdf/InvoicePDF'
import MarkPaidForm from '@/components/invoices/MarkPaidForm'
import DeleteDraftButton from '@/components/invoices/DeleteDraftButton'

interface InvoiceItem {
  id: string
  description: string
  quantity: number | null
  unit_price: number
  amount: number
  lesson_id: string | null
}

interface Receipt {
  id: string
  receipt_number: string
  paid_at: string
  amount_paid: number
  payment_method: string | null
}

interface Student {
  name: string
  parent_name: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  subtotal: number
  total: number
  notes: string | null
  students: Student | null
  invoice_items: InvoiceItem[] | null
  receipts: Receipt[] | null
}

interface InvoiceDetailProps {
  invoice: Invoice
  pdfData: InvoicePDFData
  invoiceId: string
}

function getStatusBadgeVariant(status: string): 'secondary' | 'default' | 'destructive' | 'outline' {
  if (status === 'draft') return 'secondary'
  if (status === 'sent') return 'outline'
  if (status === 'paid') return 'default'
  return 'secondary'
}

export default function InvoiceDetail({ invoice, pdfData, invoiceId }: InvoiceDetailProps) {
  const [isPending, startTransition] = useTransition()
  const [showMarkPaid, setShowMarkPaid] = useState(false)

  const items = invoice.invoice_items ?? []
  const receipt = invoice.receipts?.[0] ?? null

  function handleSendInvoice() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('invoiceId', invoiceId)
      const result = await sendInvoice(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Invoice sent')
      }
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/invoices"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Invoices
          </Link>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
        </div>
        <Badge variant={getStatusBadgeVariant(invoice.status)}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
        {invoice.students && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{invoice.students.name}</span>
          </div>
        )}
        {invoice.issued_date && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span>{format(parseISO(invoice.issued_date), 'dd MMM yyyy')}</span>
          </div>
        )}
        {invoice.due_date && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due</span>
            <span>{format(parseISO(invoice.due_date), 'dd MMM yyyy')}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
          <span>Total</span>
          <span>{formatCurrency(Number(invoice.total))}</span>
        </div>
      </div>

      {/* Line Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Line Items
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Table header — hidden on mobile, shown on sm+ */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Amount</span>
            </div>
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`px-4 py-3 ${index > 0 ? 'border-t' : ''}`}
              >
                {/* Mobile: stacked layout */}
                <div className="flex justify-between items-start sm:hidden">
                  <span className="text-sm">{item.description}</span>
                  <span className="text-sm font-medium ml-4 shrink-0">
                    {formatCurrency(Number(item.amount))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                  {item.quantity ?? 1} &times; {formatCurrency(Number(item.unit_price))}
                </div>
                {/* Desktop: grid layout */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 text-sm items-center">
                  <span>{item.description}</span>
                  <span className="text-right">{item.quantity ?? 1}</span>
                  <span className="text-right">{formatCurrency(Number(item.unit_price))}</span>
                  <span className="text-right font-medium">{formatCurrency(Number(item.amount))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Notes
          </h2>
          <p className="text-sm rounded-xl border bg-card p-4">{invoice.notes}</p>
        </div>
      )}

      {/* Paid status line (D-16) */}
      {invoice.status === 'paid' && invoice.paid_date && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-1 text-sm">
          <p className="font-medium text-green-800">
            Paid on {format(parseISO(invoice.paid_date), 'dd MMM yyyy')}
            {receipt?.payment_method ? ` via ${receipt.payment_method}` : ''}
          </p>
          {/* Receipt info (D-15) */}
          {receipt && (
            <p className="text-green-700">
              Receipt {receipt.receipt_number} &mdash; Paid {format(parseISO(receipt.paid_at), 'dd MMM yyyy')}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Draft actions */}
        {invoice.status === 'draft' && (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSendInvoice}
              disabled={isPending}
              className="min-h-[44px]"
            >
              {isPending ? 'Sending...' : 'Send Invoice'}
            </Button>
            <DeleteDraftButton invoiceId={invoiceId} />
            <a
              href={`/api/invoices/${invoiceId}/pdf`}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground min-h-[44px]"
              download
            >
              Download PDF
            </a>
          </div>
        )}

        {/* Sent actions */}
        {invoice.status === 'sent' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowMarkPaid((v) => !v)}
                className="min-h-[44px]"
                variant={showMarkPaid ? 'secondary' : 'default'}
              >
                {showMarkPaid ? 'Cancel' : 'Mark as Paid'}
              </Button>
              <a
                href={`/api/invoices/${invoiceId}/pdf`}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground min-h-[44px]"
                download
              >
                Download PDF
              </a>
            </div>
            {showMarkPaid && <MarkPaidForm invoiceId={invoiceId} />}
          </div>
        )}

        {/* Paid actions */}
        {invoice.status === 'paid' && (
          <a
            href={`/api/invoices/${invoiceId}/pdf`}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground min-h-[44px]"
            download
          >
            Download PDF
          </a>
        )}
      </div>

      {/* PDF Preview section (D-12) */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          PDF Preview
        </h2>
        <InvoicePDFViewer invoice={pdfData} invoiceId={invoiceId} />
      </div>
    </div>
  )
}
