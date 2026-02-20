import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

export function SidebarFooter() {
  const { isCollapsed } = useSidebar()
  const { toggleTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mt-auto border-t border-sidebar-border">
      <div className="flex flex-col gap-2 p-2">
        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 cursor-pointer"
              >
                Home
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent hover:bg-sidebar-accent transition-colors size-8 px-0"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-sidebar-foreground" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sidebar-foreground" />
              <span className="sr-only">Toggle theme</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent hover:bg-sidebar-accent transition-colors size-8 px-0"
            >
              <LogOut className="size-4 text-sidebar-foreground" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
