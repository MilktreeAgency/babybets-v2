import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'

interface PendingTask {
  id: string
  title: string
  description: string
  count: number
  href: string
  urgent?: boolean
}

interface PendingTasksWidgetProps {
  tasks: PendingTask[]
  loading?: boolean
}

export default function PendingTasksWidget({ tasks, loading = false }: PendingTasksWidgetProps) {
  if (loading) {
    return (
      <div className="bg-admin-card-bg border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-admin-gray-bg animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-admin-card-bg border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No pending tasks</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-admin-card-bg border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Pending Tasks</h3>
        {tasks.some((t) => t.urgent) && (
          <span className="inline-flex items-center gap-1 text-sm text-admin-error-light">
            <AlertCircle className="size-4" />
            Urgent
          </span>
        )}
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Link
            key={task.id}
            to={task.href}
            className="block p-4 border border-border rounded-lg hover:bg-admin-hover-bg transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  {task.urgent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-admin-error-bg text-admin-error-text">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="inline-flex items-center justify-center size-8 rounded-full bg-admin-info-bg text-admin-info-fg font-semibold text-sm">
                  {task.count}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
