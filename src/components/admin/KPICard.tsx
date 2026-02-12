import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  loading?: boolean
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel,
  loading = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="bg-admin-card-bg border border-border rounded-lg p-6">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-32 bg-admin-gray-bg animate-pulse rounded"></div>
        ) : (
          <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="size-4 text-admin-success-text" />
            ) : (
              <TrendingDown className="size-4 text-admin-error-light" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-admin-success-text' : 'text-admin-error-light'
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
    </div>
  )
}
