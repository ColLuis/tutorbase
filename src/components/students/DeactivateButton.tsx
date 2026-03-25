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
import { deactivateStudent } from '@/lib/actions/students'

interface DeactivateButtonProps {
  studentId: string
  studentName: string
}

export default function DeactivateButton({ studentId, studentName }: DeactivateButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)
    const result = await deactivateStudent(studentId)
    setIsLoading(false)
    if ('success' in result) {
      setOpen(false)
      router.push('/students')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" className="min-h-[44px] w-full">
            Deactivate Student
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {studentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This student will be hidden from your active list. Their lesson history will be
            preserved.
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
            {isLoading ? 'Deactivating...' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
