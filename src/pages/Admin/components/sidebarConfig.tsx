import {
  Home,
  Settings,
  Trophy,
  Gift,
  Users,
  Tag,
  Award,
  DollarSign,
  BarChart3,
  Package
} from 'lucide-react'
import { type ReactNode } from 'react'

export interface NavItem {
  label: string
  href: string
  icon: ReactNode
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const sidebarConfig: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: <Home className="size-4" />,
      },
      {
        label: 'Analytics',
        href: '/admin/dashboard/analytics',
        icon: <BarChart3 className="size-4" />,
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Competitions',
        href: '/admin/dashboard/competitions',
        icon: <Trophy className="size-4" />,
      },
      {
        label: 'Prizes',
        href: '/admin/dashboard/prizes',
        icon: <Package className="size-4" />,
      },
      {
        label: 'Fulfillments',
        href: '/admin/dashboard/fulfillments',
        icon: <Gift className="size-4" />,
      },
      {
        label: 'Users',
        href: '/admin/dashboard/users',
        icon: <Users className="size-4" />,
      },
      {
        label: 'Promo Codes',
        href: '/admin/dashboard/promo-codes',
        icon: <Tag className="size-4" />,
      },
      {
        label: 'Winners',
        href: '/admin/dashboard/winners',
        icon: <Award className="size-4" />,
      },
      {
        label: 'Withdrawals',
        href: '/admin/dashboard/withdrawals',
        icon: <DollarSign className="size-4" />,
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        label: 'Settings',
        href: '/admin/dashboard/settings',
        icon: <Settings className="size-4" />,
      },
    ],
  },
]
