import { NextRequest, NextResponse } from 'next/server'
import { listWebBackups, BackupServiceError } from '@/services/backup.service'

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, page = 1, limit = 5, deviceId, sortOrder = 'desc' } = await request.json()

    if (!licenseKey) {
      return NextResponse.json({ success: false, message: 'License key is required' }, { status: 400 })
    }

    const data = await listWebBackups(licenseKey, page, limit, deviceId, sortOrder)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof BackupServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('List backups error (web):', error)
    return NextResponse.json({ success: false, message: 'Failed to list backups' }, { status: 500 })
  }
}
