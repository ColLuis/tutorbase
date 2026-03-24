'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteInvoice } from '@/lib/actions/invoices'
import { toast } from 'sonner'

interface DeleteDraftButtonProps {
  invoiceId: string
}

export default function DeleteDraftButton({ invoiceId }: DeleteDraftButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)
    const formData = new FormData()
    formData.set('invoiceId', invoiceId)
    const result = await deleteInvoice(formData)
    setIsLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setOpen(false)
      router.push('/invoices')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" className="min-h-[44px]">
            Delete
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this draft invoice. Lessons will become available for
            future invoices.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="min-h-[44px]"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Invoice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
