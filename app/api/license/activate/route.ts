import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { activateLicense, LicenseServiceError } from '@/services/license.service'

const activationSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  platform: z.enum(['windows', 'mac', 'linux', 'win32', 'darwin']),
  appVersion: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'license-activation', 5, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many activation attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const parsed = activationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }

    const result = await activateLicense(parsed.data)
    const { device, activeCount, deviceLimit, subscriptionStatus, signedLicense, reactivated } = result

    return NextResponse.json({
      success: true,
      message: reactivated ? 'Device reactivated successfully' : device ? 'Device already activated' : 'Device activated successfully! 30-day trial started.',
      data: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        activatedAt: device.activatedAt.toISOString(),
        devicesUsed: activeCount,
        deviceLimit,
        trialEndsAt: device.trialEndsAt?.toISOString() ?? null,
        trialUsed: device.trialUsed,
        subscriptionStatus,
        isTrialActive: device.trialEndsAt ? new Date() < device.trialEndsAt : false,
        signedLicense,
      },
    })
  } catch (error) {
    if (error instanceof LicenseServiceError) {
      return NextResponse.json(
        { success: false, message: error.message, ...error.extra },
        { status: error.status }
      )
    }
    console.error('Device activation error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
