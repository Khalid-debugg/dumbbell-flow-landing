import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export async function getServerUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      language: true,
      trialStartAt: true,
      trialEndAt: true,
      subscriptionStatus: true,
      subscriptionType: true,
      planTier: true,
      deviceLimit: true,
      licenseKey: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function requireAuth(redirectTo = '/auth/signin') {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user) redirect(redirectTo as any)
  return session
}
