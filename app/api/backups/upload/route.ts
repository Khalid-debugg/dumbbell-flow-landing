import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { uploadBackup, BackupServiceError } from '@/services/backup.service'

const uploadSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  fileName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rateLimit = await checkRateLimit(ip, 'backup-upload', 20, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many upload attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.` },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const parsed = uploadSchema.safeParse({
      licenseKey: formData.get('licenseKey'),
      deviceId: formData.get('deviceId'),
      deviceName: formData.get('deviceName') ?? undefined,
      fileName: formData.get('fileName'),
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid request data', errors: parsed.error.errors }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    const backup = await uploadBackup({ ...parsed.data, file })

    return NextResponse.json({
      success: true,
      message: 'Backup uploaded successfully',
      data: { id: backup.id, fileName: backup.fileName, fileSize: Number(backup.fileSize), checksum: backup.checksum, createdAt: backup.createdAt.toISOString() },
    })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Backup upload error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
