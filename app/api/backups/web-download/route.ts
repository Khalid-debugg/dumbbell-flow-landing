import { NextRequest, NextResponse } from 'next/server'
import { downloadWebBackup, BackupServiceError } from '@/services/backup.service'

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, backupId } = await request.json()
    if (!licenseKey || !backupId) {
      return NextResponse.json({ success: false, message: 'License key and backup ID are required' }, { status: 400 })
    }

    const { buffer, fileName } = await downloadWebBackup(licenseKey, backupId)

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
    console.error('Download backup error (web):', error)
    return NextResponse.json({ success: false, message: 'Failed to download backup' }, { status: 500 })
  }
}
