import { prisma } from '@/lib/db/prisma'
import { verifyChecksum } from './generate'

export interface LicenseValidationResult {
  valid: boolean
  code?: string
  message?: string
  user?: {
    id: string
    email: string
    planTier: string | null
    subscriptionStatus: string
    subscriptionType: string | null
    deviceLimit: number
    trialEndAt: Date
  }
}

/**
 * Validate license key format
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX (5 segments of 4 characters)
 * First segment must start with "FF"
 */
export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^FF[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9a-z]{4}$/
  return pattern.test(key)
}

/**
 * Validate license key completely:
 * 1. Check format
 * 2. Verify checksum
 * 3. Check if exists in database
 * 4. Check expiry status
 */
export async function validateLicenseKey(
  licenseKey: string
): Promise<LicenseValidationResult> {
  // 1. Validate format
  if (!validateLicenseKeyFormat(licenseKey)) {
    return {
      valid: false,
      code: 'INVALID_FORMAT',
      message: 'Invalid license key format'
    }
  }

  // 2. Verify checksum
  if (!verifyChecksum(licenseKey)) {
    return {
      valid: false,
      code: 'INVALID_CHECKSUM',
      message: 'Invalid license key'
    }
  }

  // 3. Find user with this license key
  const user = await prisma.user.findUnique({
    where: { licenseKey }
  })

  if (!user) {
    return {
      valid: false,
      code: 'LICENSE_NOT_FOUND',
      message: 'License key not found'
    }
  }

  // 4. Check subscription status
  const statusCheck = checkSubscriptionStatus(user)

  if (!statusCheck.valid) {
    return statusCheck
  }

  // All checks passed
  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      planTier: user.planTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionType: user.subscriptionType,
      deviceLimit: user.deviceLimit,
      trialEndAt: user.trialEndAt
    }
  }
}

interface UserData {
  subscriptionStatus: string;
  trialEndAt: Date;
  subscriptionType: string | null;
}

function checkSubscriptionStatus(user: UserData): LicenseValidationResult {
  const now = new Date()

  if (user.subscriptionStatus === 'trial') {
    if (now > user.trialEndAt) {
      return {
        valid: false,
        code: 'TRIAL_EXPIRED',
        message: 'Your 30-day trial has ended. Upgrade to continue.'
      }
    }
    return { valid: true }
  }

  if (user.subscriptionStatus === 'past_due') {
    return {
      valid: true,
      code: 'PAYMENT_WARNING',
      message: 'Payment failed. Please update your payment method.'
    }
  }

  if (['cancelled', 'expired'].includes(user.subscriptionStatus)) {
    return {
      valid: false,
      code: 'SUBSCRIPTION_EXPIRED',
      message: 'Your subscription is inactive. Reactivate to continue.'
    }
  }

  if (user.subscriptionStatus === 'active') {
    return { valid: true }
  }

  return {
    valid: false,
    code: 'UNKNOWN_STATUS',
    message: 'Unknown subscription status'
  }
}

export function calculateDaysRemaining(endDate: Date): number {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}
