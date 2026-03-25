'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { Home, Users, Calendar, FileText, TrendingUp, LogOut, GraduationCap } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'w-64 fixed left-0 top-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border',
        className
      )}
    >
      {/* Logo / App name */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="size-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-foreground">TutorBase</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
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
              className={cn(
                'flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 min-h-[44px] w-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
