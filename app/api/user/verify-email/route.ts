import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail, UserServiceError } from '@/services/user.service'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    await verifyEmail(token)

    return NextResponse.json(
      { success: true, message: 'Email verified successfully! You can now sign in.', redirectUrl: '/auth/signin' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
