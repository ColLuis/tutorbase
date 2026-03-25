'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { StudentRow } from '@/lib/queries/revenue'

type SortKey = 'name' | 'lessons' | 'invoiced' | 'paid' | 'outstanding'

interface StudentBreakdownProps {
  rows: StudentRow[]
  year: number
}

export default function StudentBreakdown({ rows, year }: StudentBreakdownProps) {
  const [sortKey, setSortKey] = useState<SortKey>('invoiced')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  if (rows.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-base font-bold">No students yet</h2>
        <p className="text-sm text-muted-foreground mt-1">Add a student to start tracking revenue.</p>
      </div>
    )
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = typeof av === 'string'
      ? av.localeCompare(bv as string)
      : (av as number) - (bv as number)
    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortHeader({ label, sortKey: key, align = 'right' }: { label: string; sortKey: SortKey; align?: 'left' | 'right' }) {
    const isActive = sortKey === key
    return (
      <th aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button
          onClick={() => toggleSort(key)}
          className={`flex items-center gap-1 py-3 px-2 text-sm font-bold min-h-[44px] ${align === 'right' ? 'ml-auto' : ''} ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {label}
          {isActive && (sortDir === 'desc' ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />)}
        </button>
      </th>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Per-student revenue breakdown for {year}</caption>
        <thead>
          <tr className="border-b">
            <SortHeader label="Student" sortKey="name" align="left" />
            <SortHeader label="Lessons" sortKey="lessons" />
            <SortHeader label="Invoiced" sortKey="invoiced" />
            <SortHeader label="Paid" sortKey="paid" />
            <SortHeader label="Outstanding" sortKey="outstanding" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="sticky left-0 bg-background py-3 px-2">{row.name}</td>
              <td className="py-3 px-2 text-right">{row.lessons}</td>
              <td className="py-3 px-2 text-right">{formatCurrency(row.invoiced)}</td>
              <td className="py-3 px-2 text-right">{formatCurrency(row.paid)}</td>
              <td className="py-3 px-2 text-right">{formatCurrency(row.outstanding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
