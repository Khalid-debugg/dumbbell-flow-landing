import { NextRequest, NextResponse } from 'next/server'
import { registerUser, UserServiceError } from '@/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await registerUser(email, password, name)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: { id: user.id, email: user.email, name: user.name, trialEndsAt: user.trialEndAt },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof UserServiceError) {
      const status = error.code === 'EMAIL_TAKEN' ? 409 : 400
      return NextResponse.json({ error: error.message, details: error.details }, { status })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
