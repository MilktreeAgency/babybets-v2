import { useSidebar } from '@/contexts/SidebarContext'
import { SidebarNavItem } from './SidebarNavItem'
import type { NavGroup } from './sidebarConfig'

interface SidebarNavGroupProps {
  group: NavGroup
}

export function SidebarNavGroup({ group }: SidebarNavGroupProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="relative flex w-full min-w-0 flex-col p-2 py-0">
      {!isCollapsed && group.label && (
        <div className="flex h-6 shrink-0 items-center rounded px-2 pt-3 pb-1">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
            {group.label}
          </h3>
        </div>
      )}
      <div className="w-full text-sm">
        <ul className="flex w-full min-w-0 flex-col gap-px">
          {group.items.map((item) => (
            <li key={item.href} className="group/menu-item relative">
              <SidebarNavItem
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
