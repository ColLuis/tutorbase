'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'

interface StudentListProps {
  students: Array<{
    id: string
    name: string
    subject: string | null
    default_rate: number | null
    is_active: boolean
    parent_phone: string | null
  }>
}

export default function StudentList({ students }: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = students.filter((s) => {
    if (!showInactive && !s.is_active) return false
    return s.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-4">
      {/* Search input */}
      <Input
        type="search"
        placeholder="Search students..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search students"
      />

      {/* Show inactive toggle */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={showInactive ? 'secondary' : 'outline'}
          onClick={() => setShowInactive((v) => !v)}
          className="min-h-[44px] text-sm"
        >
          {showInactive ? 'Showing all' : 'Show inactive'}
        </Button>
        <span className="text-sm text-muted-foreground">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Student list */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No students found.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((student) => (
            <li key={student.id}>
              <Link
                href={`/students/${student.id}`}
                className="flex flex-col gap-1.5 rounded-xl border bg-card px-4 py-3 min-h-[44px] shadow-sm transition-all hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{student.name}</span>
                  <div className="flex items-center gap-1.5">
                    {!student.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {student.subject && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 text-xs font-medium">{student.subject}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {student.default_rate != null && (
                    <span>{formatCurrency(student.default_rate)} / hr</span>
                  )}
                  {student.parent_phone && (
                    <span>{student.parent_phone}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
