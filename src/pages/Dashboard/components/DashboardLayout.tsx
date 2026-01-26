import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

function DashboardLayoutContent() {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`border-r border-border transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ backgroundColor: '#f9f7f4' }}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content with its own header */}
        <Outlet />
      </main>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  )
}
