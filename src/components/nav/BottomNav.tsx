'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/students', label: 'Students' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/revenue', label: 'Revenue' },
]

interface BottomNavProps {
  className?: string
}

export default function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'bg-background border-t pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="flex">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
