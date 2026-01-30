import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { ConfirmDialogProvider } from '@/contexts/ConfirmDialogContext'

function DashboardLayoutContent() {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Page Content with its own header */}
        <Outlet />
      </main>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <ConfirmDialogProvider>
        <DashboardLayoutContent />
      </ConfirmDialogProvider>
    </SidebarProvider>
  )
}
