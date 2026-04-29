import { prisma } from '@/lib/db/prisma'

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function findUserByLicenseKey(licenseKey: string) {
  return prisma.user.findUnique({ where: { licenseKey } })
}

export async function findUserByVerificationToken(token: string) {
  return prisma.user.findFirst({ where: { verificationToken: token } })
}

export async function findUserByResetToken(token: string) {
  return prisma.user.findFirst({ where: { resetToken: token } })
}

export async function findUserWithActiveDevicesByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      licenseKey: true,
      subscriptionStatus: true,
      subscriptionType: true,
      planTier: true,
      trialStartAt: true,
      trialEndAt: true,
      deviceLimit: true,
      ActivatedDevice: {
        where: { isActive: true },
        orderBy: { activatedAt: 'desc' },
      },
    },
  })
}

export async function findUserWithAllDevicesByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      ActivatedDevice: { orderBy: { activatedAt: 'desc' } },
    },
  })
}

export async function findUserWithDevicesByLicenseKey(licenseKey: string, filterDeviceId?: string) {
  return prisma.user.findUnique({
    where: { licenseKey },
    include: {
      ActivatedDevice: filterDeviceId
        ? { where: { deviceId: filterDeviceId, isActive: true } }
        : { orderBy: { lastValidatedAt: 'asc' } },
    },
  })
}

export async function createUser(data: {
  email: string
  name: string | null
  passwordHash: string
  verificationToken: string
  verificationTokenExpiry: Date
  licenseKey: string
  trialStartAt: Date
  trialEndAt: Date
  subscriptionStatus: string
  deviceLimit: number
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      email: true,
      name: true,
      licenseKey: true,
      trialStartAt: true,
      trialEndAt: true,
    },
  })
}

export async function updateUserVerification(id: string) {
  return prisma.user.update({
    where: { id },
    data: { emailVerified: new Date(), verificationToken: null, verificationTokenExpiry: null },
    select: { id: true, email: true, name: true, licenseKey: true },
  })
}

export async function updateUserResetToken(id: string, token: string, expiry: Date) {
  return prisma.user.update({
    where: { id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  })
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  })
}

export async function updateUserVerificationToken(id: string, token: string, expiry: Date) {
  return prisma.user.update({
    where: { id },
    data: { verificationToken: token, verificationTokenExpiry: expiry },
  })
}

export async function updateUserSubscription(
  id: string,
  data: {
    subscriptionStatus?: string
    subscriptionType?: string
    planTier?: string
    deviceLimit?: number
  }
) {
  return prisma.user.update({ where: { id }, data })
}
