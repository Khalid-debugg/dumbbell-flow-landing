import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { validateLicense, LicenseServiceError } from '@/services/license.service'

const validationSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'license-validation', 10, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many validation attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const parsed = validationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }

    const { licenseKey, deviceId } = parsed.data
    const result = await validateLicense(licenseKey, deviceId)

    return NextResponse.json({
      success: true,
      valid: result.isValid,
      message: result.isValid ? 'License is valid' : 'License expired or subscription required',
      data: {
        deviceId: result.device.deviceId,
        deviceName: result.device.deviceName,
        activatedAt: result.device.activatedAt.toISOString(),
        lastValidatedAt: result.device.lastValidatedAt.toISOString(),
        subscriptionStatus: result.subscriptionStatus,
        subscriptionEndsAt: result.subscriptionEndsAt.toISOString(),
        isAccessActive: result.isAccessActive,
        isAccessExpired: result.isAccessExpired,
        daysRemaining: result.daysRemaining,
        hasActiveSubscription: result.hasActiveSubscription,
        requiresPayment: result.isAccessExpired && !result.hasActiveSubscription,
        dashboardUrl: `${process.env.NEXTAUTH_URL ?? 'https://dumbbellflow.com'}/dashboard`,
      },
    })
  } catch (error) {
    if (error instanceof LicenseServiceError) {
      return NextResponse.json({ success: false, valid: false, message: error.message }, { status: error.status })
    }
    console.error('License validation error:', error)
    return NextResponse.json({ success: false, valid: false, message: 'Internal server error' }, { status: 500 })
  }
}
