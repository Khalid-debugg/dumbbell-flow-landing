import {
  findUserByEmail,
  findUserByVerificationToken,
  findUserByResetToken,
  createUser,
  updateUserVerification,
  updateUserResetToken,
  updateUserPassword,
  updateUserVerificationToken,
} from '@/repositories/user.repository'
import { hashPassword, validatePassword } from '@/lib/utils/password'
import { generateToken, generateTokenExpiry, isTokenExpired } from '@/lib/utils/tokens'
import { generateLicenseKey } from '@/lib/license'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '@/lib/email/send'

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string[]
  ) {
    super(message)
    this.name = 'UserServiceError'
  }
}

export async function registerUser(email: string, password: string, name?: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) throw new UserServiceError('Invalid email format', 'INVALID_EMAIL')

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid)
    throw new UserServiceError('Invalid password', 'INVALID_PASSWORD', passwordValidation.errors)

  const existing = await findUserByEmail(email.toLowerCase())
  if (existing) throw new UserServiceError('User with this email already exists', 'EMAIL_TAKEN')

  const [passwordHash, licenseKey] = await Promise.all([
    hashPassword(password),
    generateLicenseKey(),
  ])
  const verificationToken = generateToken(32)
  const verificationTokenExpiry = generateTokenExpiry(24)
  const trialStartAt = new Date()
  const trialEndAt = new Date()
  trialEndAt.setDate(trialEndAt.getDate() + 30)

  const user = await createUser({
    email: email.toLowerCase(),
    name: name ?? null,
    passwordHash,
    verificationToken,
    verificationTokenExpiry,
    licenseKey,
    trialStartAt,
    trialEndAt,
    subscriptionStatus: 'trial',
    deviceLimit: 1,
  })

  sendVerificationEmail(user.email, user.name, verificationToken).catch(() => null)

  return user
}

export async function verifyEmail(token: string) {
  const user = await findUserByVerificationToken(token)
  if (!user) throw new UserServiceError('Invalid verification token', 'INVALID_TOKEN')
  if (user.emailVerified) throw new UserServiceError('Email already verified', 'ALREADY_VERIFIED')
  if (isTokenExpired(user.verificationTokenExpiry))
    throw new UserServiceError('Verification token has expired', 'TOKEN_EXPIRED')

  const updated = await updateUserVerification(user.id)
  if (updated.licenseKey) {
    sendWelcomeEmail(updated.email, updated.name, updated.licenseKey).catch(() => null)
  }
  return updated
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email.toLowerCase())
  if (!user) return

  const resetToken = generateToken(32)
  const resetTokenExpiry = generateTokenExpiry(1)
  await updateUserResetToken(user.id, resetToken, resetTokenExpiry)
  await sendPasswordResetEmail(user.email, user.name, resetToken)
}

export async function resetPassword(token: string, newPassword: string) {
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid)
    throw new UserServiceError('Invalid password', 'INVALID_PASSWORD', passwordValidation.errors)

  const user = await findUserByResetToken(token)
  if (!user) throw new UserServiceError('Invalid or expired reset token', 'INVALID_TOKEN')
  if (isTokenExpired(user.resetTokenExpiry))
    throw new UserServiceError('Reset token has expired', 'TOKEN_EXPIRED')

  await updateUserPassword(user.id, await hashPassword(newPassword))
}

export async function resendVerification(email: string) {
  const user = await findUserByEmail(email.toLowerCase())
  if (!user) return
  if (user.emailVerified)
    throw new UserServiceError('Email is already verified', 'ALREADY_VERIFIED')

  const verificationToken = generateToken(32)
  const verificationTokenExpiry = generateTokenExpiry(24)
  await updateUserVerificationToken(user.id, verificationToken, verificationTokenExpiry)
  await sendVerificationEmail(user.email, user.name, verificationToken)
}
