import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { downloadBackup, BackupServiceError } from '@/services/backup.service'

const downloadSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
  backupId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'backup-download', 30, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many download attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const parsed = downloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }

    const { licenseKey, deviceId, backupId } = parsed.data
    const { buffer, fileName } = await downloadBackup(licenseKey, deviceId, backupId)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Backup download error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
