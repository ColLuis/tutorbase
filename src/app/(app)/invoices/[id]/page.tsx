import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getInvoice, getTutorForInvoice } from '@/lib/queries/invoices'
import InvoiceDetail from '@/components/invoices/InvoiceDetail'
import type { InvoicePDFData } from '@/components/invoices/pdf/InvoicePDF'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { tutorId } = await verifySession()
  const { id } = await params

  const [invoice, tutor] = await Promise.all([
    getInvoice(tutorId, id),
    getTutorForInvoice(tutorId),
  ])

  if (!invoice) notFound()

  const pdfData: InvoicePDFData = {
    tutor_name: tutor.name,
    invoice_number: invoice.invoice_number,
    issued_date: invoice.issued_date ?? '',
    due_date: invoice.due_date ?? '',
    bill_to: invoice.students?.parent_name ?? invoice.students?.name ?? '',
    items: (invoice.invoice_items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: Number(item.unit_price),
      amount: Number(item.amount),
    })),
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
    notes: invoice.notes,
  }

  return (
    <InvoiceDetail
      invoice={invoice}
      pdfData={pdfData}
      invoiceId={id}
    />
  )
}
