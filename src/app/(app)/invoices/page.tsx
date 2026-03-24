import { verifySession } from '@/lib/dal'
import { getInvoices } from '@/lib/queries/invoices'
import InvoiceList from '@/components/invoices/InvoiceList'

interface InvoicesPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const { tutorId } = await verifySession()
  const { status = 'all' } = await searchParams
  const invoices = await getInvoices(tutorId, status)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>
      <InvoiceList invoices={invoices} currentStatus={status} />
    </div>
  )
}
