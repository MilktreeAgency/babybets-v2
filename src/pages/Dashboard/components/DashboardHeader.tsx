import { Link, useNavigate } from 'react-router-dom'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/contexts/ConfirmDialogContext'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DashboardHeaderProps {
  breadcrumbs: BreadcrumbItem[]
}

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
  const { toggleSidebar } = useSidebar()
  const { logout } = useAuth()
  const { confirm } = useConfirm()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Are you sure you want to logout?',
      description: 'You will be redirected to the login page and will need to sign in again to access your dashboard.',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (confirmed) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <div className="flex h-14 items-center gap-3 px-4 text-sm text-muted-foreground border-b border-border">
      {/* Sidebar Toggle */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggleSidebar}
          className="relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border bg-clip-padding font-medium text-sm outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 border-transparent hover:bg-accent data-pressed:bg-accent size-7 -ml-1 cursor-pointer"
          data-slot="sidebar-trigger"
          data-sidebar="trigger"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 32 32">
            <line
              x1="18"
              y1="4"
              x2="18"
              y2="28"
              fill="none"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="2"
              data-color="color-2"
              data-cap="butt"
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />
            <rect
              x="2"
              y="4"
              width="28"
              height="24"
              rx="3"
              ry="3"
              fill="none"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="2"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
            <line
              x1="22"
              y1="11"
              x2="26"
              y2="11"
              fill="none"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="2"
              data-color="color-2"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
            <line
              x1="22"
              y1="16"
              x2="26"
              y2="16"
              fill="none"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="2"
              data-color="color-2"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
            <line
              x1="22"
              y1="21"
              x2="26"
              y2="21"
              fill="none"
              stroke="currentColor"
              strokeMiterlimit="10"
              strokeWidth="2"
              data-color="color-2"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
          </svg>
          <span className="sr-only">Toggle Sidebar</span>
        </button>
        <div
          data-orientation="vertical"
          role="separator"
          aria-orientation="vertical"
          data-slot="separator"
          className="shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch ml-3 mr-2 h-8 w-1 bg-border self-center"
        />
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" data-slot="breadcrumb">
        <ol
          data-slot="breadcrumb-list"
          className="flex-wrap text-sm break-words text-muted-foreground sm:gap-2.5 flex items-center gap-1"
        >
          {breadcrumbs.map((item, index) => (
            <li key={index} data-slot="breadcrumb-item" className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <li
                  data-slot="breadcrumb-separator"
                  role="presentation"
                  aria-hidden="true"
                  className="opacity-72 [&>svg]:size-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-right"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </li>
              )}
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link data-slot="breadcrumb-link" className="transition-colors hover:text-foreground" to={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span
                  data-slot="breadcrumb-page"
                  role="link"
                  aria-disabled="true"
                  aria-current="page"
                  className="font-medium text-foreground"
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </div>
  )
}
