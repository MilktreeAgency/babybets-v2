import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database.types'

interface MaintenanceModeSettings {
  enabled: boolean
  message: string
}

interface LiveTickerSettings {
  enabled: boolean
  url: string
  text: string
}

interface SystemSettings {
  maintenance_mode: MaintenanceModeSettings
  live_ticker: LiveTickerSettings
}

interface SystemSettingsReturn {
  settings: SystemSettings | null
  loading: boolean
  updateSetting: (key: string, value: Json) => Promise<void>
  maintenanceMode: MaintenanceModeSettings | undefined
  liveTicker: LiveTickerSettings | undefined
}

export function useSystemSettings(): SystemSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()

    // Subscribe to real-time changes in system_settings table
    const subscription = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        () => {
          // Reload settings when any change occurs
          loadSettings()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['maintenance_mode', 'live_ticker'])

      if (error) throw error

      // Transform array to object with typed values
      let maintenanceMode: MaintenanceModeSettings | undefined
      let liveTicker: LiveTickerSettings | undefined

      data?.forEach((item) => {
        if (item.setting_key === 'maintenance_mode' && item.setting_value && typeof item.setting_value === 'object' && !Array.isArray(item.setting_value)) {
          maintenanceMode = item.setting_value as unknown as MaintenanceModeSettings
        } else if (item.setting_key === 'live_ticker' && item.setting_value && typeof item.setting_value === 'object' && !Array.isArray(item.setting_value)) {
          liveTicker = item.setting_value as unknown as LiveTickerSettings
        }
      })

      // Only set if we have both settings
      if (maintenanceMode && liveTicker) {
        setSettings({
          maintenance_mode: maintenanceMode,
          live_ticker: liveTicker
        })
      } else {
        throw new Error('Missing required settings')
      }
    } catch (error) {
      console.error('Error loading system settings:', error)
      // Set empty settings on error to prevent blocking the app
      setSettings({
        maintenance_mode: { enabled: false, message: '' },
        live_ticker: { enabled: false, url: '', text: 'Watch Live Now' }
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: Json) => {
    try {
      const { error } = await supabase.rpc('update_system_setting', {
        key,
        value
      })

      if (error) throw error

      // Reload settings to ensure UI is in sync
      await loadSettings()
    } catch (error) {
      console.error('Error updating system setting:', error)
      throw error
    }
  }

  return {
    settings,
    loading,
    updateSetting,
    maintenanceMode: settings?.maintenance_mode,
    liveTicker: settings?.live_ticker
  }
}
