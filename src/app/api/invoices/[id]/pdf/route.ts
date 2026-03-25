import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { verifySession } from '@/lib/dal'
import { getInvoice, getTutorForInvoice } from '@/lib/queries/invoices'
import InvoicePDF, { type InvoicePDFData } from '@/components/invoices/pdf/InvoicePDF'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { tutorId } = await verifySession()
  const { id } = await params

  const invoice = await getInvoice(tutorId, id)
  if (!invoice) {
    return new Response('Not found', { status: 404 })
  }

  const tutor = await getTutorForInvoice(tutorId)

  const pdfData: InvoicePDFData = {
    invoice_number: invoice.invoice_number,
    issued_date: invoice.issued_date ?? '',
    due_date: invoice.due_date ?? '',
    bill_to: invoice.students.parent_name || invoice.students.name,
    items: (invoice.invoice_items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    })),
    subtotal: invoice.subtotal,
    total: invoice.total,
    notes: invoice.notes ?? null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoicePDF, { invoice: pdfData }) as any
  const buffer = await renderToBuffer(element)

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
