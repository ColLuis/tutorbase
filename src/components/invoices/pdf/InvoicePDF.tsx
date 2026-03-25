import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface InvoicePDFData {
  invoice_number: string
  issued_date: string
  due_date: string
  bill_to: string
  items: Array<{
    id: string
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
  subtotal: number
  total: number
  notes: string | null
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    color: '#111111',
  },
  header: {
    marginBottom: 24,
  },
  tutorName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  metaRow: {
    marginBottom: 4,
  },
  billToSection: {
    marginBottom: 24,
  },
  billToLabel: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: 'right',
  },
  colRate: {
    flex: 1,
    textAlign: 'right',
  },
  colAmount: {
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    borderTopStyle: 'solid',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 16,
  },
  totalAmount: {
    fontFamily: 'Helvetica-Bold',
    minWidth: 80,
    textAlign: 'right',
  },
  notesSection: {
    marginTop: 32,
  },
  notesLabel: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
})

function formatPDFCurrency(amount: number): string {
  return '$' + amount.toFixed(2)
}

interface InvoicePDFProps {
  invoice: InvoicePDFData
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.tutorName}>Invoice #{invoice.invoice_number}</Text>
          <Text style={styles.metaRow}>Issued: {invoice.issued_date}</Text>
          <Text style={styles.metaRow}>Due: {invoice.due_date}</Text>
        </View>

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.billToLabel}>Bill to:</Text>
          <Text>{invoice.bill_to}</Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colAmount}>Amount</Text>
        </View>

        {/* Line Items */}
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>{formatPDFCurrency(item.unit_price)}</Text>
            <Text style={styles.colAmount}>{formatPDFCurrency(item.amount)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPDFCurrency(invoice.total)}</Text>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
