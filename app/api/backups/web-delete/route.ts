import { NextRequest, NextResponse } from 'next/server'
import { deleteWebBackup, BackupServiceError } from '@/services/backup.service'

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, backupId } = await request.json()
    if (!licenseKey || !backupId) {
      return NextResponse.json({ success: false, message: 'License key and backup ID are required' }, { status: 400 })
    }

    await deleteWebBackup(licenseKey, backupId)
    return NextResponse.json({ success: true, message: 'Backup deleted successfully' })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Delete backup error (web):', error)
    return NextResponse.json({ success: false, message: 'Failed to delete backup' }, { status: 500 })
  }
}
