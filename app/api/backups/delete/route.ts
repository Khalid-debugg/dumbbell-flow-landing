import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { deleteBackupById, BackupServiceError } from '@/services/backup.service'

const deleteSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
  backupId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'backup-delete', 30, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many delete attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }

    const { licenseKey, deviceId, backupId } = parsed.data
    await deleteBackupById(licenseKey, deviceId, backupId)

    return NextResponse.json({ success: true, message: 'Backup deleted successfully' })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Backup delete error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
