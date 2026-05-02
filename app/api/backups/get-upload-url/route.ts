import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { getBackupUploadUrl, BackupServiceError } from '@/services/backup.service'

const schema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  fileName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'backup-get-url', 5, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many requests. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: parsed.error.errors },
        { status: 400 }
      )
    }

    const result = await getBackupUploadUrl(parsed.data)

    return NextResponse.json({
      success: true,
      data: { signedUrl: result.signedUrl, storagePath: result.storagePath },
    })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status }
      )
    }
    console.error('Get upload URL error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
