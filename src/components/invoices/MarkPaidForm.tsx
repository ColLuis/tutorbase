'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markInvoicePaid } from '@/lib/actions/invoices'
import { toast } from 'sonner'

interface MarkPaidFormProps {
  invoiceId: string
}

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Card', 'Other']

export default function MarkPaidForm({ invoiceId }: MarkPaidFormProps) {
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await markInvoicePaid(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Payment recorded')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4 space-y-4"
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="space-y-1">
        <label
          htmlFor="paidDate"
          className="text-sm font-medium"
        >
          Payment Date
        </label>
        <input
          type="date"
          id="paidDate"
          name="paidDate"
          defaultValue={today}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="paymentMethod"
          className="text-sm font-medium"
        >
          Payment Method
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[44px]"
      >
        {isPending ? 'Recording...' : 'Record Payment'}
      </Button>
    </form>
  )
}
