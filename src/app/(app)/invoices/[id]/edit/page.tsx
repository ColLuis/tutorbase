import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getInvoice } from '@/lib/queries/invoices'
import EditInvoiceForm from '@/components/invoices/EditInvoiceForm'

interface EditInvoicePageProps {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { tutorId } = await verifySession()
  const { id } = await params

  const invoice = await getInvoice(tutorId, id)
  if (!invoice) notFound()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Edit {invoice.invoice_number}
      </h1>
      <EditInvoiceForm invoice={invoice} invoiceId={id} />
    </div>
  )
}
