'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Key,
  CheckCircle2,
  Crown,
  Smartphone,
  Copy,
  Download,
  Monitor,
  Clock,
  Calendar,
  Zap
} from 'lucide-react'
import { VerificationBanner } from '@/components/auth/VerificationBanner'
import { CloudBackupsSection } from '@/components/dashboard/CloudBackupsSection'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { formatDate } from '@/lib/utils/format'

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

interface User {
  name: string | null
  email: string
  emailVerified: Date | null
  licenseKey: string
  subscriptionStatus: string
  planTier: string | null
  deviceLimit: number
  trialDaysRemaining: number
}

interface DashboardContentProps {
  user: User
  devices: Device[]
}

export function DashboardContent({ user, devices }: DashboardContentProps) {
  const t = useTranslations('dashboard')
  const [copied, setCopied] = useState(false)

  const copyLicenseKey = async () => {
    await navigator.clipboard.writeText(user.licenseKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Welcome Header with Animation */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('welcome', { name: user.name || 'there' })}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>

        {/* Email Verification Banner */}
        {!user.emailVerified && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-50">
            <VerificationBanner email={user.email} />
          </div>
        )}

        {/* Trial Banner */}
        {user.subscriptionStatus === 'trial' && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-1">
                      {t('trial.title')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('trial.daysRemaining', { days: user.trialDaysRemaining })}
                    </p>
                  </div>
                </div>
                <Link
                  href={{ pathname: '/', hash: 'pricing' }}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 font-medium shadow-lg shadow-primary/25"
                >
                  {t('trial.upgradeButton')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription Status */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('status.label')}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold capitalize">
                  {user.subscriptionStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Tier */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                    <Crown className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('plan.label')}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold capitalize">
                  {user.planTier || t('plan.trial')}
                </p>
              </div>
            </div>
          </div>

          {/* Devices */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms]">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('devices.label')}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold">
                  {devices.length} / {user.deviceLimit}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* License Key Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Key className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold mb-2">
                  {t('license.title')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('license.description')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4 border border-border/50">
              <code className="flex-1 font-mono text-lg tracking-wider font-semibold">
                {user.licenseKey}
              </code>
              <button
                onClick={copyLicenseKey}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Activated Devices */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:600ms]">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {t('activatedDevices.title')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('activatedDevices.count', { current: devices.length, limit: user.deviceLimit })}
                </p>
              </div>
            </div>

            {devices.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
                  <Monitor className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">
                  {t('activatedDevices.noDevices')}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  {t('activatedDevices.getStarted')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div
                    key={device.id}
                    className="group relative overflow-hidden rounded-xl bg-muted/30 border border-border p-5 transition-all hover:bg-muted/50 hover:border-primary/30 hover:shadow-md"
                    style={{
                      animationDelay: `${700 + index * 100}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-background border border-border text-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                        <PlatformIcon platform={device.platform} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {device.deviceName || t('activatedDevices.deviceFallback', { platform: device.platform })}
                          </h3>
                          {device.isTrialActive && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
                              <Zap className="h-3 w-3" />
                              {t('activatedDevices.trialActive', { days: device.trialDaysRemaining })}
                            </span>
                          )}
                          {device.isTrialExpired && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                              <Clock className="h-3 w-3" />
                              {t('activatedDevices.trialExpired')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>
                              {device.platform.charAt(0).toUpperCase() + device.platform.slice(1)} • v{device.appVersion}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t('activatedDevices.activatedLabel')}: {formatDate(device.activatedAt)}
                            </span>
                          </div>
                        </div>

                        {device.trialEndsAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {t('activatedDevices.trialEndsLabel')}: {formatDate(device.trialEndsAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decorative gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Cloud Backups Section */}
        <CloudBackupsSection
          licenseKey={user.licenseKey}
        />


        {/* Download Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:900ms]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary to-secondary/80 p-8 text-secondary-foreground shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Download className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">
                    {t('download.title')}
                  </h2>
                  <p className="text-secondary-foreground/80 text-lg">
                    {t('download.description')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-white text-secondary rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 font-semibold shadow-xl flex items-center gap-2 group">
                  <Download className="h-5 w-5 group-hover:animate-bounce" />
                  {t('download.windows')}
                </button>
                <button className="px-6 py-3 bg-white text-secondary rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 font-semibold shadow-xl flex items-center gap-2 group">
                  <Download className="h-5 w-5 group-hover:animate-bounce" />
                  {t('download.mac')}
                </button>
                <button className="px-6 py-3 bg-white text-secondary rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 font-semibold shadow-xl flex items-center gap-2 group">
                  <Download className="h-5 w-5 group-hover:animate-bounce" />
                  {t('download.linux')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
