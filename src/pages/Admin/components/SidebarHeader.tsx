import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/hooks/useAuth'
import { User } from 'lucide-react'

export function SidebarHeader() {
  const { isCollapsed } = useSidebar()
  const { user } = useAuth()

  const truncateEmail = (email: string) => {
    if (email.length > 25) {
      return email.substring(0, 25) + '...'
    }
    return email
  }

  return (
    <div className="flex flex-col gap-2 p-2 pb-0">
      <div className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-4 text-sidebar-foreground" />
          )}
        </span>
        {!isCollapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold leading-tight text-sidebar-foreground">
              {user?.name || 'User'}
            </span>
            <span className="truncate text-[11px] leading-tight text-sidebar-foreground/60">
              {user?.email ? truncateEmail(user.email) : 'user@example.com'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
