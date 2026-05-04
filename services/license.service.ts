import {
  findUserWithDevicesByLicenseKey,
  findUserByEmail,
  updateUserSubscription,
} from '@/repositories/user.repository'
import {
  touchDevice,
  reactivateDevice,
  createDevice,
  deactivateDevice,
  countActiveDevices,
  findActiveDevice,
} from '@/repositories/device.repository'
import { signLicenseData } from '@/lib/license/signing'
import { auth } from '@/lib/auth/auth'

export class LicenseServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly extra?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'LicenseServiceError'
  }
}

const PLATFORM_MAP: Record<string, string> = { win32: 'windows', darwin: 'mac' }

function normalizePlatform(platform: string): string {
  return PLATFORM_MAP[platform] ?? platform
}

function computeSubscriptionStatus(subscriptionEndsAt: Date | null) {
  const now = new Date()
  const isAccessActive = subscriptionEndsAt ? now < subscriptionEndsAt : false
  const isAccessExpired = subscriptionEndsAt ? now >= subscriptionEndsAt : false
  const daysRemaining =
    subscriptionEndsAt && isAccessActive
      ? Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  return { isAccessActive, isAccessExpired, daysRemaining }
}

export async function activateLicense(params: {
  licenseKey: string
  deviceId: string
  deviceName?: string
  platform: string
  appVersion: string
}) {
  const { licenseKey, deviceId, deviceName, appVersion } = params
  const platform = normalizePlatform(params.platform)

  const user = await findUserWithDevicesByLicenseKey(licenseKey)
  if (!user)
    throw new LicenseServiceError('Invalid license key', 'INVALID_KEY', 401)

  if (!user.emailVerified)
    throw new LicenseServiceError(
      'Please verify your email before activating devices',
      'EMAIL_UNVERIFIED',
      403
    )

  if (['expired', 'cancelled'].includes(user.subscriptionStatus))
    throw new LicenseServiceError(
      'Your subscription has expired. Please renew to activate devices.',
      'SUBSCRIPTION_EXPIRED',
      403
    )

  if (user.subscriptionStatus === 'trial' && new Date() > user.subscriptionEndsAt)
    throw new LicenseServiceError(
      'Your trial has expired. Please upgrade to continue.',
      'TRIAL_EXPIRED',
      403
    )

  const existing = user.ActivatedDevice.find((d) => d.deviceId === deviceId)
  const activeCount = user.ActivatedDevice.filter((d) => d.isActive).length

  if (existing) {
    const device = existing.isActive
      ? existing
      : await reactivateDevice(existing.id, { deviceName, platform, appVersion })

    if (existing.isActive) await touchDevice(existing.id)

    const signedLicense = signLicenseData({
      licenseKey: user.licenseKey!,
      deviceId: device.deviceId,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionStatus: user.subscriptionStatus,
    })

    return {
      device,
      activeCount: existing.isActive ? activeCount : activeCount + 1,
      deviceLimit: user.deviceLimit,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      signedLicense,
      reactivated: !existing.isActive,
    }
  }

  if (activeCount >= user.deviceLimit)
    throw new LicenseServiceError(
      `Device limit reached (${activeCount}/${user.deviceLimit}). Please deactivate a device from your dashboard.`,
      'DEVICE_LIMIT',
      403,
      { activeCount, deviceLimit: user.deviceLimit }
    )

  const device = await createDevice({ userId: user.id, deviceId, deviceName, platform, appVersion })

  const signedLicense = signLicenseData({
    licenseKey: user.licenseKey!,
    deviceId: device.deviceId,
    subscriptionEndsAt: user.subscriptionEndsAt,
    subscriptionStatus: user.subscriptionStatus,
  })

  return {
    device,
    activeCount: activeCount + 1,
    deviceLimit: user.deviceLimit,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    signedLicense,
    reactivated: false,
  }
}

export async function validateLicense(licenseKey: string, deviceId: string) {
  const user = await findUserWithDevicesByLicenseKey(licenseKey, deviceId)
  if (!user)
    throw new LicenseServiceError('Invalid license key', 'INVALID_KEY', 401)

  const device = user.ActivatedDevice[0]
  if (!device)
    throw new LicenseServiceError('Device not activated with this license', 'DEVICE_NOT_FOUND', 403)

  await touchDevice(device.id)

  const { isAccessActive, isAccessExpired, daysRemaining } = computeSubscriptionStatus(user.subscriptionEndsAt)
  const hasActiveSubscription = ['active', 'paid'].includes(user.subscriptionStatus)
  const isValid = isAccessActive || hasActiveSubscription

  if (user.subscriptionStatus === 'trial' && isAccessExpired && !hasActiveSubscription) {
    await updateUserSubscription(user.id, { subscriptionStatus: 'expired' })
  }

  return {
    isValid,
    device,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    isAccessActive,
    isAccessExpired,
    daysRemaining,
    hasActiveSubscription,
  }
}

export async function deactivateLicense(params: { deviceId: string; licenseKey?: string }) {
  let userId: string

  if (params.licenseKey) {
    const user = await findUserWithDevicesByLicenseKey(params.licenseKey)
    if (!user) throw new LicenseServiceError('Invalid license key', 'INVALID_KEY', 404)
    userId = user.id
  } else {
    const session = await auth()
    if (!session?.user?.email)
      throw new LicenseServiceError('Authentication required', 'UNAUTHENTICATED', 401)
    const user = await findUserByEmail(session.user.email)
    if (!user) throw new LicenseServiceError('User not found', 'NOT_FOUND', 404)
    userId = user.id
  }

  const device = await findActiveDevice(userId, params.deviceId)
  if (!device)
    throw new LicenseServiceError('Device not found or already deactivated', 'NOT_FOUND', 404)

  await deactivateDevice(device.id)
  const remaining = await countActiveDevices(userId)

  return { device, remaining }
}

export async function getUserDevices(email: string) {
  const { findUserWithAllDevicesByEmail } = await import('@/repositories/user.repository')
  const user = await findUserWithAllDevicesByEmail(email)
  if (!user) return null

  const { isAccessActive, isAccessExpired, daysRemaining } = computeSubscriptionStatus(user.subscriptionEndsAt)
  const devices = user.ActivatedDevice.map((device) => ({
    id: device.id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
    appVersion: device.appVersion,
    activatedAt: device.activatedAt.toISOString(),
    lastValidatedAt: device.lastValidatedAt.toISOString(),
    isActive: device.isActive,
  }))

  const hasActiveSubscription = ['active', 'paid'].includes(user.subscriptionStatus)

  return {
    licenseKey: user.licenseKey,
    devices,
    deviceLimit: user.deviceLimit,
    devicesUsed: devices.filter((d) => d.isActive).length,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionStartsAt: user.subscriptionStartsAt.toISOString(),
    subscriptionEndsAt: user.subscriptionEndsAt.toISOString(),
    isAccessActive,
    isAccessExpired,
    daysRemaining,
    hasActiveSubscription,
    planTier: user.planTier,
    subscriptionType: user.subscriptionType,
  }
}

export { computeSubscriptionStatus }
