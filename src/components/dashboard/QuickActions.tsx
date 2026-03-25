import Link from 'next/link'
import { Plus, FileText, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2 mt-6">
      <Button
        variant="outline"
        size="lg"
        className="h-11 flex-col gap-1"
        render={
          <Link href="/schedule?action=new">
            <Plus className="size-4" />
            <span>Add Lesson</span>
          </Link>
        }
      />
      <Button
        variant="outline"
        size="lg"
        className="h-11 flex-col gap-1"
        render={
          <Link href="/invoices/new">
            <FileText className="size-4" />
            <span>Create Invoice</span>
          </Link>
        }
      />
      <Button
        variant="outline"
        size="lg"
        className="h-11 flex-col gap-1"
        render={
          <Link href="/students?action=new">
            <UserPlus className="size-4" />
            <span>Add Student</span>
          </Link>
        }
      />
    </div>
  )
}
