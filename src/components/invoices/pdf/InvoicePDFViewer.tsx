'use client'

import dynamic from 'next/dynamic'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import InvoicePDF, { type InvoicePDFData } from './InvoicePDF'

const PDFViewerDynamic = dynamic(
  () =>
    import('@react-pdf/renderer').then((mod) => {
      const { PDFViewer } = mod
      return function InvoicePDFViewerInner({ invoice }: { invoice: InvoicePDFData }) {
        return (
          <PDFViewer width="100%" height={600} showToolbar={false}>
            <InvoicePDF invoice={invoice} />
          </PDFViewer>
        )
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground">
        Loading preview...
      </div>
    ),
  }
)

interface InvoicePDFViewerProps {
  invoice: InvoicePDFData
  invoiceId: string
}

export default function InvoicePDFViewer({ invoice, invoiceId }: InvoicePDFViewerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return <PDFViewerDynamic invoice={invoice} />
  }

  return (
    <div className="flex items-center justify-center py-8">
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        download
      >
        Download PDF
      </a>
    </div>
  )
}
