import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/landing/Header'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { findUserWithActiveDevicesByEmail, updateUserSubscription } from '@/repositories/user.repository'
import { computeSubscriptionStatus } from '@/services/license.service'

export default async function DashboardPage({
  params,
}: {
  params: { locale: string }
}) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect(`/${params.locale}/auth/signin`)
  }

  const user = await findUserWithActiveDevicesByEmail(session.user.email)
  const t = await getTranslations('dashboard')

  if (!user || !user.licenseKey) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header user={user ? { name: user.name, email: user.email } : null} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">{t('error')}</h1>
            <p className="text-muted-foreground">{t('errorMessage')}</p>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()

  const { isAccessActive, isAccessExpired, daysRemaining } = computeSubscriptionStatus(user.subscriptionEndsAt)

  if (user.subscriptionStatus === 'trial' && isAccessExpired) {
    await updateUserSubscription(user.id, { subscriptionStatus: 'expired' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect(`/${params.locale}/#pricing` as any)
  }

  const devices = user.activatedDevices.map((device) => ({
    ...device,
    activatedAt: device.activatedAt.toISOString(),
    lastValidatedAt: device.lastValidatedAt.toISOString(),
  }))

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      <Header user={{ name: user.name, email: user.email }} />
      <DashboardContent
        user={{
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          licenseKey: user.licenseKey,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndsAt: user.subscriptionEndsAt.toISOString(),
          planTier: user.planTier,
          deviceLimit: user.deviceLimit,
          daysRemaining,
          isAccessActive,
          isAccessExpired,
        }}
        devices={devices}
      />
    </div>
  )
}
