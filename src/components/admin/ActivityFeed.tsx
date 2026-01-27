import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'order' | 'win' | 'signup' | 'fulfillment' | 'withdrawal'
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

const activityColors = {
  order: 'bg-blue-100 text-blue-800',
  win: 'bg-green-100 text-green-800',
  signup: 'bg-purple-100 text-purple-800',
  fulfillment: 'bg-orange-100 text-orange-800',
  withdrawal: 'bg-yellow-100 text-yellow-800',
}

const activityLabels = {
  order: 'Order',
  win: 'Win',
  signup: 'Signup',
  fulfillment: 'Fulfillment',
  withdrawal: 'Withdrawal',
}

export default function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-10 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="shrink-0">
              {activity.user?.avatar ? (
                <img
                  src={activity.user.avatar}
                  alt={activity.user.name}
                  className="size-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div
                className="size-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600"
                style={{ display: activity.user?.avatar ? 'none' : 'flex' }}
              >
                {activity.user?.name?.charAt(0) || '?'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    activityColors[activity.type]
                  }`}
                >
                  {activityLabels[activity.type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        View all activity
      </button>
    </div>
  )
}
