import { SidebarHeader } from './SidebarHeader'
import { SidebarNavGroup } from './SidebarNavGroup'
import { SidebarFooter } from './SidebarFooter'
import { sidebarConfig } from './sidebarConfig'
import { useSidebarCounts } from '@/hooks/useSidebarCounts'
import type { NavGroup } from './sidebarConfig'

export function Sidebar() {
  const { counts } = useSidebarCounts()

  // Merge real counts into sidebar config
  const configWithCounts: NavGroup[] = sidebarConfig.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      // Update Fulfillments badge
      if (item.href === '/admin/dashboard/fulfillments') {
        return {
          ...item,
          badge: counts.fulfillments > 0 ? counts.fulfillments.toString() : undefined,
        }
      }
      // Update Withdrawals badge
      if (item.href === '/admin/dashboard/withdrawals') {
        return {
          ...item,
          badge: counts.withdrawals > 0 ? counts.withdrawals.toString() : undefined,
        }
      }
      return item
    }),
  }))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SidebarHeader />

      {/* Separator */}
      <div className="mx-2 my-2 h-px bg-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="flex flex-col gap-2">
          {configWithCounts.map((group, index) => (
            <SidebarNavGroup key={index} group={group} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter />
    </div>
  )
}
