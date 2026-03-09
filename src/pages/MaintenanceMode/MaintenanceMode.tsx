import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Construction } from 'lucide-react'

export default function MaintenanceMode() {
  const { maintenanceMode } = useSystemSettings()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Construction className="w-20 h-20 text-primary" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Under Maintenance
        </h1>

        <p className="text-muted-foreground text-lg">
          {maintenanceMode?.message ||
            'We are currently performing scheduled maintenance. Please check back soon!'}
        </p>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            We appreciate your patience and will be back shortly.
          </p>
        </div>
      </div>
    </div>
  )
}
