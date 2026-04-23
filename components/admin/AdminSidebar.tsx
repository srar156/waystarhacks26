'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  LogOut,
  CreditCard,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pages/new', label: 'Create Page', icon: PlusCircle },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

interface AdminSidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

export function AdminSidebar({ onClose, isMobile }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-full flex-col bg-brand-navy text-white"
      aria-label="Admin navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <Link href="/admin" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded" onClick={onClose}>
          <CreditCard className="h-7 w-7 text-brand-orange" aria-hidden="true" />
          <div>
            <div className="text-sm font-bold leading-none">QuickPay</div>
            <div className="text-xs text-brand-blue/80 leading-none mt-0.5">by Waystar</div>
          </div>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Waystar logo */}
      <div className="px-4 py-3 border-b border-white/10">
        <Image
          src="https://s45903.pcdn.co/wp-content/uploads/2018/12/logo-full.png"
          alt="Waystar logo"
          width={120}
          height={32}
          className="opacity-80 brightness-0 invert"
          unoptimized
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Primary navigation">
        <ul role="list" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange',
                    isActive
                      ? 'bg-brand-orange text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
