import { NextRequest, NextResponse } from 'next/server'
import { resendVerification, UserServiceError } from '@/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await resendVerification(email)

    return NextResponse.json(
      { success: true, message: 'If an account exists with this email, a verification email has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof UserServiceError && error.code === 'ALREADY_VERIFIED') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
