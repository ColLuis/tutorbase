'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateInvoice } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils/currency'

interface InvoiceItem {
  id: string
  description: string
  quantity: number | null
  unit_price: number
  amount: number
  lesson_id: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issued_date: string | null
  due_date: string | null
  subtotal: number
  total: number
  notes: string | null
  invoice_items: InvoiceItem[] | null
}

interface EditInvoiceFormProps {
  invoice: Invoice
  invoiceId: string
}

interface EditableItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

export default function EditInvoiceForm({ invoice, invoiceId }: EditInvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [issuedDate, setIssuedDate] = useState(invoice.issued_date ?? '')
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '')
  const [notes, setNotes] = useState(invoice.notes ?? '')

  const [items, setItems] = useState<EditableItem[]>(
    (invoice.invoice_items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: Number(item.unit_price),
    }))
  )

  function updateItem(index: number, field: keyof EditableItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function calcItemAmount(item: EditableItem): number {
    return item.quantity * item.unit_price
  }

  const subtotal = items.reduce((sum, item) => sum + calcItemAmount(item), 0)

  function handleSubmit() {
    startTransition(async () => {
      const itemsPayload = items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: calcItemAmount(item),
      }))

      const formData = new FormData()
      formData.append('invoiceId', invoiceId)
      formData.append('issuedDate', issuedDate)
      formData.append('dueDate', dueDate)
      if (notes.trim()) formData.append('notes', notes.trim())
      formData.append('items', JSON.stringify(itemsPayload))

      const result = await updateInvoice(formData)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Invoice updated')
        router.push('/invoices/' + invoiceId)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Line items */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Line Items</h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border bg-card p-3 space-y-3"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit Price ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="h-9 flex items-center text-sm font-medium tabular-nums">
                    {formatCurrency(calcItemAmount(item))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 px-3 py-3 rounded-lg bg-muted font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
      </section>

      {/* Date fields */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invoice Details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="issuedDate">Issue Date</Label>
          <Input
            id="issuedDate"
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment due within 14 days"
            rows={3}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          disabled={isPending}
          className="w-full sm:w-auto min-h-[44px]"
          onClick={handleSubmit}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="w-full sm:w-auto min-h-[44px]"
          onClick={() => router.push('/invoices/' + invoiceId)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
