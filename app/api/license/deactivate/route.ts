import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { deactivateLicense, LicenseServiceError } from '@/services/license.service'

const deactivationSchema = z.object({
  deviceId: z.string().min(1),
  licenseKey: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = deactivationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }

    const { device, remaining } = await deactivateLicense(parsed.data)

    return NextResponse.json({
      success: true,
      message: 'Device deactivated successfully',
      data: { deviceId: device.deviceId, deviceName: device.deviceName, devicesUsed: remaining },
    })
  } catch (error) {
    if (error instanceof LicenseServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Device deactivation error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
