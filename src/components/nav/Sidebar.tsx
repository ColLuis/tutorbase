'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/students', label: 'Students' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/revenue', label: 'Revenue' },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'w-64 fixed left-0 top-0 h-screen flex flex-col bg-background border-r',
        className
      )}
    >
      {/* Logo / App name */}
      <div className="px-4 py-5 border-b">
        <span className="text-lg font-semibold">TutorBase</span>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 overflow-y-auto">
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
                'flex items-center min-h-[44px] px-4 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Logout */}
      <div className="border-t p-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center min-h-[44px] w-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
