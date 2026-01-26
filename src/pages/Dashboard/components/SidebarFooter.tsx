import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

export function SidebarFooter() {
  const { isCollapsed } = useSidebar()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2 p-2 mt-auto">
      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-150 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-150 cursor-pointer"
            >
              Help
            </button>
          </div>
        )}
        <button
          type="button"
          className="relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent hover:bg-accent transition-colors size-8 px-0"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>
    </div>
  )
}
