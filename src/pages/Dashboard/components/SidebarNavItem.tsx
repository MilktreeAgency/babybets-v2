import { Link, useLocation } from 'react-router-dom'
import { useSidebar } from '@/contexts/SidebarContext'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SidebarNavItemProps {
  href: string
  icon: ReactNode
  label: string
  badge?: string
}

export function SidebarNavItem({ href, icon, label, badge }: SidebarNavItemProps) {
  const location = useLocation()
  const { isCollapsed } = useSidebar()
  const isActive = location.pathname === href

  return (
    <Link
      to={href}
      className={cn(
        'group flex w-full items-center gap-2 overflow-hidden rounded p-1.5 pl-2 text-left outline-hidden transition-colors h-8 text-[13px] font-[450]',
        isActive
          ? 'bg-[#e8e3da] text-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <div className="shrink-0 [&>svg]:size-4">{icon}</div>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate transition-[letter-spacing] duration-150 group-hover:tracking-wide">{label}</span>
          {badge && (
            <span className="inline-flex items-center justify-center rounded-md bg-accent px-1.5 py-0.5 text-xs">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  )
}
