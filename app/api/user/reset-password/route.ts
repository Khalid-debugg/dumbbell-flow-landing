import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, UserServiceError } from '@/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    await resetPassword(token, newPassword)

    return NextResponse.json(
      { success: true, message: 'Password reset successfully. You can now sign in.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 })
    }
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
