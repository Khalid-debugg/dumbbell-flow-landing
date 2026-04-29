import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getUserDevices, LicenseServiceError } from '@/services/license.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const data = await getUserDevices(session.user.email)
    if (!data) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof LicenseServiceError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Get devices error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
