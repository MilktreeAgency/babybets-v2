import { useState, useEffect } from 'react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { DashboardHeader } from '../components'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Construction, Radio, Landmark, Sparkles } from 'lucide-react'

export default function SystemSettings() {
  const { settings, updateSetting, loading } = useSystemSettings()

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [liveTickerEnabled, setLiveTickerEnabled] = useState(false)
  const [liveTickerUrl, setLiveTickerUrl] = useState('')
  const [liveTickerText, setLiveTickerText] = useState('Watch Live Now')
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('100.00')
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState('10000.00')
  const [heroTitle, setHeroTitle] = useState('Win Premium Baby Gear Instantly')
  const [heroDescription, setHeroDescription] = useState('Enter our instant win competitions for a chance to win iCandy prams, car seats, and cash prizes. Over 1,900 instant wins available now.')

  const [saving, setSaving] = useState(false)

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setMaintenanceEnabled(settings.maintenance_mode.enabled)
      setMaintenanceMessage(settings.maintenance_mode.message)
      setLiveTickerEnabled(settings.live_ticker.enabled)
      setLiveTickerUrl(settings.live_ticker.url)
      setLiveTickerText(settings.live_ticker.text)

      // Load withdrawal limits if they exist
      if (settings.withdrawal_limits) {
        setMinWithdrawalAmount((settings.withdrawal_limits.min_amount_pence / 100).toFixed(2))
        setMaxWithdrawalAmount((settings.withdrawal_limits.max_amount_pence / 100).toFixed(2))
      }

      // Load hero content if it exists
      if (settings.hero_content) {
        setHeroTitle(settings.hero_content.title)
        setHeroDescription(settings.hero_content.description)
      }
    }
  }, [settings])

  const handleToggleMaintenanceMode = async (enabled: boolean) => {
    setMaintenanceEnabled(enabled)
    try {
      await updateSetting('maintenance_mode', {
        enabled,
        message: maintenanceMessage
      })
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating maintenance mode:', error)
      toast.error('Failed to update maintenance mode')
      setMaintenanceEnabled(!enabled) // Revert on error
    }
  }

  const handleSaveMaintenanceMessage = async () => {
    try {
      setSaving(true)
      await updateSetting('maintenance_mode', {
        enabled: maintenanceEnabled,
        message: maintenanceMessage
      })
      toast.success('Maintenance message updated')
    } catch (error) {
      console.error('Error updating maintenance message:', error)
      toast.error('Failed to update maintenance message')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLiveTicker = async (enabled: boolean) => {
    setLiveTickerEnabled(enabled)
    try {
      await updateSetting('live_ticker', {
        enabled,
        url: liveTickerUrl,
        text: liveTickerText
      })
      toast.success(`Live ticker ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating live ticker:', error)
      toast.error('Failed to update live ticker')
      setLiveTickerEnabled(!enabled) // Revert on error
    }
  }

  const handleSaveLiveTickerSettings = async () => {
    try {
      setSaving(true)
      await updateSetting('live_ticker', {
        enabled: liveTickerEnabled,
        url: liveTickerUrl,
        text: liveTickerText
      })
      toast.success('Live ticker settings updated')
    } catch (error) {
      console.error('Error updating live ticker:', error)
      toast.error('Failed to update live ticker settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWithdrawalLimits = async () => {
    try {
      // Validate amounts
      const minPence = Math.round(parseFloat(minWithdrawalAmount) * 100)
      const maxPence = Math.round(parseFloat(maxWithdrawalAmount) * 100)

      if (isNaN(minPence) || isNaN(maxPence)) {
        toast.error('Please enter valid amounts')
        return
      }

      if (minPence <= 0 || maxPence <= 0) {
        toast.error('Amounts must be greater than zero')
        return
      }

      if (minPence >= maxPence) {
        toast.error('Minimum amount must be less than maximum amount')
        return
      }

      setSaving(true)
      await updateSetting('withdrawal_limits', {
        min_amount_pence: minPence,
        max_amount_pence: maxPence
      })
      toast.success('Withdrawal limits updated')
    } catch (error) {
      console.error('Error updating withdrawal limits:', error)
      toast.error('Failed to update withdrawal limits')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveHeroContent = async () => {
    try {
      // Validate inputs
      if (!heroTitle.trim()) {
        toast.error('Hero title cannot be empty')
        return
      }

      if (!heroDescription.trim()) {
        toast.error('Hero description cannot be empty')
        return
      }

      setSaving(true)
      await updateSetting('hero_content', {
        title: heroTitle.trim(),
        description: heroDescription.trim()
      })
      toast.success('Hero content updated')
    } catch (error) {
      console.error('Error updating hero content:', error)
      toast.error('Failed to update hero content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'System Settings' }
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'System Settings' }
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-6 py-8 mx-auto w-full max-w-4xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage system-wide configuration and features
            </p>
          </div>

          {/* Maintenance Mode Section */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-admin-warning-bg rounded-lg">
                <Construction className="size-5 text-admin-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Maintenance Mode</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  When enabled, the site shows a maintenance page to all non-admin users
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-enabled" className="cursor-pointer">
                    Enable Maintenance Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Admins can still access the site
                  </p>
                </div>
                <Switch
                  id="maintenance-enabled"
                  checked={maintenanceEnabled}
                  onCheckedChange={handleToggleMaintenanceMode}
                  className="cursor-pointer data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-message" className="cursor-pointer">
                  Maintenance Message
                </Label>
                <Textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Enter the message to display during maintenance"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSaveMaintenanceMessage}
                disabled={saving || loading}
                className="cursor-pointer"
              >
                Save Message
              </Button>
            </div>
          </div>

          {/* Live Ticker Section */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffe5e5' }}>
                <Radio className="size-5" style={{ color: '#ff4444' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Live Stream Ticker</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Display a static banner on the homepage with a link to your live stream
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ticker-enabled" className="cursor-pointer">
                    Show Live Ticker
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display the live stream banner on homepage
                  </p>
                </div>
                <Switch
                  id="ticker-enabled"
                  checked={liveTickerEnabled}
                  onCheckedChange={handleToggleLiveTicker}
                  className="cursor-pointer data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticker-url" className="cursor-pointer">
                  Live Stream URL
                </Label>
                <Input
                  id="ticker-url"
                  type="url"
                  value={liveTickerUrl}
                  onChange={(e) => setLiveTickerUrl(e.target.value)}
                  placeholder="https://youtube.com/live/..."
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full URL to your live stream
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticker-text" className="cursor-pointer">
                  Button Text
                </Label>
                <Input
                  id="ticker-text"
                  value={liveTickerText}
                  onChange={(e) => setLiveTickerText(e.target.value)}
                  placeholder="Watch Live Now"
                />
                <p className="text-xs text-muted-foreground">
                  Customize the text shown on the call-to-action button
                </p>
              </div>

              <Button
                onClick={handleSaveLiveTickerSettings}
                disabled={saving || loading}
                className="cursor-pointer"
              >
                Save URL & Button Text
              </Button>
            </div>
          </div>

          {/* Hero Content Section */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                <Sparkles className="size-5" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Hero Section Content</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize the main heading and description text displayed on the homepage hero section
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title" className="cursor-pointer">
                  Hero Title
                </Label>
                <Input
                  id="hero-title"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Win Premium Baby Gear Instantly"
                  className="font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  The main heading displayed in large text on the hero section
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-description" className="cursor-pointer">
                  Hero Description
                </Label>
                <Textarea
                  id="hero-description"
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  placeholder="Enter our instant win competitions for a chance to win..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  The descriptive text shown below the main heading
                </p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  <strong>Preview:</strong> Changes will be reflected immediately on the homepage after saving.
                  Make sure to review the homepage after making changes.
                </p>
              </div>

              <Button
                onClick={handleSaveHeroContent}
                disabled={saving || loading}
                className="cursor-pointer"
              >
                Save Hero Content
              </Button>
            </div>
          </div>

          {/* Withdrawal Limits Section */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Landmark className="size-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Withdrawal Limits</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure minimum and maximum withdrawal amounts for users (UK bank accounts only)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-withdrawal" className="cursor-pointer">
                    Minimum Withdrawal Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      id="min-withdrawal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minWithdrawalAmount}
                      onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                      placeholder="100.00"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Typical range: £50 - £500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-withdrawal" className="cursor-pointer">
                    Maximum Withdrawal Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      id="max-withdrawal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxWithdrawalAmount}
                      onChange={(e) => setMaxWithdrawalAmount(e.target.value)}
                      placeholder="10000.00"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Typical range: £5000 - £20000
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Users can only request withdrawals between these amounts.
                  Withdrawals are processed to UK bank accounts within 3-5 business days.
                </p>
              </div>

              <Button
                onClick={handleSaveWithdrawalLimits}
                disabled={saving || loading}
                className="cursor-pointer"
              >
                Save Withdrawal Limits
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
