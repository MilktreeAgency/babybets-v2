import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: ReactNode
  iconBgColor?: string
  loading?: boolean
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBgColor = '#f25100',
  loading = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="size-4 text-green-600" />
              ) : (
                <TrendingDown className="size-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="size-12 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: iconBgColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
