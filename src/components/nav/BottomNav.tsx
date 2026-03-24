'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Calendar, FileText, TrendingUp } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
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

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5 mb-0.5" />
              <span className="hidden sm:block">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
