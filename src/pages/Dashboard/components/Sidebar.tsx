import { SidebarHeader } from './SidebarHeader'
import { SidebarNavGroup } from './SidebarNavGroup'
import { SidebarFooter } from './SidebarFooter'
import { sidebarConfig } from './sidebarConfig'

export function Sidebar() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SidebarHeader />

      {/* Separator */}
      <div className="mx-2 my-2 h-px bg-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="flex flex-col gap-2">
          {sidebarConfig.map((group, index) => (
            <SidebarNavGroup key={index} group={group} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter />
    </div>
  )
}
