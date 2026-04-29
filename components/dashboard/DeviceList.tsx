'use client'

import { useState } from 'react'
import { Trash2, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { formatDate } from '@/lib/utils/format'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface Device {
  id: string
  deviceId: string
  deviceName: string | null
  platform: string
  appVersion: string
  activatedAt: string
  lastValidatedAt: string
  isActive: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  trialUsed: boolean
  isTrialActive: boolean
  isTrialExpired: boolean
  trialDaysRemaining: number
}

interface DeviceListProps {
  devices: Device[]
  deviceLimit: number
  devicesUsed: number
}

export function DeviceList({ devices, deviceLimit, devicesUsed }: DeviceListProps) {
  const t = useTranslations('dashboard.devices')
  const [deactivatingDeviceId, setDeactivatingDeviceId] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleDeactivate = async (deviceId: string) => {
    setIsDeactivating(true)
    try {
      const response = await fetch('/api/license/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Device deactivated successfully')
        window.location.reload() // Refresh to update device list
      } else {
        toast.error(data.message || 'Failed to deactivate device')
      }
    } catch (error) {
      console.error('Deactivation error:', error)
      toast.error('Failed to deactivate device')
    } finally {
      setIsDeactivating(false)
      setDeactivatingDeviceId(null)
    }
  }

  const activeDevices = devices.filter((d) => d.isActive)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description', { used: devicesUsed, limit: deviceLimit })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeDevices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noDevices')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1"><PlatformIcon platform={device.platform} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {device.deviceName || `${device.platform} Device`}
                        </h4>
                        {device.isTrialActive && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            Trial: {device.trialDaysRemaining}d left
                          </span>
                        )}
                        {device.isTrialExpired && (
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                            Trial Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('platform')}: {device.platform.charAt(0).toUpperCase() + device.platform.slice(1)} • {t('version')}: {device.appVersion}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('activated')}: {formatDate(device.activatedAt)}
                      </p>
                      {device.trialEndsAt && (
                        <p className="text-xs text-muted-foreground">
                          {t('trialEnds')}: {formatDate(device.trialEndsAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeactivatingDeviceId(device.deviceId)}
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deactivatingDeviceId !== null}
        onOpenChange={(open) => !open && setDeactivatingDeviceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deactivate.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deactivate.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              {t('deactivate.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivatingDeviceId && handleDeactivate(deactivatingDeviceId)}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? t('deactivate.deactivating') : t('deactivate.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
